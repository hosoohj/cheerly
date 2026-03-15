import type { ScheduleCategory } from '@/types'

interface BadgeProps {
  category: ScheduleCategory
  className?: string
}

const CATEGORY_STYLES: Record<ScheduleCategory, { bg: string; text: string; label: string }> = {
  WORK: { bg: 'bg-blue-100', text: 'text-blue-700', label: '업무' },
  STUDY: { bg: 'bg-green-100', text: 'text-green-700', label: '공부' },
  PERSONAL: { bg: 'bg-purple-100', text: 'text-purple-700', label: '개인' },
  FAMILY: { bg: 'bg-orange-100', text: 'text-orange-700', label: '가족' },
}

export function Badge({ category, className = '' }: BadgeProps) {
  const { bg, text, label } = CATEGORY_STYLES[category]
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text} ${className}`}
    >
      {label}
    </span>
  )
}
