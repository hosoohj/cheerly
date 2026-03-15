# Cheerly — 기술 스택 상세 명세

> 채택 이유, 버전, 의존성 전략, 확장 설계까지 기록

---

## 1. Runtime & Framework

### Next.js 16.1.6 (App Router)

| 항목 | 내용 |
|------|------|
| 역할 | 풀스택 프레임워크 — 프론트엔드 렌더링 + API Routes + instrumentation |
| 선택 이유 | Server Component로 Prisma 직접 호출 가능, API Routes로 별도 백엔드 서버 불필요, `instrumentation.ts`로 서버 시작 시 스케줄러 1회 초기화 |
| 주요 활용 기능 | App Router, Server/Client Component, Route Handlers, `instrumentation.ts` |
| 알려진 이슈 | `workUnitAsyncStorage` 버그로 `npm run build` 실패 (개발 서버는 정상). 프레임워크 픽스 대기 중 |

### React 19.2.3

| 항목 | 내용 |
|------|------|
| 역할 | UI 컴포넌트 렌더링 |
| 선택 이유 | Next.js 16 기본 peer dependency, Server Component 모델 지원 |
| Client Component 사용 기준 | 상태(`useState`), 이벤트 핸들러, `useRouter` 가 필요한 경우만 `'use client'` 선언 |

### TypeScript 5

| 항목 | 내용 |
|------|------|
| 역할 | 타입 안전성 |
| 설정 | `strict: true`, `paths` alias (`@/` → `src/`) |
| 핵심 인터페이스 | `Schedule`, `ScheduleFormData`, `Notification`, `SerializedSchedule`, `NotificationChannel` |

---

## 2. Backend

### Prisma v7.5.0 (ORM)

| 항목 | 내용 |
|------|------|
| 역할 | 데이터베이스 접근 추상화 |
| 특이사항 | v7부터 **드라이버 어댑터 방식** 필수. `prisma-client-js` → `prisma-client`. import 경로: `@/generated/prisma/client` |
| 어댑터 | `@prisma/adapter-better-sqlite3` + `better-sqlite3` |
| 초기화 방식 | Proxy 패턴 lazy initialization — 빌드 시 DB 연결 방지 (`src/lib/db.ts`) |
| 스키마 위치 | `prisma/schema.prisma` |
| 마이그레이션 | `prisma/migrations/` (자동 생성) |
| 시드 | `prisma/seed.ts` — `tsx`로 실행 |
| DB 전환 전략 | `datasource` provider + adapter만 교체하면 PostgreSQL로 이전 가능 |

**인덱스 설계:**
```prisma
model Schedule {
  @@index([startTime])          // 스케줄러 쿼리: startTime > now
}
model Notification {
  @@index([sentAt])             // 최근 알림 조회
  @@index([scheduleId, sentAt]) // 중복 방지 서브쿼리
}
```

### SQLite (개발/MVP)

| 항목 | 내용 |
|------|------|
| 역할 | 파일 기반 데이터베이스 |
| 선택 이유 | 설치 없이 로컬 개발, zero config |
| 전환 시점 | 다중 사용자 도입(Phase 4) 시 PostgreSQL로 마이그레이션 |
| 파일 위치 | `dev.db` (루트, `.gitignore`에 포함) |

### Zod v4.3.6 (유효성 검증)

| 항목 | 내용 |
|------|------|
| 역할 | API 입력 서버 사이드 검증 + TypeScript 타입 추론 |
| v4 변경사항 | `.errors` → `.issues`, `z.enum` 옵션 키 `message` → `error` |
| 스키마 위치 | `src/lib/validations/schedule.ts` |
| 패턴 | `safeParse()` → `.success` 분기 → `.error.issues` 반환 |
| 선택 이유 | 런타임 검증과 TypeScript 타입을 단일 스키마로 관리 (`z.infer<typeof schema>`) |

### node-cron v4.2.1 (스케줄러)

| 항목 | 내용 |
|------|------|
| 역할 | 매분 `checkAndSendReminders()` 실행 |
| 표현식 | `* * * * *` (매분 0초) |
| 초기화 위치 | `src/instrumentation.ts` — `NEXT_RUNTIME === 'nodejs'` 가드 |
| 중복 방지 | `NODE_ENV !== 'test'` 가드로 테스트 환경에서 미실행 |
| 알림 윈도우 | `diffMs >= 0` (도달) AND `diffMs/1000 <= 60` (60초 이내) |
| 중복 발송 방지 | 최근 2분 내 기존 `Notification` 레코드 존재 시 스킵 |
| 전환 시점 | Vercel 서버리스 환경에서는 `instrumentation.ts` 동작 미보장 → BullMQ / AWS SQS 전환 검토 |

### @anthropic-ai/sdk v0.78.0 (AI)

| 항목 | 내용 |
|------|------|
| 역할 | Claude AI 격려 메시지 생성 |
| 기본 모델 | `claude-haiku-4-5-20251001` (환경변수 `ANTHROPIC_MODEL`로 오버라이드 가능) |
| 파라미터 | `max_tokens: 150`, 한국어 2~3문장 |
| 폴백 전략 | `ANTHROPIC_API_KEY` 미설정 → 즉시 정적 메시지 / API 오류 → catch에서 정적 메시지 |
| 정적 메시지 | 카테고리별 11개 × 4 = 44개 (`src/lib/encouragements.ts`) |

---

## 3. Frontend

### Tailwind CSS v4

| 항목 | 내용 |
|------|------|
| 역할 | 유틸리티 기반 스타일링 |
| v4 변경사항 | `tailwind.config.js` 불필요, `globals.css`에 `@import "tailwindcss"` 한 줄로 설정 |
| PostCSS 통합 | `@tailwindcss/postcss` |
| 반응형 | `sm:` prefix 사용 (모바일 퍼스트) |

### Server/Client Component 분리 전략

```
Server Component (기본)              Client Component ('use client')
─────────────────────────────────   ─────────────────────────────────
src/app/page.tsx                     src/app/schedules/new/page.tsx
src/app/schedules/[id]/page.tsx      src/components/schedule/ScheduleDetail.tsx
src/components/schedule/             src/components/schedule/ScheduleForm.tsx
  ScheduleCard.tsx                   src/components/schedule/
  ScheduleList.tsx                     DeleteConfirmDialog.tsx
  EmptyState.tsx                     src/components/notification/
src/components/layout/                 NotificationBell.tsx
  Header.tsx                           NotificationPanel.tsx
  Container.tsx
```

**Date 직렬화 경계:**
- Server → Client 전달 시 `Date` → `string` (`toISOString()`) 변환 필수
- `SerializedSchedule` 인터페이스로 경계 명시 (`src/components/schedule/ScheduleDetail.tsx`)

### 알림 채널 확장 설계 (Strategy Pattern)

```
NotificationChannel (interface)
├── name: string
├── isEnabled(): boolean
└── send(payload): Promise<boolean>
         │
         ├── TeamsChannel        ← 구현됨 (Phase 1)
         ├── KakaoChannel        ← Phase 2 예정
         ├── SlackChannel        ← Phase 2 예정
         └── EmailChannel        ← Phase 3 예정
```

**새 채널 추가 방법:**
1. `src/lib/channels/kakao.ts` 생성 — `NotificationChannel` 구현
2. `src/lib/channels/index.ts`의 `getNotificationChannels()` 배열에 추가
3. **scheduler.ts 수정 불필요** — 레지스트리가 자동으로 신규 채널 포함

---

## 4. 공유 상수 (단일 소스 원칙)

```
src/lib/constants.ts
├── SCHEDULE_CATEGORIES     ← 카테고리 배열 (validations, scheduler에서 사용)
└── CATEGORY_LABELS         ← 한국어 레이블 (ai-encouragement에서 사용)

src/types/schedule.ts
└── ScheduleCategory        ← union 타입 ('WORK' | 'STUDY' | 'PERSONAL' | 'FAMILY')
```

**새 카테고리 추가 시 수정 파일:**
1. `src/types/schedule.ts` — union 타입에 추가
2. `src/lib/constants.ts` — 배열과 레이블에 추가
3. `src/lib/encouragements.ts` — 정적 메시지 추가
4. `src/components/ui/Badge.tsx` — 컬러 스타일 추가
5. `prisma/schema.prisma` — 스키마 `@default` 값 검토

---

## 5. 테스트

### Vitest v4.1.0

| 항목 | 내용 |
|------|------|
| 역할 | 단위 테스트 실행기 |
| 선택 이유 | Next.js + ESM 환경에서 Jest 대비 설정 단순, 빠른 실행 |
| 설정 | `vitest.config.ts` — `@vitejs/plugin-react`, `jsdom` 환경, `@testing-library/jest-dom` |

### @testing-library

| 패키지 | 버전 | 역할 |
|--------|------|------|
| `@testing-library/react` | 16.3.2 | React 컴포넌트 테스트 |
| `@testing-library/user-event` | 14.6.1 | 사용자 인터랙션 시뮬레이션 |
| `@testing-library/jest-dom` | 6.9.1 | DOM 매처 (`toBeInTheDocument` 등) |

**테스트 현황 (54개):**

| 파일 | 수 | 내용 |
|------|----|------|
| `validations/schedule.test.ts` | 11 | Zod 유효성 검증 전수 |
| `schedules/route.test.ts` | 6 | API CRUD |
| `encouragements.test.ts` | 4 | 정적 메시지 |
| `ai-encouragement.test.ts` | 3 | AI 생성 + 폴백 |
| `channels/teams.test.ts` | 3 | Webhook 전송/재시도 |
| `scheduler.test.ts` | 4 | 발송/중복방지/미도달/미래일정 |
| `Button.test.tsx` | 4 | UI 렌더링/스타일 |
| `ScheduleCard.test.tsx` | 3 | 카드 렌더링 |
| `ScheduleForm.test.tsx` | 4 | 폼 입력/제출 |
| `DeleteConfirmDialog.test.tsx` | 4 | 다이얼로그 흐름 |
| `NotificationBell.test.tsx` | 3 | 배지/패널/읽음 |
| `types/schedule.test.ts` | 5 | 타입 구조 검증 |

---

## 6. 의존성 전략

### Production Dependencies (9개)

| 패키지 | 버전 | 분류 | 제거 가능 여부 |
|--------|------|------|----------------|
| `next` | ^16.1.6 | 핵심 | 불가 |
| `react` | 19.2.3 | 핵심 | 불가 |
| `react-dom` | 19.2.3 | 핵심 | 불가 |
| `prisma` | ^7.5.0 | DB ORM | 불가 |
| `@prisma/client` | ^7.5.0 | DB 클라이언트 | 불가 |
| `@prisma/adapter-better-sqlite3` | ^7.5.0 | DB 어댑터 | PostgreSQL 전환 시 교체 |
| `better-sqlite3` | ^12.8.0 | DB 드라이버 | PostgreSQL 전환 시 교체 |
| `@anthropic-ai/sdk` | ^0.78.0 | AI | 선택적 (폴백 존재) |
| `node-cron` | ^4.2.1 | 스케줄러 | 서버리스 배포 시 교체 |
| `zod` | ^4.3.6 | 유효성 검증 | 불가 |

### Dev Dependencies (13개)

| 패키지 | 역할 | 비고 |
|--------|------|------|
| `typescript` | 타입 시스템 | 불가 |
| `tailwindcss` | 스타일링 | 불가 |
| `@tailwindcss/postcss` | Tailwind v4 통합 | 불가 |
| `eslint` | 코드 품질 | 불가 |
| `eslint-config-next` | Next.js ESLint 규칙 | 불가 |
| `vitest` | 테스트 실행기 | 불가 |
| `@vitejs/plugin-react` | Vitest React 지원 | 불가 |
| `jsdom` | 브라우저 환경 시뮬레이션 | 불가 |
| `@testing-library/react` | 컴포넌트 테스트 | 불가 |
| `@testing-library/user-event` | 인터랙션 시뮬레이션 | 불가 |
| `@testing-library/jest-dom` | DOM 매처 | 불가 |
| `tsx` | TypeScript 직접 실행 (seed) | 불가 |
| `@types/*` | TypeScript 타입 정의 | 불가 |

> `ts-node`는 `tsx`로 대체되어 v0.2.0에서 제거됨.

### 의존성 최소화 원칙
- **차트 라이브러리 없음**: 현재 통계 기능 없음 → Phase 3에서 Recharts 도입 예정
- **상태관리 라이브러리 없음**: `useState` + Server Component 조합으로 충분
- **HTTP 클라이언트 없음**: 브라우저 내장 `fetch` 사용 (axios 불필요)
- **날짜 라이브러리 없음**: `Intl.DateTimeFormat`, `Date` 내장 API로 충분
- **아이콘 라이브러리 없음**: SVG 인라인 (번들 크기 최소화)
- **폼 라이브러리 없음**: `useState` 기반 커스텀 폼 (react-hook-form 불필요)

---

## 7. 환경변수

| 변수 | 필수 여부 | 설명 | 기본값 |
|------|----------|------|--------|
| `DATABASE_URL` | 선택 | SQLite 파일 경로 | `file:./dev.db` |
| `ANTHROPIC_API_KEY` | 선택 | Claude AI API 키 (미설정 시 정적 메시지 폴백) | — |
| `ANTHROPIC_MODEL` | 선택 | 사용할 Claude 모델 | `claude-haiku-4-5-20251001` |
| `TEAMS_WEBHOOK_URL` | 선택 | Microsoft Teams Webhook URL (미설정 시 스킵) | — |

---

## 8. 기술 진화 계획

| 항목 | 현재 (Phase 1) | 전환 조건 | 목표 |
|------|---------------|----------|------|
| DB | SQLite | 다중 사용자 도입 | PostgreSQL |
| 스케줄러 | node-cron + instrumentation.ts | Vercel 서버리스 배포 | BullMQ / AWS SQS |
| AI 모델 | Claude Haiku | 메시지 품질 고도화 | Claude Sonnet (env 변수만 변경) |
| 알림 채널 | Teams | Phase 2 | KakaoTalk, Slack (채널 클래스 추가만 필요) |
| 인증 | 없음 (단일 사용자) | Phase 4 | OAuth (Google, GitHub) |
| 차트 | 없음 | Phase 3 통계 기능 | Recharts |
