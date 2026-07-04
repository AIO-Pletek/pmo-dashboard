import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const division = await db.division.findUnique({
      where: { id },
    })

    if (!division) {
      return NextResponse.json(
        { error: 'Division not found' },
        { status: 404 }
      )
    }

    const projectCount = await db.project.count({
      where: { picInternalDivisionId: id },
    })

    return NextResponse.json({
      data: {
        ...division,
        createdAt: division.createdAt.toISOString(),
        updatedAt: division.updatedAt.toISOString(),
        _count: { projects: projectCount },
      },
    })
  } catch (error) {
    console.error('Get division error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch division' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.division.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Division not found' },
        { status: 404 }
      )
    }

    const { name, description } = body

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return NextResponse.json(
        { error: 'Division name cannot be empty' },
        { status: 400 }
      )
    }

    const division = await db.division.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
      },
    })

    return NextResponse.json({
      data: {
        ...division,
        createdAt: division.createdAt.toISOString(),
        updatedAt: division.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Update division error:', error)
    return NextResponse.json(
      { error: 'Failed to update division' },
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

    const existing = await db.division.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Division not found' },
        { status: 404 }
      )
    }

    await db.division.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete division error:', error)
    return NextResponse.json(
      { error: 'Failed to delete division' },
      { status: 500 }
    )
  }
}