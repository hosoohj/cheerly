import type { NotificationChannel, NotificationPayload } from './types'

// 기존 함수 시그니처 호환을 위해 내부 타입 별칭 유지
type TeamsNotificationPayload = NotificationPayload

function buildAdaptiveCard(payload: TeamsNotificationPayload) {
  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              text: `📅 ${payload.title}`,
              weight: 'Bolder',
              size: 'Medium',
            },
            {
              type: 'TextBlock',
              text: payload.message,
              wrap: true,
            },
            {
              type: 'TextBlock',
              text: payload.encouragement,
              wrap: true,
              color: 'Accent',
              spacing: 'Small',
            },
          ],
        },
      },
    ],
  }
}

export async function sendTeamsNotification(
  webhookUrl: string,
  payload: TeamsNotificationPayload,
  maxRetries = 3
): Promise<boolean> {
  if (!webhookUrl) return false

  const body = JSON.stringify(buildAdaptiveCard(payload))

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      if (res.ok) return true

      console.warn(`[Teams] 전송 실패 (시도 ${attempt}/${maxRetries}): HTTP ${res.status}`)
      if (attempt === maxRetries) {
        console.error('[Teams] 최대 재시도 횟수 초과, 전송 포기')
        return false
      }
    } catch (err) {
      console.warn(`[Teams] 전송 오류 (시도 ${attempt}/${maxRetries}):`, err)
      if (attempt === maxRetries) {
        console.error('[Teams] 최대 재시도 횟수 초과, 전송 포기')
        return false
      }
    }

    // 재시도 전 지연 (지수 백오프: 1초, 2초)
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000))
  }

  return false
}

/**
 * Teams 알림 채널 — NotificationChannel 구현체
 * 새 채널 추가 시 이 패턴을 참고해 src/lib/channels/ 아래에 추가
 */
export class TeamsChannel implements NotificationChannel {
  readonly name = 'Teams'

  isEnabled(): boolean {
    return !!process.env.TEAMS_WEBHOOK_URL
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL ?? ''
    return sendTeamsNotification(webhookUrl, payload)
  }
}
