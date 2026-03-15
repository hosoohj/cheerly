import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { updateScheduleSchema } from '@/lib/validations/schedule'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const schedule = await prisma.schedule.findUnique({ where: { id } })

    if (!schedule) {
      return NextResponse.json({ error: '일정을 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json(schedule)
  } catch (err) {
    console.error('[API] GET /api/schedules/[id] 실패:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '요청 본문이 올바른 JSON 형식이 아닙니다' }, { status: 400 })
  }

  const parsed = updateScheduleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '유효성 검증 실패', issues: parsed.error.issues }, { status: 400 })
  }

  try {
    const { id } = await params
    const existing = await prisma.schedule.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: '일정을 찾을 수 없습니다' }, { status: 404 })
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
  } catch (err) {
    console.error('[API] PUT /api/schedules/[id] 실패:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const existing = await prisma.schedule.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: '일정을 찾을 수 없습니다' }, { status: 404 })
    }

    await prisma.schedule.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[API] DELETE /api/schedules/[id] 실패:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
