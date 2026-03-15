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

  const sorted = [...schedules].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  )

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((schedule) => (
        <ScheduleCard key={schedule.id} schedule={schedule} />
      ))}
    </div>
  )
}
