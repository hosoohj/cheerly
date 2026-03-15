import { prisma } from '@/lib/db'
import { getEncouragementMessage } from '@/lib/ai-encouragement'
import { sendTeamsNotification } from '@/lib/channels/teams'
import type { ScheduleCategory } from '@/types'

const REMINDER_WINDOW_SECONDS = 60

export async function checkAndSendReminders() {
  const now = new Date()

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

  for (const schedule of schedules) {
    const reminderTime = new Date(schedule.startTime.getTime() - schedule.reminderMinutes * 60 * 1000)
    const diffMs = Math.abs(now.getTime() - reminderTime.getTime())
    const diffSeconds = diffMs / 1000

    // 알림 시간 ±60초 윈도우 내인지 확인
    if (diffSeconds > REMINDER_WINDOW_SECONDS) continue

    // 중복 알림 방지 (최근 2분 내 이미 알림이 있으면 스킵)
    if (schedule.notifications.length > 0) continue

    try {
      const encouragement = await getEncouragementMessage(
        schedule.title,
        schedule.category as ScheduleCategory
      )
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

      // Teams 웹훅 전송
      const webhookUrl = process.env.TEAMS_WEBHOOK_URL ?? ''
      if (webhookUrl) {
        await sendTeamsNotification(webhookUrl, {
          title: schedule.title,
          message,
          encouragement,
          scheduleId: schedule.id,
        })
      }

      console.log(`[Scheduler] 알림 전송: ${schedule.title}`)
    } catch (err) {
      console.error(`[Scheduler] 알림 전송 실패 (${schedule.id}):`, err)
    }
  }
}
