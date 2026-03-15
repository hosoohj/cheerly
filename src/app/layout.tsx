import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'Cheerly — 스마트 일정 관리',
  description: '일정 알림과 함께 격려 메시지를 받으세요',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen font-sans">
        <Header />
        {children}
      </body>
    </html>
  )
}
