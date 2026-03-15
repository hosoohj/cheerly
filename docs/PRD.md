# Cheerly PRD (Product Requirement Document)

## 1. 제품 개요

Cheerly는 일정 시작 전에 알림과 함께 AI 격려 메시지를 전달하여 사용자가 일정 준비를 할 수 있도록 돕는 스마트 일정 관리 서비스입니다.

기존 일정 관리 서비스는 단순히 일정 시간을 알려주는 역할에 집중하지만, Cheerly는 사용자의 감정적 동기부여까지 고려하여 일정 시작 전에 Claude AI가 생성한 맞춤 응원과 격려 메시지를 함께 전달하는 것을 목표로 합니다.

**예시 메시지**

- "팀 회의 시작까지 10분 남았습니다. 충분히 준비되었습니다. 자신감 있게 임해보세요!"
- "공부 시작 시간입니다. 조금만 더 집중하면 목표에 가까워집니다."

**핵심 컨셉**

```
Reminder + Encouragement
```

단순한 알림이 아니라 사용자를 응원하는 일정 관리 서비스입니다.

---

## 2. 대상 사용자

Cheerly의 주요 대상 사용자는 다음과 같습니다.

**학생**
- 시험 공부 일정 관리
- 스터디 시간 관리

**직장인**
- 회의 일정 관리
- 업무 마감 일정 관리
- 주간 보고 알림

**팀 리더 / 조직 관리자**
- 팀원 동기부여
- 조직 일정 관리
- 번아웃 예방

**워킹맘**
- 아이 하원 시간 관리
- 가족 일정 관리
- 개인 일정 관리

---

## 3. 기능 명세

### 3.1 일정 관리 (CRUD)

**일정 등록**

사용자는 새로운 일정을 등록할 수 있습니다.

입력 항목:

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| 제목 | 문자열 (최대 100자) | 필수 | - | 일정 이름 |
| 설명 | 문자열 | 선택 | - | 일정 메모 |
| 시작 시간 | DateTime | 필수 | - | 일정 시작 일시 |
| 알림 시간 | 정수 (1~1440분) | 필수 | 10분 | 일정 시작 N분 전 알림 |
| 일정 유형 | Enum | 필수 | PERSONAL | WORK / STUDY / PERSONAL / FAMILY |

**일정 목록 조회**

- 등록된 전체 일정 조회
- 시작 시간 순 정렬 (오름차순)
- 카테고리 배지 표시

**일정 상세 조회**

- 일정 상세 정보 및 관련 알림 이력 표시

**일정 수정**

- 등록된 일정의 모든 필드 수정 가능

**일정 삭제**

- 삭제 확인 다이얼로그 후 삭제
- 연관 알림 Cascade 삭제

---

### 3.2 AI 격려 메시지 시스템

**Claude AI 연동**

- 모델: Claude claude-haiku-4-5-20251001 (`max_tokens: 150`)
- 일정 제목과 카테고리를 컨텍스트로 맞춤 한국어 격려 메시지 생성
- 생성 조건: 2~3문장, 따뜻하고 진심 어린 톤, 이모지 없이 텍스트만, 일정 내용 반영

**프롬프트 예시**

```
다음 일정을 앞두고 있는 사람에게 짧고 따뜻한 격려 메시지를 한국어로 작성해주세요.
일정: "팀 주간 회의" (업무 관련)
요구사항:
- 2~3문장으로 간결하게
- 따뜻하고 진심 어린 톤으로
- 구체적인 일정 내용을 반영하여
- 이모지 없이 텍스트만
```

**카테고리 매핑**

| Enum | 한국어 레이블 |
|------|--------------|
| WORK | 업무 |
| STUDY | 공부 |
| PERSONAL | 개인 |
| FAMILY | 가족 |

**정적 메시지 폴백**

- ANTHROPIC_API_KEY 미설정 또는 API 오류 시 카테고리별 사전 정의 메시지(카테고리당 11개, 랜덤 선택)로 자동 전환
- AI 장애가 알림 발송을 막지 않음 (무중단)
- 폴백 우선순위: API 키 없음 → 즉시 정적 / API 오류 → catch 후 정적

**정적 메시지 예시 (WORK 카테고리)**

- "오늘도 최선을 다하는 당신, 정말 멋져요! 화이팅!"
- "잘 준비된 회의가 좋은 결과를 만듭니다. 믿어요!"
- "준비하신 만큼 좋은 결과가 있을 거예요!" (외 8개)

---

### 3.3 자동 알림 스케줄러

**실행 주기 및 초기화**

- `src/instrumentation.ts`의 `register()` 함수에서 node-cron `* * * * *`(매 1분, 정각 :00초) 스케줄 등록
- 초기화 조건: `NEXT_RUNTIME === 'nodejs' && NODE_ENV !== 'test'`
  - Next.js Hot Reload 시 재실행 방지 (Edge Runtime, 테스트 환경 제외)
  - 서버 시작 로그: `[Scheduler] 알림 스케줄러 시작`

**알림 대상 선정 로직**

```
알림 발송 시간 = startTime - reminderMinutes분
발송 조건: |현재 시간 - 알림 발송 시간| ≤ 60초 (±60초 윈도우)
중복 방지: 최근 2분 내 동일 scheduleId의 Notification 레코드가 있으면 스킵
```

**처리 순서**

1. `startTime > now`인 일정 전체 조회 (최근 2분 알림 포함)
2. 각 일정의 알림 발송 시간과 현재 시간 차이 계산
3. ±60초 윈도우 밖이면 스킵
4. 최근 2분 내 기존 알림이 있으면 스킵
5. Claude AI 또는 정적 메시지로 격려 문구 생성
6. Notification 레코드 DB 저장
7. Teams Webhook 전송 (URL 설정 시)

---

### 3.4 알림 채널

**앱 내부 알림 (구현 완료)**

- 헤더 우측 알림 벨 아이콘 + 미읽음 배지
- 클릭 시 알림 패널 드롭다운
- 알림 클릭 → 읽음 처리 + 해당 일정 상세 페이지 이동

**Microsoft Teams 알림 (구현 완료)**

- Teams Webhook을 통해 Adaptive Card v1.4 포맷으로 전송
- 카드 구성: 일정명(굵게), 알림 메시지, AI 격려 문구(Accent 색상)
- 3회 자동 재시도 (실패 즉시 재시도, 딜레이 없음)
- TEAMS_WEBHOOK_URL 미설정 시 자동 스킵 (선택적 연동)

**Adaptive Card 구조**

```json
{
  "type": "message",
  "attachments": [{
    "contentType": "application/vnd.microsoft.card.adaptive",
    "content": {
      "type": "AdaptiveCard",
      "version": "1.4",
      "body": [
        { "type": "TextBlock", "text": "📅 {일정명}", "weight": "Bolder", "size": "Medium" },
        { "type": "TextBlock", "text": "{알림 메시지}", "wrap": true },
        { "type": "TextBlock", "text": "{격려 문구}", "wrap": true, "color": "Accent" }
      ]
    }
  }]
}
```

**KakaoTalk 알림 (미구현 — Phase 2)**

**모바일 Push 알림 (미구현 — Phase 3)**

---

### 3.5 백엔드 API

RESTful API Routes:

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/schedules` | 일정 목록 |
| POST | `/api/schedules` | 일정 생성 |
| GET | `/api/schedules/:id` | 일정 상세 |
| PUT | `/api/schedules/:id` | 일정 수정 |
| DELETE | `/api/schedules/:id` | 일정 삭제 |
| GET | `/api/notifications` | 알림 목록 |
| PATCH | `/api/notifications/:id/read` | 읽음 처리 |

**입력 유효성 검증 규칙 (Zod v4)**

| 필드 | 규칙 |
|------|------|
| title | 최소 1자, 최대 100자 |
| description | 선택, 문자열 |
| startTime | 유효한 날짜/시간 문자열 (`Date.parse()` 통과) |
| reminderMinutes | 정수, 1~1440 범위 |
| category | `WORK \| STUDY \| PERSONAL \| FAMILY` |

**응답 코드 규칙**

| 코드 | 상황 |
|------|------|
| 200 | 조회/수정/삭제 성공 |
| 201 | 생성 성공 |
| 400 | 유효성 검증 실패 (`{ error, issues }`) |
| 404 | 리소스 없음 (`{ error: "Schedule not found" }`) |
| 500 | 서버 오류 (`{ error: "Internal server error" }`) |

---

## 4. 기술 스택 (구현 기준)

| 분류 | 기술 |
|------|------|
| **프레임워크** | Next.js 16.1.6 (App Router) |
| **언어** | TypeScript |
| **데이터베이스** | SQLite (better-sqlite3) |
| **ORM** | Prisma v7.5.0 (드라이버 어댑터 방식) |
| **AI** | Anthropic Claude claude-haiku-4-5-20251001 |
| **스케줄러** | node-cron v4 |
| **유효성 검증** | Zod v4 |
| **스타일** | Tailwind CSS v4 |
| **테스트** | Vitest v4 + Testing Library (53개 테스트) |
| **외부 연동** | Microsoft Teams Webhook (Adaptive Card) |

---

## 5. 데이터 모델

```prisma
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

---

## 6. Phase 기반 기능 확장 계획

### Phase 1 — MVP (해커톤, 구현 완료)

- ✅ 일정 CRUD (등록/조회/수정/삭제)
- ✅ Claude AI 기반 맞춤 격려 메시지 (정적 폴백 포함)
- ✅ 자동 알림 스케줄러 (1분 주기, ±60초 윈도우, 중복 방지)
- ✅ Microsoft Teams Webhook 알림
- ✅ 앱 내부 알림 UI (벨 아이콘, 패널, 읽음 처리)
- ✅ 53개 단위 테스트

### Phase 2 — 메신저 확장

- KakaoTalk 알림 연동
- 반복 일정 기능
- 사용자별 알림 설정 (채널, 시간 커스터마이징)

### Phase 3 — 모바일 기능

- 모바일 Push Notification
- 개인 일정 통계
- 생산성 분석 리포트

### Phase 4 — 고도화

- 사용자 인증 / 다중 사용자 지원
- 일정 추천 기능
- 팀 성과 리포트
- SaaS 서비스 확장

---

## 7. 기대 효과

Cheerly는 단순한 일정 관리 서비스가 아니라 사용자의 생산성과 동기부여를 함께 높이는 서비스입니다.

- 일정 준비 시간 확보
- 생산성 향상
- 사용자 동기부여 증가
- 번아웃 예방
- 팀 분위기 개선

---

## 8. 프로젝트 목표

1. 일정 관리의 편의성 향상
2. AI 기반 사용자 동기부여 제공
3. 다양한 알림 채널 지원 (Teams, 앱 내부)
4. 확장 가능한 스마트 일정 관리 서비스로 발전
