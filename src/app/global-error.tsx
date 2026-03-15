'use client'

import './globals.css'

export const dynamic = 'force-dynamic'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen font-sans">
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">예기치 못한 오류가 발생했습니다</h1>
          <p className="text-gray-500 text-sm mb-2">
            {error.message || '잠시 후 다시 시도해 주세요.'}
          </p>
          {error.digest && (
            <p className="text-xs text-gray-400 mb-6 font-mono">오류 코드: {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  )
}
