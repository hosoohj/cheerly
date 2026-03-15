# Sprint 2 구현 계획 — 백엔드 API + 알림 + Teams + AI 격려 메시지

**목표:** Sprint 1에서 완성한 프론트엔드를 실제 백엔드(Prisma/SQLite)와 연결하고, AI 기반 격려 메시지(Claude claude-haiku-4-5-20251001) + 알림 스케줄러 + Teams Webhook을 구현하여 MVP를 완성한다.

**아키텍처:** Next.js API Routes를 백엔드로, Prisma v7 + SQLite(better-sqlite3 어댑터)를 데이터 저장소로 사용한다. 격려 메시지는 카테고리별 정적 풀(fallback)을 기본으로 하고, Claude API로 컨텍스트 기반 한국어 메시지를 생성한다. node-cron 스케줄러는 `instrumentation.ts`를 통해 서버 시작 시 단 한 번 초기화하여 중복 실행을 방지한다.

**기술 스택:** Next.js 16.1.6 (App Router), TypeScript, Prisma 7.5.0 + SQLite(better-sqlite3), zod v4, node-cron v4, @anthropic-ai/sdk, Vitest

**완료일:** 2026-03-15

---

## 의존성 및 리스크

| 항목 | 내용 |
|------|------|
| **선행 조건** | Sprint 1 완료 — `src/types/`, `src/components/` 존재 |
| **환경변수 필수** | `ANTHROPIC_API_KEY`, `TEAMS_WEBHOOK_URL` (`.env.local`) |
| **리스크 1** | node-cron이 Next.js dev 서버에서 Hot Reload 시 중복 실행 → `instrumentation.ts`로 격리 |
| **리스크 2** | Claude API 장애 시 알림 발송 불가 → 정적 메시지 풀로 자동 폴백 |
| **리스크 3** | Teams Webhook URL 미설정 시 전송 건너뜀, 나머지 로직은 계속 진행 |

---

## Prisma v7 핵심 주의사항

Prisma 7.x는 이전 버전과 설정 방식이 다르다.

| 항목 | 구버전 (≤6) | Prisma v7 |
|------|------------|-----------|
| generator provider | `"prisma-client-js"` | `"prisma-client"` |
| schema datasource url | `url = env("DATABASE_URL")` | **schema에 url 없음** — `prisma.config.ts`에서 관리 |
| import 경로 | `from '@prisma/client'` | `from '@/generated/prisma/client'` |
| PrismaClient 생성 | `new PrismaClient()` | `new PrismaClient({ adapter })` (드라이버 어댑터 필수) |
| seed 등록 | `package.json` `"prisma"` 블록 | `prisma.config.ts` `migrations.seed` |
| seed 실행기 | `ts-node` | `tsx` |

---

## 커밋 구조 (8 커밋)

### Commit 1: Prisma 스키마, 마이그레이션, seed, db 싱글턴

**패키지 설치:**
```bash
npm install @prisma/adapter-better-sqlite3 better-sqlite3
npm install -D tsx
```

**`prisma/schema.prisma`:**
```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "sqlite"
  // url은 prisma.config.ts에서 관리 (v7)
}

model Schedule {
  id              String         @id @default(cuid())
  title           String
  description     String?
  startTime       DateTime
  reminderMinutes Int            @default(10)
  category        String         @default("PERSONAL")
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  notifications   Notification[]
}

model Notification {
  id            String   @id @default(cuid())
  scheduleId    String
  message       String
  encouragement String
  sentAt        DateTime @default(now())
  isRead        Boolean  @default(false)
  schedule      Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
}
```

**`prisma.config.ts`:**
```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

**`src/lib/db.ts`:**
```typescript
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

let _prisma: PrismaClient | undefined

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db'
  const adapter = new PrismaBetterSqlite3({ url: dbUrl })
  return new PrismaClient({ adapter })
}

export function getPrisma(): PrismaClient {
  if (!_prisma) _prisma = createPrismaClient()
  return _prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as any)[prop]
  },
})
```

> **Proxy 패턴 이유:** `createPrismaClient()`를 모듈 로드 시점이 아닌 첫 사용 시점에 실행하여 Next.js 빌드 시 better-sqlite3 초기화 오류 방지.

**`prisma/seed.ts`:**
```typescript
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db'
const adapter = new PrismaBetterSqlite3({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.notification.deleteMany()
  await prisma.schedule.deleteMany()
  // ... 시드 데이터 삽입
}
```

**마이그레이션 실행:**
```bash
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed
```

---

### Commit 2: zod v4 유효성 검증 스키마 (TDD)

**`src/lib/validations/schedule.ts`:**
```typescript
import { z } from 'zod'

const CATEGORIES = ['WORK', 'STUDY', 'PERSONAL', 'FAMILY'] as const

export const createScheduleSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: '유효한 날짜/시간 형식이 아닙니다',
  }),
  reminderMinutes: z.number().int().min(1).max(1440),
  category: z.enum(CATEGORIES),
})

export const updateScheduleSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  reminderMinutes: z.number().int().min(1).max(1440).optional(),
  category: z.enum(CATEGORIES).optional(),
})
```

> **zod v4 주의:** `.datetime()` 대신 `Date.parse()` refine 사용. `updateScheduleSchema`는 `createScheduleSchema.partial()` 체이닝 대신 독립 정의 (v4 호환).
> 에러 접근: `parsed.error.issues` (구버전 `.errors` 아님).

---

### Commit 3: 일정 CRUD + 알림 API Routes (TDD)

**파일 구조:**
```
src/app/api/
├── schedules/
│   ├── route.ts              # GET(목록), POST(생성)
│   ├── [id]/route.ts         # GET(상세), PUT(수정), DELETE(삭제)
│   └── __tests__/route.test.ts
└── notifications/
    ├── route.ts              # GET(목록)
    └── [id]/read/route.ts    # PATCH(읽음 처리)
```

**핵심 패턴:**
```typescript
// params는 Promise<{ id: string }> — Next.js 15+ 패턴
interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  // ...
}
```

---

### Commit 4: 격려 메시지 시스템 (TDD)

**`src/lib/encouragements.ts`:**
```typescript
import type { ScheduleCategory } from '@/types'

export const ENCOURAGEMENT_MESSAGES: Record<ScheduleCategory, string[]> = {
  WORK: [ /* 11개+ 한국어 메시지 */ ],
  STUDY: [ /* 11개+ */ ],
  PERSONAL: [ /* 11개+ */ ],
  FAMILY: [ /* 11개+ */ ],
}

export function getStaticEncouragement(category: ScheduleCategory): string {
  const messages = ENCOURAGEMENT_MESSAGES[category]
  return messages[Math.floor(Math.random() * messages.length)]
}
```

**`src/lib/ai-encouragement.ts`:**
```typescript
// 시그니처
export async function generateAIEncouragement(
  scheduleTitle: string,
  category: ScheduleCategory
): Promise<string>

// AI 우선, 실패 시 정적 폴백
export async function getEncouragementMessage(
  scheduleTitle: string,
  category: ScheduleCategory
): Promise<string>
```

> API 키 없으면 정적 메시지 반환, API 오류도 정적으로 폴백.

---

### Commit 5: Teams Webhook + 알림 스케줄러 + instrumentation (TDD)

**`src/lib/channels/teams.ts`:**
```typescript
// Adaptive Card 포맷, maxRetries=3 재시도
export async function sendTeamsNotification(
  webhookUrl: string,
  payload: { title: string; message: string; encouragement: string; scheduleId: string },
  maxRetries = 3
): Promise<boolean>
```

**`src/lib/scheduler.ts`:**
- 알림 시간 = `startTime - reminderMinutes분` 기준 ±60초 윈도우
- 최근 2분 내 알림이 있으면 중복 전송 방지
- `TEAMS_WEBHOOK_URL` 없으면 Teams 전송 건너뜀, DB 저장은 항상 수행

**`src/instrumentation.ts`:**
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV !== 'test') {
    const cron = await import('node-cron')
    const { checkAndSendReminders } = await import('@/lib/scheduler')
    cron.schedule('* * * * *', async () => {
      await checkAndSendReminders()
    })
    console.log('[Scheduler] 알림 스케줄러 시작')
  }
}
```

> `next.config.ts`에 별도 설정 불필요 (Next.js 16에서 instrumentation stable).

---

### Commit 6: 프론트엔드-백엔드 연동

**Date 직렬화 전략:**
- Server Component → Server Component (ScheduleList, ScheduleCard): Prisma `Date` 객체 그대로 전달 ✅
- Server Component → Client Component (ScheduleDetail): Date → `.toISOString()` 문자열로 직렬화 후 전달, 컴포넌트 내에서 `new Date(str)` 변환

**`src/app/page.tsx`:** async Server Component, Prisma 직접 조회
**`src/app/schedules/new/page.tsx`:** `scheduleApi.create()` API 호출로 교체
**`src/app/schedules/[id]/page.tsx`:** Server Component 전환, `await params` 패턴
**`src/components/schedule/ScheduleDetail.tsx`:** 신규 Client Component (수정/삭제 인터랙션)
**`src/lib/api-client.ts`:** `scheduleApi`, `notificationApi` CRUD 헬퍼

---

### Commit 7: 앱 내부 알림 UI (TDD)

**`src/components/notification/NotificationBell.tsx`:** Client Component
- 벨 아이콘 + 미읽음 배지 (초기값: Server에서 prop으로 전달)
- 클릭 시 `notificationApi.list()` 호출 후 패널 표시

**`src/components/notification/NotificationPanel.tsx`:** Client Component
- 알림 목록 드롭다운
- 클릭 시 읽음 처리 + 해당 일정 상세 페이지 이동

---

### Commit 8: 정리 및 최종 검증

- `src/lib/mock-data.ts` 삭제
- `next.config.ts`: `serverExternalPackages`, `turbopackUseSystemTlsCerts` 추가
- `src/app/layout.tsx`: Google Fonts → 시스템 폰트 (TLS 이슈 대응)
- `src/app/not-found.tsx`, `src/app/global-error.tsx`: 커스텀 에러 페이지 추가

---

## 파일 목록

### 신규 파일
| 파일 | 커밋 |
|------|------|
| `src/lib/db.ts` | 1 |
| `prisma/seed.ts` | 1 |
| `.env.local` | 1 |
| `src/lib/validations/schedule.ts` | 2 |
| `src/lib/validations/__tests__/schedule.test.ts` | 2 |
| `src/app/api/schedules/route.ts` | 3 |
| `src/app/api/schedules/[id]/route.ts` | 3 |
| `src/app/api/schedules/__tests__/route.test.ts` | 3 |
| `src/app/api/notifications/route.ts` | 3 |
| `src/app/api/notifications/[id]/read/route.ts` | 3 |
| `src/lib/encouragements.ts` | 4 |
| `src/lib/__tests__/encouragements.test.ts` | 4 |
| `src/lib/ai-encouragement.ts` | 4 |
| `src/lib/__tests__/ai-encouragement.test.ts` | 4 |
| `src/lib/channels/teams.ts` | 5 |
| `src/lib/channels/__tests__/teams.test.ts` | 5 |
| `src/lib/scheduler.ts` | 5 |
| `src/lib/__tests__/scheduler.test.ts` | 5 |
| `src/instrumentation.ts` | 5 |
| `src/lib/api-client.ts` | 6 |
| `src/components/schedule/ScheduleDetail.tsx` | 6 |
| `src/components/notification/NotificationBell.tsx` | 7 |
| `src/components/notification/NotificationPanel.tsx` | 7 |
| `src/components/notification/__tests__/NotificationBell.test.tsx` | 7 |
| `src/app/not-found.tsx` | 8 |
| `src/app/global-error.tsx` | 8 |

### 수정 파일
| 파일 | 커밋 | 변경 내용 |
|------|------|-----------|
| `prisma/schema.prisma` | 1 | Schedule + Notification 모델 추가 |
| `prisma.config.ts` | 1 | seed 명령 등록 |
| `package.json` | 1 | tsx devDep, better-sqlite3 어댑터 |
| `src/app/page.tsx` | 6, 7 | Prisma 직접 조회 + NotificationBell |
| `src/app/schedules/new/page.tsx` | 6 | API 호출로 교체 |
| `src/app/schedules/[id]/page.tsx` | 6 | Server/Client 분리, params await |
| `src/app/layout.tsx` | 8 | Google Fonts 제거 |
| `next.config.ts` | 8 | serverExternalPackages 추가 |

### 삭제 파일
| 파일 | 커밋 |
|------|------|
| `src/lib/mock-data.ts` | 8 |

---

## 검증 결과

```
Test Files  12 passed (12)
Tests       53 passed (53)
```

### 미해결 사항
- `npm run build` — Next.js 16 내부 `workUnitAsyncStorage` 버그로 `/_not-found` prerendering 실패 (개발 서버는 정상 동작)
