import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId') || ''

    const where: Record<string, unknown> = {}
    if (projectId) where.projectId = projectId

    const excelFiles = await db.excelFile.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
    })

    const total = await db.excelFile.count({ where })

    const data = excelFiles.map((f) => ({
      ...f,
      uploadedAt: f.uploadedAt.toISOString(),
    }))

    return NextResponse.json({ data, total })
  } catch (error) {
    console.error('List uploads error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch uploads' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
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

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parse the Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const parsedData = XLSX.utils.sheet_to_json(worksheet)

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    // Save file to disk
    const fileExtension = file.name.split('.').pop() || 'xlsx'
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`
    const filePath = join(uploadDir, uniqueFileName)
    await writeFile(filePath, buffer)

    // Create database record
    const excelFile = await db.excelFile.create({
      data: {
        projectId,
        fileName: file.name,
        filePath: `/uploads/${uniqueFileName}`,
      },
    })

    return NextResponse.json(
      { data: {
        id: excelFile.id,
        fileName: excelFile.fileName,
        projectId: excelFile.projectId,
        data: parsedData,
      }},
      { status: 201 }
    )
  } catch (error) {
    console.error('Upload file error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}