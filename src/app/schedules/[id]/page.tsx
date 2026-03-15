import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ScheduleDetail } from '@/components/schedule/ScheduleDetail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ScheduleDetailPage({ params }: PageProps) {
  const { id } = await params
  const schedule = await prisma.schedule.findUnique({ where: { id } })

  if (!schedule) {
    notFound()
  }

  // Server → Client 컴포넌트 경계: Date를 string으로 직렬화
  const serialized = {
    ...schedule,
    startTime: schedule.startTime.toISOString(),
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
  }

  return <ScheduleDetail schedule={serialized} />
}
