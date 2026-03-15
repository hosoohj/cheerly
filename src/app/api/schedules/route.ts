import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createScheduleSchema } from '@/lib/validations/schedule'

export async function GET() {
  const schedules = await prisma.schedule.findMany({
    orderBy: { startTime: 'asc' },
  })
  return NextResponse.json(schedules)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = createScheduleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const schedule = await prisma.schedule.create({
    data: {
      ...parsed.data,
      startTime: new Date(parsed.data.startTime),
    },
  })

  return NextResponse.json(schedule, { status: 201 })
}
