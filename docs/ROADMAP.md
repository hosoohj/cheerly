# 프로젝트 로드맵 — Cheerly

## 개요

- **프로젝트 목표**: 일정 시작 전 알림과 격려 메시지를 함께 전달하는 스마트 일정 관리 서비스
- **전체 예상 기간**: 약 16주 (8 스프린트, 4 Phase)
- **현재 진행 단계**: Phase 1 완료 (Sprint 1~2 완료), Sprint 3 예정
- **시작일**: 2026-03-15

## 진행 상태 범례

- ✅ 완료
- 🔄 진행 중
- 📋 예정
- ⏸️ 보류

---

## 프로젝트 현황 대시보드

| 항목 | 상태 |
|------|------|
| 전체 진행률 | Phase 1 완료 (Sprint 1~2, 102개 테스트 전체 통과) + CI/CD 배포 자동화 완료 |
| 현재 Phase | Phase 1 완료 / Phase 2 준비 중 |
| 현재 Sprint | Sprint 3 예정 (반복 일정 + 메신저 확장) |
| 다음 마일스톤 | Sprint 3 완료 후 Phase 2 (메신저 확장) |

---

## 기술 아키텍처 결정 사항

| 영역 | 기술 | 선택 이유 |
|------|------|-----------|
| 프레임워크 | Next.js 16.1.6 (App Router) | 풀스택 프레임워크, SSR/SSG 지원, API Routes 내장 |
| 언어 | TypeScript | 타입 안전성, 개발 생산성, 유지보수성 |
| 스타일링 | Tailwind CSS v4 | 빠른 UI 개발, 일관된 디자인 시스템 |
| 상태 관리 | useState (Client Component) | MVP 수준에 적합한 단순한 구조 |
| DB | SQLite (Prisma v7 ORM) | 드라이버 어댑터 방식, 추후 PostgreSQL 마이그레이션 가능 |
| AI | Claude claude-haiku-4-5-20251001 (Anthropic API) | 격려 메시지 생성, 정적 폴백 44개 |
| 스케줄러 | node-cron + instrumentation.ts | 매분 실행, ±60초 윈도우, 중복 방지 |
| 알림 연동 | Microsoft Teams Adaptive Card v1.4 | Phase 1 MVP 요구사항, 3회 재시도 |
| 테스트 | Vitest + Playwright | 53개 단위 테스트 전체 통과 |
| 패키지 매니저 | npm | 표준적이고 안정적 |

---

## 의존성 맵

```
Phase 1 Sprint 1: 프로젝트 초기화 + 일정 등록/목록 UI
        |
        v
Phase 1 Sprint 2: 백엔드 API + DB 연동 + 알림/격려 메시지 + Teams 연동
        |
        v
Phase 2 Sprint 3: 반복 일정 + 일정 유형 UI
        |
        v
Phase 2 Sprint 4: KakaoTalk 연동 + 사용자 알림 설정
        |
        v
Phase 3 Sprint 5: 모바일 반응형 강화 + Push 알림 기반
        |
        v
Phase 3 Sprint 6: 일정 통계 + 생산성 분석
        |
        v
Phase 4 Sprint 7: AI 고도화 (개인화 + 피드백 학습)
        |
        v
Phase 4 Sprint 8: AI 일정 추천 + 자동 생성
```

---

## Phase 1: MVP (Sprint 1-2) ✅

> **Must Have** — 핵심 가치를 증명하는 최소 기능 제품. **Sprint 1~2 완료.**

### Sprint 1: 프로젝트 초기화 및 프론트엔드 (2주) ✅

#### 목표
프로젝트 기반 구축 및 일정 등록/목록 조회 UI를 완성하여 사용자 리뷰를 받을 수 있는 상태로 만든다.

#### 작업 목록

- ✅ **프로젝트 초기화** [복잡도: S]
  - Next.js 16.1.6 + TypeScript 프로젝트 생성
  - Tailwind CSS v4 설정
  - ESLint, Prettier 설정
  - 프로젝트 디렉토리 구조 수립 (`app/`, `components/`, `lib/`, `types/`)
  - Vitest 설정 및 샘플 테스트 작성

- ✅ **타입 정의** [복잡도: S]
  - `Schedule` 타입 정의 (id, title, description, startTime, reminderMinutes, category)
  - `ScheduleCategory` enum 정의 (WORK, STUDY, PERSONAL, FAMILY)
  - `Notification` 타입 정의 (id, scheduleId, message, encouragement, sentAt)

- ✅ **공통 레이아웃 컴포넌트** [복잡도: S]
  - 헤더 컴포넌트 (로고, 네비게이션)
  - 메인 레이아웃 (반응형 컨테이너)
  - 공통 버튼, 입력 필드 컴포넌트

- ✅ **일정 등록 페이지 UI** [복잡도: M]
  - `/schedules/new` 라우트 생성
  - 일정 등록 폼 컴포넌트 (제목, 설명, 시작 시간, 알림 시간, 일정 유형)
  - 알림 시간 기본값 10분 전 설정
  - 일정 유형 선택 UI (업무/공부/개인/가족)
  - 클라이언트 사이드 폼 유효성 검사
  - 등록 성공/실패 피드백 UI

- ✅ **일정 목록 페이지 UI** [복잡도: M]
  - `/` (홈) 라우트에 일정 목록 표시
  - 일정 카드 컴포넌트 (제목, 시간, 유형 뱃지, 남은 시간)
  - 시간순 정렬 표시
  - 빈 상태(일정 없음) UI

- ✅ **일정 상세/수정/삭제 UI** [복잡도: M]
  - `/schedules/[id]` 라우트 생성
  - 일정 상세 보기 컴포넌트
  - 수정 모드 전환 UI (인라인 폼 전환)
  - 삭제 확인 다이얼로그

#### 완료 기준 (Definition of Done)
- Next.js 프로젝트가 `npm run dev`로 정상 실행된다
- 일정 등록 폼이 렌더링되고 모든 입력 필드가 동작한다
- 일정 목록 페이지가 목 데이터로 정상 표시된다
- 모든 페이지가 모바일/데스크톱에서 반응형으로 동작한다
- ESLint 경고 0개, TypeScript 컴파일 에러 0개
- Vitest 단위 테스트 통과율 100%

#### Playwright MCP 검증 시나리오

> `npm run dev` 실행 후 아래 순서로 검증

**일정 목록 페이지 검증:**
1. `browser_navigate` -> `http://localhost:3000` 접속
2. `browser_snapshot` -> 헤더, 일정 목록 영역 렌더링 확인
3. `browser_snapshot` -> 일정 카드 컴포넌트 존재 확인 (목 데이터)
4. `browser_console_messages(level: "error")` -> 콘솔 에러 없음 확인

**일정 등록 페이지 검증:**
1. `browser_navigate` -> `http://localhost:3000/schedules/new` 접속
2. `browser_snapshot` -> 폼 필드 전체 렌더링 확인
3. `browser_fill_form` -> 제목, 설명, 시작 시간, 알림 시간, 유형 입력
4. `browser_snapshot` -> 입력값 반영 확인
5. `browser_click` -> 등록 버튼 클릭
6. `browser_snapshot` -> 피드백 UI 표시 확인
7. `browser_console_messages(level: "error")` -> 에러 없음 확인

**반응형 검증:**
1. `browser_resize(width: 375, height: 812)` -> 모바일 뷰포트
2. `browser_snapshot` -> 모바일 레이아웃 정상 확인
3. `browser_resize(width: 1280, height: 720)` -> 데스크톱 뷰포트
4. `browser_snapshot` -> 데스크톱 레이아웃 정상 확인

#### 기술 고려사항
- App Router의 Server/Client Component 구분을 명확히 한다
- 폼 상태 관리는 React `useState`로 충분하다 (MVP)
- 목 데이터는 `lib/mock-data.ts`에 중앙 관리한다
- 컴포넌트는 재사용 가능한 단위로 분리한다

---

### Sprint 2: 백엔드 API + 알림 + Teams 연동 (2주) ✅

#### 목표
Sprint 1의 프론트엔드를 실제 백엔드와 연결하고, 핵심 가치인 알림 + 격려 메시지 기능을 완성하여 MVP를 릴리스한다.

#### 작업 목록

- ✅ **DB 스키마 및 Prisma 설정** [복잡도: M]
  - Prisma v7 + 드라이버 어댑터(better-sqlite3) 방식으로 초기화
  - Schedule 모델 정의 (Notification onDelete: Cascade)
  - Notification 모델 정의
  - 시드(seed) 데이터 스크립트 작성
  - Proxy 패턴 지연 초기화 (`lib/db.ts`)

- ✅ **일정 CRUD API** [복잡도: M]
  - `POST /api/schedules` — 일정 생성 (201)
  - `GET /api/schedules` — 일정 목록 조회 (시간순 정렬)
  - `GET /api/schedules/[id]` — 일정 상세 조회
  - `PUT /api/schedules/[id]` — 일정 수정 (부분 업데이트)
  - `DELETE /api/schedules/[id]` — 일정 삭제 (Cascade)
  - Zod v4 서버 사이드 유효성 검사
  - 에러 응답 표준화 (`{ error, issues }`)

- ✅ **프론트엔드-백엔드 연동** [복잡도: M]
  - 목 데이터를 실제 API 호출로 교체 (`lib/api-client.ts`)
  - Server Component에서 Prisma 직접 호출 (홈/상세 페이지)
  - Date 직렬화 경계 처리 (`SerializedSchedule`)

- ✅ **격려 메시지 시스템** [복잡도: S]
  - Claude claude-haiku-4-5-20251001 AI 연동 (`lib/ai-encouragement.ts`)
  - 카테고리별 정적 메시지 풀 11개 × 4 = 44개 (`lib/encouragements.ts`)
  - AI 우선 → 정적 폴백 로직
  - `ANTHROPIC_API_KEY` 미설정 시 즉시 정적 메시지 전환

- ✅ **알림 스케줄러** [복잡도: L]
  - node-cron `* * * * *` + `instrumentation.ts` 등록
  - 일정 시작 N분 전(기본값 10분) 알림 트리거
  - ±60초 윈도우, 최근 2분 내 중복 방지
  - 알림 발송 기록 DB 저장

- ✅ **Microsoft Teams Webhook 연동** [복잡도: M]
  - Adaptive Card v1.4 포맷 (`lib/channels/teams.ts`)
  - 미설정 시 자동 스킵, 실패 시 최대 3회 재시도
  - Teams 실패가 전체 알림 흐름에 영향 없음

- ✅ **앱 내부 알림 UI** [복잡도: M]
  - 벨 아이콘 + 미읽음 배지 (`NotificationBell`)
  - 드롭다운 패널 + AI 격려 문구 표시 (`NotificationPanel`)
  - 읽음 처리 + 일정 페이지 이동, 패널 외부 클릭 시 닫힘

#### 완료 기준 (Definition of Done) — 달성
- ✅ 일정 CRUD가 실제 DB와 연동되어 동작한다
- ✅ 일정 시작 N분 전(기본값 10분)에 알림이 발송된다
- ✅ 알림 메시지에 Claude AI 또는 정적 격려 메시지가 포함된다
- ✅ Teams Webhook으로 Adaptive Card 메시지가 전송된다
- ✅ 앱 내부에서 알림 목록을 확인하고 읽음 처리할 수 있다
- ✅ Vitest 53개 단위 테스트 전체 통과

#### Playwright MCP 검증 시나리오

> `npm run dev` 실행 후 아래 순서로 검증

**일정 CRUD 통합 검증:**
1. `browser_navigate` -> `http://localhost:3000/schedules/new` 접속
2. `browser_fill_form` -> 테스트 일정 데이터 입력
3. `browser_click` -> 등록 버튼 클릭
4. `browser_wait_for` -> 성공 메시지 또는 목록 페이지 이동 대기
5. `browser_network_requests` -> `POST /api/schedules` 응답 201 확인
6. `browser_navigate` -> `http://localhost:3000` 접속
7. `browser_snapshot` -> 등록한 일정이 목록에 표시되는지 확인
8. `browser_click` -> 일정 카드 클릭
9. `browser_snapshot` -> 상세 페이지 정상 렌더링 확인
10. `browser_network_requests` -> `GET /api/schedules/[id]` 응답 200 확인

**알림 UI 검증:**
1. `browser_navigate` -> `http://localhost:3000` 접속
2. `browser_snapshot` -> 알림 배지/아이콘 존재 확인
3. `browser_click` -> 알림 아이콘 클릭
4. `browser_snapshot` -> 알림 목록 패널 표시 확인
5. `browser_console_messages(level: "error")` -> 에러 없음 확인

**API 동작 검증:**
1. `browser_navigate` -> `http://localhost:3000` 접속
2. `browser_network_requests` -> `GET /api/schedules` 응답 200 확인
3. `browser_console_messages(level: "error")` -> 에러 없음 확인

#### 기술 고려사항
- Prisma는 `prisma/schema.prisma`에 스키마를 정의한다
- Teams Webhook URL은 `.env.local`에 `TEAMS_WEBHOOK_URL`로 관리한다
- node-cron은 Next.js API Route가 아닌 별도 프로세스 또는 instrumentation.ts에서 실행한다
- zod 스키마를 타입 정의와 유효성 검사에 모두 활용한다

---

## Phase 2: 메신저 확장 (Sprint 3-4) 📋

> **Should Have** — MVP 이후 사용자 경험을 확장하는 기능

### Sprint 3: 반복 일정 + 일정 유형 강화 (2주)

#### 목표
반복 일정 기능을 추가하고 일정 유형별 차별화된 경험을 제공한다.

#### 작업 목록

- ⬜ **반복 일정 UI** [복잡도: M]
  - 반복 설정 UI 컴포넌트 (매일/매주/매월/사용자 지정)
  - 반복 일정 아이콘/뱃지 표시
  - 반복 일정 수정 시 "이 일정만/전체" 선택 UI

- ⬜ **반복 일정 백엔드** [복잡도: L]
  - RecurrenceRule 모델 추가 (Prisma 마이그레이션)
  - 반복 일정 생성/수정/삭제 API 확장
  - 반복 패턴에 따른 다음 일정 자동 생성 로직
  - 반복 일정 알림 스케줄러 확장

- ⬜ **일정 유형별 UI 차별화** [복잡도: S]
  - 유형별 컬러 테마 적용 (업무: 파랑, 공부: 초록, 개인: 보라, 가족: 주황)
  - 유형별 아이콘 적용
  - 유형별 필터링 기능

- ⬜ **일정 유형 관리** [복잡도: S]
  - 유형별 일정 필터 UI
  - 유형별 격려 메시지 차별화 강화

#### 완료 기준 (Definition of Done)
- 반복 일정을 생성하면 설정된 패턴에 따라 일정이 자동 생성된다
- 반복 일정 수정 시 단일/전체 수정이 가능하다
- 일정 유형별 컬러와 아이콘이 적용된다
- 유형별 필터링이 동작한다

#### Playwright MCP 검증 시나리오

> `npm run dev` 실행 후 아래 순서로 검증

**반복 일정 검증:**
1. `browser_navigate` -> `http://localhost:3000/schedules/new` 접속
2. `browser_snapshot` -> 반복 설정 UI 존재 확인
3. `browser_select_option` -> 반복 유형 "매주" 선택
4. `browser_fill_form` -> 나머지 필드 입력
5. `browser_click` -> 등록 버튼 클릭
6. `browser_network_requests` -> API 호출 성공 확인
7. `browser_navigate` -> `http://localhost:3000` 접속
8. `browser_snapshot` -> 반복 일정 아이콘/뱃지 표시 확인

**유형별 필터 검증:**
1. `browser_navigate` -> `http://localhost:3000` 접속
2. `browser_click` -> "업무" 유형 필터 클릭
3. `browser_snapshot` -> 업무 유형 일정만 표시되는지 확인
4. `browser_click` -> "전체" 필터 클릭
5. `browser_snapshot` -> 모든 일정 표시 확인

#### 기술 고려사항
- 반복 일정은 rrule 라이브러리 또는 자체 로직으로 구현한다
- 반복 일정의 "이 일정만 수정"은 해당 인스턴스를 예외로 분리한다
- DB 마이그레이션은 기존 데이터를 보존하면서 진행한다

---

### Sprint 4: KakaoTalk 연동 + 사용자 알림 설정 (2주)

#### 목표
KakaoTalk 알림 채널을 추가하고 사용자가 알림 방식을 세밀하게 설정할 수 있게 한다.

#### 작업 목록

- ⬜ **사용자 알림 설정 UI** [복잡도: M]
  - `/settings` 라우트 생성
  - 알림 채널 선택 UI (앱 내부, Teams, KakaoTalk)
  - 기본 알림 시간 설정 (5분/10분/20분/30분/1시간 전)
  - 알림 ON/OFF 토글
  - 설정 저장 및 즉시 반영

- ⬜ **사용자 설정 백엔드** [복잡도: M]
  - UserSettings 모델 추가
  - `GET/PUT /api/settings` API
  - 알림 스케줄러에 사용자 설정 반영

- ⬜ **KakaoTalk 연동** [복잡도: L]
  - KakaoTalk 메시지 API 연동 모듈 (`lib/channels/kakao.ts`)
  - OAuth 인증 플로우 (카카오 로그인)
  - 메시지 템플릿 구성
  - 발송 실패 시 재시도 로직

- ⬜ **알림 채널 통합 관리** [복잡도: M]
  - 알림 채널 추상화 인터페이스 (`lib/channels/base.ts`)
  - 채널별 발송 전략 패턴 적용
  - 다중 채널 동시 발송 지원

#### 완료 기준 (Definition of Done)
- 사용자가 알림 설정 페이지에서 채널과 시간을 변경할 수 있다
- KakaoTalk으로 알림 메시지가 정상 발송된다
- 여러 채널로 동시 알림 발송이 가능하다
- 알림 발송 실패 시 재시도가 동작한다

#### Playwright MCP 검증 시나리오

> `npm run dev` 실행 후 아래 순서로 검증

**설정 페이지 검증:**
1. `browser_navigate` -> `http://localhost:3000/settings` 접속
2. `browser_snapshot` -> 알림 설정 UI 렌더링 확인
3. `browser_click` -> Teams 알림 토글 ON
4. `browser_select_option` -> 알림 시간 "30분 전" 선택
5. `browser_click` -> 저장 버튼 클릭
6. `browser_network_requests` -> `PUT /api/settings` 응답 200 확인
7. `browser_navigate` -> `http://localhost:3000/settings` 재접속
8. `browser_snapshot` -> 저장된 설정값 유지 확인

#### 기술 고려사항
- KakaoTalk API는 카카오 디벨로퍼 앱 등록이 필요하다
- 알림 채널은 Strategy Pattern으로 구현하여 새 채널 추가를 용이하게 한다
- 사용자 인증은 이 단계에서 간소화 (단일 사용자 가정, Phase 3 이후 확장)

---

## Phase 3: 모바일 기능 (Sprint 5-6) 📋

> **Could Have** — 모바일 경험 강화 및 데이터 분석

### Sprint 5: 모바일 최적화 + Push 알림 기반 (2주)

#### 목표
PWA 기반 모바일 최적화와 Push Notification 기반을 구축한다.

#### 작업 목록

- ⬜ **PWA 설정** [복잡도: M]
  - `next-pwa` 설정 또는 수동 Service Worker 구성
  - Web App Manifest 작성
  - 오프라인 폴백 페이지
  - 홈 화면 추가(A2HS) 프롬프트

- ⬜ **모바일 UI 최적화** [복잡도: M]
  - 터치 최적화 (탭 타겟 48px 이상)
  - 스와이프 제스처 (일정 삭제/완료)
  - 바텀 내비게이션 바
  - 풀 투 리프레시

- ⬜ **Web Push Notification** [복잡도: L]
  - Service Worker 기반 Push API 연동
  - Push 구독 관리 API
  - VAPID 키 생성 및 환경변수 관리
  - 알림 채널에 Push 추가 (`lib/channels/push.ts`)
  - 알림 클릭 시 해당 일정으로 이동

#### 완료 기준 (Definition of Done)
- 모바일 브라우저에서 홈 화면에 앱을 추가할 수 있다
- Push Notification이 정상 수신된다
- Lighthouse PWA 점수 80 이상
- 모바일 터치 인터랙션이 자연스럽다

#### Playwright MCP 검증 시나리오

> `npm run dev` 실행 후 아래 순서로 검증

**모바일 UI 검증:**
1. `browser_resize(width: 375, height: 812)` -> 모바일 뷰포트 설정
2. `browser_navigate` -> `http://localhost:3000` 접속
3. `browser_snapshot` -> 바텀 내비게이션 바 표시 확인
4. `browser_snapshot` -> 일정 카드 터치 영역 충분한지 확인
5. `browser_click` -> 바텀 내비게이션 항목 클릭
6. `browser_snapshot` -> 페이지 전환 확인
7. `browser_console_messages(level: "error")` -> 에러 없음 확인

#### 기술 고려사항
- Web Push는 HTTPS 환경에서만 동작한다 (개발 시 localhost 예외)
- Service Worker 캐싱 전략은 네트워크 우선(Network First)으로 설정한다
- VAPID 키는 `web-push` 라이브러리로 생성한다

---

### Sprint 6: 일정 통계 + 생산성 분석 (2주)

#### 목표
사용자의 일정 완료 데이터를 분석하여 통계와 생산성 인사이트를 제공한다.

#### 작업 목록

- ⬜ **일정 완료 기능** [복잡도: S]
  - 일정 완료 체크 UI
  - 완료 상태 API (`PATCH /api/schedules/[id]/complete`)
  - 완료 시 축하 격려 메시지 표시

- ⬜ **통계 대시보드 UI** [복잡도: L]
  - `/stats` 라우트 생성
  - 주간/월간 일정 완료율 차트
  - 유형별 일정 분포 차트
  - 연속 달성일(스트릭) 표시
  - 기간 선택 필터

- ⬜ **통계 API** [복잡도: M]
  - `GET /api/stats/weekly` — 주간 통계
  - `GET /api/stats/monthly` — 월간 통계
  - 완료율, 유형별 분포, 시간대별 활동 집계

- ⬜ **생산성 격려 메시지** [복잡도: S]
  - 통계 기반 격려 메시지 생성 ("이번 주에 8개 일정을 완료했습니다!")
  - 주간 리포트 알림

#### 완료 기준 (Definition of Done)
- 일정 완료를 기록할 수 있다
- 주간/월간 통계 차트가 정상 표시된다
- 통계 기반 격려 메시지가 생성된다
- 차트 라이브러리 렌더링이 모바일에서도 정상 동작한다

#### Playwright MCP 검증 시나리오

> `npm run dev` 실행 후 아래 순서로 검증

**일정 완료 검증:**
1. `browser_navigate` -> `http://localhost:3000` 접속
2. `browser_click` -> 일정 완료 체크 버튼 클릭
3. `browser_snapshot` -> 완료 상태 UI 변경 확인
4. `browser_snapshot` -> 축하 격려 메시지 표시 확인
5. `browser_network_requests` -> `PATCH /api/schedules/[id]/complete` 응답 200 확인

**통계 대시보드 검증:**
1. `browser_navigate` -> `http://localhost:3000/stats` 접속
2. `browser_snapshot` -> 차트 영역 렌더링 확인
3. `browser_click` -> 기간 필터 "월간" 선택
4. `browser_snapshot` -> 월간 데이터 차트 갱신 확인
5. `browser_console_messages(level: "error")` -> 에러 없음 확인

#### 기술 고려사항
- 차트 라이브러리는 Recharts 또는 Chart.js를 사용한다 (번들 크기 고려)
- 통계 쿼리는 DB 인덱스를 활용하여 성능을 확보한다
- 대량 데이터 시 페이지네이션/가상 스크롤 적용 검토

---

## Phase 4: AI 기능 (Sprint 7-8) 📋

> **Could Have / Won't Have (MVP)** — 장기 비전, 기반 기술 검증

### Sprint 7: AI 고도화 — 개인화 + 피드백 학습 (2주)

> **참고**: Claude AI 기본 격려 메시지 생성은 **Sprint 2에서 이미 구현 완료**. Sprint 7은 개인화 심화 및 피드백 학습에 집중한다.

#### 목표
Sprint 2에서 구현한 Claude AI 기반 격려 메시지를 사용자 데이터(시간대, 반복 패턴, 피드백)로 개인화하고, 메시지 품질을 지속 개선한다.

#### 작업 목록

- ⬜ **시간대 인식 메시지 개인화** [복잡도: M]
  - 아침/점심/저녁별 다른 톤의 프롬프트 설계
  - 반복 일정 감지 ("이번 주 세 번째 팀 회의" 류의 누적 컨텍스트)
  - 개인화 컨텍스트를 Claude 프롬프트에 동적 주입

- ⬜ **사용자 피드백 수집** [복잡도: S]
  - 알림 패널에 좋아요/별로 버튼 추가
  - `PATCH /api/notifications/:id/feedback` API
  - 피드백 데이터 DB 저장

- ⬜ **피드백 기반 프롬프트 개선** [복잡도: M]
  - 피드백 이력 분석 로직
  - 높은 평가를 받은 메시지 패턴을 프롬프트에 반영
  - 낮은 평가 패턴 회피 로직

#### 완료 기준 (Definition of Done)
- 시간대에 따라 메시지 톤이 달라진다
- 사용자가 메시지에 피드백을 남길 수 있다
- 피드백 데이터가 DB에 저장되고 조회된다
- 피드백 기반 프롬프트 개선이 동작한다

#### Playwright MCP 검증 시나리오

> `npm run dev` 실행 후 아래 순서로 검증

**피드백 UI 검증:**
1. `browser_navigate` -> `http://localhost:3000` 접속
2. `browser_click` -> 알림 벨 아이콘 클릭
3. `browser_snapshot` -> 알림 패널 내 피드백 버튼 존재 확인
4. `browser_click` -> 좋아요 버튼 클릭
5. `browser_network_requests` -> `PATCH /api/notifications/:id/feedback` 응답 200 확인
6. `browser_console_messages(level: "error")` -> 에러 없음 확인

#### 기술 고려사항
- Claude API 키는 이미 `ANTHROPIC_API_KEY`로 관리 중 (Sprint 2)
- 시간대 계산은 사용자 로컬 타임존 기준으로 처리한다
- 피드백 기반 개선은 최소 20개 이상 피드백 누적 후 적용한다

---

### Sprint 8: AI 일정 추천 + 자동 생성 (2주)

#### 목표
사용자의 일정 패턴을 분석하여 일정 추천 및 자동 생성 기능을 제공한다.

#### 작업 목록

- ⬜ **일정 패턴 분석** [복잡도: L]
  - 사용자 일정 패턴 분석 로직 (`lib/ai/pattern-analyzer.ts`)
  - 요일별, 시간대별 패턴 추출
  - 자주 등록하는 일정 유형 분석

- ⬜ **일정 추천 UI** [복잡도: M]
  - 홈 화면 하단 "추천 일정" 섹션
  - 추천 일정 카드 (수락/무시 버튼)
  - 추천 사유 표시 ("보통 이 시간에 공부를 시작하셨습니다")

- ⬜ **일정 추천 API** [복잡도: M]
  - `GET /api/recommendations` — 추천 일정 목록
  - `POST /api/recommendations/[id]/accept` — 추천 수락 (일정 자동 생성)
  - `POST /api/recommendations/[id]/dismiss` — 추천 무시

- ⬜ **자동 일정 생성** [복잡도: M]
  - 추천 수락 시 일정 자동 등록
  - 자동 생성 일정 표시 뱃지 (AI 마크)
  - 자동 생성 ON/OFF 설정

#### 완료 기준 (Definition of Done)
- 사용자의 과거 일정 패턴을 분석하여 추천을 제공한다
- 추천을 수락하면 일정이 자동 생성된다
- 추천 정확도를 측정할 수 있는 수락/무시 비율이 기록된다
- 데이터가 부족한 신규 사용자에게는 추천이 표시되지 않는다

#### Playwright MCP 검증 시나리오

> `npm run dev` 실행 후 아래 순서로 검증

**일정 추천 검증:**
1. `browser_navigate` -> `http://localhost:3000` 접속
2. `browser_snapshot` -> "추천 일정" 섹션 존재 확인
3. `browser_click` -> 추천 일정 "수락" 버튼 클릭
4. `browser_wait_for` -> 일정 생성 성공 메시지 대기
5. `browser_snapshot` -> 새 일정이 목록에 추가되었는지 확인
6. `browser_network_requests` -> API 호출 성공 확인

#### 기술 고려사항
- 패턴 분석은 최소 2주 이상의 데이터가 필요하다
- 추천 로직은 규칙 기반으로 시작하고 점진적으로 ML 도입을 검토한다
- 자동 생성 일정은 사용자 확인 전까지 "임시" 상태로 관리할 수 있다

---

## 리스크 및 완화 전략

| 리스크 | 영향도 | 발생 가능성 | 완화 전략 |
|--------|--------|-------------|-----------|
| Teams Webhook 연동 지연 | 중 | 중 | Phase 1에서 조기 검증, 실패 시 이메일 알림으로 대체 |
| KakaoTalk API 승인 지연 | 중 | 높 | 개발용 테스트 앱으로 먼저 개발, 심사는 병렬 진행 |
| AI API 비용 초과 | 중 | 중 | 메시지 캐싱, Rate limiting, 일일 예산 한도 설정 |
| SQLite 성능 한계 | 낮 | 낮 | 사용자 수 증가 시 PostgreSQL 마이그레이션 계획 수립 |
| 알림 스케줄러 정확도 | 높 | 중 | 1분 단위 폴링, 중복 방지 로직, 모니터링 로그 |
| 모바일 Push 브라우저 호환성 | 중 | 중 | iOS Safari 제한 사항 사전 조사, 폴백 알림 채널 준비 |

---

## 기술 부채 관리

| 항목 | 발생 시점 | 해결 시점 | 설명 |
|------|-----------|-----------|------|
| 단일 사용자 가정 | Phase 1 | Phase 3 | MVP에서는 인증 없이 단일 사용자로 시작, 이후 사용자 인증 추가 |
| SQLite 사용 | Phase 1 | Phase 3+ | 초기 개발 속도 우선, 사용자 증가 시 PostgreSQL 마이그레이션 |
| 정적 메시지 폴백 고도화 | Phase 1 | Phase 4 | AI 실패 시 사용하는 정적 메시지를 피드백 학습으로 지속 개선 |
| 테스트 커버리지 확대 | Phase 1-2 | 매 Sprint | 초기 70% 목표에서 점진적으로 80% 이상으로 확대 |

---

## 마일스톤

| 마일스톤 | 목표 시점 | 설명 |
|----------|-----------|------|
| **M1: MVP 릴리스** | ✅ Sprint 2 완료 (2026-03-15) | 일정 CRUD + Claude AI 격려 메시지 + 자동 알림 스케줄러 + Teams Webhook + 앱 내 알림 UI |
| **M2: 메신저 확장** | Sprint 4 완료 (2026-05-10) | 반복 일정 + KakaoTalk 연동 + 사용자 설정 |
| **M3: 모바일 릴리스** | Sprint 6 완료 (2026-06-07) | PWA + Push 알림 + 통계 대시보드 |
| **M4: AI 기능 릴리스** | Sprint 8 완료 (2026-07-05) | AI 격려 메시지 + 일정 추천/자동 생성 |

---

## 향후 계획 (Backlog)

PRD 범위 외이지만 향후 고려할 수 있는 기능들:

- ⬜ 다중 사용자 인증 (OAuth, 소셜 로그인)
- ⬜ 팀/그룹 일정 공유
- ⬜ Google Calendar / Outlook 연동
- ⬜ Slack 알림 채널 추가
- ⬜ 다국어 지원 (영어, 일본어)
- ⬜ 일정 태그/라벨 시스템
- ⬜ 음성 알림 (TTS)
- ⬜ 위치 기반 알림 (출발 시간 자동 계산)
- ⬜ PostgreSQL 마이그레이션
- ✅ CI/CD 파이프라인 (GitHub Actions + Jenkins)
- ⬜ Docker 컨테이너화
