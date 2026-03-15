import Link from 'next/link'
import type { Schedule } from '@/types'
import { Badge } from '@/components/ui/Badge'

interface ScheduleCardProps {
  schedule: Schedule
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getRemainingTime(startTime: Date): string {
  const now = new Date()
  const diffMs = startTime.getTime() - now.getTime()

  if (diffMs < 0) return '종료된 일정'

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `${diffDays}일 후`
  if (diffHours > 0) return `${diffHours}시간 후`
  if (diffMinutes > 0) return `${diffMinutes}분 후`
  return '곧 시작'
}

export function ScheduleCard({ schedule }: ScheduleCardProps) {
  const remaining = getRemainingTime(schedule.startTime)
  const isImminent = schedule.startTime.getTime() - new Date().getTime() < schedule.reminderMinutes * 60 * 1000

  return (
    <Link href={`/schedules/${schedule.id}`}>
      <div
        className={`
          bg-white rounded-xl border p-4 shadow-sm
          hover:shadow-md hover:border-blue-200
          transition-all duration-200 cursor-pointer
          ${isImminent ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}
        `}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge category={schedule.category} />
              {isImminent && (
                <span className="text-xs text-orange-600 font-medium">알림 예정</span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 truncate">{schedule.title}</h3>
            {schedule.description && (
              <p className="text-sm text-gray-500 truncate mt-0.5">{schedule.description}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-medium text-blue-600">{remaining}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatTime(schedule.startTime)}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center text-xs text-gray-500">
          <span>알림: {schedule.reminderMinutes}분 전</span>
        </div>
      </div>
    </Link>
  )
}
