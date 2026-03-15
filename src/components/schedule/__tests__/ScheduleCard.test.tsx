import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScheduleCard } from '../ScheduleCard'
import type { Schedule } from '@/types'

const mockSchedule: Schedule = {
  id: '1',
  title: '팀 회의',
  description: '주간 팀 회의',
  startTime: new Date('2026-03-15T10:00:00'),
  reminderMinutes: 20,
  category: 'WORK',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('ScheduleCard 컴포넌트', () => {
  it('일정 제목이 렌더링된다', () => {
    render(<ScheduleCard schedule={mockSchedule} />)
    expect(screen.getByText('팀 회의')).toBeInTheDocument()
  })

  it('일정 유형 뱃지가 렌더링된다', () => {
    render(<ScheduleCard schedule={mockSchedule} />)
    expect(screen.getByText('업무')).toBeInTheDocument()
  })

  it('알림 시간이 표시된다', () => {
    render(<ScheduleCard schedule={mockSchedule} />)
    expect(screen.getByText(/20분 전/)).toBeInTheDocument()
  })
})
