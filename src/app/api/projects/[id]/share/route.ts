import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { randomBytes } from 'crypto'

// POST /api/projects/[id]/share — Generate share link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await db.project.findUnique({ where: { id } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Generate unique token
    const token = randomBytes(16).toString('hex')

    await db.project.update({
      where: { id },
      data: { shareToken: token },
    })

    return NextResponse.json({
      data: {
        shareToken: token,
        shareUrl: `${process.env.APP_URL || ''}/share/${token}`,
      },
    })
  } catch (error) {
    console.error('Share project error:', error)
    return NextResponse.json({ error: 'Failed to generate share link' }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/share — Revoke share link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.project.update({
      where: { id },
      data: { shareToken: null },
    })

    return NextResponse.json({ data: { message: 'Share link revoked' } })
  } catch (error) {
    console.error('Revoke share error:', error)
    return NextResponse.json({ error: 'Failed to revoke share link' }, { status: 500 })
  }
}
