import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/email-logs — List email logs (Admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const emailLogs = await db.emailLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const safeLogs = emailLogs.map(log => ({
      id: log.id,
      to: log.to,
      subject: log.subject,
      body: log.body,
      status: log.status,
      createdAt: log.createdAt.toISOString(),
    }))

    return NextResponse.json({ data: safeLogs, total: safeLogs.length })
  } catch (error) {
    console.error('Email logs error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}