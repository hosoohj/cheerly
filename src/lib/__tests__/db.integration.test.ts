/**
 * 통합 테스트 — 실제 SQLite in-memory DB 사용
 *
 * 단위 테스트(Prisma 모킹)와 달리, 실제 better-sqlite3 + PrismaClient 조합으로
 * DB 레이어의 실제 동작(Cascade, 인덱스, 트랜잭션 등)을 검증한다.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@/generated/prisma/client'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomBytes } from 'crypto'
import { unlinkSync, existsSync } from 'fs'

// 마이그레이션 SQL (prisma/migrations 동일 내용)
const INIT_SQL = `
CREATE TABLE IF NOT EXISTS "Schedule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "startTime" DATETIME NOT NULL,
  "reminderMinutes" INTEGER NOT NULL DEFAULT 10,
  "category" TEXT NOT NULL DEFAULT 'PERSONAL',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "scheduleId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "encouragement" TEXT NOT NULL,
  "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isRead" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Notification_scheduleId_fkey"
    FOREIGN KEY ("scheduleId") REFERENCES "Schedule" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Schedule_startTime_idx" ON "Schedule"("startTime");
CREATE INDEX IF NOT EXISTS "Notification_sentAt_idx" ON "Notification"("sentAt");
CREATE INDEX IF NOT EXISTS "Notification_scheduleId_sentAt_idx" ON "Notification"("scheduleId", "sentAt");

PRAGMA foreign_keys = ON;
`

function createTestPrisma(): { prisma: PrismaClient; cleanup: () => Promise<void> } {
  const dbPath = join(tmpdir(), `cheerly-test-${randomBytes(6).toString('hex')}.db`)

  const db = new Database(dbPath)
  db.exec(INIT_SQL)
  db.close()

  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` })
  const prisma = new PrismaClient({ adapter })

  return {
    prisma,
    cleanup: async () => {
      await prisma.$disconnect()
      if (existsSync(dbPath)) unlinkSync(dbPath)
    },
  }
}

const NOW = new Date('2026-03-20T09:00:00Z')
const FUTURE = new Date('2026-03-20T10:00:00Z')

describe('통합: Schedule CRUD', () => {
  let prisma: PrismaClient
  let cleanup: () => Promise<void>

  beforeEach(() => {
    const test = createTestPrisma()
    prisma = test.prisma
    cleanup = test.cleanup
  })

  afterEach(async () => {
    await cleanup()
  })

  it('일정을 생성하고 조회한다', async () => {
    const schedule = await prisma.schedule.create({
      data: {
        id: 'sched-1',
        title: '팀 회의',
        startTime: FUTURE,
        reminderMinutes: 10,
        category: 'WORK',
        updatedAt: NOW,
      },
    })

    expect(schedule.id).toBe('sched-1')
    expect(schedule.title).toBe('팀 회의')
    expect(schedule.category).toBe('WORK')

    const found = await prisma.schedule.findUnique({ where: { id: 'sched-1' } })
    expect(found?.title).toBe('팀 회의')
    expect(found?.reminderMinutes).toBe(10)
  })

  it('일정 목록을 startTime 오름차순으로 조회한다', async () => {
    await prisma.schedule.createMany({
      data: [
        { id: 's1', title: '나중 회의', startTime: new Date('2026-03-20T14:00:00Z'), reminderMinutes: 10, category: 'WORK', updatedAt: NOW },
        { id: 's2', title: '이른 회의', startTime: new Date('2026-03-20T09:00:00Z'), reminderMinutes: 10, category: 'WORK', updatedAt: NOW },
        { id: 's3', title: '중간 회의', startTime: new Date('2026-03-20T11:00:00Z'), reminderMinutes: 10, category: 'STUDY', updatedAt: NOW },
      ],
    })

    const schedules = await prisma.schedule.findMany({ orderBy: { startTime: 'asc' } })
    expect(schedules[0].title).toBe('이른 회의')
    expect(schedules[1].title).toBe('중간 회의')
    expect(schedules[2].title).toBe('나중 회의')
  })

  it('일정을 수정한다', async () => {
    await prisma.schedule.create({
      data: { id: 'sched-2', title: '원래 제목', startTime: FUTURE, reminderMinutes: 10, category: 'WORK', updatedAt: NOW },
    })

    const updated = await prisma.schedule.update({
      where: { id: 'sched-2' },
      data: { title: '수정된 제목', reminderMinutes: 30, updatedAt: new Date() },
    })

    expect(updated.title).toBe('수정된 제목')
    expect(updated.reminderMinutes).toBe(30)
  })

  it('일정 삭제 시 연결된 알림이 Cascade 삭제된다', async () => {
    await prisma.schedule.create({
      data: { id: 'sched-3', title: '삭제 테스트', startTime: FUTURE, reminderMinutes: 10, category: 'WORK', updatedAt: NOW },
    })
    await prisma.notification.create({
      data: { id: 'notif-1', scheduleId: 'sched-3', message: '10분 전', encouragement: '화이팅!', sentAt: NOW },
    })

    // 삭제 전 알림 존재 확인
    const beforeDelete = await prisma.notification.findMany({ where: { scheduleId: 'sched-3' } })
    expect(beforeDelete).toHaveLength(1)

    await prisma.schedule.delete({ where: { id: 'sched-3' } })

    // 삭제 후 알림도 사라져야 함 (Cascade)
    const afterDelete = await prisma.notification.findMany({ where: { scheduleId: 'sched-3' } })
    expect(afterDelete).toHaveLength(0)
  })

  it('존재하지 않는 일정 조회 시 null을 반환한다', async () => {
    const result = await prisma.schedule.findUnique({ where: { id: 'not-exist' } })
    expect(result).toBeNull()
  })
})

describe('통합: Notification 읽음 처리', () => {
  let prisma: PrismaClient
  let cleanup: () => Promise<void>

  beforeEach(async () => {
    const test = createTestPrisma()
    prisma = test.prisma
    cleanup = test.cleanup

    // 기본 일정과 알림 생성
    await prisma.schedule.create({
      data: { id: 'sched-base', title: '기본 일정', startTime: FUTURE, reminderMinutes: 10, category: 'WORK', updatedAt: NOW },
    })
  })

  afterEach(async () => {
    await cleanup()
  })

  it('알림을 읽음 처리하면 isRead가 true가 된다', async () => {
    await prisma.notification.create({
      data: { id: 'notif-read', scheduleId: 'sched-base', message: '10분 전', encouragement: '화이팅!', sentAt: NOW },
    })

    const before = await prisma.notification.findUnique({ where: { id: 'notif-read' } })
    expect(before?.isRead).toBe(false)

    await prisma.notification.update({ where: { id: 'notif-read' }, data: { isRead: true } })

    const after = await prisma.notification.findUnique({ where: { id: 'notif-read' } })
    expect(after?.isRead).toBe(true)
  })

  it('sentAt 내림차순으로 알림 목록을 조회한다', async () => {
    await prisma.notification.createMany({
      data: [
        { id: 'n1', scheduleId: 'sched-base', message: '첫 번째', encouragement: '화이팅!', sentAt: new Date('2026-03-20T08:00:00Z') },
        { id: 'n2', scheduleId: 'sched-base', message: '두 번째', encouragement: '화이팅!', sentAt: new Date('2026-03-20T09:00:00Z') },
        { id: 'n3', scheduleId: 'sched-base', message: '세 번째', encouragement: '화이팅!', sentAt: new Date('2026-03-20T10:00:00Z') },
      ],
    })

    const notifications = await prisma.notification.findMany({ orderBy: { sentAt: 'desc' } })
    expect(notifications[0].message).toBe('세 번째')
    expect(notifications[2].message).toBe('첫 번째')
  })

  it('최근 2분 이내 중복 알림 여부를 확인한다', async () => {
    const twoMinAgo = new Date(NOW.getTime() - 2 * 60 * 1000)
    const oneMinAgo = new Date(NOW.getTime() - 1 * 60 * 1000)

    // 1분 전 알림 생성
    await prisma.notification.create({
      data: { id: 'n-recent', scheduleId: 'sched-base', message: '최근 알림', encouragement: '화이팅!', sentAt: oneMinAgo },
    })

    // 최근 2분 이내 알림 존재 확인 (scheduler.ts 중복 방지 로직과 동일)
    const recentNotifs = await prisma.notification.findMany({
      where: {
        scheduleId: 'sched-base',
        sentAt: { gte: twoMinAgo },
      },
      take: 1,
    })

    expect(recentNotifs).toHaveLength(1) // 이미 알림 있음 → 발송 스킵
  })
})

describe('통합: 스케줄러 조회 쿼리', () => {
  let prisma: PrismaClient
  let cleanup: () => Promise<void>

  beforeEach(() => {
    const test = createTestPrisma()
    prisma = test.prisma
    cleanup = test.cleanup
  })

  afterEach(async () => {
    await cleanup()
  })

  it('startTime > now인 일정만 조회한다', async () => {
    const past = new Date(NOW.getTime() - 60 * 60 * 1000) // 1시간 전

    await prisma.schedule.createMany({
      data: [
        { id: 'future', title: '미래 일정', startTime: FUTURE, reminderMinutes: 10, category: 'WORK', updatedAt: NOW },
        { id: 'past', title: '과거 일정', startTime: past, reminderMinutes: 10, category: 'WORK', updatedAt: NOW },
      ],
    })

    const futureSchedules = await prisma.schedule.findMany({
      where: { startTime: { gt: NOW } },
    })

    expect(futureSchedules).toHaveLength(1)
    expect(futureSchedules[0].id).toBe('future')
  })

  it('알림 include 조회가 정상 동작한다', async () => {
    await prisma.schedule.create({
      data: { id: 's-incl', title: '포함 조회', startTime: FUTURE, reminderMinutes: 10, category: 'WORK', updatedAt: NOW },
    })
    await prisma.notification.create({
      data: { id: 'n-incl', scheduleId: 's-incl', message: '알림 메시지', encouragement: '화이팅!', sentAt: NOW },
    })

    const schedule = await prisma.schedule.findFirst({
      where: { id: 's-incl' },
      include: {
        notifications: {
          where: { sentAt: { gte: new Date(NOW.getTime() - 2 * 60 * 1000) } },
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
      },
    })

    expect(schedule?.notifications).toHaveLength(1)
    expect(schedule?.notifications[0].message).toBe('알림 메시지')
  })
})
