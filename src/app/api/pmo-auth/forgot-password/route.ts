import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success to not reveal if email exists
    if (!user) {
      return NextResponse.json({
        data: { sent: true },
        message: 'Jika email terdaftar, link reset password akan dikirim',
      })
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    await db.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expiresAt,
      },
    })

    const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/?reset=${token}`

    await db.emailLog.create({
      data: {
        to: user.email,
        subject: 'Reset Password - PMO Dashboard',
        body: resetLink,
        status: 'SENT',
        userId: user.id,
      },
    })

    return NextResponse.json({
      data: { sent: true },
      message: 'Jika email terdaftar, link reset password akan dikirim',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}