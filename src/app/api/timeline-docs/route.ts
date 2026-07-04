import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface TimelineTask {
  description: string
  assignedTo: string
  progress: number
  days: number
}

interface TimelinePhase {
  name: string
  tasks: TimelineTask[]
}

function validatePhases(phases: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(phases)) {
    return { valid: false, error: 'phases must be a JSON array' }
  }

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i]
    if (!phase.name || typeof phase.name !== 'string') {
      return { valid: false, error: `Phase ${i + 1} must have a name` }
    }
    if (!Array.isArray(phase.tasks)) {
      return { valid: false, error: `Phase "${phase.name}" must have a tasks array` }
    }
    for (let j = 0; j < phase.tasks.length; j++) {
      const task = phase.tasks[j]
      if (!task.description || typeof task.description !== 'string') {
        return { valid: false, error: `Task ${j + 1} in phase "${phase.name}" must have a description` }
      }
      if (typeof task.days !== 'number' || task.days < 0) {
        return { valid: false, error: `Task "${task.description}" must have a non-negative days number` }
      }
    }
  }

  return { valid: true }
}

function validateDate(dateStr: string): boolean {
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!isoRegex.test(dateStr)) return false
  const d = new Date(dateStr + 'T00:00:00')
  return !isNaN(d.getTime())
}

function serializeDoc(doc: {
  id: string
  title: string
  projectLead: string
  startDate: string
  totalWeeks: number
  phases: string
  notes: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...doc,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}

export async function GET() {
  try {
    const docs = await db.timelineDocument.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const total = await db.timelineDocument.count()

    const data = docs.map(serializeDoc)

    return NextResponse.json({ data, total })
  } catch (error) {
    console.error('List timeline documents error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timeline documents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, projectLead, startDate, totalWeeks, phases, notes } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (startDate && !validateDate(startDate)) {
      return NextResponse.json(
        { error: 'startDate must be a valid ISO date string (YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    if (totalWeeks !== undefined) {
      if (typeof totalWeeks !== 'number' || totalWeeks < 1 || totalWeeks > 52) {
        return NextResponse.json(
          { error: 'totalWeeks must be a number between 1 and 52' },
          { status: 400 }
        )
      }
    }

    if (phases !== undefined) {
      let parsedPhases: TimelinePhase[]
      try {
        parsedPhases = typeof phases === 'string' ? JSON.parse(phases) : phases
      } catch {
        return NextResponse.json(
          { error: 'phases must be valid JSON' },
          { status: 400 }
        )
      }

      const validation = validatePhases(parsedPhases)
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }
    }

    const doc = await db.timelineDocument.create({
      data: {
        title,
        projectLead: projectLead || '',
        startDate: startDate || '',
        totalWeeks: totalWeeks || 5,
        phases: phases ? (typeof phases === 'string' ? phases : JSON.stringify(phases)) : '[]',
        notes: notes || '',
      },
    })

    return NextResponse.json(
      { data: serializeDoc(doc) },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create timeline document error:', error)
    return NextResponse.json(
      { error: 'Failed to create timeline document' },
      { status: 500 }
    )
  }
}