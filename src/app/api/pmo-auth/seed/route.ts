import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, isEmailDomainAllowed } from '@/lib/auth'

export async function POST() {
  try {
    // Check if any admin already exists
    const existingAdmin = await db.user.findFirst({
      where: { role: 'ADMIN' },
    })

    if (existingAdmin) {
      return NextResponse.json({
        data: { message: 'Admin already exists' },
      })
    }

    const email = 'admin@company.com'
    const password = 'admin123'

    if (!isEmailDomainAllowed(email)) {
      return NextResponse.json({ error: 'Email domain not allowed' }, { status: 403 })
    }

    const hashedPassword = await hashPassword(password)

    const admin = await db.user.create({
      data: {
        email,
        name: 'Administrator',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    })

    return NextResponse.json({
      data: { email: admin.email, message: 'Admin user created' },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}