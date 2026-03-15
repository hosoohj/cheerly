export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Container } from '@/components/layout/Container'

export default function NotFound() {
  return (
    <Container>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-7xl font-black text-blue-100 mb-4 select-none">404</p>
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">페이지를 찾을 수 없습니다</h2>
        <p className="text-gray-500 text-sm mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link
          href="/"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </Container>
  )
}
