/**
 * 알림 채널 추상화 인터페이스
 * 새 채널(KakaoTalk, Slack, Email 등) 추가 시 이 인터페이스를 구현
 */
export interface NotificationPayload {
  title: string
  message: string
  encouragement: string
  scheduleId: string
}

export interface NotificationChannel {
  readonly name: string
  isEnabled(): boolean
  send(payload: NotificationPayload): Promise<boolean>
}
