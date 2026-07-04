import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, comparePassword, hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Password lama dan baru wajib diisi' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password baru minimal 8 karakter' }, { status: 400 })
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
    }

    const isValid = await comparePassword(currentPassword, dbUser.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Password lama salah' }, { status: 401 })
    }

    const hashedPassword = await hashPassword(newPassword)
    await db.user.update({
      where: { id: user.userId },
      data: { password: hashedPassword },
    })

    return NextResponse.json({
      data: { success: true },
      message: 'Password berhasil diubah',
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}