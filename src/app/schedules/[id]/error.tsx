'use client'

import Link from 'next/link'
import { Container } from '@/components/layout/Container'

export default function ScheduleDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Container>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-4xl mb-4">😟</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">일정을 불러오지 못했습니다</h2>
        <p className="text-gray-500 text-sm mb-6">
          {error.message || '잠시 후 다시 시도해 주세요.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로
          </Link>
        </div>
      </div>
    </Container>
  )
}
