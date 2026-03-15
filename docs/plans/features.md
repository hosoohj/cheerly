# Cheerly — 기능 명세서

> 구현된 모든 기능의 상세 설명 및 동작 방식

---

## 1. 일정 관리 (CRUD)

Cheerly의 핵심 기반이 되는 일정 데이터 관리 기능. 단순 CRUD를 넘어 알림 시스템과 유기적으로 연결된다.

### 1.1 일정 등록

**경로:** `/schedules/new`

사용자는 다음 5개 필드로 일정을 등록한다.

| 필드 | 타입 | 필수 | 기본값 | 유효성 규칙 |
|------|------|:----:|--------|------------|
| 제목 | 문자열 | ✅ | — | 1~100자 |
| 설명 | 문자열 | — | — | 제한 없음 |
| 시작 시간 | DateTime | ✅ | — | 유효한 날짜/시간 |
| 알림 시간 | 정수 (분) | ✅ | 10분 | 1~1440 (최대 24시간 전) |
| 카테고리 | Enum | ✅ | PERSONAL | WORK / STUDY / PERSONAL / FAMILY |

등록 성공 시 축하 화면(`🎉`)이 표시되며, "계속 등록하기" 또는 "목록 보기" 선택지를 제공한다. API 오류 시 폼 위에 에러 메시지가 표시되어 사용자가 상황을 파악할 수 있다.

**내부 동작:**
```
ScheduleForm → POST /api/schedules → Zod 유효성 검증 → Prisma INSERT → 201 응답
```

### 1.2 일정 목록 조회

**경로:** `/` (홈 화면)

- 등록된 전체 일정을 **시작 시간 오름차순**으로 표시
- 각 일정 카드에 카테고리 컬러 배지 표시
  - WORK(업무): 파란색
  - STUDY(공부): 보라색
  - PERSONAL(개인): 초록색
  - FAMILY(가족): 주황색
- 일정이 없을 때는 `EmptyState` 컴포넌트로 등록 유도
- **Server Component**에서 Prisma를 직접 호출 — 페이지 로드 시 최신 데이터 보장

### 1.3 일정 상세 조회

**경로:** `/schedules/[id]`

- 일정의 모든 필드(제목, 설명, 시작 시간, 알림 시간, 카테고리) 표시
- 시작 시간은 한국어 로케일(`Intl.DateTimeFormat('ko-KR')`)로 포맷
  - 예: "2026년 3월 15일 오후 2:00"
- 수정/삭제 버튼을 통해 다음 액션으로 진입

### 1.4 일정 수정

상세 페이지에서 "수정" 버튼 클릭 시 **인라인 폼 전환** (별도 페이지 이동 없음).

- 기존 데이터가 폼에 자동 채워짐 (초기값 주입)
- PUT 요청으로 부분 업데이트 지원 — 변경된 필드만 전송 가능
- 수정 성공 시 `router.refresh()`로 상세 페이지 데이터 갱신
- 실패 시 에러 메시지 인라인 표시

### 1.5 일정 삭제

- "삭제" 버튼 클릭 시 `DeleteConfirmDialog` 모달 표시
- 일정 제목을 모달 내에 표시하여 실수 방지
- 확인 후 DELETE 요청 → 연관 `Notification` 레코드 **Cascade 자동 삭제** (Prisma 스키마에 `onDelete: Cascade` 설정)
- 삭제 완료 후 홈 화면으로 자동 이동

---

## 2. AI 격려 메시지 시스템

Cheerly의 핵심 차별화 기능. 단순 알림에 감정적 동기부여를 더한다.

### 2.1 Claude AI 메시지 생성

알림 발송 시점에 `getEncouragementMessage(scheduleTitle, category)`를 호출한다.

**AI 호출 명세:**

| 항목 | 값 |
|------|-----|
| 모델 | `claude-haiku-4-5-20251001` |
| max_tokens | 150 |
| 언어 | 한국어 |
| 톤 | 따뜻하고 진심 어린 |
| 분량 | 2~3문장 |
| 포맷 | 이모지 없이 텍스트만 |

**프롬프트 구조:**

```
다음 일정을 앞두고 있는 사람에게 짧고 따뜻한 격려 메시지를 한국어로 작성해주세요.
일정: "{scheduleTitle}" ({categoryLabel} 관련)
요구사항:
- 2~3문장으로 간결하게
- 따뜻하고 진심 어린 톤으로
- 구체적인 일정 내용을 반영하여
- 이모지 없이 텍스트만
```

"팀 주간 회의"라는 일정에 대해 AI가 생성하는 메시지 예시:
> "팀 회의를 통해 서로의 생각을 나누고 함께 성장할 기회입니다. 준비하신 내용을 자신 있게 공유하시고, 팀원들과 함께 좋은 결과를 만들어가세요."

### 2.2 정적 메시지 폴백

AI가 응답하지 않아도 알림은 반드시 발송된다. `ANTHROPIC_API_KEY` 미설정 시 즉시 정적 메시지로 전환, API 오류 발생 시 catch에서 정적 메시지로 폴백한다. 폴백 로직의 상세 구조는 `technical_design.md` 3절을 참고한다.

**카테고리별 정적 메시지 (각 11개, 랜덤 선택):**

| 카테고리 | 메시지 예시 |
|----------|------------|
| WORK (업무) | "잘 준비된 회의가 좋은 결과를 만듭니다. 믿어요!" |
| STUDY (공부) | "꾸준함이 천재를 이깁니다. 오늘도 화이팅!" |
| PERSONAL (개인) | "자신을 위한 시간, 충분히 누려요!" |
| FAMILY (가족) | "가족과 함께하는 시간은 소중한 선물이에요!" |

---

## 3. 자동 알림 스케줄러

사용자가 아무것도 하지 않아도 정해진 시간에 알림이 자동으로 발송된다. Cheerly 서비스의 자율적 동작을 담당하는 엔진이다.

### 3.1 초기화 메커니즘

`src/instrumentation.ts`의 `register()` 함수에서 서버 시작 시 단 한 번 초기화된다. `NEXT_RUNTIME === 'nodejs'` 가드로 Hot Reload 중복 등록을 방지하며, 테스트 환경에서는 실행되지 않는다. 초기화 코드 및 설계 원칙은 `technical_design.md` 4절을 참고한다.

### 3.2 알림 발송 로직

매분 실행되는 `checkAndSendReminders()` 함수의 동작 순서:

```
1. startTime > now 인 일정 전체 조회
   (각 일정에 최근 2분 내 Notification 포함 JOIN)

2. 각 일정에 대해:
   알림 발송 시간 = startTime - reminderMinutes분
   diff = |now - 알림 발송 시간|

3. diff > 60초 → 스킵 (아직 알림 시간 아님, 또는 이미 지남)

4. 최근 2분 내 기존 알림 있음 → 스킵 (중복 방지)

5. Claude AI 또는 정적 메시지로 격려 문구 생성

6. Notification 레코드 DB 저장
   { scheduleId, message, encouragement, sentAt: now }

7. TEAMS_WEBHOOK_URL 설정된 경우 → Teams Adaptive Card 전송
```

**알림 메시지 형식:**
```
"{일정 제목} 시작까지 {reminderMinutes}분 남았습니다."
```

---

## 4. 앱 내 알림 UI

알림 스케줄러가 DB에 저장한 Notification 레코드를 사용자에게 실시간으로 보여주는 인터페이스.

### 4.1 알림 벨 아이콘

홈 화면 헤더 우측에 고정 위치. 두 가지 상태를 가진다.

- **미읽음 알림 없음** — 회색 벨 아이콘만 표시
- **미읽음 알림 있음** — 빨간 배지에 미읽음 수 표시 (10개 초과 시 "9+" 표시)

서버 렌더링 시 `prisma.notification.count({ where: { isRead: false } })`로 초기 미읽음 수를 계산해 전달한다.

### 4.2 알림 패널

벨 아이콘 클릭 시 드롭다운 패널이 나타난다.

- 클릭 시점에 `GET /api/notifications` 호출하여 최신 알림 목록 로드
- 미읽음 알림은 **파란 배경 + 파란 점** 으로 시각적 구분
- 각 알림 항목에 표시되는 정보:
  - 연결된 일정 제목
  - 알림 메시지 ("OO 시작까지 N분 남았습니다")
  - AI 격려 문구 (파란 이탤릭 텍스트)
- 패널 외부 클릭 시 자동 닫힘

### 4.3 읽음 처리

알림 항목 클릭 시 세 가지 동작이 순차 실행된다.

```
알림 클릭
  → PATCH /api/notifications/:id/read 호출
  → 로컬 상태 즉시 업데이트 (isRead: true)
  → 헤더 배지 카운트 감소
  → /schedules/:scheduleId 페이지로 이동
```

API 호출 실패 시에도 페이지 이동은 정상 진행 — 사용자 경험을 막지 않는다.

---

## 5. Microsoft Teams Webhook 알림

개인 알림이 팀 채널로 확장되는 기능. 조직 단위 Cheerly 활용의 핵심.

### 5.1 Adaptive Card 구조

Teams 채널에 전송되는 카드는 3개의 블록으로 구성된다.

```
┌─────────────────────────────────┐
│  📅 팀 주간 회의                 │  ← 굵은 제목 (Bolder, Medium)
│                                 │
│  팀 주간 회의 시작까지 10분       │  ← 알림 메시지 (기본 색상)
│  남았습니다.                     │
│                                 │
│  잘 준비된 회의가 좋은 결과를     │  ← 격려 문구 (Accent 파란색)
│  만듭니다. 믿어요!               │
└─────────────────────────────────┘
```

### 5.2 전송 로직

`sendTeamsNotification(webhookUrl, payload, maxRetries = 3)` 함수 동작:

1. `TEAMS_WEBHOOK_URL` 미설정 → 즉시 `false` 반환, 나머지 알림 흐름 영향 없음
2. Adaptive Card JSON 빌드 후 POST 요청
3. `res.ok` 이면 `true` 반환 (성공)
4. 실패 시 즉시 재시도, 최대 3회
5. 3회 모두 실패 시 `false` 반환 후 로그 기록

Teams 전송 실패는 전체 알림 발송 프로세스를 중단하지 않는다.

---

## 6. 백엔드 API

Next.js App Router의 Route Handlers로 구현된 RESTful API.

### 6.1 엔드포인트 목록

**일정 (Schedules)**

| Method | Endpoint | 설명 | 응답 코드 |
|--------|----------|------|-----------|
| GET | `/api/schedules` | 전체 목록 (startTime 오름차순) | 200 |
| POST | `/api/schedules` | 새 일정 생성 | 201 |
| GET | `/api/schedules/:id` | 상세 조회 | 200 / 404 |
| PUT | `/api/schedules/:id` | 수정 (부분 업데이트) | 200 / 404 |
| DELETE | `/api/schedules/:id` | 삭제 (Notification Cascade) | 200 / 404 |

**알림 (Notifications)**

| Method | Endpoint | 설명 | 응답 코드 |
|--------|----------|------|-----------|
| GET | `/api/notifications` | 전체 목록 (sentAt 내림차순, schedule 포함) | 200 |
| PATCH | `/api/notifications/:id/read` | 읽음 처리 | 200 / 404 |

### 6.2 에러 응답 형식

모든 에러는 일관된 JSON 형식으로 반환된다.

```json
// 400 Bad Request (유효성 실패)
{
  "error": "유효성 검증 실패",
  "issues": [
    { "path": ["title"], "message": "제목을 입력해주세요" }
  ]
}

// 404 Not Found
{ "error": "Schedule not found" }

// 500 Internal Server Error
{ "error": "Internal server error" }
```

