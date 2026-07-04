import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparePassword, signToken, isEmailDomainAllowed } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 })
    }

    if (!isEmailDomainAllowed(email)) {
      return NextResponse.json({ error: 'Hanya email perusahaan yang diizinkan' }, { status: 403 })
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { division: true },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Akun tidak aktif' }, { status: 401 })
    }

    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    // If 2FA is enabled, return a temp token
    if (user.twoFactorEnabled) {
      const tempToken = await signToken(
        { userId: user.id, email: user.email, is2FATemp: true },
        '5m'
      )
      return NextResponse.json({
        data: { requires2FA: true, tempToken },
        message: 'Verifikasi 2FA diperlukan',
      })
    }

    // Normal login — update lastLoginAt
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      divisionId: user.divisionId,
    }

    const token = await signToken(payload)

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
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}