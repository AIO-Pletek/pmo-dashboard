import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ExcelJS from 'exceljs'

interface TimelineTask {
  description: string
  assignedTo: string
  progress: number
  days: number
}

interface TimelinePhase {
  name: string
  tasks: TimelineTask[]
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d: Date, days: number): Date {
  const date = new Date(d)
  date.setDate(date.getDate() + days)
  return date
}

function sanitizeFilename(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s\-_()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100)
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Column definitions: 1-indexed
// A=1 (empty, width 2), B=2 (desc, 55), C=3 (assign, 25), D=4 (progress, 10),
// E=5 (start, 10), F=6 (days, 8), G=7 (empty, 2), H=8 (duration, 8)
// I=9 onwards: Gantt columns (width 4.5 each, 7 per week)

function setThinBorder(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const doc = await db.timelineDocument.findUnique({ where: { id } })

    if (!doc) {
      return NextResponse.json(
        { error: 'Timeline document not found' },
        { status: 404 }
      )
    }

    let phases: TimelinePhase[] = []
    try {
      phases = JSON.parse(doc.phases)
    } catch {
      phases = []
    }

    const workbook = new ExcelJS.Workbook()
    const ws = workbook.addWorksheet('Timeline', {
      properties: { defaultColWidth: 10 },
    })

    // --- Column widths ---
    ws.getColumn(1).width = 2    // A
    ws.getColumn(2).width = 55   // B
    ws.getColumn(3).width = 25   // C
    ws.getColumn(4).width = 10   // D
    ws.getColumn(5).width = 10   // E
    ws.getColumn(6).width = 8    // F
    ws.getColumn(7).width = 2    // G
    ws.getColumn(8).width = 8    // H

    const totalWeeks = doc.totalWeeks || 5
    const ganttStartCol = 9 // Column I

    for (let w = 0; w < totalWeeks; w++) {
      for (let d = 0; d < 7; d++) {
        ws.getColumn(ganttStartCol + w * 7 + d).width = 4.5
      }
    }

    // --- Parse start date ---
    const startDate = doc.startDate ? new Date(doc.startDate + 'T00:00:00') : new Date()
    const mondayStart = getMonday(startDate)

    // --- Row 1-2: Title ---
    // B1:B2 merged with title
    ws.mergeCells('B1', 'B2')
    const titleCell = ws.getCell('B1')
    titleCell.value = doc.title
    titleCell.font = { bold: true, size: 12, name: 'Calibri' }
    titleCell.alignment = { vertical: 'middle', wrapText: true }

    // I1:O1 merged: "Project start:"
    ws.mergeCells(1, ganttStartCol, 1, ganttStartCol + 6)
    const projStartLabel = ws.getCell(1, ganttStartCol)
    projStartLabel.value = 'Project start:'
    projStartLabel.font = { bold: false, size: 10, name: 'Calibri' }
    projStartLabel.alignment = { vertical: 'middle', horizontal: 'right' }

    // Q1:Z1 merged = Project start date (wide merge, matching the template layout)
    // Gap col P (16) between "Project start:" label and date value
    const dateMergeStart = ganttStartCol + 8  // Q = col 17
    const dateMergeEnd = Math.min(dateMergeStart + 9, ganttStartCol + totalWeeks * 7) // 10 cols wide
    if (dateMergeEnd > dateMergeStart) {
      ws.mergeCells(1, dateMergeStart, 1, dateMergeEnd)
    }
    const dateCell = ws.getCell(1, dateMergeStart)
    dateCell.value = startDate
    dateCell.numFmt = 'mmm d, yyyy'
    dateCell.font = { size: 10, name: 'Calibri' }
    dateCell.alignment = { vertical: 'middle' }

    // I2:O2 merged: "Display week:"
    ws.mergeCells(2, ganttStartCol, 2, ganttStartCol + 6)
    const displayWeekLabel = ws.getCell(2, ganttStartCol)
    displayWeekLabel.value = 'Display week:'
    displayWeekLabel.font = { bold: false, size: 10, name: 'Calibri' }
    displayWeekLabel.alignment = { vertical: 'middle', horizontal: 'right' }

    // Q2:Z2 merged = week number 1
    if (dateMergeEnd > dateMergeStart) {
      ws.mergeCells(2, dateMergeStart, 2, dateMergeEnd)
    }
    const weekNumCell = ws.getCell(2, dateMergeStart)
    weekNumCell.value = 1
    weekNumCell.font = { size: 10, name: 'Calibri' }
    weekNumCell.alignment = { vertical: 'middle' }

    // Row 3: C3 = "Project lead" label (bold), D3 = actual name
    const leadCell = ws.getCell('C3')
    leadCell.value = 'Project lead'
    leadCell.font = { bold: true, size: 10, name: 'Calibri' }
    if (doc.projectLead) {
      const leadNameCell = ws.getCell('D3')
      leadNameCell.value = doc.projectLead
      leadNameCell.font = { size: 10, name: 'Calibri' }
    }

    // Row 4: Week headers, merged across 7 cols each
    const headerFill: ExcelJS.FillPattern = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF2F2F2' },
    }

    const headerFont: ExcelJS.Font = {
      bold: true,
      size: 11,
      name: 'Calibri',
      color: { argb: 'FF000000' },
    }

    const dataFont: ExcelJS.Font = {
      size: 10,
      name: 'Calibri',
      color: { argb: 'FF000000' },
    }

    for (let w = 0; w < totalWeeks; w++) {
      const startCol = ganttStartCol + w * 7
      const endCol = startCol + 6
      ws.mergeCells(4, startCol, 4, endCol)
      const weekCell = ws.getCell(4, startCol)
      weekCell.value = `Week ${w + 1}`
      weekCell.font = headerFont
      weekCell.fill = headerFill
      weekCell.alignment = { vertical: 'middle', horizontal: 'center' }
      for (let c = startCol; c <= endCol; c++) {
        setThinBorder(ws.getCell(4, c))
        ws.getCell(4, c).fill = headerFill
      }
    }

    // Row 5: Column headers + date values in Gantt
    const colHeaders: [string, number][] = [
      ['Timeline description', 2],
      ['Assigned to', 3],
      ['Progress', 4],
      ['Start', 5],
      ['Days', 6],
    ]

    for (const [text, col] of colHeaders) {
      const cell = ws.getCell(5, col)
      cell.value = text
      cell.font = headerFont
      cell.fill = headerFill
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      setThinBorder(cell)
    }

    // Gantt date columns in row 5
    for (let w = 0; w < totalWeeks; w++) {
      const weekMonday = addDays(mondayStart, w * 7)
      for (let d = 0; d < 7; d++) {
        const col = ganttStartCol + w * 7 + d
        const cell = ws.getCell(5, col)
        cell.value = addDays(weekMonday, d)
        cell.numFmt = 'd'
        cell.font = { size: 8, name: 'Calibri', color: { argb: 'FF000000' } }
        cell.fill = headerFill
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        setThinBorder(cell)
      }
    }

    // Row 6: Day-of-week letters
    for (let w = 0; w < totalWeeks; w++) {
      for (let d = 0; d < 7; d++) {
        const col = ganttStartCol + w * 7 + d
        const cell = ws.getCell(6, col)
        cell.value = DAY_LETTERS[d]
        cell.font = { size: 8, name: 'Calibri', color: { argb: 'FF000000' } }
        cell.fill = headerFill
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        setThinBorder(cell)
      }
    }

    // Also set border on non-gantt cells in rows 4-6
    for (let row = 4; row <= 6; row++) {
      for (let col = 1; col <= 8; col++) {
        const cell = ws.getCell(row, col)
        cell.fill = headerFill
        setThinBorder(cell)
      }
    }

    // --- Data area ---
    let currentRow = 7
    const taskRows: number[] = [] // Track rows with days for SUM formula
    let totalDays = 0

    for (const phase of phases) {
      // Phase row
      const phaseCell = ws.getCell(currentRow, 2)
      phaseCell.value = phase.name
      phaseCell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FF000000' } }
      setThinBorder(phaseCell)

      currentRow++

      // Task rows
      for (const task of phase.tasks) {
        const descCell = ws.getCell(currentRow, 2)
        descCell.value = task.description
        descCell.font = dataFont
        setThinBorder(descCell)

        const assignCell = ws.getCell(currentRow, 3)
        assignCell.value = task.assignedTo
        assignCell.font = dataFont
        setThinBorder(assignCell)

        const progressCell = ws.getCell(currentRow, 4)
        progressCell.value = Math.round(task.progress) || 0
        progressCell.font = dataFont
        progressCell.alignment = { horizontal: 'center' }
        setThinBorder(progressCell)

        const daysCell = ws.getCell(currentRow, 6)
        daysCell.value = task.days
        daysCell.font = dataFont
        daysCell.alignment = { horizontal: 'center' }
        setThinBorder(daysCell)

        // Add borders to all gantt columns for this row
        for (let w = 0; w < totalWeeks; w++) {
          for (let d = 0; d < 7; d++) {
            setThinBorder(ws.getCell(currentRow, ganttStartCol + w * 7 + d))
          }
        }

        taskRows.push(currentRow)
        totalDays += task.days
        currentRow++
      }
    }

    // Total row
    const totalLabelCell = ws.getCell(currentRow, 2)
    totalLabelCell.value = 'Total'
    totalLabelCell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FF000000' } }
    setThinBorder(totalLabelCell)

    // SUM formula for total days
    if (taskRows.length > 0) {
      const sumRefs = taskRows.map((r) => `F${r}`).join('+')
      const totalDaysCell = ws.getCell(currentRow, 6)
      totalDaysCell.value = { formula: sumRefs }
      totalDaysCell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FF000000' } }
      totalDaysCell.alignment = { horizontal: 'center' }
      setThinBorder(totalDaysCell)
    } else {
      const totalDaysCell = ws.getCell(currentRow, 6)
      totalDaysCell.value = 0
      totalDaysCell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FF000000' } }
      totalDaysCell.alignment = { horizontal: 'center' }
      setThinBorder(totalDaysCell)
    }

    currentRow++

    // Note row
    const noteLabelCell = ws.getCell(currentRow, 2)
    noteLabelCell.value = doc.notes ? `Note : ${doc.notes}` : 'Note : '
    noteLabelCell.font = dataFont
    setThinBorder(noteLabelCell)

    // --- Generate buffer ---
    const buffer = await workbook.xlsx.writeBuffer()

    const safeFilename = sanitizeFilename(doc.title)
    const filename = `Timeline ${safeFilename}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export timeline document error:', error)
    return NextResponse.json(
      { error: 'Failed to export timeline document' },
      { status: 500 }
    )
  }
}