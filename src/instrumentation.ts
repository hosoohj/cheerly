export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
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
  }
}
