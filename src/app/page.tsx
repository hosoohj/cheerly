import { Container } from '@/components/layout/Container'
import { ScheduleList } from '@/components/schedule/ScheduleList'
import { prisma } from '@/lib/db'
import type { Schedule } from '@/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const rawSchedules = await prisma.schedule.findMany({
    orderBy: { startTime: 'asc' },
  })

  const schedules = rawSchedules as unknown as Schedule[]

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
        {unreadCount > 0 && (
          <div className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full">
            <span>알림</span>
            <span>미읽음 {unreadCount}개</span>
          </div>
        )}
      </div>
      <ScheduleList schedules={schedules} />
    </Container>
  )
}
