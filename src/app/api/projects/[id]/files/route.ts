import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { unlink } from 'fs/promises'
import { getCurrentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

// GET /api/projects/[id]/files — List files
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const files = await db.excelFile.findMany({
      where: { projectId },
      orderBy: { uploadedAt: 'desc' },
    })

    const data = files.map((f) => ({
      ...f,
      uploadedAt: f.uploadedAt.toISOString(),
    }))

    return NextResponse.json({ data, total: data.length })
  } catch (error) {
    console.error('List files error:', error)
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 })
  }
}

// POST /api/projects/[id]/files — Upload file
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

    // Limit file size to 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 })
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileName = `${timestamp}_${safeName}`
    const filePath = join(UPLOAD_DIR, fileName)

    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save record
    const record = await db.excelFile.create({
      data: {
        projectId,
        fileName: file.name,
        filePath: `/uploads/${fileName}`,
      },
    })

    // Log activity
    logActivity({
      projectId,
      userId: user?.userId || 'system',
      userName: user?.name || 'System',
      action: 'CREATE',
      entity: 'excel',
      entityName: file.name,
      details: `File attached (${(file.size / 1024).toFixed(1)} KB)`,
    }).catch(() => {})

    return NextResponse.json(
      {
        data: {
          ...record,
          uploadedAt: record.uploadedAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Upload file error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
