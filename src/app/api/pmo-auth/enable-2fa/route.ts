import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, verify2FAToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { secret, code } = body

    if (!secret || !code) {
      return NextResponse.json({ error: 'Secret dan kode verifikasi wajib diisi' }, { status: 400 })
    }

    if (!verify2FAToken(secret, code)) {
      return NextResponse.json({ error: 'Kode verifikasi tidak valid' }, { status: 400 })
    }

    await db.user.update({
      where: { id: user.userId },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true,
      },
    })

    return NextResponse.json({
      data: { enabled: true },
      message: '2FA berhasil diaktifkan',
    })
  } catch (error) {
    console.error('Enable 2FA error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}