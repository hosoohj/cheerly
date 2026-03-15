# Cheerly — 개발 로그

> 버전별 완료 항목, 버그 수정, 기술 결정사항 기록 (오래된 버전 → 최신 버전 순)

---

## v0.1.0 — Sprint 1: 프론트엔드 UI (2026-03-15)

**목 데이터 기반 전체 화면 UI 완성.** 실제 API 없이 사용자 리뷰가 가능한 프론트엔드를 구축하였다.

### 완료 항목

- Next.js 16.1.6 + TypeScript + Tailwind CSS v4 + Vitest 프로젝트 초기화
- `Schedule` / `Notification` / `ScheduleCategory` 타입 정의
- 공통 UI 컴포넌트: `Button`, `Input`, `Badge`
- 공통 레이아웃: `Header`, `Container`
- 일정 목록 페이지 (`/`): `ScheduleCard`, `ScheduleList`, `EmptyState`
- 일정 등록 페이지 (`/schedules/new`): `ScheduleForm` (5개 필드, 유효성 검사)
- 일정 상세/수정/삭제 페이지 (`/schedules/[id]`): `DeleteConfirmDialog`
- UI 컴포넌트 테스트 착수 (Button, ScheduleCard, ScheduleForm, DeleteConfirmDialog)

### 기술 결정사항

- **프론트엔드 퍼스트 전략**: 목 데이터로 UI를 먼저 완성하고 사용자 리뷰 후 백엔드 연결. 초기 방향 수정 비용 최소화.
- **Next.js 16.1.6 선택**: App Router의 Server/Client Component 분리가 Prisma 직접 호출 및 Date 직렬화 전략에 유리.
- **Tailwind CSS v4**: CSS-first 설정 방식, `@import "tailwindcss"` 단일 라인으로 설정. v3 대비 설정 파일 불필요.
- **Vitest 선택**: Jest 대비 Next.js + ESM 환경에서 설정이 단순하고 속도가 빠름.

---

### 커밋 상세

#### `98b9196` — 프로젝트 초기화 (2026-03-15 16:48)

- `npx create-next-app@latest` 기반. Next.js 16.1.6, TypeScript, Tailwind CSS v4, ESLint.
- `vitest.config.ts`: `@vitejs/plugin-react`, `jsdom` 환경, `@testing-library/jest-dom` setup.
- `.prettierrc`: 탭 너비 2, 세미콜론 없음, 싱글 쿼트.
- `src/app/layout.tsx`: 기본 메타데이터 + 전역 CSS.

#### `ed4ef7c` — 타입 정의 및 목 데이터 (2026-03-15 16:51)

- `src/types/schedule.ts`: `ScheduleCategory` enum(WORK/STUDY/PERSONAL/FAMILY), `Schedule` 인터페이스(6개 필드).
- `src/types/notification.ts`: `Notification` 인터페이스(scheduleId 참조 포함).
- `src/lib/mock-data.ts`: 테스트용 일정 3개, 알림 2개.
- `src/types/__tests__/schedule.test.ts`: 3개 타입 구조 검증 테스트.

#### `56e10ee` — 공통 UI 컴포넌트 + 레이아웃 (2026-03-15 16:55)

- `src/components/ui/Button.tsx`: variant(primary/secondary/danger), size(sm/md/lg), disabled/loading 상태. Tailwind 조건부 클래스.
- `src/components/ui/Input.tsx`: label, error 메시지, `forwardRef` 지원.
- `src/components/ui/Badge.tsx`: 카테고리별 4가지 컬러 (WORK: 파랑, STUDY: 보라, PERSONAL: 초록, FAMILY: 주황).
- `src/components/layout/Header.tsx`: 로고 + 일정 등록 버튼 링크.
- `src/components/layout/Container.tsx`: 반응형 최대 너비 컨테이너.
- `__tests__/Button.test.tsx`: 4개 테스트 — 렌더링, variant 스타일, disabled.

#### `0aca7ff` — 일정 목록 페이지 UI (2026-03-15 16:58)

- `src/components/schedule/ScheduleCard.tsx`: 카테고리 배지, `Intl.DateTimeFormat('ko-KR')` 날짜 포맷, 상세 페이지 링크.
- `src/components/schedule/ScheduleList.tsx`: 일정 배열 → ScheduleCard 목록 렌더링.
- `src/components/schedule/EmptyState.tsx`: 일정 없음 안내 + 등록 페이지 링크.
- `src/app/page.tsx`: 목 데이터로 ScheduleList 렌더링. 기존 기본 페이지 코드 제거.
- `__tests__/ScheduleCard.test.tsx`: 3개 테스트 — 제목/시간/카테고리 렌더링.

#### `e8b41d6` — 일정 등록 페이지 UI (2026-03-15 17:01)

- `src/components/schedule/ScheduleForm.tsx`: 제목(필수), 설명(선택), 시작 시간(datetime-local), 알림 시간(number, 기본값 10), 카테고리(select). 클라이언트 사이드 필수 필드 검증. 성공 시 축하 화면(`🎉`) 전환.
- `src/app/schedules/new/page.tsx`: `ScheduleForm` 마운트, `setTimeout` 목 submit 핸들러.
- `__tests__/ScheduleForm.test.tsx`: 4개 테스트 — 렌더링, 입력, 빈 제목 제출 차단, 정상 제출.

#### `25fbf9e` — 일정 상세/수정/삭제 UI (2026-03-15 17:04)

- `src/components/schedule/DeleteConfirmDialog.tsx`: 일정 제목 표시 모달. 확인/취소 버튼. `isDeleting` 상태로 중복 클릭 방지.
- `src/app/schedules/[id]/page.tsx`: 상세 보기(모든 필드 표시) + 수정 모드 인라인 전환(ScheduleForm 재사용) + 삭제 다이얼로그 트리거. 목 데이터에서 `id`로 일정 조회.
- `__tests__/DeleteConfirmDialog.test.tsx`: 4개 테스트 — 렌더링, 일정 제목 표시, 확인/취소 콜백.

#### `7dfe0f6` — Sprint 1 완료 정리 (2026-03-15 17:09)

- `src/components/schedule/ScheduleCard.tsx`: 날짜 포맷 오타 수정 (경미한 표시 버그).
- Sprint 1 완료 확인: `npm run dev` 정상 실행, ESLint/TypeScript 에러 0개.

---

## v0.2.0 — Sprint 2: 백엔드 + AI + 알림 시스템 (2026-03-15)

**Phase 1 MVP 완성.** 프론트엔드를 실제 백엔드와 연결하고, Claude AI 격려 메시지 + 자동 알림 스케줄러 + Teams Webhook을 구현하였다.

### 완료 항목

- Prisma v7 + SQLite DB 구성 (드라이버 어댑터 방식)
- RESTful API 전체 구현 (`/api/schedules`, `/api/notifications`)
- Zod v4 서버 사이드 유효성 검증
- Claude claude-haiku-4-5-20251001 AI 격려 메시지 + 44개 정적 폴백
- node-cron 알림 스케줄러 (매분 실행, ±60초 윈도우, 중복 방지)
- Microsoft Teams Adaptive Card v1.4 Webhook (3회 재시도)
- 앱 내부 알림 UI (벨 아이콘, 미읽음 배지, 드롭다운 패널, 읽음 처리)
- 프론트엔드-백엔드 연동 (목 데이터 → 실제 Prisma/API)
- **53개 단위 테스트 전체 통과 (12개 파일)**

### 버그 수정

| 버그 | 원인 | 수정 |
|------|------|------|
| Zod 에러 접근 실패 | v4에서 `.errors` → `.issues`로 변경 | `parsed.error.issues` 사용 |
| 빌드 시 PrismaClient 초기화 오류 | 빌드 단계에서 DB 연결 시도 | Proxy 패턴으로 lazy initialization 적용 (`db.ts`) |
| Google Fonts 로드 실패 | 사내 환경 TLS 이슈 | 시스템 폰트로 교체 (`layout.tsx`) |
| 스케줄러 Hot Reload 중복 등록 | `instrumentation.ts`가 HMR마다 재실행 | `NEXT_RUNTIME === 'nodejs'` + `NODE_ENV !== 'test'` 가드 추가 |
| `params.id` 타입 에러 | Next.js 15+에서 `params`가 `Promise` 타입 | `await params` 패턴으로 수정 |
| Date 직렬화 오류 | Server→Client Component 경계에서 Date 객체 전달 불가 | `SerializedSchedule` 인터페이스로 string 변환 처리 |

### 기술 결정사항

- **Prisma v7 드라이버 어댑터 방식 채택**: `prisma-client-js` 대신 `prisma-client` generator + `better-sqlite3` 어댑터. `@prisma/client`가 아닌 `@/generated/prisma`에서 import.
- **AI 폴백 아키텍처 선행 설계**: `ANTHROPIC_API_KEY` 미설정 시 즉시 정적 메시지 전환, API 오류 시 catch에서 폴백. AI 실패가 알림 발송을 막지 않음.
- **Server/Client Component 경계 명시적 분리**: `page.tsx`(Server)에서 Prisma 직접 호출, `ScheduleDetail.tsx`(Client)로 직렬화된 데이터 전달. Date 필드는 경계에서 string으로 변환.
- **instrumentation.ts 활용**: Next.js 16 stable 기능으로 별도 프로세스 없이 서버 시작 시 스케줄러 1회 초기화.
- **`prisma.config.ts` 방식의 seed 설정**: Prisma v7에서 `package.json`의 `"prisma": { "seed" }` 대신 `prisma.config.ts`에서 `seed` 명령 관리.

---

### 커밋 상세

#### `0a2df5b` — Prisma 스키마, SQLite 마이그레이션, seed, DB 싱글턴 (2026-03-15 18:13)

- `prisma/schema.prisma`: `Schedule` + `Notification` 모델 추가. `Notification.onDelete: Cascade` 설정으로 일정 삭제 시 알림 자동 삭제.
- `src/lib/db.ts`: PrismaClient 싱글턴. 개발 환경에서 Hot Reload 시 다중 인스턴스 생성 방지 (`global.__prisma` 캐시).
- `prisma/seed.ts`: 일정 4개 + 알림 1개 시드 데이터. `tsx`로 실행 (ESM 호환).
- `prisma.config.ts`: seed 실행 명령 등록 (`tsx prisma/seed.ts`).
- `prisma/migrations/20260315090733_init/migration.sql`: 초기 테이블 생성 마이그레이션.
- devDependency `tsx`, `better-sqlite3`, `@prisma/adapter-better-sqlite3` 추가.

#### `06bc078` — Zod v4 유효성 검증 스키마 (TDD) (2026-03-15 18:14)

- `src/lib/validations/schedule.ts`: `createScheduleSchema` (5개 필드, reminderMinutes 기본값 10, category enum), `updateScheduleSchema` (모든 필드 optional).
- `startTime`: `z.string().datetime()` — ISO 8601 형식 검증. 폼에서 `new Date(val).toISOString()` 변환 후 전달.
- `src/lib/validations/__tests__/schedule.test.ts`: 11개 테스트 — 정상 케이스, 필수 필드 누락, 범위 초과(reminderMinutes 1~1440), 잘못된 category 전수 검증.

#### `6ff9faf` — 일정 CRUD + 알림 API Routes (TDD) (2026-03-15 18:16)

- `src/app/api/schedules/route.ts`: `GET`(목록, startTime 오름차순), `POST`(생성, 201 반환).
- `src/app/api/schedules/[id]/route.ts`: `GET`(상세), `PUT`(부분 업데이트), `DELETE`(404 처리).
- `src/app/api/notifications/route.ts`: `GET`(목록, sentAt 내림차순, schedule 포함 JOIN).
- `src/app/api/notifications/[id]/read/route.ts`: `PATCH`(isRead: true 업데이트).
- params 타입: `Promise<{ id: string }>` + `await params` (Next.js 15+ 호환).
- `src/app/api/schedules/__tests__/route.test.ts`: 6개 테스트 — CRUD 전체 동작 검증.

#### `3c66a79` — 격려 메시지 시스템 (TDD) (2026-03-15 18:19)

- `src/lib/encouragements.ts`: 카테고리별(WORK/STUDY/PERSONAL/FAMILY) 11개 한국어 메시지 풀. `getStaticEncouragement(category)` — 랜덤 인덱스 선택.
- `src/lib/ai-encouragement.ts`: `generateAIEncouragement(title, category)` — Claude claude-haiku-4-5-20251001, max_tokens 150, 한국어 2~3문장. `getEncouragementMessage()` — AI 우선 시도, 실패 시 정적 폴백.
- `ANTHROPIC_API_KEY` 미설정 시 AI 호출 자체를 건너뜀 (불필요한 오류 방지).
- 4개 파일, 테스트 7개 (정적 메시지 4개 + AI 생성/폴백/미설정 3개).

#### `d83b539` — Teams Webhook + 알림 스케줄러 + instrumentation (TDD) (2026-03-15 18:20)

- `src/lib/channels/teams.ts`: `sendTeamsNotification(url, payload, maxRetries=3)`. Adaptive Card v1.4 — 제목(Bolder), 알림 메시지(기본색), 격려 문구(Accent). `TEAMS_WEBHOOK_URL` 미설정 시 즉시 `false` 반환.
- `src/lib/scheduler.ts`: `checkAndSendReminders()`. 알림 발송 조건: `diffMs >= 0` AND `diffMs/1000 <= 60` + 최근 2분 내 기존 알림 없음. 조건 충족 시 AI/정적 메시지 생성 → Notification DB 저장 → Teams 전송.
- `src/instrumentation.ts`: `register()` 함수에서 `NEXT_RUNTIME === 'nodejs'` 가드로 서버 환경에서만 node-cron `* * * * *` 등록.
- 테스트 6개 (Teams 전송/재시도/미설정 3개 + 스케줄러 발송/중복방지/조건미충족 3개).

#### `1096616` — 프론트엔드-백엔드 연동 (2026-03-15 18:22)

- `src/lib/api-client.ts`: `scheduleApi` (list/get/create/update/delete), `notificationApi` (list/markAsRead) — fetch 기반 클라이언트.
- `src/app/page.tsx`: async Server Component로 전환. `prisma.schedule.findMany()` + `prisma.notification.count({ where: { isRead: false } })` 직접 호출. `dynamic = 'force-dynamic'` 추가.
- `src/app/schedules/new/page.tsx`: `setTimeout` 목 → `scheduleApi.create()` 교체. `startTime`: `new Date(val).toISOString()` 변환 추가.
- `src/app/schedules/[id]/page.tsx`: Server Component로 전환. `prisma.schedule.findUnique()` 직접 조회. `await params` 패턴.
- `src/components/schedule/ScheduleDetail.tsx`: Client Component 신규 추가. 수정/삭제 인터랙션 담당. Date 필드(startTime)는 string으로 수신 후 `new Date()` 변환.

#### `b60440a` — 앱 내부 알림 UI (TDD) (2026-03-15 18:25)

- `src/components/notification/NotificationBell.tsx`: 미읽음 수 props 수신. 0이면 회색 벨만, 1 이상이면 빨간 배지 + 숫자(10+ → "9+"). 클릭 시 패널 토글.
- `src/components/notification/NotificationPanel.tsx`: 클릭 시 `GET /api/notifications` 호출. 미읽음 알림 파란 배경 + 파란 점 구분. 항목 클릭 → `PATCH /api/notifications/:id/read` → 로컬 상태 업데이트 → `/schedules/:id` 이동. 패널 외부 클릭 시 닫힘(`useEffect` + `mousedown`).
- `src/app/page.tsx`: `NotificationBell` 헤더 우측에 추가, `unreadCount` 전달.
- `__tests__/NotificationBell.test.tsx`: 3개 테스트 — 배지 미표시/표시/패널 토글.

#### `18e15e8` — Sprint 2 정리 (버그 수정 + 에러 페이지) (2026-03-15 18:46)

- `src/lib/mock-data.ts` 삭제. 모든 import 제거 확인.
- `src/app/api/schedules/route.ts`, `[id]/route.ts`: `parsed.error.errors` → `parsed.error.issues` (Zod v4 호환).
- `src/lib/db.ts`: Proxy 패턴으로 재작성. `new Proxy({}, { get: (_, prop) => prisma[prop] })` — 실제 접근 시점에만 PrismaClient 초기화.
- `src/app/layout.tsx`: `Inter` 폰트 제거, `font-sans` 시스템 폰트 스택으로 대체.
- `next.config.ts`: `serverExternalPackages: ['better-sqlite3']`, `turbopackUseSystemTlsCerts: true` 추가.
- `src/app/not-found.tsx`: 404 커스텀 페이지 추가.
- `src/app/global-error.tsx`: 전역 에러 바운더리 추가.
- `src/instrumentation.ts`: `process.env.NODE_ENV !== 'test'` 가드 추가 — 테스트 환경에서 스케줄러 미실행.

#### `0ded065` — docs: sprint2.md 실제 구현 기준으로 정리 (2026-03-15 19:06)

- `docs/sprint/sprint2.md`: Next.js 버전(14→16), Prisma generator(`prisma-client-js`→`prisma-client`), import 경로, zod v4 주의사항, API 시그니처를 실제 구현과 일치하도록 전면 수정. 완료일 및 테스트 결과 기록.
- `src/lib/scheduler.ts`: 매분 실행 시 `[Scheduler] checking reminders...` 확인 로그 추가.

---

## v0.3.0 — Sprint 2 후속 개선: 품질·UX·워크플로우 (2026-03-15)

**테스트 커버리지 강화, UX/접근성 개선, 워크플로우 인프라 구축, 시장 분석.** 54개 → 102개 테스트, 에러 경계, 로딩 스켈레톤, 접근성 마크업, Playwright E2E 도입, 통합 테스트(SQLite) 추가.

### 완료 항목

- **테스트**: 54개 → 102개 (notifications API, ScheduleDetail, NotificationPanel, api-client, Input, Badge 신규 + SQLite 통합 테스트 10개)
- **통합 테스트**: `db.integration.test.ts` — 실제 `better-sqlite3` + Prisma 어댑터로 Cascade 삭제, 정렬, 스케줄러 쿼리 검증
- **시장 분석**: `docs/plans/market-analysis.md` — 직접(Remindly, HiFutureSelf, Rocky.ai) + 간접(Google Calendar, Todoist, Tiimo 등) 경쟁사 비교, 포지셔닝 맵, 차별화 강점
- **테스트 계획**: `docs/test-plan.md` — API 검증, 화면별 기능 검증, 입력 유효성, 단위·통합·E2E 전략 문서화
- **아키텍처**: NotificationChannel Strategy Pattern, `constants.ts` 단일 소스, `scheduler.ts` diffMs 버그(Math.abs 오사용) 수정
- **UX**: `loading.tsx`/`error.tsx` 라우트 레벨 추가, `global-error.tsx` Tailwind 적용, 404 페이지 개선
- **접근성**: skip-link, `<nav aria-label>`, `<ul>/<li>` 시맨틱, `role=article`, `aria-label`
- **문서**: CLAUDE.md, ROADMAP.md, dev-log.md, tech-stack.md, vision.md 추가
- **기타**: 다크모드 CSS 충돌 제거, ESLint 경고 0개, Vitest에서 e2e/ 디렉토리 제외
- **워크플로우**: sprint1/sprint2/main 브랜치 생성, Playwright E2E 25개 케이스 작성, sprint-close 리포트 생성

### 버그 수정

| 버그 | 원인 | 수정 |
|------|------|------|
| 스케줄러 이중 발송 | `diffMs < 0` 조건에 `Math.abs()` 사용으로 미래 일정도 발송 | `diffMs < 0` + `diffMs/1000 > 60` 두 조건으로 분리 |
| NotificationBell stale closure | `!isOpen` 체크가 setIsOpen 이전 값 참조 | `nextOpen` 지역 변수로 분리 후 조건 체크 |
| Vitest가 Playwright 파일 실행 | `e2e/` 디렉토리 exclude 설정 없음 | `vitest.config.ts`에 `exclude: ['**/e2e/**']` 추가 |
| 통합 테스트 EBUSY 오류 (Windows) | `unlinkSync()` 전 Prisma 연결 미해제 | `cleanup`을 async로 변경, `await prisma.$disconnect()` 후 파일 삭제 |
| `global-error.tsx` 스타일 없음 | `globals.css` import 누락, inline style 사용 | `./globals.css` import + Tailwind 클래스 적용 |
| `<main>` 중첩 | `Container.tsx`와 `layout.tsx` 모두 `<main>` 사용 | `Container.tsx`를 `<div>`로 변경 |
| 다크모드에서 배경 검게 변함 | `@media (prefers-color-scheme: dark)` CSS 변수가 UI 하드코딩 색상과 충돌 | 다크모드 CSS 변수 제거, `color-scheme: light` 고정 |

### 기술 결정사항

- **Strategy Pattern 도입**: `NotificationChannel` 인터페이스 + `getNotificationChannels()` 레지스트리. 새 채널(KakaoTalk, Slack) 추가 시 `scheduler.ts` 수정 불필요.
- **단일 소스 원칙 적용**: 카테고리 배열이 3개 파일에 분산 → `src/lib/constants.ts`로 통합.
- **라우트 레벨 에러 경계**: `error.tsx`(클라이언트 컴포넌트) + `loading.tsx`(서버 스켈레톤)를 각 라우트에 추가. 페이지 단위 에러/로딩 UX 분리.
- **접근성 선언적 마크업**: `<nav aria-label>`, `<ul aria-label>`, `role="article"`, skip-link로 스크린리더 지원 강화.

---

### 커밋 상세

#### `39b35d7` — Sprint 2 후속 개선 (2026-03-15 22:05)

- 테스트 7개 파일 신규 (notifications route, read route, NotificationPanel, ScheduleDetail, api-client, Input, Badge)
- `src/lib/channels/`: `types.ts`(인터페이스), `index.ts`(레지스트리), `teams.ts`(TeamsChannel 클래스) 추가
- `src/lib/constants.ts`: `SCHEDULE_CATEGORIES`, `CATEGORY_LABELS` 단일 소스
- `src/lib/scheduler.ts`: diffMs 조건 버그 수정, 채널 레지스트리 사용으로 리팩토링
- UX 파일: `(home)/loading.tsx`, `(home)/error.tsx`, `schedules/[id]/loading.tsx`, `[id]/error.tsx`, `new/error.tsx`
- `src/app/layout.tsx`: skip-link + `<main id="main-content">` 추가
- `src/components/layout/Container.tsx`: `<main>` → `<div>` 변경
- `src/components/layout/Header.tsx`: `<nav aria-label="주요 메뉴">` 추가
- `src/components/schedule/ScheduleList.tsx`: `<ul aria-label="일정 목록">/<li>` 시맨틱
- `src/components/schedule/ScheduleCard.tsx`: `role="article"`, `aria-label` 추가
- `src/app/globals.css`: 다크모드 변수 제거, `color-scheme: light` 추가
- `src/app/global-error.tsx`: `./globals.css` import + Tailwind 스타일
- `src/app/not-found.tsx`: 404 숫자 표시 + 안내 메시지 개선
- ESLint 경고 0개, vitest.config.ts `exclude: ['**/e2e/**']` 추가

#### `(현재)` — 통합 테스트 + 시장 분석 + 테스트 계획 (2026-03-15)

- `src/lib/__tests__/db.integration.test.ts`: 실제 SQLite 파일 기반 통합 테스트 10개 — Schedule CRUD, Cascade 삭제, isRead 업데이트, sentAt 정렬, 스케줄러 쿼리
- `vitest.config.ts`: `exclude: ['**/e2e/**']` 추가로 Playwright 파일 Vitest 실행 방지
- `docs/plans/market-analysis.md`: 경쟁사 6개 심층 분석, 포지셔닝 맵, 차별화 강점 5가지
- `docs/test-plan.md`: API 검증, 화면별 검증, 입력 유효성, 단위·통합·E2E 전략 전체 문서화
- 테스트 결과: 20개 파일, 102개 케이스 전체 통과

#### `9f70b07` — 워크플로우 인프라 구축 (2026-03-15 22:20)

- `playwright.config.ts`: Chromium + Mobile Safari, webServer 자동 시작 설정
- `e2e/schedule.spec.ts`: 일정 CRUD 전체 흐름, 알림 패널, 404, 반응형 E2E 25개 케이스
- `docs/sprint/sprint1/code-review.md`, `playwright-report.md`: Sprint 1 마무리 리포트
- `docs/sprint/sprint2/code-review.md`, `playwright-report.md`: Sprint 2 마무리 리포트
- 브랜치 구조: `sprint1`(7dfe0f6), `sprint2`(0ded065), `main`(master) 생성

---

## v0.4.0 — CI/CD 배포 자동화 (2026-03-15)

**GitHub Actions + Jenkins + PM2 기반 배포 파이프라인 전체 구축.** 코드 push → 테스트 → 빌드 → 패키징 → 운영 배포 → 롤백까지 전 과정 자동화.

### 완료 항목

- **GitHub Actions CI** (`.github/workflows/ci.yml`): Backend 테스트 + Frontend 빌드 + E2E(main 브랜치) 3-Job 파이프라인
- **Jenkins 파이프라인** (`Jenkinsfile`): Checkout → Build → Test(병렬) → Package → Deploy 5단계, 프로덕션 배포 수동 승인 게이트
- **운영 배포 스크립트** (`scripts/deploy.sh`): 사전 검사 → DB 백업 → 코드 업데이트 → 의존성 → 마이그레이션 → 빌드 → PM2 재시작 → 헬스체크
- **롤백 자동화** (`scripts/rollback.sh`): 직전 커밋 자동 롤백, 특정 커밋/태그 롤백, DB 단독 롤백, 대화형 목록 조회
- **배포 가이드** (`docs/deploy.md`): 환경변수, 서버 준비, 롤백 4개 시나리오, 모니터링, 백업 전략 전체 문서화

### 기술 결정사항

- **PM2 무중단 재시작**: `pm2 reload` 사용 — 기존 프로세스가 응답하는 동안 새 프로세스를 시작하여 순단 없는 배포
- **배포 전 DB 백업 필수화**: 마이그레이션 실패/코드 오류 시 즉시 복원 가능. WAL 체크포인트로 일관성 보장
- **Git 태그 기반 롤백 이력**: `rollback-prev` 태그와 `.previous_commit` 파일로 이중 보호
- **Jenkins 프로덕션 게이트**: `input` 스텝으로 배포 승인을 요구하여 실수에 의한 프로덕션 배포 방지
- **GitHub Actions E2E 분리**: E2E(Playwright)는 `main`/`master` push 시에만 실행 — PR 단계에서는 단위/통합 테스트로 충분

---

### 커밋 상세

#### `(현재)` — CI/CD 배포 자동화 전체 구축 (2026-03-15)

- `.github/workflows/ci.yml`: 3-Job CI (Backend Tests + Frontend Build + E2E)
- `Jenkinsfile`: 5단계 선언형 파이프라인 (Checkout/Build/Test/Package/Deploy)
- `scripts/deploy.sh`: PM2 기반 운영 배포 스크립트 (8단계, 헬스체크 포함)
- `scripts/rollback.sh`: 자동/수동 롤백 + DB 단독 복원 스크립트
- `scripts/deploy-remote.sh`: Jenkins SSH 원격 배포 헬퍼
- `docs/deploy.md`: 배포 전체 가이드 (✅ 완료 표시)
- `docs/ROADMAP.md`: CI/CD 완료 항목 업데이트

---

## 알려진 이슈

| 이슈 | 원인 | 상태 |
|------|------|------|
| `npm run build` 실패 | Next.js 16 내부 `workUnitAsyncStorage` 버그 (`/_global-error` 사전 렌더링 단계에서 발생) | ⏸️ 프레임워크 픽스 대기 (개발 서버에서는 정상 동작) |
| Playwright 브라우저 미설치 | 사내 환경 SSL 인증서 문제로 바이너리 다운로드 차단 | ⏸️ 네트워크 환경 해결 후 `npx playwright install chromium` 실행 필요 |
