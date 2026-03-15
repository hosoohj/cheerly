'use client'

import { Container } from '@/components/layout/Container'

export default function HomeError({
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
        <button
          onClick={reset}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          다시 시도
        </button>
      </div>
    </Container>
  )
}
