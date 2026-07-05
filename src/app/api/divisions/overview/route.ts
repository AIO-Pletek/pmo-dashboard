import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const divisions = await db.division.findMany({
      orderBy: { name: 'asc' },
    })

    const projectsWithoutDivision = await db.project.count({
      where: { picInternalDivisionId: null },
    })

    const allStatuses = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']
    const allCategories = ['ONGOING_CUSTOMER', 'POC_CUSTOMER']
    const allPendingTypes = ['NONE', 'INTERNAL', 'EXTERNAL']

    const serializeDate = (d: Date | null) =>
      d ? d.toISOString() : null

    const divisionsData = await Promise.all(
      divisions.map(async (division) => {
        const projects = await db.project.findMany({
          where: { picInternalDivisionId: division.id },
          include: { customer: true },
        })

        const projectsByStatus: Record<string, number> = {}
        for (const s of allStatuses) projectsByStatus[s] = 0
        for (const p of projects) {
          projectsByStatus[p.status] = (projectsByStatus[p.status] || 0) + 1
        }

        const projectsByCategory: Record<string, number> = {}
        for (const c of allCategories) projectsByCategory[c] = 0
        for (const p of projects) {
          projectsByCategory[p.category] = (projectsByCategory[p.category] || 0) + 1
        }

        const projectsByPendingType: Record<string, number> = {}
        for (const pt of allPendingTypes) projectsByPendingType[pt] = 0
        for (const p of projects) {
          projectsByPendingType[p.pendingType] = (projectsByPendingType[p.pendingType] || 0) + 1
        }

        const pendingProjects = projects
          .filter((p) => p.pendingType !== 'NONE')
          .map((p) => ({
            ...p,
            startDate: serializeDate(p.startDate),
            endDate: serializeDate(p.endDate),
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
            customer: p.customer
              ? {
                  ...p.customer,
                  createdAt: p.customer.createdAt.toISOString(),
                  updatedAt: p.customer.updatedAt.toISOString(),
                }
              : null,
          }))

        return {
          id: division.id,
          name: division.name,
          description: division.description,
          createdAt: division.createdAt.toISOString(),
          updatedAt: division.updatedAt.toISOString(),
          totalProjects: projects.length,
          projectsByStatus,
          projectsByCategory,
          projectsByPendingType,
          pendingProjects,
        }
      })
    )

    // Compute summary
    let totalPendingInternal = 0
    let totalPendingExternal = 0
    let totalPendingNone = 0
    for (const d of divisionsData) {
      totalPendingInternal += d.projectsByPendingType['INTERNAL'] || 0
      totalPendingExternal += d.projectsByPendingType['EXTERNAL'] || 0
      totalPendingNone += d.projectsByPendingType['NONE'] || 0
    }

    return NextResponse.json({
      data: {
        divisions: divisionsData,
        summary: {
          totalDivisions: divisions.length,
          totalPendingInternal,
          totalPendingExternal,
          totalPendingNone,
          projectsWithoutDivision,
        },
      },
    })
  } catch (error) {
    console.error('Division overview error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch division overview' },
      { status: 500 }
    )
  }
}