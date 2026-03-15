import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { NotificationBell } from '../NotificationBell'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@/lib/api-client', () => ({
  notificationApi: {
    list: vi.fn().mockResolvedValue([
      {
        id: 'n1',
        scheduleId: 's1',
        message: '팀 회의 시작까지 10분 남았습니다.',
        encouragement: '화이팅!',
        sentAt: new Date().toISOString(),
        isRead: false,
        schedule: { title: '팀 회의' },
      },
    ]),
    markAsRead: vi.fn().mockResolvedValue({}),
  },
}))

describe('NotificationBell', () => {
  beforeEach(() => vi.clearAllMocks())

  it('미읽음 배지를 표시한다', () => {
    render(<NotificationBell unreadCount={3} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('미읽음이 없으면 배지를 숨긴다', () => {
    render(<NotificationBell unreadCount={0} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('벨 클릭 시 패널이 열린다', async () => {
    render(<NotificationBell unreadCount={1} />)
    const bell = screen.getByRole('button', { name: /알림/i })
    fireEvent.click(bell)
    await waitFor(() => {
      expect(screen.getByText('알림')).toBeInTheDocument()
    })
  })
})
