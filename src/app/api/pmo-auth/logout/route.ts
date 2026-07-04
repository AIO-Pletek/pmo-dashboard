import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({
      data: { success: true },
    })

    response.cookies.set('pmo_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}