import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { company: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {}

    const customers = await db.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { projects: true } },
      },
    })

    const total = await db.customer.count({ where })

    const data = customers.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      projectCount: c._count.projects,
    }))

    return NextResponse.json({ data, total })
  } catch (error) {
    console.error('List customers error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, company, industry, email, phone, address, notes } = body

    if (!name || !company) {
      return NextResponse.json(
        { error: 'Name and company are required' },
        { status: 400 }
      )
    }

    const customer = await db.customer.create({
      data: {
        name,
        company,
        industry: industry || '',
        email: email || '',
        phone: phone || '',
        address: address || '',
        notes: notes || '',
      },
    })

    return NextResponse.json(
      { data: {
        ...customer,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      }},
      { status: 201 }
    )
  } catch (error) {
    console.error('Create customer error:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}