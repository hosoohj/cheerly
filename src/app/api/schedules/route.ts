import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createScheduleSchema } from '@/lib/validations/schedule'

export async function GET() {
  try {
    const schedules = await prisma.schedule.findMany({
      orderBy: { startTime: 'asc' },
    })
    return NextResponse.json(schedules)
  } catch (err) {
    console.error('[API] GET /api/schedules 실패:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '요청 본문이 올바른 JSON 형식이 아닙니다' }, { status: 400 })
  }

  const parsed = createScheduleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '유효성 검증 실패', issues: parsed.error.issues }, { status: 400 })
  }

  try {
    const schedule = await prisma.schedule.create({
      data: {
        ...parsed.data,
        startTime: new Date(parsed.data.startTime),
      },
    })
    return NextResponse.json(schedule, { status: 201 })
  } catch (err) {
    console.error('[API] POST /api/schedules 실패:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
