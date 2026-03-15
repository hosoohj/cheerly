import { TeamsChannel } from './teams'
import type { NotificationChannel } from './types'

export type { NotificationChannel, NotificationPayload } from './types'

/**
 * 활성 알림 채널 목록
 * Phase 2에서 KakaoTalk, Slack 등 추가 시 여기에 append만 하면 됨
 *
 * @example
 * // Phase 2: KakaoTalk 추가
 * import { KakaoChannel } from './kakao'
 * return [new TeamsChannel(), new KakaoChannel()]
 */
export function getNotificationChannels(): NotificationChannel[] {
  return [
    new TeamsChannel(),
  ]
}
