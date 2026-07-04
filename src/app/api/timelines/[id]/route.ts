import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.timeline.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Timeline not found' },
        { status: 404 }
      )
    }

    const { taskName, startDate, endDate, status, progress, assignee, notes, taskOrder } = body

    const timeline = await db.timeline.update({
      where: { id },
      data: {
        ...(taskName !== undefined && { taskName }),
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
        ...(status !== undefined && { status }),
        ...(progress !== undefined && { progress }),
        ...(assignee !== undefined && { assignee }),
        ...(notes !== undefined && { notes }),
        ...(taskOrder !== undefined && { taskOrder }),
      },
    })

    const serializeDate = (d: Date | null) =>
      d ? d.toISOString() : null

    return NextResponse.json({ data: {
      ...timeline,
      startDate: serializeDate(timeline.startDate),
      endDate: serializeDate(timeline.endDate),
      createdAt: timeline.createdAt.toISOString(),
      updatedAt: timeline.updatedAt.toISOString(),
    }})
  } catch (error) {
    console.error('Update timeline error:', error)
    return NextResponse.json(
      { error: 'Failed to update timeline' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.timeline.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Timeline not found' },
        { status: 404 }
      )
    }

    await db.timeline.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete timeline error:', error)
    return NextResponse.json(
      { error: 'Failed to delete timeline' },
      { status: 500 }
    )
  }
}