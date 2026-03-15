import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))
vi.mock('@/lib/api-client', () => ({
  scheduleApi: {
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}))

import { ScheduleDetail } from '../ScheduleDetail'
import { scheduleApi } from '@/lib/api-client'

const mockSchedule = {
  id: 'cuid1',
  title: '팀 회의',
  description: '주간 업무 보고',
  startTime: '2026-03-20T10:00:00.000Z',
  reminderMinutes: 10,
  category: 'WORK',
  createdAt: '2026-03-15T09:00:00.000Z',
  updatedAt: '2026-03-15T09:00:00.000Z',
}

describe('ScheduleDetail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('일정 상세 정보를 표시한다', () => {
    render(<ScheduleDetail schedule={mockSchedule} />)
    expect(screen.getByText('팀 회의')).toBeInTheDocument()
    expect(screen.getByText('주간 업무 보고')).toBeInTheDocument()
    expect(screen.getByText('10분 전')).toBeInTheDocument()
  })

  it('수정 버튼 클릭 시 수정 폼으로 전환된다', async () => {
    render(<ScheduleDetail schedule={mockSchedule} />)
    await userEvent.click(screen.getByText('수정'))
    expect(screen.getByRole('heading', { name: '일정 수정' })).toBeInTheDocument()
  })

  it('삭제 버튼 클릭 시 확인 다이얼로그가 열린다', async () => {
    render(<ScheduleDetail schedule={mockSchedule} />)
    await userEvent.click(screen.getByText('삭제'))
    expect(screen.getByText(/삭제하시겠습니까/)).toBeInTheDocument()
  })

  it('삭제 확인 시 scheduleApi.delete를 호출하고 홈으로 이동한다', async () => {
    render(<ScheduleDetail schedule={mockSchedule} />)
    await userEvent.click(screen.getByText('삭제'))
    // 다이얼로그 안의 삭제 버튼 (두 번째 삭제 버튼)
    const deleteButtons = screen.getAllByText('삭제')
    await userEvent.click(deleteButtons[deleteButtons.length - 1])
    expect(scheduleApi.delete).toHaveBeenCalledWith('cuid1')
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('수정 폼에서 취소하면 상세 보기로 돌아간다', async () => {
    render(<ScheduleDetail schedule={mockSchedule} />)
    await userEvent.click(screen.getByText('수정'))
    await userEvent.click(screen.getByLabelText('뒤로 가기'))
    expect(screen.getByText('일정 상세')).toBeInTheDocument()
  })
})
