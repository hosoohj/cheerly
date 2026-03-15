import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { sentAt: 'desc' },
      include: { schedule: { select: { title: true } } },
    })
    return NextResponse.json(notifications)
  } catch (err) {
    console.error('[API] GET /api/notifications 실패:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
