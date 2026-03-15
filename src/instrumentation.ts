export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV !== 'test') {
    try {
      const cron = await import('node-cron')
      const { checkAndSendReminders } = await import('@/lib/scheduler')

      cron.schedule('* * * * *', async () => {
        try {
          await checkAndSendReminders()
        } catch (err) {
          console.error('[Scheduler] 오류:', err)
        }
      })

      console.log('[Scheduler] 알림 스케줄러 시작')
    } catch (err) {
      console.error('[Scheduler] 스케줄러 초기화 실패:', err)
    }
  }
}
