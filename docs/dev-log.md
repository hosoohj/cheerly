# Cheerly — 개발 로그

> 버전별 완료 항목, 버그 수정, 기술 결정사항 기록

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
- `src/lib/scheduler.ts`: `checkAndSendReminders()`. 알림 발송 조건: `|now - (startTime - reminderMinutes분)| ≤ 60초` + 최근 2분 내 기존 알림 없음. 조건 충족 시 AI/정적 메시지 생성 → Notification DB 저장 → Teams 전송.
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

## 알려진 이슈

| 이슈 | 원인 | 상태 |
|------|------|------|
| `npm run build` 실패 | Next.js 16 내부 `workUnitAsyncStorage` 버그 | ⏸️ 프레임워크 픽스 대기 (개발 서버에서는 정상 동작) |
