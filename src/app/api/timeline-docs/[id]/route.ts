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
  let parsedPhases: TimelinePhase[] = []
  try {
    parsedPhases = JSON.parse(doc.phases)
  } catch {
    parsedPhases = []
  }

  return {
    ...doc,
    phases: parsedPhases,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const doc = await db.timelineDocument.findUnique({
      where: { id },
    })

    if (!doc) {
      return NextResponse.json(
        { error: 'Timeline document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: serializeDoc(doc) })
  } catch (error) {
    console.error('Get timeline document error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timeline document' },
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
    const { title, projectLead, startDate, totalWeeks, phases, notes } = body

    const existing = await db.timelineDocument.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Timeline document not found' },
        { status: 404 }
      )
    }

    if (title !== undefined && (!title || typeof title !== 'string')) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (startDate !== undefined) {
      if (!validateDate(startDate)) {
        return NextResponse.json(
          { error: 'startDate must be a valid ISO date string (YYYY-MM-DD)' },
          { status: 400 }
        )
      }
    }

    if (totalWeeks !== undefined) {
      if (typeof totalWeeks !== 'number' || totalWeeks < 1 || totalWeeks > 52) {
        return NextResponse.json(
          { error: 'totalWeeks must be a number between 1 and 52' },
          { status: 400 }
        )
      }
    }

    let phasesStr: string | undefined
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

      phasesStr = typeof phases === 'string' ? phases : JSON.stringify(phases)
    }

    const doc = await db.timelineDocument.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(projectLead !== undefined && { projectLead }),
        ...(startDate !== undefined && { startDate }),
        ...(totalWeeks !== undefined && { totalWeeks }),
        ...(phasesStr !== undefined && { phases: phasesStr }),
        ...(notes !== undefined && { notes }),
      },
    })

    return NextResponse.json({ data: serializeDoc(doc) })
  } catch (error) {
    console.error('Update timeline document error:', error)
    return NextResponse.json(
      { error: 'Failed to update timeline document' },
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

    const existing = await db.timelineDocument.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Timeline document not found' },
        { status: 404 }
      )
    }

    await db.timelineDocument.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete timeline document error:', error)
    return NextResponse.json(
      { error: 'Failed to delete timeline document' },
      { status: 500 }
    )
  }
}