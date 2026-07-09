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
      include: { customer: true, picInternalDivision: true, picInternalDivision2: true },
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
      picInternalName,
      picInternalDivisionId,
      picInternalName2,
      picInternalDivisionId2,
      picExternalName,
      pendingType,
      pendingNote,
    } = body

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      )
    }

    // customerId is required for non-INTERNAL projects
    if (category !== 'INTERNAL' && !customerId) {
      return NextResponse.json(
        { error: 'customerId is required for non-INTERNAL projects' },
        { status: 400 }
      )
    }

    const validPendingTypes = ['NONE', 'INTERNAL', 'EXTERNAL']
    if (pendingType && !validPendingTypes.includes(pendingType)) {
      return NextResponse.json(
        { error: 'pendingType must be one of: NONE, INTERNAL, EXTERNAL' },
        { status: 400 }
      )
    }

    // Validate customer if provided
    if (customerId) {
      const customerExists = await db.customer.findUnique({
        where: { id: customerId },
      })
      if (!customerExists) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 400 }
        )
      }
    }

    if (picInternalDivisionId) {
      const divisionExists = await db.division.findUnique({
        where: { id: picInternalDivisionId },
      })
      if (!divisionExists) {
        return NextResponse.json(
          { error: 'Division not found' },
          { status: 400 }
        )
      }
    }

    if (picInternalDivisionId2) {
      const divisionExists = await db.division.findUnique({
        where: { id: picInternalDivisionId2 },
      })
      if (!divisionExists) {
        return NextResponse.json(
          { error: 'Division 2 not found' },
          { status: 400 }
        )
      }
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
        picInternalName: picInternalName || '',
        picInternalDivisionId: picInternalDivisionId || null,
        picInternalName2: picInternalName2 || '',
        picInternalDivisionId2: picInternalDivisionId2 || null,
        picExternalName: picExternalName || '',
        pendingType: pendingType || 'NONE',
        pendingNote: pendingNote || '',
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