export const dynamic = 'force-dynamic'

import { Container } from '@/components/layout/Container'
import { ScheduleList } from '@/components/schedule/ScheduleList'
import { NotificationBell } from '@/components/notification/NotificationBell'
import { prisma } from '@/lib/db'
import type { Schedule } from '@/types'

export default async function HomePage() {
  const rawSchedules = await prisma.schedule.findMany({
    orderBy: { startTime: 'asc' },
  })

  const schedules: Schedule[] = rawSchedules.map((s) => ({
    ...s,
    category: s.category as Schedule['category'],
  }))

  const unreadCount = await prisma.notification.count({
    where: { isRead: false },
  })

  return (
    <Container>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">오늘의 일정</h1>
          <p className="text-gray-500 text-sm mt-1">
            일정 시작 전에 격려 메시지를 받아보세요
          </p>
        </div>
        <NotificationBell unreadCount={unreadCount} />
      </div>
      <ScheduleList schedules={schedules} />
    </Container>
  )
}
