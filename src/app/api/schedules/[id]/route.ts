import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { updateScheduleSchema } from '@/lib/validations/schedule'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const schedule = await prisma.schedule.findUnique({ where: { id } })

  if (!schedule) {
    return NextResponse.json({ error: '일정을 찾을 수 없습니다' }, { status: 404 })
  }

  return NextResponse.json(schedule)
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const existing = await prisma.schedule.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: '일정을 찾을 수 없습니다' }, { status: 404 })
  }

  const body = await req.json()
  const parsed = updateScheduleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const data = parsed.data
  const schedule = await prisma.schedule.update({
    where: { id },
    data: {
      ...data,
      startTime: data.startTime ? new Date(data.startTime) : undefined,
    },
  })

  return NextResponse.json(schedule)
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const existing = await prisma.schedule.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: '일정을 찾을 수 없습니다' }, { status: 404 })
  }

  await prisma.schedule.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
