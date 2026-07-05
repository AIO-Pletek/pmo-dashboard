import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get all projects that have pending status (INTERNAL or EXTERNAL)
    const pendingProjects = await db.project.findMany({
      where: {
        pendingType: { not: 'NONE' },
      },
      include: {
        customer: true,
        picInternalDivision: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    // --- Breakdown by User (PIC Internal) ---
    const byUser: Record<string, {
      userName: string
      divisionId: string | null
      divisionName: string | null
      internal: number
      external: number
      projects: Array<{
        id: string
        name: string
        category: string
        status: string
        pendingType: string
        pendingNote: string
        customerName: string
        progress: number
        updatedAt: string
      }>
    }> = {}

    // --- Breakdown by Division ---
    const byDivision: Record<string, {
      divisionId: string
      divisionName: string
      internal: number
      external: number
      projects: Array<{
        id: string
        name: string
        category: string
        status: string
        pendingType: string
        pendingNote: string
        picInternalName: string
        customerName: string
        progress: number
        updatedAt: string
      }>
    }> = {}

    // Group "Unassigned"
    let unassignedProjects: typeof pendingProjects = []

    for (const p of pendingProjects) {
      const projectSummary = {
        id: p.id,
        name: p.name,
        category: p.category,
        status: p.status,
        pendingType: p.pendingType,
        pendingNote: p.pendingNote,
        customerName: p.customer?.name || 'N/A',
        progress: p.progress,
        updatedAt: p.updatedAt.toISOString(),
      }

      // Group by user
      const userName = p.picInternalName || 'Unassigned'
      if (!p.picInternalName) {
        unassignedProjects.push(p)
      }
      if (!byUser[userName]) {
        byUser[userName] = {
          userName,
          divisionId: p.picInternalDivisionId,
          divisionName: p.picInternalDivision?.name || null,
          internal: 0,
          external: 0,
          projects: [],
        }
      }
      if (p.pendingType === 'INTERNAL') byUser[userName].internal++
      if (p.pendingType === 'EXTERNAL') byUser[userName].external++
      byUser[userName].projects.push(projectSummary)

      // Group by division
      const divId = p.picInternalDivisionId || 'unassigned'
      const divName = p.picInternalDivision?.name || 'No Division'
      if (!byDivision[divId]) {
        byDivision[divId] = {
          divisionId: divId === 'unassigned' ? '' : divId,
          divisionName: divName,
          internal: 0,
          external: 0,
          projects: [],
        }
      }
      if (p.pendingType === 'INTERNAL') byDivision[divId].internal++
      if (p.pendingType === 'EXTERNAL') byDivision[divId].external++
      byDivision[divId].projects.push({
        ...projectSummary,
        picInternalName: p.picInternalName || '—',
      })
    }

    // Sort users by total pending (desc)
    const sortedUsers = Object.values(byUser).sort(
      (a, b) => (b.internal + b.external) - (a.internal + a.internal)
    )

    // Sort divisions by total pending (desc)
    const sortedDivisions = Object.values(byDivision).sort(
      (a, b) => (b.internal + b.external) - (a.internal + a.internal)
    )

    // Totals
    const totalInternal = pendingProjects.filter(p => p.pendingType === 'INTERNAL').length
    const totalExternal = pendingProjects.filter(p => p.pendingType === 'EXTERNAL').length

    return NextResponse.json({
      data: {
        summary: {
          totalPending: pendingProjects.length,
          totalInternal,
          totalExternal,
        },
        byUser: sortedUsers,
        byDivision: sortedDivisions,
      },
    })
  } catch (error) {
    console.error('Pending breakdown error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending breakdown' },
      { status: 500 }
    )
  }
}
