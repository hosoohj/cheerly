'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { ScheduleForm } from '@/components/schedule/ScheduleForm'
import type { ScheduleFormData } from '@/types'

export default function NewSchedulePage() {
  const router = useRouter()
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(data: ScheduleFormData) {
    setIsLoading(true)
    try {
      const { scheduleApi } = await import('@/lib/api-client')
      await scheduleApi.create(data)
      setIsSuccess(true)
    } catch (err) {
      console.error('일정 등록 실패:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">일정이 등록되었습니다!</h2>
          <p className="text-gray-500 text-sm mb-6">
            일정 시작 전에 격려 메시지와 함께 알림을 보내드릴게요.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setIsSuccess(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              계속 등록하기
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              목록 보기
            </button>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">새 일정 등록</h1>
        <p className="text-gray-500 text-sm mt-1">
          일정과 함께 받을 격려 메시지가 준비되어 있어요
        </p>
      </div>
      <ScheduleForm onSubmit={handleSubmit} isLoading={isLoading} />
    </Container>
  )
}
