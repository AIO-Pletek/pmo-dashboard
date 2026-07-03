import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const project = await db.project.findUnique({
      where: { id },
      include: {
        customer: true,
        timelines: { orderBy: { taskOrder: 'asc' } },
        reports: { orderBy: { createdAt: 'desc' } },
        excelFiles: { orderBy: { uploadedAt: 'desc' } },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const serializeDate = (d: Date | null) =>
      d ? d.toISOString() : null

    return NextResponse.json({ data: {
      ...project,
      startDate: serializeDate(project.startDate),
      endDate: serializeDate(project.endDate),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      customer: project.customer
        ? {
            ...project.customer,
            createdAt: project.customer.createdAt.toISOString(),
            updatedAt: project.customer.updatedAt.toISOString(),
          }
        : null,
      timelines: project.timelines.map((t) => ({
        ...t,
        startDate: serializeDate(t.startDate),
        endDate: serializeDate(t.endDate),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      reports: project.reports.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      excelFiles: project.excelFiles.map((e) => ({
        ...e,
        uploadedAt: e.uploadedAt.toISOString(),
      })),
    }})
  } catch (error) {
    console.error('Get project error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
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

    const existing = await db.project.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const {
      name,
      customerId,
      category,
      status,
      description,
      startDate,
      endDate,
      progress,
      budget,
      priority,
      notes,
    } = body

    const project = await db.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(customerId !== undefined && { customerId }),
        ...(category !== undefined && { category }),
        ...(status !== undefined && { status }),
        ...(description !== undefined && { description }),
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
        ...(progress !== undefined && { progress }),
        ...(budget !== undefined && { budget }),
        ...(priority !== undefined && { priority }),
        ...(notes !== undefined && { notes }),
      },
    })

    const serializeDate = (d: Date | null) =>
      d ? d.toISOString() : null

    return NextResponse.json({ data: {
      ...project,
      startDate: serializeDate(project.startDate),
      endDate: serializeDate(project.endDate),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }})
  } catch (error) {
    console.error('Update project error:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
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

    const existing = await db.project.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    await db.project.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}