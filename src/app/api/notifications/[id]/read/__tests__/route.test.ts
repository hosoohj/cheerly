import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    notification: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'
import { PATCH } from '../route'

const mockNotification = {
  id: 'notif1',
  scheduleId: 'cuid1',
  message: '팀 회의 시작까지 10분 남았습니다.',
  encouragement: '화이팅!',
  sentAt: new Date('2026-03-15T09:50:00Z'),
  isRead: false,
}

function makeRequest() {
  return new Request('http://localhost/api/notifications/notif1/read', { method: 'PATCH' })
}

describe('PATCH /api/notifications/[id]/read', () => {
  beforeEach(() => vi.clearAllMocks())

  it('알림을 읽음 처리한다', async () => {
    vi.mocked(prisma.notification.findUnique).mockResolvedValue(mockNotification)
    vi.mocked(prisma.notification.update).mockResolvedValue({ ...mockNotification, isRead: true })

    const res = await PATCH(makeRequest() as never, { params: Promise.resolve({ id: 'notif1' }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.isRead).toBe(true)
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif1' },
      data: { isRead: true },
    })
  })

  it('존재하지 않는 알림은 404를 반환한다', async () => {
    vi.mocked(prisma.notification.findUnique).mockResolvedValue(null)

    const res = await PATCH(makeRequest() as never, { params: Promise.resolve({ id: 'notexist' }) })
    expect(res.status).toBe(404)
  })

  it('DB 오류 시 500을 반환한다', async () => {
    vi.mocked(prisma.notification.findUnique).mockRejectedValue(new Error('DB error'))

    const res = await PATCH(makeRequest() as never, { params: Promise.resolve({ id: 'notif1' }) })
    expect(res.status).toBe(500)
  })
})
