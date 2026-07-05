import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recalculateProjectProgress } from '@/lib/project-utils'
import { getCurrentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId') || ''

    const where: Record<string, unknown> = {}
    if (projectId) where.projectId = projectId

    const timelines = await db.timeline.findMany({
      where,
      orderBy: { taskOrder: 'asc' },
    })

    const total = await db.timeline.count({ where })

    const serializeDate = (d: Date | null) =>
      d ? d.toISOString() : null

    const data = timelines.map((t) => ({
      ...t,
      startDate: serializeDate(t.startDate),
      endDate: serializeDate(t.endDate),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }))

    return NextResponse.json({ data, total })
  } catch (error) {
    console.error('List timelines error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timelines' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, taskName, startDate, endDate, status, progress, assignee, notes, taskOrder } = body

    if (!projectId || !taskName) {
      return NextResponse.json(
        { error: 'projectId and taskName are required' },
        { status: 400 }
      )
    }

    const projectExists = await db.project.findUnique({
      where: { id: projectId },
    })
    if (!projectExists) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 400 }
      )
    }

    const timeline = await db.timeline.create({
      data: {
        projectId,
        taskName,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'NOT_STARTED',
        progress: progress ?? 0,
        assignee: assignee || '',
        notes: notes || '',
        taskOrder: taskOrder ?? 0,
      },
    })

    const serializeDate = (d: Date | null) =>
      d ? d.toISOString() : null

    // Auto-recalculate project progress
    recalculateProjectProgress(projectId).catch((e) =>
      console.error('Failed to recalculate project progress:', e)
    )

    // Log activity
    const user = await getCurrentUser(request)
    logActivity({
      projectId,
      userId: user?.userId || 'system',
      userName: user?.name || 'System',
      action: 'CREATE',
      entity: 'timeline',
      entityName: taskName,
    }).catch((e) => console.error('Failed to log activity:', e))

    return NextResponse.json(
      { data: {
        ...timeline,
        startDate: serializeDate(timeline.startDate),
        endDate: serializeDate(timeline.endDate),
        createdAt: timeline.createdAt.toISOString(),
        updatedAt: timeline.updatedAt.toISOString(),
      }},
      { status: 201 }
    )
  } catch (error) {
    console.error('Create timeline error:', error)
    return NextResponse.json(
      { error: 'Failed to create timeline' },
      { status: 500 }
    )
  }
}