# Cheerly — 테스트 계획 (Test Plan)

> 최종 수정: 2026-03-15
> 테스트 프레임워크: Vitest 4.1.0 (단위/통합) · Playwright (E2E)
> 현재 커버리지: **20개 파일, 102개 단위·통합 테스트 통과** + E2E 25개 시나리오

---

## 1. 테스트 전략 개요

### 1.1 레이어 구조

```
┌───────────────────────────────────────────────────────┐
│  E2E (Playwright)  — 실제 브라우저, 실서버, 25 시나리오  │
│  통합 (Vitest)     — 실제 SQLite DB, 10 케이스           │
│  단위 (Vitest)     — Mock/Stub, 92 케이스                │
└───────────────────────────────────────────────────────┘
```

| 레이어 | 도구 | 목적 | 속도 | 격리 |
|--------|------|------|------|------|
| 단위 | Vitest + jsdom | 컴포넌트/함수/API Route 로직 | 빠름 | Mock |
| 통합 | Vitest + better-sqlite3 | DB 실제 동작(Cascade, 인덱스) | 보통 | 실 파일 |
| E2E | Playwright | 브라우저 전체 흐름 + 반응형 | 느림 | 실 서버 |

### 1.2 TDD 원칙

- 새 기능 구현 시 테스트 먼저 작성 → 실패 확인 → 구현 → 통과 확인
- `beforeEach` / `afterEach` 로 격리: 각 테스트는 독립적 DB 상태 보장
- E2E는 실제 사용자 시나리오 순서대로 작성 (AAA 패턴: Arrange → Act → Assert)

---

## 2. 단위 테스트 (Vitest)

### 2.1 실행 방법

```bash
npx vitest run              # 전체 실행
npx vitest run src/lib/     # 특정 경로만
npx vitest watch            # 개발 중 감시 모드
```

### 2.2 Frontend 컴포넌트 테스트

| 파일 | 테스트 대상 | 주요 검증 항목 |
|------|------------|--------------|
| `src/components/ui/__tests__/Button.test.tsx` | `Button` | variant/size props, disabled 상태, onClick |
| `src/components/ui/__tests__/Input.test.tsx` | `Input` | label 연결, error 메시지, value binding |
| `src/components/ui/__tests__/Badge.test.tsx` | `Badge` | category별 컬러 클래스 |
| `src/components/schedule/__tests__/ScheduleCard.test.tsx` | `ScheduleCard` | 제목/시간/카테고리 표시, 링크 경로 |
| `src/components/schedule/__tests__/ScheduleForm.test.tsx` | `ScheduleForm` | 필수 필드 검증, 성공 콜백, 로딩 상태 |
| `src/components/schedule/__tests__/ScheduleDetail.test.tsx` | `ScheduleDetail` | 수정 폼 토글, 삭제 다이얼로그 트리거 |
| `src/components/schedule/__tests__/DeleteConfirmDialog.test.tsx` | `DeleteConfirmDialog` | 확인/취소 콜백, 로딩 중 버튼 비활성화 |
| `src/components/notification/__tests__/NotificationBell.test.tsx` | `NotificationBell` | 미읽음 배지, 패널 토글 |
| `src/components/notification/__tests__/NotificationPanel.test.tsx` | `NotificationPanel` | 알림 목록, 읽음 처리, 빈 상태 |

### 2.3 비즈니스 로직 테스트

| 파일 | 테스트 대상 | 주요 검증 항목 |
|------|------------|--------------|
| `src/lib/validations/__tests__/schedule.test.ts` | zod 스키마 | 필수 필드, 과거 시간 거부, 선택 필드 기본값 |
| `src/lib/__tests__/encouragements.test.ts` | 정적 격려 메시지 | 카테고리별 메시지 풀, 랜덤 선택 |
| `src/lib/__tests__/ai-encouragement.test.ts` | AI 격려 메시지 | Claude API 호출, 실패 시 정적 폴백 |
| `src/lib/__tests__/scheduler.test.ts` | 알림 스케줄러 | 알림 시간 윈도우(±60초), 중복 방지 |
| `src/lib/__tests__/api-client.test.ts` | API 클라이언트 | 각 엔드포인트 fetch 래핑, 에러 처리 |
| `src/types/__tests__/schedule.test.ts` | 타입 유틸리티 | formatDate, Category 레이블 변환 |

### 2.4 API Route 테스트

| 파일 | 엔드포인트 | 검증 항목 |
|------|-----------|---------|
| `src/app/api/schedules/__tests__/route.test.ts` | GET /api/schedules, POST /api/schedules | 목록 조회, 생성 성공, 유효성 실패 400 |
| `src/app/api/notifications/__tests__/route.test.ts` | GET /api/notifications | 알림 목록, scheduleId 필터 |
| `src/app/api/notifications/[id]/read/__tests__/route.test.ts` | PATCH /api/notifications/[id]/read | 읽음 처리, 404 처리 |

> API Route 테스트는 `prisma`를 Vitest vi.mock()으로 모킹하여 격리된 환경에서 실행

### 2.5 채널 테스트

| 파일 | 테스트 대상 | 주요 검증 항목 |
|------|------------|--------------|
| `src/lib/channels/__tests__/teams.test.ts` | Teams Webhook | Adaptive Card 포맷, 3회 재시도, HTTP 에러 처리 |

---

## 3. 통합 테스트 (Vitest + SQLite)

### 3.1 설계 원칙

- **실제 DB 사용**: `better-sqlite3` 임시 파일 DB (`:memory:`가 아닌 파일 경로)
- **매 테스트 격리**: `createTestPrisma()`로 고유 임시 파일 생성, `afterEach`에서 `await prisma.$disconnect()` 후 파일 삭제
- **목적**: Mock 테스트가 검증 못하는 Cascade 삭제, 인덱스, 정렬 실제 동작 확인

### 3.2 테스트 파일

**`src/lib/__tests__/db.integration.test.ts`** — 10개 케이스

| describe | 테스트 케이스 |
|---------|-------------|
| Schedule CRUD | 생성+조회, startTime 오름차순 정렬, 수정, Cascade 삭제, 존재하지 않는 ID null 반환 |
| Notification 읽음 처리 | isRead 업데이트, sentAt 내림차순 정렬, 최근 2분 중복 여부 |
| 스케줄러 조회 쿼리 | startTime > now 필터, notifications include 조회 |

### 3.3 실행 방법

```bash
npx vitest run src/lib/__tests__/db.integration.test.ts
```

> Windows 환경에서 `EBUSY` 오류 방지: `afterEach`에서 반드시 `await cleanup()` 호출

---

## 4. API 검증

### 4.1 일정 (Schedule) API

| 메서드 | 경로 | 검증 항목 |
|--------|------|---------|
| GET | /api/schedules | 200 + 배열 반환, startTime asc 정렬 |
| POST | /api/schedules | 201 + 생성된 객체, title 누락 시 400 |
| GET | /api/schedules/:id | 200 + 객체, 없으면 404 |
| PUT | /api/schedules/:id | 200 + 수정된 객체, 없으면 404 |
| DELETE | /api/schedules/:id | 204, 없으면 404, 연결 알림 cascade 삭제 |

### 4.2 알림 (Notification) API

| 메서드 | 경로 | 검증 항목 |
|--------|------|---------|
| GET | /api/notifications | 200 + 배열, scheduleId 필터 동작 |
| PATCH | /api/notifications/:id/read | 200 + isRead:true, 없으면 404 |

### 4.3 입력값 유효성 검증 (Zod)

| 필드 | 검증 규칙 | 실패 메시지 |
|------|---------|-----------|
| title | 필수, 1-100자 | "제목을 입력해 주세요" |
| startTime | 필수, ISO datetime, 미래 시간 (생성 시) | "시작 시간을 입력해 주세요" |
| reminderMinutes | 선택, 5/10/15/30/60 중 하나, 기본값 10 | — |
| category | 선택, WORK/STUDY/PERSONAL/HEALTH/OTHER, 기본값 PERSONAL | — |
| description | 선택, 최대 500자 | — |

---

## 5. 화면별 기능 검증

### 5.1 홈 (`/`)

| 기능 | 검증 방법 | 테스트 위치 |
|------|---------|-----------|
| 일정 목록 startTime 오름차순 표시 | DB 순서 확인 | 통합 테스트 |
| 빈 상태 메시지 표시 | 목록 없을 때 EmptyState 렌더 | E2E |
| 알림 벨 + 미읽음 배지 | unreadCount prop | 단위 테스트 |
| "+ 일정 추가" 링크 | href=/schedules/new | E2E |
| 반응형 레이아웃 | Mobile 390px 뷰포트 | E2E |

### 5.2 일정 등록 (`/schedules/new`)

| 기능 | 검증 방법 | 테스트 위치 |
|------|---------|-----------|
| 필수 필드 미입력 에러 | 제출 시 에러 메시지 표시 | 단위 + E2E |
| 카테고리 선택 버튼 | active 스타일 전환 | 단위 테스트 |
| 성공 후 완료 화면 | "일정이 등록되었습니다!" 메시지 | E2E |
| 완료 후 목록 보기 → 홈 이동 | URL = "/" | E2E |
| 반응형 폼 | 모바일에서 필드 표시 | E2E |

### 5.3 일정 상세 (`/schedules/:id`)

| 기능 | 검증 방법 | 테스트 위치 |
|------|---------|-----------|
| 상세 정보 표시 | 제목/시간/카테고리/설명 | 단위 + E2E |
| 수정 버튼 → 수정 폼 전환 | 폼 헤딩 "일정 수정" 표시 | 단위 + E2E |
| 삭제 버튼 → 확인 다이얼로그 | "삭제하시겠습니까" 텍스트 | 단위 + E2E |
| 삭제 취소 → 상세 유지 | 헤딩 "일정 상세" 남음 | E2E |
| 삭제 확인 → 홈 이동 | URL = "/" | E2E |
| 없는 ID → 404 | not-found 처리 | 단위 테스트 |

### 5.4 알림 패널

| 기능 | 검증 방법 | 테스트 위치 |
|------|---------|-----------|
| 벨 클릭 → 패널 열림 | "알림" 헤딩 표시 | 단위 + E2E |
| 닫기 버튼 → 패널 닫힘 | 헤딩 사라짐 | E2E |
| 알림 클릭 → 읽음 처리 | isRead 변경 API 호출 | 단위 테스트 |
| 빈 알림 상태 | 빈 상태 메시지 | 단위 테스트 |

### 5.5 오류 화면

| 시나리오 | 검증 항목 | 테스트 위치 |
|---------|---------|-----------|
| 없는 경로 → 404 | "페이지를 찾을 수 없습니다" | E2E |
| 404에서 홈으로 이동 | URL = "/" | E2E |

---

## 6. E2E 자동화 (Playwright)

### 6.1 설정

```typescript
// playwright.config.ts
testDir: './e2e',
workers: 1,             // 직렬 실행 (DB 상태 충돌 방지)
retries: process.env.CI ? 2 : 0,
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
],
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
}
```

### 6.2 테스트 시나리오 (`e2e/schedule.spec.ts` — 25개)

| describe | 시나리오 수 | 주요 검증 |
|---------|-----------|---------|
| 일정 목록 (홈) | 4 | 페이지 로드, 헤더 요소, 알림 벨, 빈 상태 |
| 일정 등록 | 4 | 페이지 이동, 필수 필드 에러, 등록 성공, 목록 이동 |
| 일정 상세/수정/삭제 | 6 | 상세 로드, 수정 폼, 삭제 다이얼로그, 취소, 확인 |
| 알림 패널 | 2 | 패널 열기, 닫기 |
| 404 페이지 | 2 | 오류 화면, 홈 이동 |
| 반응형 (Mobile) | 2 | 390px 홈/등록 폼 |
| *(Chromium + Mobile Safari 각 실행)* | ×2 | 브라우저 호환성 |

### 6.3 실행 방법

```bash
# 브라우저 설치 (최초 1회)
npx playwright install chromium

# 전체 E2E 실행
npx playwright test

# 특정 파일만
npx playwright test e2e/schedule.spec.ts

# UI 모드 (디버깅)
npx playwright test --ui

# 리포트 확인
npx playwright show-report
```

### 6.4 환경별 실행 고려사항

| 환경 | 주의사항 |
|------|---------|
| 로컬 Windows | `npx playwright install` 시 SSL 차단 가능 → `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`로 회피 후 수동 설치 |
| CI (GitHub Actions) | `PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install --with-deps chromium` |
| 리포트 | `playwright-report/` 폴더에 HTML 리포트 자동 생성 |

---

## 7. 테스트 현황 요약

### 7.1 단위 + 통합 테스트 결과

```
테스트 파일: 20개 통과
테스트 케이스: 102개 통과
  - 컴포넌트 단위: 9개 파일 / ~45 케이스
  - 비즈니스 로직: 5개 파일 / ~30 케이스
  - API Route: 3개 파일 / ~17 케이스
  - DB 통합: 1개 파일 / 10 케이스
```

### 7.2 E2E 테스트 현황

```
시나리오: 25개 (schedule.spec.ts)
대상 브라우저: Chromium, Mobile Safari (iPhone 12)
자동화 수준: 전체 CRUD 흐름 + 알림 패널 + 404 + 반응형
```

### 7.3 커버리지 매트릭스

| 레이어 | 일정 CRUD | 알림 시스템 | AI 격려 | Teams | 스케줄러 | 반응형 |
|--------|----------|-----------|--------|-------|---------|-------|
| 단위 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 통합 | ✅ | ✅ | — | — | ✅ | — |
| E2E | ✅ | ✅ | — | — | — | ✅ |

> AI 격려/Teams/스케줄러는 외부 서비스(Claude API, Teams Webhook)에 의존하므로 E2E 대상 제외; 단위 테스트에서 Mock으로 충분히 검증

---

## 8. 향후 개선 과제

| 우선순위 | 항목 | 설명 |
|---------|------|-----|
| 높음 | Playwright 브라우저 설치 자동화 | CI 환경에서 `playwright install` 포함 |
| 높음 | API Route 통합 테스트 | Mock 대신 실제 DB로 GET/POST/DELETE 검증 |
| 중간 | 스케줄러 실행 E2E 검증 | 서버 로그에서 "[Scheduler] 알림 발송" 확인 |
| 중간 | 코드 커버리지 리포트 | `vitest --coverage` + v8 provider |
| 낮음 | Firefox/Safari 데스크톱 추가 | Playwright projects 확장 |
| 낮음 | 성능 테스트 | k6로 API 부하 테스트 (Phase 3) |
