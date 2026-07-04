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

    // Use first allowed domain for admin email, fallback to company.com
    const domains = (process.env.ALLOWED_EMAIL_DOMAINS || 'company.com').split(',').map(d => d.trim()).filter(Boolean)
    const adminDomain = domains[0] || 'company.com'
    const email = `admin@${adminDomain}`
    const password = 'admin123'

    if (!isEmailDomainAllowed(email)) {
      return NextResponse.json({ error: `Email domain not allowed: ${adminDomain}` }, { status: 403 })
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