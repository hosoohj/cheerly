import { prisma } from '@/lib/db'
import { getEncouragementMessage } from '@/lib/ai-encouragement'
import { getNotificationChannels } from '@/lib/channels'
import { SCHEDULE_CATEGORIES } from '@/lib/constants'
import type { ScheduleCategory } from '@/types'

const REMINDER_WINDOW_SECONDS = 60

export async function checkAndSendReminders() {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('ko-KR')

  // 앞으로 알림이 필요한 일정 조회 (시작 전, 알림 시간 ±60초 윈도우 내)
  const schedules = await prisma.schedule.findMany({
    where: {
      startTime: { gt: now },
    },
    include: {
      notifications: {
        where: { sentAt: { gte: new Date(now.getTime() - 2 * 60 * 1000) } },
        orderBy: { sentAt: 'desc' },
        take: 1,
      },
    },
  })

  console.log(`[Scheduler] ${timeStr} 체크 — 대기 중인 일정 ${schedules.length}개`)

  for (const schedule of schedules) {
    const reminderTime = new Date(schedule.startTime.getTime() - schedule.reminderMinutes * 60 * 1000)
    const diffMs = now.getTime() - reminderTime.getTime()
    const remainMin = Math.round((schedule.startTime.getTime() - now.getTime()) / 60000)

    console.log(`[Scheduler]   └ "${schedule.title}" — 알림 기준 ${Math.round(diffMs / 1000)}초 경과 (일정까지 ${remainMin}분)`)

    // 아직 알림 시간이 되지 않은 경우 스킵
    if (diffMs < 0) continue
    // 알림 윈도우(60초)를 초과한 경우 스킵 (이미 지남)
    if (diffMs / 1000 > REMINDER_WINDOW_SECONDS) continue

    // 중복 알림 방지 (최근 2분 내 이미 알림이 있으면 스킵)
    if (schedule.notifications.length > 0) continue

    try {
      const category: ScheduleCategory = (SCHEDULE_CATEGORIES as readonly string[]).includes(schedule.category)
        ? (schedule.category as ScheduleCategory)
        : 'PERSONAL'
      const encouragement = await getEncouragementMessage(schedule.title, category)
      const message = `${schedule.title} 시작까지 ${schedule.reminderMinutes}분 남았습니다.`

      // DB에 알림 저장
      await prisma.notification.create({
        data: {
          scheduleId: schedule.id,
          message,
          encouragement,
          sentAt: now,
        },
      })

      // 등록된 모든 알림 채널로 전송
      const channels = getNotificationChannels()
      for (const channel of channels) {
        if (!channel.isEnabled()) continue
        const ok = await channel.send({ title: schedule.title, message, encouragement, scheduleId: schedule.id })
        if (!ok) {
          console.warn(`[Scheduler] ${channel.name} 전송 실패 (DB 알림은 저장됨): ${schedule.title}`)
        }
      }

      console.log(`[Scheduler] 알림 전송 완료: ${schedule.title}`)
    } catch (err) {
      console.error(`[Scheduler] 알림 전송 실패 (${schedule.id}):`, err)
    }
  }
}
