import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = {}
    if (customerId) where.customerId = customerId
    if (category) where.category = category
    if (status) where.status = status

    const projects = await db.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    })

    const total = await db.project.count({ where })

    const serializeDate = (d: Date | null) =>
      d ? d.toISOString() : null

    const data = projects.map((p) => ({
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

    return NextResponse.json({ data, total })
  } catch (error) {
    console.error('List projects error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      customerId,
      category,
      status,
      description,
      startDate,
      endDate,
      budget,
      priority,
      notes,
    } = body

    if (!name || !customerId || !category) {
      return NextResponse.json(
        { error: 'Name, customerId, and category are required' },
        { status: 400 }
      )
    }

    const customerExists = await db.customer.findUnique({
      where: { id: customerId },
    })
    if (!customerExists) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 400 }
      )
    }

    const project = await db.project.create({
      data: {
        name,
        customerId,
        category,
        status: status || 'PLANNING',
        description: description || '',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ?? 0,
        priority: priority || 'MEDIUM',
        notes: notes || '',
      },
    })

    const serializeDate = (d: Date | null) =>
      d ? d.toISOString() : null

    return NextResponse.json(
      { data: {
        ...project,
        startDate: serializeDate(project.startDate),
        endDate: serializeDate(project.endDate),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      }},
      { status: 201 }
    )
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}