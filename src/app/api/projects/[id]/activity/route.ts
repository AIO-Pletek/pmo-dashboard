import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

// GET /api/projects/[id]/activity — Fetch activity logs
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const logs = await db.activityLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const data = logs.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    }))

    return NextResponse.json({ data, total: data.length })
  } catch (error) {
    console.error('Activity log error:', error)
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 })
  }
}

// POST /api/projects/[id]/activity — Log a VIEW action
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await logActivity({
      projectId,
      userId: user.userId,
      userName: user.name,
      action: 'VIEW',
      entity: 'project',
      entityName: project.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Log view error:', error)
    return NextResponse.json({ error: 'Failed to log view' }, { status: 500 })
  }
}
