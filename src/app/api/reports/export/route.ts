import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ExcelJS from 'exceljs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = {}
    if (projectId) where.projectId = projectId
    if (type) where.type = type
    if (status) where.status = status

    const reports = await db.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          include: { customer: true },
        },
      },
    })

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Reports')

    // Header style
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF059669' } },
      alignment: { vertical: 'middle' as const, horizontal: 'left' as const },
      border: {
        top: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        left: { style: 'thin' as const },
        right: { style: 'thin' as const },
      },
    }

    // Columns
    sheet.columns = [
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Project', key: 'project', width: 25 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Content', key: 'content', width: 50 },
      { header: 'Created', key: 'createdAt', width: 18 },
      { header: 'Updated', key: 'updatedAt', width: 18 },
    ]

    // Header row styling
    const headerRow = sheet.getRow(1)
    headerRow.height = 22
    headerRow.eachCell((cell) => {
      cell.font = headerStyle.font
      cell.fill = headerStyle.fill
      cell.alignment = headerStyle.alignment
      cell.border = headerStyle.border
    })

    // Data rows
    for (const r of reports) {
      sheet.addRow({
        title: r.title,
        project: r.project?.name || '—',
        customer: r.project?.customer?.name || '—',
        type: r.type,
        status: r.status,
        content: r.content || '',
        createdAt: r.createdAt.toISOString().split('T')[0],
        updatedAt: r.updatedAt.toISOString().split('T')[0],
      })
    }

    // Alternating row colors
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && rowNumber % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
        })
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="reports-export-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Export reports error:', error)
    return NextResponse.json(
      { error: 'Failed to export reports' },
      { status: 500 }
    )
  }
}
