import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    schedule: {
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/ai-encouragement', () => ({
  getEncouragementMessage: vi.fn().mockResolvedValue('화이팅!'),
}))

vi.mock('@/lib/channels', () => ({
  getNotificationChannels: vi.fn().mockReturnValue([
    { name: 'Teams', isEnabled: () => true, send: vi.fn().mockResolvedValue(true) },
  ]),
}))

import { prisma } from '@/lib/db'
import { checkAndSendReminders } from '../scheduler'

describe('checkAndSendReminders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('알림 시간이 된 일정에 알림을 전송한다', async () => {
    const now = new Date()
    const reminderTime = new Date(now.getTime() + 10 * 60 * 1000) // 10분 후 일정

    vi.mocked(prisma.schedule.findMany).mockResolvedValue([
      {
        id: 'cuid1',
        title: '팀 회의',
        description: '주간 업무',
        startTime: reminderTime,
        reminderMinutes: 10,
        category: 'WORK',
        createdAt: new Date(),
        updatedAt: new Date(),
        notifications: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    ])

    vi.mocked(prisma.notification.create).mockResolvedValue({
      id: 'notif1',
      scheduleId: 'cuid1',
      message: '팀 회의 시작까지 10분 남았습니다.',
      encouragement: '화이팅!',
      sentAt: now,
      isRead: false,
    })

    await checkAndSendReminders()

    expect(prisma.notification.create).toHaveBeenCalledOnce()
  })

  it('이미 알림이 전송된 일정은 중복 전송하지 않는다', async () => {
    const now = new Date()
    const reminderTime = new Date(now.getTime() + 10 * 60 * 1000)

    vi.mocked(prisma.schedule.findMany).mockResolvedValue([
      {
        id: 'cuid1',
        title: '팀 회의',
        description: '주간 업무',
        startTime: reminderTime,
        reminderMinutes: 10,
        category: 'WORK',
        createdAt: new Date(),
        updatedAt: new Date(),
        notifications: [
          {
            id: 'notif1',
            scheduleId: 'cuid1',
            message: '이미 전송된 알림',
            encouragement: '화이팅!',
            sentAt: now,
            isRead: false,
          },
        ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    ])

    await checkAndSendReminders()

    expect(prisma.notification.create).not.toHaveBeenCalled()
  })

  it('알림 시간이 아닌 일정은 건너뛴다', async () => {
    const now = new Date()
    const farFuture = new Date(now.getTime() + 60 * 60 * 1000) // 1시간 후

    vi.mocked(prisma.schedule.findMany).mockResolvedValue([
      {
        id: 'cuid2',
        title: '나중 회의',
        description: '',
        startTime: farFuture,
        reminderMinutes: 10,
        category: 'WORK',
        createdAt: new Date(),
        updatedAt: new Date(),
        notifications: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    ])

    await checkAndSendReminders()

    expect(prisma.notification.create).not.toHaveBeenCalled()
  })

  it('알림 시간이 아직 되지 않은 경우(30초 후) 알림을 보내지 않는다', async () => {
    const now = new Date()
    // 알림 시간 = startTime - reminderMinutes분 = 30초 후 (아직 미도달)
    const startTime = new Date(now.getTime() + 10 * 60 * 1000 + 30 * 1000) // 10분 30초 후

    vi.mocked(prisma.schedule.findMany).mockResolvedValue([
      {
        id: 'cuid3',
        title: '아직 이른 회의',
        description: '',
        startTime,
        reminderMinutes: 10,
        category: 'WORK',
        createdAt: new Date(),
        updatedAt: new Date(),
        notifications: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    ])

    await checkAndSendReminders()

    // 알림 시간이 30초 후이므로 아직 전송하지 않아야 함
    expect(prisma.notification.create).not.toHaveBeenCalled()
  })
})
