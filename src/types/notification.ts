export interface Notification {
  id: string
  scheduleId: string
  message: string
  encouragement: string
  sentAt: Date
  isRead?: boolean
}
