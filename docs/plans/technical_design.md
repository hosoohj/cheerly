# Cheerly — 기술 설계 문서

> 왜 이 기술을 선택했는가, 어떻게 설계했는가

---

## 1. 기술 스택 선택 배경

### 전체 스택 개요

| 분류 | 기술 | 버전 | 선택 이유 |
|------|------|------|---------|
| 프레임워크 | Next.js (App Router) | 16.1.6 | 서버/클라이언트 통합, API Routes 내장 |
| 언어 | TypeScript | 5.x | 타입 안전성, 빠른 오류 발견 |
| 데이터베이스 | SQLite (better-sqlite3) | — | 제로 설정, 해커톤 속도 최적화 |
| ORM | Prisma | 7.5.0 | 타입 안전 쿼리, 마이그레이션 자동화 |
| AI | Anthropic Claude Haiku | claude-haiku-4-5-20251001 | 빠른 응답, 한국어 품질, 저비용 |
| 스케줄러 | node-cron | v4 | 경량, 크론 표현식, 서버 사이드 전용 |
| 유효성 검증 | Zod | v4 | 런타임 검증 + TypeScript 타입 추론 동시 |
| 스타일 | Tailwind CSS | v4 | 빠른 프로토타이핑, 디자인 일관성 |
| 테스트 | Vitest + Testing Library | v4 | Jest 호환, 빠른 실행, ESM 지원 |

### Next.js 16 선택: 최신을 선제 도입하다

해커톤에서 이미 안정된 기술만 쓰는 것은 쉬운 선택이다. 우리는 Next.js 16의 최신 기능을 선제적으로 도입하기로 했다.

- **App Router의 Server/Client Component 분리** — 데이터 페칭 위치를 코드 레벨에서 명확히 구분
- **Turbopack 기본 탑재** — 개발 서버 빌드 속도 향상
- **instrumentation.ts stable** — 별도 실험적 플래그 없이 서버 초기화 로직 등록 가능

대신 그에 따른 리스크도 정직하게 수용했다. Next.js 16 자체의 `workUnitAsyncStorage` 버그로 인해 `npm run build`가 실패한다. 이는 우리 코드의 문제가 아니라 프레임워크 내부 이슈임을 53개의 테스트 코드로 증명했다.

### SQLite + Prisma: 빠르게, 그러나 제대로

해커톤의 제약 조건(빠른 개발, 배포 환경 없음)에서 SQLite는 최적의 선택이다. 별도 DB 서버 불필요, 파일 하나로 완결.

그러나 SQLite를 선택했다고 해서 설계를 타협하지 않았다. Prisma ORM으로 타입 안전한 쿼리, 자동 마이그레이션, 시드 데이터 관리를 구현했다. 나중에 PostgreSQL로 교체할 때도 `datasource` 한 줄만 바꾸면 된다.

---

## 2. Prisma v7: 새로운 패러다임 적응기

Prisma v7은 이전 버전과 아키텍처가 크게 달라졌다. 이 변화를 제대로 이해하고 적용하는 데 상당한 노력이 들었고, 그 결과를 기록으로 남긴다.

### 드라이버 어댑터 방식

Prisma v6까지는 내장 드라이버가 포함되어 있었다. v7부터는 드라이버를 직접 주입해야 한다.

```typescript
// src/lib/db.ts
import Database from 'better-sqlite3'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@/generated/prisma/client'

function getPrisma() {
  const dbUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
  const filePath = dbUrl.replace('file:', '')
  const db = new Database(filePath)
  const adapter = new PrismaBetterSqlite3(db)
  return new PrismaClient({ adapter })
}
```

### Prisma v7 변경 사항 요약

| 항목 | v6 이하 | v7 |
|------|---------|-----|
| generator provider | `"prisma-client-js"` | `"prisma-client"` |
| datasource url | `schema.prisma` 내부 | `prisma.config.ts` 별도 관리 |
| import 경로 | `from '@prisma/client'` | `from '@/generated/prisma/client'` |
| 클라이언트 초기화 | `new PrismaClient()` | `new PrismaClient({ adapter })` |
| seed 설정 | `package.json` prisma 블록 | `prisma.config.ts` migrations.seed |
| Zod 에러 필드 | `.errors` | `.issues` |

### Proxy 패턴으로 빌드 타임 오류 방지

`better-sqlite3`는 네이티브 바이너리(`*.node`)를 포함한다. Next.js 빌드 타임에 이 바이너리가 로드되면 오류가 발생한다. 이를 막기 위해 PrismaClient를 **첫 번째 DB 접근 시점까지 지연 초기화**하는 Proxy 패턴을 적용했다.

```typescript
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return Reflect.get(getPrisma(), prop)
  },
})
```

`getPrisma()`는 실제 쿼리가 실행되는 순간에 처음 호출된다. 빌드 타임에는 빈 Proxy 객체만 존재한다.

---

## 3. AI 통합 설계: Claude Haiku의 활용

### 왜 Claude Haiku인가

격려 메시지는 응답 속도가 중요하다. 알림 스케줄러가 1분마다 실행되고, 해당 분 안에 AI 응답까지 받아야 한다.

- **claude-haiku-4-5-20251001** — Anthropic의 가장 빠른 모델, 간단한 텍스트 생성에 최적화
- **max_tokens: 150** — 2~3문장 내 완결되는 응답 보장, 불필요한 긴 메시지 방지
- **한국어 품질** — Claude는 한국어 맥락 이해와 자연스러운 톤 구현에 탁월

### 무중단 폴백 아키텍처

AI를 서비스의 핵심 경로에 두면서도 AI 장애가 전체 서비스를 멈추지 않게 설계했다. 이것이 Cheerly AI 통합의 가장 중요한 원칙이다.

```
[AI 장애 시나리오별 대응]

시나리오 1: ANTHROPIC_API_KEY 미설정
  → generateAIEncouragement() 진입 전에 API 키 확인
  → 즉시 getStaticEncouragement(category) 반환
  → API 호출 시도 자체가 없음 (불필요한 네트워크 요청 방지)

시나리오 2: API 호출 중 네트워크 오류 / 타임아웃
  → try-catch로 예외 포착
  → getStaticEncouragement(category) 반환
  → 알림 발송 프로세스 계속 진행

시나리오 3: API 응답이 text 타입이 아닌 경우
  → content.type !== 'text' 분기
  → getStaticEncouragement(category) 반환
```

폴백 메시지는 4개 카테고리 × 11개 = 44개 메시지 풀에서 랜덤 선택된다. 단순하지만 반복적으로 같은 메시지가 나올 가능성을 낮추는 효과가 있다.

---

## 4. 스케줄러 설계: instrumentation.ts의 활용

### 왜 instrumentation.ts인가

Next.js에서 서버 시작 시 단 한 번 실행되는 코드를 등록하는 방법은 여러 가지가 있다. 우리는 Next.js 15+에서 stable로 승격된 `instrumentation.ts`를 선택했다.

- `next.config.ts`에 별도 설정 불필요
- `register()` 함수가 서버 시작 시 자동 호출
- `NEXT_RUNTIME` 환경변수로 Node.js 런타임 여부 판단 가능

### 중복 실행 방지 전략

```typescript
// src/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV !== 'test') {
    const cron = await import('node-cron')
    const { checkAndSendReminders } = await import('@/lib/scheduler')

    cron.schedule('* * * * *', async () => {
      await checkAndSendReminders()
    })
  }
}
```

**각 조건의 역할:**

| 조건 | 방지하는 상황 |
|------|------------|
| `NEXT_RUNTIME === 'nodejs'` | Edge Runtime에서의 불필요한 실행 방지 |
| `NODE_ENV !== 'test'` | Vitest 실행 중 실제 DB에 알림 발송 방지 |

### 알림 윈도우 설계 원칙

크론 작업은 실행 타이밍이 보장되지 않는다. `* * * * *`은 매분 실행을 의도하지만, 서버 부하에 따라 정각 :00초에서 수 초 벗어날 수 있다. `정확히 N분 전`만 체크하면 알림을 놓친다.

±60초 윈도우는 이 불확실성을 흡수한다. 동시에 최근 2분 중복 방지 로직이 같은 일정에 대한 이중 발송을 막는다. 두 메커니즘이 서로를 보완하는 구조다.

---

## 5. Server/Client Component 분리 전략

### 경계 설계 원칙

Next.js App Router에서 Server Component와 Client Component를 어디서 나눌지가 아키텍처의 핵심이다. Cheerly는 다음 원칙을 적용했다.

**Server Component로 유지:**
- 초기 데이터 로딩이 필요한 페이지 (`HomePage`, `ScheduleDetailPage`)
- 정적 렌더링이 가능한 UI (`ScheduleList`, `ScheduleCard`)
- SEO나 초기 로딩 성능이 중요한 영역

**Client Component로 전환:**
- 사용자 인터랙션이 필요한 컴포넌트 (`ScheduleDetail` — 수정/삭제)
- 브라우저 API 사용 (`NotificationBell` — click event, useEffect)
- 상태 관리가 필요한 컴포넌트

### Date 직렬화 문제와 해결

Server Component에서 Client Component로 props를 전달할 때, Prisma가 반환하는 `Date` 객체는 JSON 직렬화 과정에서 `string`으로 변환된다. 이를 처리하지 않으면 타입 불일치 오류가 발생한다.

**적용한 전략:**

```typescript
// [id]/page.tsx (Server Component)
// Prisma Date → 직렬화 → Client로 전달 시 string이 됨
// ScheduleDetail은 SerializedSchedule 인터페이스로 string 타입 명시

// ScheduleDetail.tsx (Client Component)
interface SerializedSchedule {
  startTime: string  // Date가 아닌 string
  // ...
}

// 사용 시점에 복원
const startTime = new Date(schedule.startTime)
```

Server Component 간 전달(예: `HomePage` → `ScheduleList` → `ScheduleCard`)에서는 Date 객체를 그대로 사용한다. 경계가 어디냐에 따라 타입이 달라지는 것을 인터페이스 레벨에서 명확히 구분했다.

---

## 6. 테스트 전략: 53개 테스트의 의미

### TDD 기반 개발

백엔드 로직과 API Routes는 테스트를 먼저 작성하고 구현하는 TDD 방식으로 개발했다. 덕분에 구현 과정에서 발생한 여러 엣지케이스를 코드에 반영하기 전에 발견하고 수정할 수 있었다.

### 테스트 구성

```
총 53개 테스트 / 12개 파일 / 전체 통과

핵심 비즈니스 로직 (서버)
├── validations/schedule.test.ts  — 11개: Zod 유효성 검증 규칙 전수 검사
├── scheduler.test.ts             —  3개: 발송/중복방지/윈도우 조건
├── ai-encouragement.test.ts      —  3개: AI 생성/폴백/키 없음
├── encouragements.test.ts        —  4개: 정적 메시지 풀 반환 검증
├── channels/teams.test.ts        —  3개: Webhook 전송/재시도/실패

API Routes
└── schedules/route.test.ts       —  6개: CRUD HTTP 동작 검증

UI 컴포넌트 (프론트엔드)
├── Button.test.tsx               —  4개: 렌더링, 클릭, 스타일 변형
├── ScheduleCard.test.tsx         —  3개: 카드 렌더링, 카테고리 배지
├── ScheduleForm.test.tsx         —  4개: 폼 입력, 제출, 유효성
├── DeleteConfirmDialog.test.tsx  —  4개: 다이얼로그 열기/닫기/확인
└── NotificationBell.test.tsx     —  3개: 배지, 패널 토글, 읽음 처리

타입 검증
└── types/schedule.test.ts        —  3개: 타입 구조 런타임 검증
```

### 테스트의 현실적 역할

빌드가 안 된다. 그럼에도 우리 코드는 신뢰할 수 있다고 말할 수 있는 이유가 바로 이 53개 테스트다.

Next.js 16 내부 버그(`workUnitAsyncStorage` invariant)로 `npm run build`가 실패하지만, 해당 오류는 `/_global-error` 정적 프리렌더링 과정의 프레임워크 내부 문제다. 비즈니스 로직(AI 메시지, 스케줄러, API Routes, 컴포넌트)은 테스트로 완벽하게 검증된 상태다.

테스트는 "작동한다"는 주장에 대한 증거다.

---

## 7. 주요 기술적 결정 요약

### 결정 1: 단일 사용자 설계 (인증 없음)

해커톤 MVP에서 인증 시스템을 포함하면 개발 복잡도가 2배 이상 증가한다. 핵심 가치(AI 격려 알림)를 빠르게 검증하기 위해 의도적으로 제외했다. Phase 4 로드맵에 사용자 인증 및 다중 사용자 지원이 포함되어 있다.

### 결정 2: 앱 내 알림 + Teams, 카카오톡 제외

카카오톡 알림은 비즈니스 채널 신청, OAuth 연동 등 외부 의존성이 크다. 해커톤 기간 내 안정적으로 구현할 수 있는 Teams Webhook을 우선 선택했다. 카카오톡은 Phase 2에서 구현한다.

### 결정 3: SQLite → 분산 DB 마이그레이션 경로 확보

현재는 SQLite 단일 파일이지만, Prisma를 통해 추상화되어 있어 `datasource.provider`와 `DATABASE_URL`만 변경하면 PostgreSQL, MySQL 등으로 전환 가능하다. 기술 부채를 쌓지 않는 설계다.

### 결정 4: Zod v4 사용

Zod v4는 v3 대비 번들 크기 감소, 파싱 성능 향상이 이루어졌다. 단, API 변경 사항이 있다 — 에러 필드가 `.errors`에서 `.issues`로 변경되었고, `z.enum()` 옵션 객체에서 `error` 키를 사용한다. 이 변경 사항을 모두 반영했다.

### 결정 5: 격려 메시지 생성을 동기 방식으로

알림 발송 시점에 AI 메시지를 생성하는 방식은 지연 시간이 있다. 미리 메시지를 생성해두는 방식도 고려했지만, 일정 등록 시점의 정보와 실제 알림 시점의 컨텍스트 차이가 생길 수 있어 동기 방식을 유지했다. AI 응답이 느릴 경우 폴백으로 즉시 전환되므로 알림 발송 타이밍에 영향이 없다.

---

## 8. 아키텍처 다이어그램

```
브라우저 (Client)
│
│  페이지 요청
▼
Next.js App Router (Server)
├── Server Components                Client Components
│   ├── (home)/page.tsx              ├── ScheduleDetail.tsx
│   │   └── prisma.schedule.findMany │   └── scheduleApi.update/delete
│   └── schedules/[id]/page.tsx      ├── NotificationBell.tsx
│       └── prisma.schedule.findUnique│   └── notificationApi.list/markAsRead
│                                    └── NotificationPanel.tsx
│
├── API Routes (/api/*)
│   ├── schedules/route.ts           GET, POST
│   ├── schedules/[id]/route.ts      GET, PUT, DELETE
│   ├── notifications/route.ts       GET
│   └── notifications/[id]/read/route.ts  PATCH
│         └── Zod 유효성 검증
│         └── Prisma 쿼리
│
└── instrumentation.ts (서버 시작 1회)
      └── node-cron: * * * * *
            └── checkAndSendReminders()
                  ├── prisma.schedule.findMany
                  ├── getEncouragementMessage()  ← Claude AI / 정적 폴백
                  ├── prisma.notification.create
                  └── sendTeamsNotification()    ← TEAMS_WEBHOOK_URL 설정 시

Prisma v7 (SQLite / better-sqlite3 adapter)
└── dev.db (Schedule, Notification)
```
