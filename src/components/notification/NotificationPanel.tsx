'use client'

import { useRouter } from 'next/navigation'
import { notificationApi } from '@/lib/api-client'

interface Notification {
  id: string
  scheduleId: string
  message: string
  encouragement: string
  sentAt: string
  isRead: boolean
  schedule?: { title: string }
}

interface NotificationPanelProps {
  notifications: Notification[]
  onClose: () => void
  onRead: (id: string) => void
}

export function NotificationPanel({ notifications, onClose, onRead }: NotificationPanelProps) {
  const router = useRouter()

  async function handleItemClick(notification: Notification) {
    if (!notification.isRead) {
      try {
        await notificationApi.markAsRead(notification.id)
        onRead(notification.id)
      } catch (err) {
        console.error('알림 읽음 처리 실패:', err)
      }
    }
    router.push(`/schedules/${notification.scheduleId}`)
    onClose()
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">알림</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          닫기
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">알림이 없습니다</div>
        ) : (
          <ul>
            {notifications.map((notif) => (
              <li key={notif.id}>
                <button
                  onClick={() => handleItemClick(notif)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                    !notif.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notif.isRead && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notif.schedule?.title ?? '일정'}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                      <p className="text-xs text-blue-600 mt-1 italic">{notif.encouragement}</p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
