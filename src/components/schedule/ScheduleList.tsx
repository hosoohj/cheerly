import type { Schedule } from '@/types'
import { ScheduleCard } from './ScheduleCard'
import { EmptyState } from './EmptyState'

interface ScheduleListProps {
  schedules: Schedule[]
}

export function ScheduleList({ schedules }: ScheduleListProps) {
  if (schedules.length === 0) {
    return <EmptyState />
  }

  return (
    <ul className="flex flex-col gap-3 list-none p-0 m-0" aria-label="일정 목록">
      {schedules.map((schedule) => (
        <li key={schedule.id}>
          <ScheduleCard schedule={schedule} />
        </li>
      ))}
    </ul>
  )
}
