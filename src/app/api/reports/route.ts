import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = {}
    if (projectId) where.projectId = projectId
    if (type) where.type = type
    if (status) where.status = status

    const reports = await db.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          include: { customer: true },
        },
      },
    })

    const total = await db.report.count({ where })

    const serializeDate = (d: Date | null) =>
      d ? d.toISOString() : null

    const data = reports.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      project: r.project
        ? {
            ...r.project,
            startDate: serializeDate(r.project.startDate),
            endDate: serializeDate(r.project.endDate),
            createdAt: r.project.createdAt.toISOString(),
            updatedAt: r.project.updatedAt.toISOString(),
            customer: r.project.customer
              ? {
                  ...r.project.customer,
                  createdAt: r.project.customer.createdAt.toISOString(),
                  updatedAt: r.project.customer.updatedAt.toISOString(),
                }
              : null,
          }
        : null,
    }))

    return NextResponse.json({ data, total })
  } catch (error) {
    console.error('List reports error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, title, type, content, status } = body

    if (!projectId || !title) {
      return NextResponse.json(
        { error: 'projectId and title are required' },
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

    const report = await db.report.create({
      data: {
        projectId,
        title,
        type: type || 'WEEKLY',
        content: content || '',
        status: status || 'DRAFT',
      },
    })

    return NextResponse.json(
      { data: {
        ...report,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
      }},
      { status: 201 }
    )
  } catch (error) {
    console.error('Create report error:', error)
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    )
  }
}