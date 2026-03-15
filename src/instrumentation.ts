export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV !== 'test') {
    // /tmp DB 자동 마이그레이션 + 시드 (Vercel, Railway 등 ephemeral 환경)
    if (process.env.VERCEL || process.env.RAILWAY_ENVIRONMENT) {
      try {
        const { execSync } = await import('child_process')
        execSync('npx prisma migrate deploy', {
          env: { ...process.env },
          stdio: 'pipe',
        })

        // DB가 비어있으면 시드 데이터 투입
        const { prisma } = await import('@/lib/db')
        const count = await prisma.schedule.count()
        if (count === 0) {
          const now = new Date()
          await prisma.schedule.createMany({
            data: [
              { title: '주간 팀 회의', description: '이번 주 업무 공유 및 계획 논의', startTime: new Date(now.getTime() + 25 * 60 * 1000), reminderMinutes: 20, category: 'WORK' },
              { title: '알고리즘 스터디', description: '코딩 테스트 대비 알고리즘 문제 풀이', startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), reminderMinutes: 20, category: 'STUDY' },
              { title: '저녁 운동', description: '헬스장 1시간', startTime: new Date(now.getTime() + 5 * 60 * 60 * 1000), reminderMinutes: 10, category: 'PERSONAL' },
              { title: '아이 하원', description: '오후 4시 유치원 하원', startTime: new Date(now.getTime() + 8 * 60 * 60 * 1000), reminderMinutes: 30, category: 'FAMILY' },
            ],
          })
          console.log('[Init] 시드 데이터 생성 완료')
        }
      } catch (err) {
        console.error('[Init] DB 초기화 실패:', err)
      }
    }

    // 알림 스케줄러 시작
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
