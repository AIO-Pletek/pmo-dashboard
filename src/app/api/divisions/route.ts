import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const divisions = await db.division.findMany({
      orderBy: { name: 'asc' },
    })

    const data = await Promise.all(
      divisions.map(async (d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        _count: {
          projects: await db.project.count({
            where: { picInternalDivisionId: d.id },
          }),
        },
      }))
    )

    return NextResponse.json({ data, total: data.length })
  } catch (error) {
    console.error('List divisions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch divisions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Division name is required' },
        { status: 400 }
      )
    }

    const division = await db.division.create({
      data: {
        name: name.trim(),
        description: description || '',
      },
    })

    return NextResponse.json(
      {
        data: {
          ...division,
          createdAt: division.createdAt.toISOString(),
          updatedAt: division.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create division error:', error)
    return NextResponse.json(
      { error: 'Failed to create division' },
      { status: 500 }
    )
  }
}