import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const existing = await prisma.notification.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: '알림을 찾을 수 없습니다' }, { status: 404 })
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })

    return NextResponse.json(notification)
  } catch (err) {
    console.error('[API] PATCH /api/notifications/[id]/read 실패:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
