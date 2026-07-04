import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token dan password baru wajib diisi' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 })
    }

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Link reset password tidak valid atau sudah kadaluarsa' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(newPassword)

    // Update user password
    await db.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    })

    // Mark token as used
    await db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    })

    // Log email
    await db.emailLog.create({
      data: {
        to: resetToken.email,
        subject: 'Password Berhasil Direset - PMO Dashboard',
        body: 'Password Anda berhasil direset. Jika Anda tidak melakukan ini, segera hubungi administrator.',
        status: 'SENT',
        userId: resetToken.userId,
      },
    })

    return NextResponse.json({
      data: { success: true },
      message: 'Password berhasil direset',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}