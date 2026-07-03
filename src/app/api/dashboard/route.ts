import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [
      totalCustomers,
      totalProjects,
      projectsByCategory,
      projectsByStatus,
      recentProjects,
      upcomingDeadlines,
    ] = await Promise.all([
      db.customer.count(),
      db.project.count(),
      db.project.groupBy({
        by: ['category'],
        _count: { category: true },
      }),
      db.project.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      db.project.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { customer: true },
      }),
      db.project.findMany({
        where: {
          endDate: { gte: new Date() },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
        orderBy: { endDate: 'asc' },
        take: 5,
        include: { customer: true },
      }),
    ])

    const serializeDate = (d: Date | null) =>
      d ? d.toISOString() : null

    const formatProject = (p: typeof recentProjects[0]) => ({
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
    })

    return NextResponse.json({
      totalCustomers,
      totalProjects,
      projectsByCategory: projectsByCategory.map((item) => ({
        category: item.category,
        count: item._count.category,
      })),
      projectsByStatus: projectsByStatus.map((item) => ({
        status: item.status,
        count: item._count.status,
      })),
      recentProjects: recentProjects.map(formatProject),
      upcomingDeadlines: upcomingDeadlines.map(formatProject),
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}