import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db'
const adapter = new PrismaBetterSqlite3({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  // 기존 데이터 삭제
  await prisma.notification.deleteMany()
  await prisma.schedule.deleteMany()

  const now = new Date()

  const schedules = await Promise.all([
    prisma.schedule.create({
      data: {
        title: '주간 팀 회의',
        description: '이번 주 업무 공유 및 계획 논의',
        startTime: new Date(now.getTime() + 25 * 60 * 1000),
        reminderMinutes: 20,
        category: 'WORK',
      },
    }),
    prisma.schedule.create({
      data: {
        title: '알고리즘 스터디',
        description: '코딩 테스트 대비 알고리즘 문제 풀이',
        startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        reminderMinutes: 20,
        category: 'STUDY',
      },
    }),
    prisma.schedule.create({
      data: {
        title: '저녁 운동',
        description: '헬스장 1시간',
        startTime: new Date(now.getTime() + 5 * 60 * 60 * 1000),
        reminderMinutes: 10,
        category: 'PERSONAL',
      },
    }),
    prisma.schedule.create({
      data: {
        title: '아이 하원',
        description: '오후 4시 유치원 하원',
        startTime: new Date(now.getTime() + 8 * 60 * 60 * 1000),
        reminderMinutes: 30,
        category: 'FAMILY',
      },
    }),
  ])

  // 샘플 알림 생성
  await prisma.notification.create({
    data: {
      scheduleId: schedules[0].id,
      message: `${schedules[0].title} 시작까지 ${schedules[0].reminderMinutes}분 남았습니다.`,
      encouragement: '이번 회의도 잘 준비하셨을 거예요. 화이팅!',
      sentAt: new Date(now.getTime() - 5 * 60 * 1000),
      isRead: false,
    },
  })

  console.log('✅ 시드 데이터 생성 완료:', schedules.length, '개 일정')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
