import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.excelFile.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Excel file record not found' },
        { status: 404 }
      )
    }

    // Delete file from disk
    try {
      const filePath = join(process.cwd(), 'public', existing.filePath)
      await unlink(filePath)
    } catch {
      // File may already be deleted from disk, continue with DB deletion
    }

    // Delete database record
    await db.excelFile.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete upload error:', error)
    return NextResponse.json(
      { error: 'Failed to delete upload' },
      { status: 500 }
    )
  }
}