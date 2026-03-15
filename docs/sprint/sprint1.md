# Sprint 1 구현 계획 — 프로젝트 초기화 및 프론트엔드

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**목표:** Next.js 14 기반 프로젝트를 초기화하고 일정 등록/목록/상세 UI를 목 데이터로 완성하여 사용자 리뷰를 받을 수 있는 상태로 만든다.

**아키텍처:** Next.js 14 App Router를 사용하여 Server/Client Component를 명확히 구분한다. 목 데이터를 `lib/mock-data.ts`에서 관리하여 Sprint 2에서 API 교체를 최소화한다. 컴포넌트는 재사용 가능한 단위로 분리하며 Tailwind CSS로 반응형 레이아웃을 구현한다.

**기술 스택:** Next.js 14 (App Router), TypeScript, Tailwind CSS, React useState/Context, Vitest, ESLint, Prettier

**기간:** 2주 (2026-03-15 ~ 2026-03-28)

---

## 작업 분해 (Task Breakdown)

---

### Task 1: 프로젝트 초기화

**파일:**
- 생성: `프로젝트 루트 (create-next-app 자동 생성)`
- 수정: `package.json` — vitest 의존성 추가
- 생성: `vitest.config.ts`
- 생성: `.prettierrc`
- 수정: `eslint.config.mjs` 또는 `.eslintrc.json`

**Step 1: Next.js 14 프로젝트 생성**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

실행 중 선택지:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- src/ directory: Yes
- App Router: Yes
- Import alias: `@/*`

**Step 2: Vitest 및 테스트 의존성 설치**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Step 3: vitest.config.ts 생성**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Step 4: vitest.setup.ts 생성**

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom'
```

**Step 5: Prettier 설정 추가**

```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100
}
```

**Step 6: package.json 스크립트 추가**

`package.json`의 `scripts` 섹션에 다음을 추가:

```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage"
```

**Step 7: 동작 확인**

```bash
npm run dev
```

기대 결과: `http://localhost:3000` 에서 Next.js 기본 페이지가 렌더링된다.

**Step 8: 커밋**

```bash
git add -A
git commit -m "chore: Next.js 14 + TypeScript + Tailwind CSS + Vitest 프로젝트 초기화"
```

---

### Task 2: 디렉토리 구조 수립 및 타입 정의

**파일:**
- 생성: `src/types/schedule.ts`
- 생성: `src/types/notification.ts`
- 생성: `src/types/index.ts`
- 생성: `src/lib/mock-data.ts`
- 테스트: `src/types/__tests__/schedule.test.ts`

**Step 1: 디렉토리 구조 생성**

```
src/
  app/                   # Next.js App Router 페이지
  components/
    ui/                  # 공통 UI 컴포넌트 (버튼, 입력 등)
    layout/              # 레이아웃 컴포넌트 (헤더, 컨테이너)
    schedule/            # 일정 관련 컴포넌트
  lib/                   # 유틸리티, 목 데이터
  types/                 # TypeScript 타입 정의
    __tests__/
```

```bash
mkdir -p src/components/ui src/components/layout src/components/schedule
mkdir -p src/lib
mkdir -p src/types/__tests__
```

**Step 2: 타입 정의 테스트 작성**

```typescript
// src/types/__tests__/schedule.test.ts
import { describe, it, expect } from 'vitest'
import type { Schedule, ScheduleCategory, Notification } from '../index'

describe('Schedule 타입', () => {
  it('ScheduleCategory 값이 올바르게 정의된다', () => {
    const categories: ScheduleCategory[] = ['WORK', 'STUDY', 'PERSONAL', 'FAMILY']
    expect(categories).toHaveLength(4)
  })

  it('Schedule 객체가 올바른 구조를 갖는다', () => {
    const schedule: Schedule = {
      id: '1',
      title: '팀 회의',
      description: '주간 팀 회의',
      startTime: new Date('2026-03-15T10:00:00'),
      reminderMinutes: 20,
      category: 'WORK',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    expect(schedule.id).toBe('1')
    expect(schedule.category).toBe('WORK')
    expect(schedule.reminderMinutes).toBe(20)
  })

  it('Notification 객체가 올바른 구조를 갖는다', () => {
    const notification: Notification = {
      id: '1',
      scheduleId: '1',
      message: '회의 시작까지 20분 남았습니다.',
      encouragement: '오늘도 잘 해내실 수 있습니다!',
      sentAt: new Date(),
    }
    expect(notification.scheduleId).toBe('1')
    expect(notification.message).toContain('20분')
  })
})
```

**Step 3: 테스트 실행 — 실패 확인**

```bash
npm run test:run
```

기대 결과: FAIL (타입 파일이 아직 없으므로)

**Step 4: 타입 정의 구현**

```typescript
// src/types/schedule.ts
export type ScheduleCategory = 'WORK' | 'STUDY' | 'PERSONAL' | 'FAMILY'

export interface Schedule {
  id: string
  title: string
  description?: string
  startTime: Date
  reminderMinutes: number
  category: ScheduleCategory
  createdAt: Date
  updatedAt: Date
}

export interface ScheduleFormData {
  title: string
  description?: string
  startTime: string   // HTML datetime-local 입력값 (string)
  reminderMinutes: number
  category: ScheduleCategory
}
```

```typescript
// src/types/notification.ts
export interface Notification {
  id: string
  scheduleId: string
  message: string
  encouragement: string
  sentAt: Date
  isRead?: boolean
}
```

```typescript
// src/types/index.ts
export type { Schedule, ScheduleCategory, ScheduleFormData } from './schedule'
export type { Notification } from './notification'
```

**Step 5: 테스트 재실행 — 통과 확인**

```bash
npm run test:run
```

기대 결과: PASS

**Step 6: 목 데이터 작성**

```typescript
// src/lib/mock-data.ts
import type { Schedule, Notification } from '@/types'

export const MOCK_SCHEDULES: Schedule[] = [
  {
    id: '1',
    title: '주간 팀 회의',
    description: '이번 주 업무 공유 및 계획 논의',
    startTime: new Date(Date.now() + 25 * 60 * 1000), // 25분 후
    reminderMinutes: 20,
    category: 'WORK',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: '알고리즘 스터디',
    description: '코딩 테스트 대비 알고리즘 문제 풀이',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2시간 후
    reminderMinutes: 20,
    category: 'STUDY',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    title: '저녁 운동',
    description: '헬스장 1시간',
    startTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5시간 후
    reminderMinutes: 10,
    category: 'PERSONAL',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    title: '아이 하원',
    description: '오후 4시 유치원 하원',
    startTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8시간 후
    reminderMinutes: 30,
    category: 'FAMILY',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    scheduleId: '1',
    message: '주간 팀 회의 시작까지 20분 남았습니다.',
    encouragement: '이번 회의도 잘 준비하셨을 거예요. 화이팅!',
    sentAt: new Date(Date.now() - 5 * 60 * 1000),
    isRead: false,
  },
]
```

**Step 7: 커밋**

```bash
git add src/types/ src/lib/mock-data.ts
git commit -m "feat: Schedule/Notification 타입 정의 및 목 데이터 추가"
```

---

### Task 3: 공통 레이아웃 및 UI 컴포넌트

**파일:**
- 생성: `src/components/ui/Button.tsx`
- 생성: `src/components/ui/Input.tsx`
- 생성: `src/components/ui/Badge.tsx`
- 생성: `src/components/layout/Header.tsx`
- 생성: `src/components/layout/Container.tsx`
- 수정: `src/app/layout.tsx`
- 테스트: `src/components/ui/__tests__/Button.test.tsx`

**Step 1: Button 컴포넌트 테스트 작성**

```typescript
// src/components/ui/__tests__/Button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button 컴포넌트', () => {
  it('텍스트가 렌더링된다', () => {
    render(<Button>클릭</Button>)
    expect(screen.getByText('클릭')).toBeInTheDocument()
  })

  it('onClick 핸들러가 호출된다', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>클릭</Button>)
    fireEvent.click(screen.getByText('클릭'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('disabled 상태에서 클릭이 동작하지 않는다', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick} disabled>클릭</Button>)
    fireEvent.click(screen.getByText('클릭'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('variant prop에 따라 다른 스타일이 적용된다', () => {
    const { rerender } = render(<Button variant="primary">버튼</Button>)
    expect(screen.getByText('버튼')).toHaveClass('bg-blue-600')

    rerender(<Button variant="secondary">버튼</Button>)
    expect(screen.getByText('버튼')).toHaveClass('bg-gray-100')
  })
})
```

**Step 2: 테스트 실행 — 실패 확인**

```bash
npm run test:run -- src/components/ui/__tests__/Button.test.tsx
```

기대 결과: FAIL

**Step 3: Button 컴포넌트 구현**

```typescript
// src/components/ui/Button.tsx
'use client'

import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variantStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center
        font-medium rounded-lg
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
```

**Step 4: 테스트 재실행 — 통과 확인**

```bash
npm run test:run -- src/components/ui/__tests__/Button.test.tsx
```

기대 결과: PASS

**Step 5: Input 및 Badge 컴포넌트 구현**

```typescript
// src/components/ui/Input.tsx
'use client'

import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full px-3 py-2 border rounded-lg text-gray-900
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
```

```typescript
// src/components/ui/Badge.tsx
import type { ScheduleCategory } from '@/types'

interface BadgeProps {
  category: ScheduleCategory
  className?: string
}

const CATEGORY_STYLES: Record<ScheduleCategory, { bg: string; text: string; label: string }> = {
  WORK: { bg: 'bg-blue-100', text: 'text-blue-700', label: '업무' },
  STUDY: { bg: 'bg-green-100', text: 'text-green-700', label: '공부' },
  PERSONAL: { bg: 'bg-purple-100', text: 'text-purple-700', label: '개인' },
  FAMILY: { bg: 'bg-orange-100', text: 'text-orange-700', label: '가족' },
}

export function Badge({ category, className = '' }: BadgeProps) {
  const { bg, text, label } = CATEGORY_STYLES[category]
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text} ${className}`}
    >
      {label}
    </span>
  )
}
```

**Step 6: Header 및 Container 컴포넌트 구현**

```typescript
// src/components/layout/Header.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-600">Cheerly</span>
          <span className="text-xs text-gray-500 hidden sm:inline">일정 + 격려</span>
        </Link>
        <Link href="/schedules/new">
          <Button size="sm">+ 일정 추가</Button>
        </Link>
      </div>
    </header>
  )
}
```

```typescript
// src/components/layout/Container.tsx
interface ContainerProps {
  children: React.ReactNode
  className?: string
}

export function Container({ children, className = '' }: ContainerProps) {
  return (
    <main className={`max-w-2xl mx-auto px-4 py-6 ${className}`}>
      {children}
    </main>
  )
}
```

**Step 7: app/layout.tsx 수정**

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <Header />
        {children}
      </body>
    </html>
  )
}
```

**Step 8: 커밋**

```bash
git add src/components/ src/app/layout.tsx
git commit -m "feat: 공통 UI 컴포넌트(Button, Input, Badge) 및 레이아웃 컴포넌트 추가"
```

---

### Task 4: 일정 목록 페이지 UI

**파일:**
- 생성: `src/components/schedule/ScheduleCard.tsx`
- 생성: `src/components/schedule/ScheduleList.tsx`
- 생성: `src/components/schedule/EmptyState.tsx`
- 수정: `src/app/page.tsx`
- 테스트: `src/components/schedule/__tests__/ScheduleCard.test.tsx`

**Step 1: ScheduleCard 테스트 작성**

```typescript
// src/components/schedule/__tests__/ScheduleCard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScheduleCard } from '../ScheduleCard'
import type { Schedule } from '@/types'

const mockSchedule: Schedule = {
  id: '1',
  title: '팀 회의',
  description: '주간 팀 회의',
  startTime: new Date('2026-03-15T10:00:00'),
  reminderMinutes: 20,
  category: 'WORK',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('ScheduleCard 컴포넌트', () => {
  it('일정 제목이 렌더링된다', () => {
    render(<ScheduleCard schedule={mockSchedule} />)
    expect(screen.getByText('팀 회의')).toBeInTheDocument()
  })

  it('일정 유형 뱃지가 렌더링된다', () => {
    render(<ScheduleCard schedule={mockSchedule} />)
    expect(screen.getByText('업무')).toBeInTheDocument()
  })

  it('알림 시간이 표시된다', () => {
    render(<ScheduleCard schedule={mockSchedule} />)
    expect(screen.getByText(/20분 전/)).toBeInTheDocument()
  })
})
```

**Step 2: 테스트 실행 — 실패 확인**

```bash
npm run test:run -- src/components/schedule/__tests__/ScheduleCard.test.tsx
```

기대 결과: FAIL

**Step 3: ScheduleCard 컴포넌트 구현**

```typescript
// src/components/schedule/ScheduleCard.tsx
import Link from 'next/link'
import type { Schedule } from '@/types'
import { Badge } from '@/components/ui/Badge'

interface ScheduleCardProps {
  schedule: Schedule
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getRemainingTime(startTime: Date): string {
  const now = new Date()
  const diffMs = startTime.getTime() - now.getTime()

  if (diffMs < 0) return '종료된 일정'

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `${diffDays}일 후`
  if (diffHours > 0) return `${diffHours}시간 후`
  if (diffMinutes > 0) return `${diffMinutes}분 후`
  return '곧 시작'
}

export function ScheduleCard({ schedule }: ScheduleCardProps) {
  const remaining = getRemainingTime(schedule.startTime)
  const isImminent = schedule.startTime.getTime() - Date.now() < schedule.reminderMinutes * 60 * 1000

  return (
    <Link href={`/schedules/${schedule.id}`}>
      <div
        className={`
          bg-white rounded-xl border p-4 shadow-sm
          hover:shadow-md hover:border-blue-200
          transition-all duration-200 cursor-pointer
          ${isImminent ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}
        `}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge category={schedule.category} />
              {isImminent && (
                <span className="text-xs text-orange-600 font-medium">알림 예정</span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 truncate">{schedule.title}</h3>
            {schedule.description && (
              <p className="text-sm text-gray-500 truncate mt-0.5">{schedule.description}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-medium text-blue-600">{remaining}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatTime(schedule.startTime)}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center text-xs text-gray-500">
          <span>알림: {schedule.reminderMinutes}분 전</span>
        </div>
      </div>
    </Link>
  )
}
```

**Step 4: 테스트 재실행 — 통과 확인**

```bash
npm run test:run -- src/components/schedule/__tests__/ScheduleCard.test.tsx
```

기대 결과: PASS

**Step 5: ScheduleList 및 EmptyState 컴포넌트 구현**

```typescript
// src/components/schedule/EmptyState.tsx
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
```

```typescript
// src/components/schedule/ScheduleList.tsx
import type { Schedule } from '@/types'
import { ScheduleCard } from './ScheduleCard'
import { EmptyState } from './EmptyState'

interface ScheduleListProps {
  schedules: Schedule[]
}

export function ScheduleList({ schedules }: ScheduleListProps) {
  if (schedules.length === 0) {
    return <EmptyState />
  }

  const sorted = [...schedules].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  )

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((schedule) => (
        <ScheduleCard key={schedule.id} schedule={schedule} />
      ))}
    </div>
  )
}
```

**Step 6: 홈 페이지(app/page.tsx) 구현**

```typescript
// src/app/page.tsx
import { Container } from '@/components/layout/Container'
import { ScheduleList } from '@/components/schedule/ScheduleList'
import { MOCK_SCHEDULES } from '@/lib/mock-data'

export default function HomePage() {
  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">오늘의 일정</h1>
        <p className="text-gray-500 text-sm mt-1">
          일정 시작 전에 격려 메시지를 받아보세요
        </p>
      </div>
      <ScheduleList schedules={MOCK_SCHEDULES} />
    </Container>
  )
}
```

**Step 7: 커밋**

```bash
git add src/components/schedule/ src/app/page.tsx
git commit -m "feat: 일정 목록 페이지 UI — ScheduleCard, ScheduleList, EmptyState 컴포넌트"
```

---

### Task 5: 일정 등록 페이지 UI

**파일:**
- 생성: `src/components/schedule/ScheduleForm.tsx`
- 생성: `src/app/schedules/new/page.tsx`
- 테스트: `src/components/schedule/__tests__/ScheduleForm.test.tsx`

**Step 1: ScheduleForm 테스트 작성**

```typescript
// src/components/schedule/__tests__/ScheduleForm.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScheduleForm } from '../ScheduleForm'

describe('ScheduleForm 컴포넌트', () => {
  it('폼 필드가 모두 렌더링된다', () => {
    render(<ScheduleForm onSubmit={vi.fn()} />)
    expect(screen.getByLabelText(/일정 제목/)).toBeInTheDocument()
    expect(screen.getByLabelText(/시작 시간/)).toBeInTheDocument()
    expect(screen.getByLabelText(/알림 시간/)).toBeInTheDocument()
    expect(screen.getByLabelText(/일정 유형/)).toBeInTheDocument()
  })

  it('알림 시간 기본값이 20분이다', () => {
    render(<ScheduleForm onSubmit={vi.fn()} />)
    const reminderSelect = screen.getByLabelText(/알림 시간/) as HTMLSelectElement
    expect(reminderSelect.value).toBe('20')
  })

  it('제목이 비어있으면 제출이 막힌다', async () => {
    const onSubmit = vi.fn()
    render(<ScheduleForm onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: /일정 등록/ }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(await screen.findByText(/제목을 입력해 주세요/)).toBeInTheDocument()
  })

  it('유효한 데이터로 제출하면 onSubmit이 호출된다', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ScheduleForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/일정 제목/), '팀 회의')
    await user.type(screen.getByLabelText(/시작 시간/), '2026-03-15T10:00')
    fireEvent.click(screen.getByRole('button', { name: /일정 등록/ }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: '팀 회의' })
      )
    })
  })
})
```

**Step 2: 테스트 실행 — 실패 확인**

```bash
npm run test:run -- src/components/schedule/__tests__/ScheduleForm.test.tsx
```

기대 결과: FAIL

**Step 3: ScheduleForm 컴포넌트 구현**

```typescript
// src/components/schedule/ScheduleForm.tsx
'use client'

import { useState } from 'react'
import type { ScheduleCategory, ScheduleFormData } from '@/types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface ScheduleFormProps {
  onSubmit: (data: ScheduleFormData) => void
  initialData?: Partial<ScheduleFormData>
  isLoading?: boolean
}

const CATEGORIES: { value: ScheduleCategory; label: string }[] = [
  { value: 'WORK', label: '업무' },
  { value: 'STUDY', label: '공부' },
  { value: 'PERSONAL', label: '개인' },
  { value: 'FAMILY', label: '가족' },
]

const REMINDER_OPTIONS = [
  { value: 5, label: '5분 전' },
  { value: 10, label: '10분 전' },
  { value: 20, label: '20분 전' },
  { value: 30, label: '30분 전' },
  { value: 60, label: '1시간 전' },
]

interface FormErrors {
  title?: string
  startTime?: string
}

export function ScheduleForm({ onSubmit, initialData, isLoading = false }: ScheduleFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [startTime, setStartTime] = useState(initialData?.startTime ?? '')
  const [reminderMinutes, setReminderMinutes] = useState(
    initialData?.reminderMinutes ?? 20
  )
  const [category, setCategory] = useState<ScheduleCategory>(
    initialData?.category ?? 'WORK'
  )
  const [errors, setErrors] = useState<FormErrors>({})

  function validate(): boolean {
    const newErrors: FormErrors = {}

    if (!title.trim()) {
      newErrors.title = '제목을 입력해 주세요'
    }
    if (!startTime) {
      newErrors.startTime = '시작 시간을 입력해 주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      startTime,
      reminderMinutes,
      category,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        id="title"
        label="일정 제목 *"
        placeholder="예: 팀 회의"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
      />

      <Input
        id="description"
        label="일정 설명 (선택)"
        placeholder="일정에 대한 간단한 메모"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Input
        id="startTime"
        label="시작 시간 *"
        type="datetime-local"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
        error={errors.startTime}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="reminderMinutes" className="text-sm font-medium text-gray-700">
          알림 시간 *
        </label>
        <select
          id="reminderMinutes"
          value={reminderMinutes}
          onChange={(e) => setReminderMinutes(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {REMINDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="text-sm font-medium text-gray-700">
          일정 유형 *
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`
                py-2 px-3 rounded-lg border text-sm font-medium transition-colors
                ${
                  category === cat.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full mt-2">
        {isLoading ? '등록 중...' : '일정 등록'}
      </Button>
    </form>
  )
}
```

**Step 4: 테스트 재실행 — 통과 확인**

```bash
npm run test:run -- src/components/schedule/__tests__/ScheduleForm.test.tsx
```

기대 결과: PASS

**Step 5: 일정 등록 페이지 구현**

```typescript
// src/app/schedules/new/page.tsx
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

  function handleSubmit(data: ScheduleFormData) {
    setIsLoading(true)
    // Sprint 1은 목 처리 — Sprint 2에서 실제 API 호출로 교체
    setTimeout(() => {
      console.log('일정 등록 데이터 (목):', data)
      setIsLoading(false)
      setIsSuccess(true)
    }, 500)
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
```

**Step 6: 커밋**

```bash
git add src/components/schedule/ScheduleForm.tsx src/app/schedules/
git commit -m "feat: 일정 등록 페이지 UI — ScheduleForm 컴포넌트 및 /schedules/new 라우트"
```

---

### Task 6: 일정 상세/수정/삭제 UI

**파일:**
- 생성: `src/app/schedules/[id]/page.tsx`
- 생성: `src/components/schedule/DeleteConfirmDialog.tsx`
- 테스트: `src/components/schedule/__tests__/DeleteConfirmDialog.test.tsx`

**Step 1: DeleteConfirmDialog 테스트 작성**

```typescript
// src/components/schedule/__tests__/DeleteConfirmDialog.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeleteConfirmDialog } from '../DeleteConfirmDialog'

describe('DeleteConfirmDialog 컴포넌트', () => {
  it('open이 false면 렌더링되지 않는다', () => {
    render(
      <DeleteConfirmDialog
        open={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.queryByText(/삭제하시겠습니까/)).not.toBeInTheDocument()
  })

  it('open이 true면 확인 메시지가 표시된다', () => {
    render(
      <DeleteConfirmDialog
        open={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByText(/삭제하시겠습니까/)).toBeInTheDocument()
  })

  it('삭제 버튼 클릭 시 onConfirm이 호출된다', () => {
    const onConfirm = vi.fn()
    render(
      <DeleteConfirmDialog
        open={true}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /삭제/ }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('취소 버튼 클릭 시 onCancel이 호출된다', () => {
    const onCancel = vi.fn()
    render(
      <DeleteConfirmDialog
        open={true}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /취소/ }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
```

**Step 2: 테스트 실행 — 실패 확인**

```bash
npm run test:run -- src/components/schedule/__tests__/DeleteConfirmDialog.test.tsx
```

기대 결과: FAIL

**Step 3: DeleteConfirmDialog 컴포넌트 구현**

```typescript
// src/components/schedule/DeleteConfirmDialog.tsx
'use client'

import { Button } from '@/components/ui/Button'

interface DeleteConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title?: string
}

export function DeleteConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = '이 일정',
}: DeleteConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />
      {/* 다이얼로그 */}
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="text-center mb-5">
          <div className="text-4xl mb-3">🗑️</div>
          <h2 className="text-lg font-semibold text-gray-900">
            {title}을(를) 삭제하시겠습니까?
          </h2>
          <p className="text-sm text-gray-500 mt-1">삭제한 일정은 복구할 수 없습니다.</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
          >
            취소
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={onConfirm}
          >
            삭제
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Step 4: 테스트 재실행 — 통과 확인**

```bash
npm run test:run -- src/components/schedule/__tests__/DeleteConfirmDialog.test.tsx
```

기대 결과: PASS

**Step 5: 일정 상세 페이지 구현**

```typescript
// src/app/schedules/[id]/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Container } from '@/components/layout/Container'
import { ScheduleForm } from '@/components/schedule/ScheduleForm'
import { DeleteConfirmDialog } from '@/components/schedule/DeleteConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MOCK_SCHEDULES } from '@/lib/mock-data'
import type { ScheduleFormData } from '@/types'

interface PageProps {
  params: { id: string }
}

export default function ScheduleDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Sprint 2에서 실제 API 호출로 교체
  const schedule = MOCK_SCHEDULES.find((s) => s.id === params.id)

  if (!schedule) {
    return (
      <Container>
        <div className="text-center py-20">
          <p className="text-gray-500">일정을 찾을 수 없습니다.</p>
          <Link href="/" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
            목록으로 돌아가기
          </Link>
        </div>
      </Container>
    )
  }

  function handleUpdate(data: ScheduleFormData) {
    // Sprint 2에서 실제 API 호출로 교체
    console.log('일정 수정 데이터 (목):', data)
    setIsEditing(false)
  }

  function handleDelete() {
    // Sprint 2에서 실제 API 호출로 교체
    console.log('일정 삭제 (목):', schedule?.id)
    router.push('/')
  }

  if (isEditing) {
    return (
      <Container>
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setIsEditing(false)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="뒤로 가기"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold text-gray-900">일정 수정</h1>
        </div>
        <ScheduleForm
          onSubmit={handleUpdate}
          initialData={{
            title: schedule.title,
            description: schedule.description,
            startTime: schedule.startTime.toISOString().slice(0, 16),
            reminderMinutes: schedule.reminderMinutes,
            category: schedule.category,
          }}
        />
      </Container>
    )
  }

  return (
    <Container>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/" className="text-gray-500 hover:text-gray-700" aria-label="뒤로 가기">
          ←
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">일정 상세</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <Badge category={schedule.category} />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">{schedule.title}</h2>

        {schedule.description && (
          <p className="text-gray-600 mb-4">{schedule.description}</p>
        )}

        <div className="flex flex-col gap-2 text-sm text-gray-600 border-t border-gray-100 pt-4 mt-4">
          <div className="flex justify-between">
            <span className="text-gray-400">시작 시간</span>
            <span className="font-medium">
              {new Intl.DateTimeFormat('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).format(schedule.startTime)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">알림 시간</span>
            <span className="font-medium">{schedule.reminderMinutes}분 전</span>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setIsEditing(true)}
          >
            수정
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => setShowDeleteDialog(true)}
          >
            삭제
          </Button>
        </div>
      </div>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        title={schedule.title}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </Container>
  )
}
```

**Step 6: 커밋**

```bash
git add src/components/schedule/DeleteConfirmDialog.tsx src/app/schedules/[id]/
git commit -m "feat: 일정 상세/수정/삭제 UI — DeleteConfirmDialog 및 /schedules/[id] 라우트"
```

---

### Task 7: 전체 테스트 검증 및 최종 점검

**파일:**
- 검증: 모든 테스트 파일
- 수정: 필요 시 ESLint/TypeScript 에러 수정

**Step 1: 전체 테스트 실행**

```bash
npm run test:run
```

기대 결과: 모든 테스트 PASS, 실패 0개

**Step 2: TypeScript 컴파일 에러 확인**

```bash
npx tsc --noEmit
```

기대 결과: 에러 0개

**Step 3: ESLint 검사**

```bash
npm run lint
```

기대 결과: 경고 0개, 에러 0개

**Step 4: 개발 서버 실행 및 반응형 확인**

```bash
npm run dev
```

브라우저에서 다음 경로를 수동으로 확인:
- `http://localhost:3000` — 일정 목록 (목 데이터 4개 표시)
- `http://localhost:3000/schedules/new` — 일정 등록 폼
- `http://localhost:3000/schedules/1` — 일정 상세
- 데스크톱(1280px)과 모바일(375px) 뷰포트에서 레이아웃 확인

**Step 5: 최종 커밋**

```bash
git add -A
git commit -m "chore: Sprint 1 완료 — 일정 등록/목록/상세 프론트엔드 UI 완성"
```

---

## 완료 기준 (Definition of Done)

| 항목 | 확인 방법 |
|------|-----------|
| `npm run dev`로 정상 실행 | 브라우저 localhost:3000 접속 |
| 일정 등록 폼 모든 입력 필드 동작 | `/schedules/new` 접속 후 수동 입력 |
| 일정 목록 페이지 목 데이터 표시 | `/` 접속 후 카드 4개 확인 |
| 일정 상세 페이지 정상 렌더링 | `/schedules/1` 접속 |
| 삭제 다이얼로그 동작 | 상세 페이지에서 삭제 버튼 클릭 |
| 수정 모드 전환 | 상세 페이지에서 수정 버튼 클릭 |
| 모바일/데스크톱 반응형 | 브라우저 뷰포트 375px/1280px 전환 |
| ESLint 경고 0개 | `npm run lint` |
| TypeScript 에러 0개 | `npx tsc --noEmit` |
| Vitest 테스트 100% 통과 | `npm run test:run` |

---

## Playwright MCP 검증 시나리오

`npm run dev` 실행 후 아래 순서로 검증한다.

**일정 목록 페이지 검증:**
1. `browser_navigate` → `http://localhost:3000` 접속
2. `browser_snapshot` → 헤더("Cheerly"), 일정 목록 영역 렌더링 확인
3. `browser_snapshot` → 일정 카드 컴포넌트 4개 존재 확인 (목 데이터)
4. `browser_console_messages(level: "error")` → 콘솔 에러 없음 확인

**일정 등록 페이지 검증:**
1. `browser_navigate` → `http://localhost:3000/schedules/new` 접속
2. `browser_snapshot` → 폼 필드(제목, 설명, 시작 시간, 알림 시간, 유형) 전체 렌더링 확인
3. `browser_fill` → 제목 입력: "테스트 일정"
4. `browser_fill` → 시작 시간 입력: "2026-03-20T10:00"
5. `browser_snapshot` → 입력값 반영 확인
6. `browser_click` → "일정 등록" 버튼 클릭
7. `browser_snapshot` → 성공 메시지("일정이 등록되었습니다") 확인
8. `browser_console_messages(level: "error")` → 에러 없음 확인

**일정 상세 페이지 검증:**
1. `browser_navigate` → `http://localhost:3000/schedules/1` 접속
2. `browser_snapshot` → 일정 제목, 유형 뱃지, 시작 시간, 수정/삭제 버튼 확인
3. `browser_click` → "삭제" 버튼 클릭
4. `browser_snapshot` → 삭제 확인 다이얼로그 표시 확인
5. `browser_click` → "취소" 버튼 클릭
6. `browser_snapshot` → 다이얼로그 닫힘 확인

**반응형 검증:**
1. `browser_resize(width: 375, height: 812)` → 모바일 뷰포트 설정
2. `browser_navigate` → `http://localhost:3000` 접속
3. `browser_snapshot` → 모바일 레이아웃 정상 확인
4. `browser_resize(width: 1280, height: 720)` → 데스크톱 뷰포트 설정
5. `browser_snapshot` → 데스크톱 레이아웃 정상 확인

---

## 예상 산출물

- Next.js 14 프로젝트 초기화 완료 (App Router + TypeScript + Tailwind CSS + Vitest)
- `src/types/` — Schedule, ScheduleCategory, Notification 타입 정의
- `src/lib/mock-data.ts` — 4개 카테고리 목 일정 데이터
- `src/components/ui/` — Button, Input, Badge 공통 컴포넌트
- `src/components/layout/` — Header, Container 레이아웃 컴포넌트
- `src/components/schedule/` — ScheduleCard, ScheduleList, EmptyState, ScheduleForm, DeleteConfirmDialog
- `src/app/` — 홈(/), 일정 등록(/schedules/new), 일정 상세(/schedules/[id]) 라우트
- Vitest 단위 테스트 (Button, ScheduleCard, ScheduleForm, DeleteConfirmDialog, 타입 검증)

---

## 의존성 및 리스크

| 리스크 | 영향도 | 완화 방안 |
|--------|--------|-----------|
| `datetime-local` 입력 브라우저 호환성 | 낮 | 최신 Chrome/Firefox/Safari 모두 지원, 폴백 불필요 |
| Next.js App Router Server/Client 컴포넌트 경계 혼동 | 중 | `'use client'` 지시어를 폼/인터랙티브 컴포넌트에만 사용, 레이아웃은 Server Component 유지 |
| 목 데이터와 실제 API 인터페이스 불일치 | 중 | `ScheduleFormData` 타입을 Sprint 2 API 스키마와 동일하게 설계하여 교체 최소화 |
| Tailwind CSS 클래스 충돌 | 낮 | 컴포넌트별 스타일 캡슐화, `className` prop으로 외부 오버라이드 허용 |

---

## 검증 결과

> **완료일:** 2026-03-15 | **상태:** ✅ 완료

- [코드 리뷰 보고서](sprint1/code-review.md) — Critical/High 이슈 없음, Medium 2개(접근성 개선)
- [Playwright E2E 테스트 보고서](sprint1/playwright-report.md) — 단위 테스트 전체 통과, E2E 수동 검증 절차 포함
