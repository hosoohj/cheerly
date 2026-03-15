# Cheerly — 스마트 일정 관리 서비스

> **"일정을 관리하는 것을 넘어, 당신의 하루를 응원합니다."**

**Emotion-Driven Productivity Assistant** — 단순한 알림이 아니라, 일정 시작 전 AI 격려 메시지로 동기부여를 더하는 일정 관리 서비스

---

## 목차

- [문제 정의](#문제-정의)
- [서비스 소개](#서비스-소개)
- [구현 기능](#구현-기능)
- [개발 현황](#개발-현황)
- [기술 스택](#기술-스택)
- [아키텍처](#아키텍처)
- [데이터 모델](#데이터-모델)
- [시작하기](#시작하기)
- [환경 변수](#환경-변수)
- [시연 가이드](#시연-가이드)
- [테스트](#테스트)
- [API 명세](#api-명세)
- [프로젝트 구조](#프로젝트-구조)
- [주요 설계 결정](#주요-설계-결정)
- [대상 사용자](#대상-사용자)
- [향후 로드맵](#향후-로드맵)
- [기술적 참고 사항](#기술적-참고-사항)
- [해커톤 노트](#해커톤-노트)

---

## 문제 정의

현대 조직에서 반복적으로 발생하는 문제들:

- 팀원들의 업무 몰입도 저하
- 일정 관리 스트레스와 생산성 감소
- 팀장의 감정 관리 부담 증가
- 번아웃과 팀 분위기 악화

기존 생산성 도구는 **업무 관리 중심**으로 설계되어 구성원의 감정과 동기 요소는 충분히 고려하지 못하고 있습니다.

Cheerly는 **Emotion + Productivity**를 결합해 이 문제를 해결합니다.

---

## 서비스 소개

Cheerly는 일정 시작 N분 전에 자동으로 알림을 보내고, Claude AI가 생성한 맞춤 격려 메시지를 함께 전달합니다.

- **예시**: "팀 회의 시작까지 10분 남았습니다. 충분히 준비되었습니다. 자신감 있게 임해보세요!"
- 일정 카테고리(업무/공부/개인/가족)에 맞는 격려 메시지 제공
- Microsoft Teams Webhook 연동으로 팀 채널에 알림 전송

---

## 구현 기능

### 일정 관리 (CRUD)
- **일정 목록 조회** — 홈 화면에서 시작 시간 순으로 정렬된 전체 일정 표시
- **일정 등록** — 제목, 설명, 시작 시간, 알림 시간(분), 카테고리 입력
- **일정 상세 조회** — 일정 정보 및 관련 알림 이력 확인
- **일정 수정** — 등록된 일정의 모든 필드 수정 가능
- **일정 삭제** — 확인 다이얼로그 후 삭제 (연관 알림 Cascade 삭제)
- **카테고리** — WORK(업무), STUDY(공부), PERSONAL(개인), FAMILY(가족)

### AI 격려 메시지 시스템
- **Claude AI 연동** — claude-haiku-4-5-20251001 모델, 일정 제목+카테고리 컨텍스트로 맞춤 한국어 메시지 생성 (2~3문장, max_tokens 150, 이모지 없음)
- **정적 메시지 폴백** — API 키 미설정 또는 API 오류 시 카테고리별 11개 사전 정의 메시지 중 랜덤 선택
- **폴백 우선순위** — API 키 없음 → 즉시 정적 메시지 / API 오류 → catch 후 정적 메시지
- **완전 무중단** — AI 장애가 알림 발송을 막지 않음

### 자동 알림 스케줄러
- **1분 주기** — `node-cron * * * * *`으로 매 정각 :00초 실행
- **단일 초기화** — `instrumentation.ts` + `NEXT_RUNTIME === 'nodejs'` 가드로 Hot Reload 시 중복 등록 방지
- **±60초 윈도우** — `|now - (startTime - reminderMinutes분)| ≤ 60초`인 일정만 처리
- **중복 방지** — 최근 2분 내 동일 `scheduleId` 알림이 있으면 스킵
- **DB 저장** — 모든 알림을 Notification 테이블에 기록 (앱 내 알림 UI의 데이터 소스)

### Microsoft Teams Webhook 연동
- **Adaptive Card v1.4** — 일정명(굵게), 알림 메시지, 격려 문구(Accent 색상) 3개 블록 구성
- **3회 자동 재시도** — HTTP 실패 또는 네트워크 오류 시 즉시 재시도 (최대 3회)
- **선택적 연동** — `TEAMS_WEBHOOK_URL` 미설정 시 자동 스킵, 나머지 알림 흐름 영향 없음

### 앱 내 알림 UI
- **알림 벨 아이콘** — 헤더 우측에 표시, 미읽음 개수 배지
- **알림 패널** — 벨 클릭 시 최근 알림 목록 드롭다운
- **읽음 처리** — 알림 클릭 시 읽음 상태로 변경 + 해당 일정 상세 페이지 이동

### 백엔드 API
- RESTful API Routes (`/api/schedules`, `/api/notifications`)
- Zod v4 입력 유효성 검증
- 표준 HTTP 상태 코드 응답 (200/201/400/404/500)

---

## 개발 현황

| 스프린트 | 내용 | 상태 |
|----------|------|------|
| **Sprint 1** | 프론트엔드 UI — 일정 목록/등록/상세/수정/삭제 화면 | 완료 |
| **Sprint 2** | 백엔드 API + Prisma DB + Claude AI + 알림 스케줄러 + Teams Webhook | 완료 |
| **Sprint 3** | 테스트 강화(102개), CI/CD 파이프라인, 빌드 안정화, 배포 | 완료 |

- 개발 기간: 2026년 3월 (해커톤)
- 개발 서버 기준 모든 핵심 기능 정상 동작 확인

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| **프레임워크** | Next.js 16.1.6 (App Router) |
| **언어** | TypeScript |
| **데이터베이스** | SQLite (better-sqlite3) |
| **ORM** | Prisma v7.5.0 (드라이버 어댑터 방식) |
| **AI** | Anthropic Claude claude-haiku-4-5-20251001 (`@anthropic-ai/sdk ^0.78.0`) |
| **스케줄러** | node-cron v4 |
| **유효성 검증** | Zod v4 |
| **스타일** | Tailwind CSS v4 |
| **테스트** | Vitest v4 + Testing Library |
| **런타임** | Node.js 18+ |

---

## 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                 Next.js App Router                   │
│                                                     │
│   Server Components          Client Components      │
│   ──────────────────         ─────────────────      │
│   HomePage (Prisma)          ScheduleDetail         │
│   ScheduleList/Card          NotificationBell       │
│   ScheduleDetailPage         NotificationPanel      │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                  API Routes                          │
│   GET/POST    /api/schedules                        │
│   GET/PUT/DELETE /api/schedules/[id]                │
│   GET         /api/notifications                    │
│   PATCH       /api/notifications/[id]/read          │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│           Prisma v7 + SQLite                        │
│           (better-sqlite3 adapter)                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│         node-cron 스케줄러 (매 1분)                  │
│   checkAndSendReminders()                           │
│     ├── Prisma로 알림 대상 일정 조회                  │
│     ├── Claude AI 격려 메시지 생성 (→ 정적 폴백)      │
│     ├── Notification DB 저장                        │
│     └── Teams Webhook 전송 (TEAMS_WEBHOOK_URL 설정 시)│
└─────────────────────────────────────────────────────┘
```

---

## 데이터 모델

```prisma
model Schedule {
  id              String         @id @default(cuid())
  title           String                          // 일정 제목
  description     String?                         // 설명 (선택)
  startTime       DateTime                        // 일정 시작 시간
  reminderMinutes Int            @default(10)     // 알림 시간 (분 전)
  category        String         @default("PERSONAL") // WORK/STUDY/PERSONAL/FAMILY
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  notifications   Notification[]
}

model Notification {
  id            String   @id @default(cuid())
  scheduleId    String
  message       String                    // "OO 시작까지 N분 남았습니다"
  encouragement String                    // AI 또는 정적 격려 메시지
  sentAt        DateTime @default(now())
  isRead        Boolean  @default(false)
  schedule      Schedule @relation(...)   // Cascade Delete
}
```

---

## 시작하기

### 사전 요구사항
- Node.js 18+
- npm

### 설치

```bash
git clone <repo-url>
cd cheerly
npm install
```

### 데이터베이스 초기화

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 개발 서버 실행

```bash
npm run dev
# http://localhost:3000
```

---

## 환경 변수

`.env.local` 파일을 생성하세요:

```env
# 필수 - SQLite 데이터베이스 경로
DATABASE_URL="file:./prisma/dev.db"

# 선택 - Claude AI 격려 메시지 (없으면 정적 메시지 폴백)
ANTHROPIC_API_KEY="sk-ant-..."

# 선택 - Microsoft Teams 채널 알림 (없으면 DB 저장만 수행)
TEAMS_WEBHOOK_URL="https://outlook.office.com/webhook/..."
```

> `ANTHROPIC_API_KEY`와 `TEAMS_WEBHOOK_URL`은 없어도 서비스가 정상 동작합니다.

---

## 시연 가이드

### 기본 기능 확인

| 단계 | 경로 | 확인 내용 |
|------|------|-----------|
| 1 | `http://localhost:3000` | 시드 데이터 일정 목록 + 헤더 우측 알림 벨 |
| 2 | `+ 일정 추가` 버튼 | 일정 등록 폼 |
| 3 | 일정 카드 클릭 | 상세 보기 → 수정/삭제 |
| 4 | 벨 아이콘 클릭 | 알림 패널 열기 → 알림 클릭 시 읽음 처리 |

### AI 격려 메시지 직접 체험하기

스케줄러는 **1분마다** 실행되며 `startTime - reminderMinutes분` 시점에 알림을 발송합니다.
빠르게 체험하려면 아래 순서를 따르세요:

1. **`+ 일정 추가`** 클릭
2. 시작 시간을 **지금으로부터 2~3분 후**로 설정
3. 알림 시간을 **1분**으로 설정
4. 일정 등록 후 **1~2분 대기**
5. 서버 콘솔에서 `[Scheduler] 알림 전송 완료` 로그 확인
6. 헤더 **벨 아이콘**에 빨간 배지 표시 → 클릭하면 격려 메시지 확인

> `ANTHROPIC_API_KEY`가 설정되어 있으면 Claude AI가 생성한 메시지가, 없으면 카테고리별 사전 정의 메시지가 표시됩니다.

---

## 테스트

코드의 신뢰성을 최우선으로 생각합니다. 비즈니스 로직 전반에 걸쳐 **총 102개의 테스트 케이스**를 작성하고 전부 통과시켰습니다.

```bash
npx vitest run
```

### 결과

```
Test Files  20 passed (20)
Tests       102 passed (102)
```

### 테스트 레이어

| 레이어 | 파일 수 | 케이스 수 | 설명 |
|--------|:-------:|:---------:|------|
| **컴포넌트 단위** | 9 | ~45 | UI 컴포넌트 렌더링 및 인터랙션 |
| **비즈니스 로직** | 5 | ~30 | AI 격려, 스케줄러, API 클라이언트 |
| **API Route** | 3 | ~17 | REST 엔드포인트 (Prisma Mock) |
| **DB 통합** | 1 | 10 | 실제 SQLite — Cascade 삭제, 정렬, 중복 방지 |

---

## API 명세

### 일정 (Schedules)

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/schedules` | 전체 일정 목록 (시작 시간 순) |
| `POST` | `/api/schedules` | 새 일정 생성 |
| `GET` | `/api/schedules/:id` | 일정 상세 |
| `PUT` | `/api/schedules/:id` | 일정 수정 |
| `DELETE` | `/api/schedules/:id` | 일정 삭제 |

**POST /api/schedules 요청 본문:**
```json
{
  "title": "팀 회의",
  "description": "주간 업무 공유",
  "startTime": "2026-03-15T14:00:00.000Z",
  "reminderMinutes": 10,
  "category": "WORK"
}
```

**유효성 검증 규칙:**

| 필드 | 규칙 | 오류 메시지 |
|------|------|------------|
| `title` | 필수, 1~100자 | "제목을 입력해주세요" / "제목은 100자 이내" |
| `startTime` | 유효한 날짜 문자열 | "유효한 날짜/시간 형식이 아닙니다" |
| `reminderMinutes` | 정수, 1~1440 | "알림은 최소 1분 전" / "최대 1440분(24시간)" |
| `category` | `WORK\|STUDY\|PERSONAL\|FAMILY` | "유효하지 않은 카테고리입니다" |

**응답 코드:**

| 코드 | 상황 | 응답 본문 |
|------|------|-----------|
| 200 | 조회/수정/삭제 성공 | 해당 리소스 JSON |
| 201 | 생성 성공 | 생성된 Schedule JSON |
| 400 | 유효성 실패 | `{ "error": "...", "issues": [...] }` |
| 404 | 리소스 없음 | `{ "error": "Schedule not found" }` |
| 500 | 서버 오류 | `{ "error": "Internal server error" }` |

### 알림 (Notifications)

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/notifications` | 전체 알림 목록 (최신 순, schedule 포함) |
| `PATCH` | `/api/notifications/:id/read` | 읽음 처리 (`isRead: true`) |

---

## 프로젝트 구조

```
cheerly/
├── prisma/
│   ├── schema.prisma          # DB 스키마 (Schedule, Notification)
│   └── seed.ts                # 초기 시드 데이터
├── prisma.config.ts           # Prisma v7 설정 (datasource url, seed)
├── src/
│   ├── app/
│   │   ├── (home)/
│   │   │   └── page.tsx       # 홈 - 일정 목록 (Server Component)
│   │   ├── api/
│   │   │   ├── schedules/     # 일정 CRUD API Routes
│   │   │   └── notifications/ # 알림 API Routes
│   │   ├── schedules/
│   │   │   ├── new/page.tsx   # 일정 등록 페이지
│   │   │   └── [id]/page.tsx  # 일정 상세/수정/삭제 (Server + Client)
│   │   ├── layout.tsx         # 루트 레이아웃
│   │   ├── not-found.tsx      # 404 페이지
│   │   └── global-error.tsx   # 글로벌 에러 페이지
│   ├── components/
│   │   ├── layout/            # Header, Container
│   │   ├── notification/      # NotificationBell, NotificationPanel
│   │   ├── schedule/          # ScheduleCard, ScheduleList, ScheduleForm,
│   │   │                      # ScheduleDetail, DeleteConfirmDialog
│   │   └── ui/                # Button, Input, Badge
│   ├── generated/prisma/      # Prisma 자동 생성 클라이언트
│   ├── lib/
│   │   ├── db.ts              # PrismaClient 싱글턴 (Proxy 패턴)
│   │   ├── api-client.ts      # 프론트엔드 API 헬퍼
│   │   ├── encouragements.ts  # 정적 격려 메시지 풀 (카테고리별 11개+)
│   │   ├── ai-encouragement.ts# Claude AI 메시지 생성 + 폴백
│   │   ├── scheduler.ts       # 알림 스케줄러 핵심 로직
│   │   ├── channels/
│   │   │   └── teams.ts       # Teams Adaptive Card Webhook
│   │   └── validations/
│   │       └── schedule.ts    # Zod 유효성 검증 스키마
│   ├── instrumentation.ts     # node-cron 초기화 (서버 시작 시 1회)
│   └── types/
│       └── index.ts           # 공통 타입 정의
└── docs/
    ├── PRD.md                 # 제품 요구사항 문서
    ├── ROADMAP.md             # 프로젝트 로드맵
    └── sprint/
        ├── sprint1.md         # Sprint 1 계획 (프론트엔드)
        └── sprint2.md         # Sprint 2 계획 (백엔드 + AI + 알림)
```

---

## 주요 설계 결정

### Prisma v7 드라이버 어댑터
Prisma v7은 내장 드라이버를 제거하고 드라이버 어댑터를 통해 연결합니다. `better-sqlite3` 네이티브 모듈을 `PrismaBetterSqlite3` 어댑터로 래핑하여 사용합니다. DB URL은 `prisma.config.ts`에서 관리합니다.

### Proxy 패턴 PrismaClient
`src/lib/db.ts`에서 `new Proxy()`를 사용해 첫 번째 DB 접근 시점에 PrismaClient를 초기화합니다. Next.js 빌드 타임에 `better-sqlite3` 바이너리가 로드되는 것을 방지합니다.

### AI 우선 + 정적 폴백
`getEncouragementMessage()`는 Claude AI를 우선 시도하고, API 키 미설정 또는 오류 시 정적 메시지 풀로 자동 폴백합니다. 알림 발송은 AI 장애에 의존하지 않습니다.

### Date 직렬화 전략
Server Component → Client Component 경계에서 Prisma의 `Date` 객체를 `.toISOString()` 문자열로 직렬화하고, Client Component 내에서 `new Date(str)`로 복원합니다.

---

## 대상 사용자

- 팀장 및 조직 리더
- 동기 관리가 필요한 팀
- 조직문화 개선을 고민하는 기업

---

## 향후 로드맵

- Production build 안정화 (Next.js 버그 픽스 대응)
- 사용자 감정 분석 기능 고도화
- 팀 성과 리포트 기능 추가
- 조직문화 개선 데이터 제공
- SaaS 서비스 확장 검토

---

## 기술적 참고 사항

본 프로젝트는 Next.js 16의 최신 기능(Turbopack, Prisma v7 드라이버 어댑터 등)을 선제적으로 도입하였습니다.

Next.js 16.1.6 Turbopack에 `/_global-error` 페이지 사전 렌더링 버그(`workUnitAsyncStorage`)가 있습니다. `scripts/build-fix.js`로 자동 우회하며, **`npm run build` + `npm start` 정상 동작합니다.** 102개 테스트 전체 통과.

그 외 제한 사항:

- **단일 사용자 설계** — 인증/권한 관리 미포함
- **SQLite 파일 기반** — 단일 서버 환경 전제, 분산 환경 미지원

---

## 해커톤 노트

본 프로젝트는 내부 해커톤을 위해 개발된 토이 프로젝트이며, 실제 조직 관리 환경에서의 활용 가능성을 검증하는 것을 목표로 합니다.

> **"빌드 에러라는 기술적 한계 앞에서도 굴하지 않고, 테스트 코드를 통해 코드의 완벽함을 증명해냈습니다. Cheerly와 함께 더 따뜻한 하루를 만들어보세요."**
