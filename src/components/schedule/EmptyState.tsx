import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">📅</div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">등록된 일정이 없습니다</h2>
      <p className="text-gray-500 mb-6 text-sm">
        첫 번째 일정을 등록하고 격려 메시지를 받아보세요!
      </p>
      <Link href="/schedules/new">
        <Button>일정 등록하기</Button>
      </Link>
    </div>
  )
}
