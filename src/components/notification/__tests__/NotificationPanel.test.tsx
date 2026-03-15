import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/lib/api-client', () => ({
  notificationApi: { markAsRead: vi.fn().mockResolvedValue({}) },
}))

import { NotificationPanel } from '../NotificationPanel'
import { notificationApi } from '@/lib/api-client'

const unreadNotif = {
  id: 'notif1',
  scheduleId: 'cuid1',
  message: '팀 회의 시작까지 10분 남았습니다.',
  encouragement: '화이팅!',
  sentAt: '2026-03-15T09:50:00Z',
  isRead: false,
  schedule: { title: '팀 회의' },
}

const readNotif = {
  ...unreadNotif,
  id: 'notif2',
  isRead: true,
}

describe('NotificationPanel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('알림 목록을 렌더링한다', () => {
    render(
      <NotificationPanel
        notifications={[unreadNotif]}
        onClose={vi.fn()}
        onRead={vi.fn()}
      />
    )
    expect(screen.getByText('팀 회의')).toBeInTheDocument()
    expect(screen.getByText('팀 회의 시작까지 10분 남았습니다.')).toBeInTheDocument()
    expect(screen.getByText('화이팅!')).toBeInTheDocument()
  })

  it('알림이 없으면 빈 상태 메시지를 표시한다', () => {
    render(
      <NotificationPanel
        notifications={[]}
        onClose={vi.fn()}
        onRead={vi.fn()}
      />
    )
    expect(screen.getByText('알림이 없습니다')).toBeInTheDocument()
  })

  it('닫기 버튼 클릭 시 onClose를 호출한다', async () => {
    const onClose = vi.fn()
    render(
      <NotificationPanel
        notifications={[]}
        onClose={onClose}
        onRead={vi.fn()}
      />
    )
    await userEvent.click(screen.getByText('닫기'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('미읽음 알림 클릭 시 markAsRead와 onRead를 호출한다', async () => {
    const onRead = vi.fn()
    render(
      <NotificationPanel
        notifications={[unreadNotif]}
        onClose={vi.fn()}
        onRead={onRead}
      />
    )
    await userEvent.click(screen.getByText('팀 회의'))
    expect(notificationApi.markAsRead).toHaveBeenCalledWith('notif1')
    expect(onRead).toHaveBeenCalledWith('notif1')
  })

  it('읽은 알림 클릭 시 markAsRead를 호출하지 않는다', async () => {
    render(
      <NotificationPanel
        notifications={[readNotif]}
        onClose={vi.fn()}
        onRead={vi.fn()}
      />
    )
    await userEvent.click(screen.getByText('팀 회의'))
    expect(notificationApi.markAsRead).not.toHaveBeenCalled()
  })
})
