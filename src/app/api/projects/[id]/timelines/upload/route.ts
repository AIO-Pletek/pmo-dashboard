import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'
import { recalculateProjectProgress } from '@/lib/project-utils'
import * as XLSX from 'xlsx'

const COLUMN_MAP: Record<string, string> = {
  'task': 'taskName',
  'taskname': 'taskName',
  'task name': 'taskName',
  'nama task': 'taskName',
  'nama': 'taskName',
  'name': 'taskName',

  'start': 'startDate',
  'startdate': 'startDate',
  'start date': 'startDate',
  'mulai': 'startDate',
  'tanggal mulai': 'startDate',

  'end': 'endDate',
  'enddate': 'endDate',
  'end date': 'endDate',
  'selesai': 'endDate',
  'tanggal selesai': 'endDate',

  'assignee': 'assignee',
  'pic': 'assignee',
  'assigned': 'assignee',
  'assigned to': 'assignee',
  'penanggung jawab': 'assignee',

  'progress': 'progress',
  'progress (%)': 'progress',
  'progres': 'progress',

  'status': 'status',
  'state': 'status',

  'notes': 'notes',
  'catatan': 'notes',
  'keterangan': 'notes',

  'order': 'taskOrder',
  'taskorder': 'taskOrder',
  'task order': 'taskOrder',
  'no': 'taskOrder',
  '#': 'taskOrder',
}

function normalizeHeader(h: string): string {
  const key = h.trim().toLowerCase()
  return COLUMN_MAP[key] || key.replace(/\s+/g, '').toLowerCase()
}

function parseDate(val: unknown): string | null {
  if (!val) return null
  if (val instanceof Date) return val.toISOString().split('T')[0]
  const str = String(val).trim()
  // Excel serial date number
  const num = Number(str)
  if (!isNaN(num) && num > 40000 && num < 60000) {
    // Convert Excel date serial to date
    const d = new Date((num - 25569) * 86400 * 1000)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }
  // Try parsing date string
  const d = new Date(str)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  return null
}

function parseProgress(val: unknown): number {
  if (val === null || val === undefined) return 0
  const num = Number(val)
  if (isNaN(num)) return 0
  return Math.min(100, Math.max(0, Math.round(num)))
}

function normalizeStatus(val: unknown): string {
  if (!val) return 'NOT_STARTED'
  const s = String(val).trim().toUpperCase().replace(/[\s-]/g, '_')
  const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED']
  // Fuzzy match
  if (s.includes('NOT') || s.includes('BELUM')) return 'NOT_STARTED'
  if (s.includes('PROGRESS') || s.includes('JALAN') || s.includes('ONGOING')) return 'IN_PROGRESS'
  if (s.includes('COMPLETE') || s.includes('DONE') || s.includes('SELESAI')) return 'COMPLETED'
  if (s.includes('DELAY') || s.includes('TELAT') || s.includes('TERLAMBAT')) return 'DELAYED'
  // Exact match
  if (validStatuses.includes(s)) return s
  return 'NOT_STARTED'
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const user = await getCurrentUser(request)

    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read Excel
    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 })
    }

    // Normalize headers + detect first column as fallback task name
    const originalKeys = rows.length > 0 ? Object.keys(rows[0]) : []
    const firstColKey = originalKeys.length > 0 ? normalizeHeader(originalKeys[0]) : ''

    const normalizedRows = rows.map((row) => {
      const mapped: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(row)) {
        const nk = normalizeHeader(key)
        mapped[nk] = val
      }
      return mapped
    })

    // Log detected headers for debugging
    const headers = normalizedRows.length > 0 ? Object.keys(normalizedRows[0]) : []
    console.log('Detected Excel headers:', headers)
    console.log('First column key:', firstColKey)

    // Get max taskOrder
    const maxOrder = await db.timeline.aggregate({
      where: { projectId },
      _max: { taskOrder: true },
    })
    let nextOrder = (maxOrder._max.taskOrder ?? -1) + 1

    // Create timeline entries
    const created: Array<{ taskName: string; status: string }> = []
    const errors: string[] = []

    for (let i = 0; i < normalizedRows.length; i++) {
      const row = normalizedRows[i]
      // Try known task name fields, then fallback to first column
      const taskName = String(
        row.taskName || row.taskname ||
        row.name || row.nama ||
        row.activity || row.kegiatan ||
        row.description || row.deskripsi ||
        (firstColKey ? row[firstColKey] : '') ||
        ''
      ).trim()
      if (!taskName || taskName === '[object Object]') {
        errors.push(`Row ${i + 2}: Missing task name, skipped`)
        continue
      }

      try {
        await db.timeline.create({
          data: {
            projectId,
            taskName,
            startDate: parseDate(row.startDate || row.startdate) ? new Date(parseDate(row.startDate || row.startdate) + 'T00:00:00') : null,
            endDate: parseDate(row.endDate || row.enddate) ? new Date(parseDate(row.endDate || row.enddate) + 'T00:00:00') : null,
            status: normalizeStatus(row.status),
            progress: parseProgress(row.progress),
            assignee: String(row.assignee || '').trim(),
            notes: String(row.notes || '').trim(),
            taskOrder: nextOrder++,
          },
        })
        created.push({ taskName, status: normalizeStatus(row.status) })
      } catch (e) {
        errors.push(`Row ${i + 2} (${taskName}): Failed to create`)
      }
    }

    // Recalculate project progress
    await recalculateProjectProgress(projectId)

    // Log activity
    logActivity({
      projectId,
      userId: user?.userId || 'system',
      userName: user?.name || 'System',
      action: 'CREATE',
      entity: 'timeline',
      entityName: `${created.length} tasks imported`,
      details: `Excel import: ${created.length} created${errors.length ? `, ${errors.length} errors` : ''}`,
    }).catch(() => {})

    return NextResponse.json({
      data: {
        created: created.length,
        errors: errors.length,
        headers: headers,
        tasks: created.slice(0, 5),
        errorDetails: errors.length > 0 ? errors.slice(0, 5) : undefined,
      },
    })
  } catch (error) {
    console.error('Import timeline error:', error)
    return NextResponse.json(
      { error: 'Failed to import timeline from Excel' },
      { status: 500 }
    )
  }
}
