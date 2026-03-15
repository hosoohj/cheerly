import { describe, it, expect } from 'vitest'
import type { Schedule, ScheduleCategory, Notification } from '../index'

describe('Schedule 타입', () => {
  it('ScheduleCategory 값이 올바르게 정의된다', () => {
    const categories: ScheduleCategory[] = ['WORK', 'STUDY', 'PERSONAL', 'FAMILY']
    expect(categories).toHaveLength(4)
  })

  it('Schedule 객체가 올바른 구조를 갖는다', () => {
    const schedule: Schedule = {
      id: '1',
      title: '팀 회의',
      description: '주간 팀 회의',
      startTime: new Date('2026-03-15T10:00:00'),
      reminderMinutes: 20,
      category: 'WORK',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    expect(schedule.id).toBe('1')
    expect(schedule.category).toBe('WORK')
    expect(schedule.reminderMinutes).toBe(20)
  })

  it('Notification 객체가 올바른 구조를 갖는다', () => {
    const notification: Notification = {
      id: '1',
      scheduleId: '1',
      message: '회의 시작까지 20분 남았습니다.',
      encouragement: '오늘도 잘 해내실 수 있습니다!',
      sentAt: new Date(),
    }
    expect(notification.scheduleId).toBe('1')
    expect(notification.message).toContain('20분')
  })
})
