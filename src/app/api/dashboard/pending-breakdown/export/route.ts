import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ExcelJS from 'exceljs'

export async function GET() {
  try {
    const pendingProjects = await db.project.findMany({
      where: { pendingType: { not: 'NONE' } },
      include: {
        customer: true,
        picInternalDivision: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Group by user
    const byUser: Record<string, typeof pendingProjects> = {}
    for (const p of pendingProjects) {
      const key = p.picInternalName || 'Unassigned'
      if (!byUser[key]) byUser[key] = []
      byUser[key].push(p)
    }

    // Group by division
    const byDivision: Record<string, typeof pendingProjects> = {}
    for (const p of pendingProjects) {
      const key = p.picInternalDivision?.name || 'No Division'
      if (!byDivision[key]) byDivision[key] = []
      byDivision[key].push(p)
    }

    const workbook = new ExcelJS.Workbook()

    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFD97706' } },
      alignment: { vertical: 'middle' as const, horizontal: 'left' as const },
      border: {
        top: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        left: { style: 'thin' as const },
        right: { style: 'thin' as const },
      },
    }

    const projectCols = [
      { header: 'Project', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Pending Type', key: 'pendingType', width: 15 },
      { header: 'Pending Note', key: 'pendingNote', width: 30 },
      { header: 'Progress', key: 'progress', width: 10 },
      { header: 'PIC Internal', key: 'picInternal', width: 18 },
      { header: 'Division', key: 'division', width: 18 },
      { header: 'Updated', key: 'updatedAt', width: 15 },
    ]

    // Sheet 1: By User
    const userSheet = workbook.addWorksheet('Pending by User')
    userSheet.columns = [
      { header: 'User', key: 'user', width: 20 },
      { header: 'Division', key: 'div', width: 18 },
      { header: 'Internal Count', key: 'intCount', width: 14 },
      { header: 'External Count', key: 'extCount', width: 14 },
      { header: 'Total Pending', key: 'total', width: 14 },
    ]
    const userHeaderRow = userSheet.getRow(1)
    userHeaderRow.height = 22
    userHeaderRow.eachCell((cell) => {
      cell.font = headerStyle.font
      cell.fill = headerStyle.fill
      cell.alignment = headerStyle.alignment
      cell.border = headerStyle.border
    })

    for (const [userName, projects] of Object.entries(byUser)) {
      const internal = projects.filter(p => p.pendingType === 'INTERNAL').length
      const external = projects.filter(p => p.pendingType === 'EXTERNAL').length
      userSheet.addRow({
        user: userName,
        div: projects[0]?.picInternalDivision?.name || '—',
        intCount: internal,
        extCount: external,
        total: projects.length,
      })
    }

    // Sheet 2: By Division
    const divSheet = workbook.addWorksheet('Pending by Division')
    divSheet.columns = [
      { header: 'Division', key: 'division', width: 20 },
      { header: 'Internal Count', key: 'intCount', width: 14 },
      { header: 'External Count', key: 'extCount', width: 14 },
      { header: 'Total Pending', key: 'total', width: 14 },
    ]
    const divHeaderRow = divSheet.getRow(1)
    divHeaderRow.height = 22
    divHeaderRow.eachCell((cell) => {
      cell.font = headerStyle.font
      cell.fill = headerStyle.fill
      cell.alignment = headerStyle.alignment
      cell.border = headerStyle.border
    })

    for (const [divName, projects] of Object.entries(byDivision)) {
      const internal = projects.filter(p => p.pendingType === 'INTERNAL').length
      const external = projects.filter(p => p.pendingType === 'EXTERNAL').length
      divSheet.addRow({
        division: divName,
        intCount: internal,
        extCount: external,
        total: projects.length,
      })
    }

    // Sheet 3: All Pending Projects Detail
    const detailSheet = workbook.addWorksheet('All Pending Projects')
    detailSheet.columns = projectCols
    const detailHeaderRow = detailSheet.getRow(1)
    detailHeaderRow.height = 22
    const greenHeaderStyle = { ...headerStyle, fill: { ...headerStyle.fill, fgColor: { argb: 'FF059669' } } }
    detailHeaderRow.eachCell((cell) => {
      cell.font = greenHeaderStyle.font
      cell.fill = greenHeaderStyle.fill
      cell.alignment = greenHeaderStyle.alignment
      cell.border = greenHeaderStyle.border
    })

    for (const p of pendingProjects) {
      detailSheet.addRow({
        name: p.name,
        category: p.category,
        status: p.status,
        customer: p.customer?.name || '—',
        pendingType: p.pendingType,
        pendingNote: p.pendingNote,
        progress: `${p.progress}%`,
        picInternal: p.picInternalName || '—',
        division: p.picInternalDivision?.name || '—',
        updatedAt: p.updatedAt.toISOString().split('T')[0],
      })
    }

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="pending-drawdown-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Export pending breakdown error:', error)
    return NextResponse.json(
      { error: 'Failed to export pending breakdown' },
      { status: 500 }
    )
  }
}
