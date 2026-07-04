import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, signToken, verify2FAToken, type JWTPayload } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tempToken, code } = body

    if (!tempToken || !code) {
      return NextResponse.json({ error: 'Temp token dan kode 2FA wajib diisi' }, { status: 400 })
    }

    const payload = await verifyToken(tempToken)
    if (!payload || payload.is2FATemp !== true) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId as string },
      include: { division: true },
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan atau 2FA tidak aktif' }, { status: 401 })
    }

    if (!verify2FAToken(user.twoFactorSecret, code)) {
      return NextResponse.json({ error: 'Kode 2FA tidak valid' }, { status: 401 })
    }

    // Update lastLoginAt
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const jwtPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'ADMIN' | 'USER',
      divisionId: user.divisionId,
    }

    const token = await signToken(jwtPayload)

    const response = NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          divisionId: user.divisionId,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        token,
      },
    })

    response.cookies.set('pmo_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('Verify 2FA error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}