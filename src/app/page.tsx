import { Container } from '@/components/layout/Container'
import { ScheduleList } from '@/components/schedule/ScheduleList'
import { MOCK_SCHEDULES } from '@/lib/mock-data'

export default function HomePage() {
  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">오늘의 일정</h1>
        <p className="text-gray-500 text-sm mt-1">
          일정 시작 전에 격려 메시지를 받아보세요
        </p>
      </div>
      <ScheduleList schedules={MOCK_SCHEDULES} />
    </Container>
  )
}
