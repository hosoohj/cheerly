import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'
import { GET } from '../route'

const mockNotification = {
  id: 'notif1',
  scheduleId: 'cuid1',
  message: '팀 회의 시작까지 10분 남았습니다.',
  encouragement: '화이팅!',
  sentAt: new Date('2026-03-15T09:50:00Z'),
  isRead: false,
  schedule: { title: '팀 회의' },
}

describe('GET /api/notifications', () => {
  beforeEach(() => vi.clearAllMocks())

  it('알림 목록을 반환한다', async () => {
    vi.mocked(prisma.notification.findMany).mockResolvedValue([mockNotification])
    const res = await GET()
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].message).toBe('팀 회의 시작까지 10분 남았습니다.')
  })

  it('알림이 없으면 빈 배열을 반환한다', async () => {
    vi.mocked(prisma.notification.findMany).mockResolvedValue([])
    const res = await GET()
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toHaveLength(0)
  })

  it('DB 오류 시 500을 반환한다', async () => {
    vi.mocked(prisma.notification.findMany).mockRejectedValue(new Error('DB error'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
