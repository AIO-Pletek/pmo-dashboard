import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, hashPassword } from '@/lib/auth'

// GET /api/users/[id] — Get single user (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { id } = await params

    const dbUser = await db.user.findUnique({
      where: { id },
      include: { division: true },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        divisionId: dbUser.divisionId,
        twoFactorEnabled: dbUser.twoFactorEnabled,
        isActive: dbUser.isActive,
        lastLoginAt: dbUser.lastLoginAt?.toISOString() || null,
        division: dbUser.division ? { id: dbUser.division.id, name: dbUser.division.name } : null,
        createdAt: dbUser.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// PUT /api/users/[id] — Update user (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, role, divisionId, isActive, password } = body

    const existingUser = await db.user.findUnique({ where: { id } })
    if (!existingUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (role !== undefined) {
      if (role !== 'ADMIN' && role !== 'USER') {
        return NextResponse.json({ error: 'Role harus ADMIN atau USER' }, { status: 400 })
      }
      updateData.role = role
    }
    if (divisionId !== undefined) updateData.divisionId = divisionId || null
    if (isActive !== undefined) updateData.isActive = isActive

    if (password) {
      if (password.length < 8) {
        return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 })
      }
      updateData.password = await hashPassword(password)
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      include: { division: true },
    })

    return NextResponse.json({
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        divisionId: updatedUser.divisionId,
        twoFactorEnabled: updatedUser.twoFactorEnabled,
        isActive: updatedUser.isActive,
        lastLoginAt: updatedUser.lastLoginAt?.toISOString() || null,
        division: updatedUser.division ? { id: updatedUser.division.id, name: updatedUser.division.name } : null,
        createdAt: updatedUser.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE /api/users/[id] — Delete user (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { id } = await params

    if (id === user.userId) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({ where: { id } })
    if (!existingUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
    }

    await db.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}