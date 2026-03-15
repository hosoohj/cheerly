import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const notifications = await prisma.notification.findMany({
    orderBy: { sentAt: 'desc' },
    include: { schedule: { select: { title: true } } },
  })
  return NextResponse.json(notifications)
}
