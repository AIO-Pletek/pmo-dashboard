import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.report.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    const { title, type, content, status } = body

    const report = await db.report.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(type !== undefined && { type }),
        ...(content !== undefined && { content }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json({ data: {
      ...report,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    }})
  } catch (error) {
    console.error('Update report error:', error)
    return NextResponse.json(
      { error: 'Failed to update report' },
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

    const existing = await db.report.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    await db.report.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete report error:', error)
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    )
  }
}