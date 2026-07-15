import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/public/projects/[token] — Public project view (no auth)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const project = await db.project.findUnique({
      where: { shareToken: token },
      include: {
        customer: true,
        picInternalDivision: true,
        picInternalDivision2: true,
        timelines: { orderBy: { taskOrder: 'asc' } },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found or link expired' }, { status: 404 })
    }

    const serializeDate = (d: Date | null) => (d ? d.toISOString() : null)

    return NextResponse.json({
      data: {
        id: project.id,
        name: project.name,
        category: project.category,
        status: project.status,
        description: project.description,
        startDate: serializeDate(project.startDate),
        endDate: serializeDate(project.endDate),
        progress: project.progress,
        priority: project.priority,
        customer: project.customer ? {
          name: project.customer.name,
          company: project.customer.company,
        } : null,
        picInternalName: project.picInternalName,
        picInternalDivision: project.picInternalDivision ? {
          name: project.picInternalDivision.name,
        } : null,
        picInternalName2: project.picInternalName2,
        picInternalDivision2: project.picInternalDivision2 ? {
          name: project.picInternalDivision2.name,
        } : null,
        pendingType: project.pendingType,
        timelines: project.timelines.map((t) => ({
          id: t.id,
          taskName: t.taskName,
          status: t.status,
          progress: t.progress,
          assignee: t.assignee,
          startDate: serializeDate(t.startDate),
          endDate: serializeDate(t.endDate),
          notes: t.notes,
        })),
        updatedAt: project.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Public project view error:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}
