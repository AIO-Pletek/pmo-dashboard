import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, hashPassword, isEmailDomainAllowed } from '@/lib/auth'

// GET /api/users — List users (Admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {}

    const users = await db.user.findMany({
      where,
      include: { division: true },
      orderBy: { createdAt: 'desc' },
    })

    const safeUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      divisionId: u.divisionId,
      twoFactorEnabled: u.twoFactorEnabled,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt?.toISOString() || null,
      division: u.division ? { id: u.division.id, name: u.division.name } : null,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }))

    return NextResponse.json({ data: safeUsers, total: safeUsers.length })
  } catch (error) {
    console.error('List users error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST /api/users — Create user (Admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { email, name, password, role, divisionId } = body

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Email, nama, dan password wajib diisi' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 })
    }

    if (role !== 'ADMIN' && role !== 'USER') {
      return NextResponse.json({ error: 'Role harus ADMIN atau USER' }, { status: 400 })
    }

    if (!isEmailDomainAllowed(email)) {
      return NextResponse.json({ error: 'Hanya email perusahaan yang diizinkan' }, { status: 403 })
    }

    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)

    const newUser = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        role: role || 'USER',
        divisionId: divisionId || null,
        isActive: true,
      },
      include: { division: true },
    })

    return NextResponse.json({
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        divisionId: newUser.divisionId,
        twoFactorEnabled: newUser.twoFactorEnabled,
        isActive: newUser.isActive,
        lastLoginAt: newUser.lastLoginAt?.toISOString() || null,
        division: newUser.division ? { id: newUser.division.id, name: newUser.division.name } : null,
        createdAt: newUser.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}