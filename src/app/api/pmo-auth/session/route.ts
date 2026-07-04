import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ data: null })
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
      include: { division: true },
    })

    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json({ data: null })
    }

    return NextResponse.json({
      data: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        divisionId: dbUser.divisionId,
        twoFactorEnabled: dbUser.twoFactorEnabled,
        division: dbUser.division
          ? { id: dbUser.division.id, name: dbUser.division.name }
          : null,
      },
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}