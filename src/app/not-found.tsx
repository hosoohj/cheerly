import Link from 'next/link'
import { Container } from '@/components/layout/Container'

export default function NotFound() {
  return (
    <Container>
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">페이지를 찾을 수 없습니다.</p>
        <Link href="/" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          홈으로 돌아가기
        </Link>
      </div>
    </Container>
  )
}
