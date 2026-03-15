import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <nav className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between" aria-label="주요 메뉴">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-600">Cheerly</span>
          <span className="text-xs text-gray-500 hidden sm:inline">일정 + 격려</span>
        </Link>
        <Link href="/schedules/new">
          <Button size="sm">+ 일정 추가</Button>
        </Link>
      </nav>
    </header>
  )
}
