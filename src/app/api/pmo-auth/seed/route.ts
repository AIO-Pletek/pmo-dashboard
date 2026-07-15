import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, isEmailDomainAllowed } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const reset = body?.reset === true

    const existingAdmin = await db.user.findFirst({
      where: { role: 'ADMIN' },
    })

    // Reset mode: update existing admin password
    if (reset && existingAdmin) {
      const newPassword = body?.password || 'admin123'
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 })
      }

      const hashedPassword = await hashPassword(newPassword)
      await db.user.update({
        where: { id: existingAdmin.id },
        data: { password: hashedPassword, isActive: true },
      })

      return NextResponse.json({
        data: {
          email: existingAdmin.email,
          message: 'Admin password has been reset',
        },
      })
    }

    // Normal mode: admin already exists, do nothing
    if (existingAdmin) {
      return NextResponse.json({
        data: { message: 'Admin already exists. Use POST with { "reset": true, "password": "newpass" } to reset password.' },
      })
    }

    // Create new admin
    const domains = (process.env.ALLOWED_EMAIL_DOMAINS || 'company.com').split(',').map(d => d.trim()).filter(Boolean)
    const adminDomain = domains[0] || 'company.com'
    const email = `admin@${adminDomain}`
    const password = body?.password || 'admin123'

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 })
    }

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
