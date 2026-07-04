import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, generate2FASecret } from '@/lib/auth'
import QRCode from 'qrcode'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { secret, otpauth } = generate2FASecret(user.email)
    const qrCode = await QRCode.toDataURL(otpauth)

    return NextResponse.json({
      data: { qrCode, secret, otpauth },
    })
  } catch (error) {
    console.error('Setup 2FA error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}