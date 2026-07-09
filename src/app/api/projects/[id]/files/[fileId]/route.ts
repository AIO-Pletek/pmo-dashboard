import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { join } from 'path'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { getCurrentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

// DELETE /api/projects/[id]/files/[fileId] — Delete file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id: projectId, fileId } = await params
    const user = await getCurrentUser(request)

    const file = await db.excelFile.findUnique({
      where: { id: fileId },
    })

    if (!file || file.projectId !== projectId) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete from disk
    const filePath = join(process.cwd(), 'public', file.filePath)
    if (existsSync(filePath)) {
      await unlink(filePath)
    }

    // Delete from DB
    await db.excelFile.delete({ where: { id: fileId } })

    // Log activity
    logActivity({
      projectId,
      userId: user?.userId || 'system',
      userName: user?.name || 'System',
      action: 'DELETE',
      entity: 'excel',
      entityName: file.fileName,
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete file error:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}
