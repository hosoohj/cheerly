import type { Schedule, Notification } from '@/types'

export const MOCK_SCHEDULES: Schedule[] = [
  {
    id: '1',
    title: '주간 팀 회의',
    description: '이번 주 업무 공유 및 계획 논의',
    startTime: new Date(Date.now() + 25 * 60 * 1000),
    reminderMinutes: 20,
    category: 'WORK',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: '알고리즘 스터디',
    description: '코딩 테스트 대비 알고리즘 문제 풀이',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    reminderMinutes: 20,
    category: 'STUDY',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    title: '저녁 운동',
    description: '헬스장 1시간',
    startTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
    reminderMinutes: 10,
    category: 'PERSONAL',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    title: '아이 하원',
    description: '오후 4시 유치원 하원',
    startTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
    reminderMinutes: 30,
    category: 'FAMILY',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    scheduleId: '1',
    message: '주간 팀 회의 시작까지 20분 남았습니다.',
    encouragement: '이번 회의도 잘 준비하셨을 거예요. 화이팅!',
    sentAt: new Date(Date.now() - 5 * 60 * 1000),
    isRead: false,
  },
]
