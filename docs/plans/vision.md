# Cheerly — Roadmap & Sprint History

> 아이디어에서 작동하는 제품까지, 그리고 그 다음 단계

---

## 현재 상태 (2026년 3월 기준)

**Phase 1 MVP 완료.** Sprint 1(프론트엔드 UI)과 Sprint 2(백엔드 + AI + 알림 시스템)가 모두 완료되었다. 일정 CRUD, Claude AI 격려 메시지, 1분 주기 알림 스케줄러, Microsoft Teams Webhook, 앱 내 알림 UI — 핵심 기능 전체가 작동한다. 53개의 단위 테스트가 모두 통과한다.

| Sprint | 내용 | 상태 |
|--------|------|------|
| **Sprint 1** | Concept & Foundation — 기획, 설계, 프론트엔드 UI | ✅ 완료 |
| **Sprint 2** | Core Feature Implementation — 백엔드 + AI + 알림 시스템 | ✅ 완료 |
| **Sprint 3** | Stabilization & Deployment | 📋 예정 |

---

## Sprint 이력

### Sprint 1 — Concept & Foundation ✅

**목표**: 서비스 아이디어를 정의하고, 사용자가 실제로 사용할 수 있는 UI를 완성한다.

**주요 성과:**
- 핵심 컨셉 확정: **Reminder + Encouragement**
- 사용자 시나리오 설계 (개인 → Teams 채널 자동 응원 흐름)
- Next.js 16.1.6 + TypeScript + Tailwind CSS v4 기반 프로젝트 구조 설정
- 전체 화면 UI 구현: 일정 목록(`/`), 등록(`/schedules/new`), 상세/수정/삭제(`/schedules/[id]`)
- 공통 UI 컴포넌트: Button, Input, Badge, Header, Container
- UI 컴포넌트 테스트 착수: Button, ScheduleCard, ScheduleForm, DeleteConfirmDialog

**완료 기준 달성:**
✅ `npm run dev` 정상 실행 · ✅ 반응형 동작 · ✅ ESLint/TypeScript 에러 0개

---

### Sprint 2 — Core Feature Implementation ✅

**목표**: 프론트엔드를 실제 백엔드와 연결하고, AI 격려 메시지 + 자동 알림 + Teams Webhook을 완성하여 MVP를 완성한다.

**주요 성과:**

| 영역 | 구현 내용 |
|------|---------|
| DB | Prisma v7 + SQLite, 드라이버 어댑터 방식, Proxy 패턴 지연 초기화 |
| API | RESTful API 전체 (`/api/schedules`, `/api/notifications`), Zod v4 유효성 검증 |
| AI | Claude claude-haiku-4-5-20251001 연동, 카테고리별 11개 × 4 = 44개 정적 폴백 |
| 스케줄러 | `instrumentation.ts` + `node-cron * * * * *`, ±60초 윈도우, 중복 방지 |
| Teams | Adaptive Card v1.4, 3회 재시도, 미설정 시 자동 스킵 |
| 알림 UI | 벨 아이콘 + 미읽음 배지 + 드롭다운 패널 + 읽음 처리 |
| 테스트 | 53개 단위 테스트 전체 통과 (12개 파일) |

**53개 테스트 구성:**

| 파일 | 수 | 내용 |
|------|:--:|------|
| `validations/schedule.test.ts` | 11 | Zod 유효성 검증 전수 |
| `schedules/route.test.ts` | 6 | API CRUD 동작 |
| `encouragements.test.ts` | 4 | 정적 메시지 반환 |
| `ai-encouragement.test.ts` | 3 | AI 생성 + 폴백 |
| `channels/teams.test.ts` | 3 | Webhook 전송/재시도 |
| `scheduler.test.ts` | 3 | 발송/중복방지/조건 |
| `Button.test.tsx` | 4 | UI 렌더링/스타일 |
| `ScheduleCard.test.tsx` | 3 | 카드 렌더링 |
| `ScheduleForm.test.tsx` | 4 | 폼 입력/제출 |
| `DeleteConfirmDialog.test.tsx` | 4 | 다이얼로그 흐름 |
| `NotificationBell.test.tsx` | 3 | 배지/패널/읽음 |
| `types/schedule.test.ts` | 3 | 타입 구조 검증 |

---

## Short-term Goals — 안정화와 출시

**Sprint 3** (해커톤 직후)

### Production Build 안정화
현재 `npm run build`는 Next.js 16 내부의 `workUnitAsyncStorage` 버그로 실패한다. 비즈니스 로직과 무관한 프레임워크 이슈이며, 모든 기능은 개발 서버에서 정상 동작한다.
- Next.js 버그 픽스 릴리스 모니터링 후 즉시 업그레이드
- 목표: `npm run build && npm run start`에서 모든 기능 정상 동작

### 배포 환경 구성
- Vercel 배포 설정 (Next.js에 최적화된 플랫폼)
- 환경변수 프로덕션 등록 (`ANTHROPIC_API_KEY`, `TEAMS_WEBHOOK_URL`)
- 배포 후 알림 스케줄러 동작 검증 (서버리스 환경에서의 `instrumentation.ts` 동작 확인)

### 오류 처리 및 UX 개선
- 전역 에러 바운더리 안정화 (`global-error.tsx`)
- API 에러 로깅 체계화
- AI 격려 메시지 체험 시나리오 간소화 (시작까지 걸리는 단계 최소화)

---

## Mid-term Goals — 메신저 확장과 개인화

**Sprint 4~5** (2026년 4~5월)

### 팀 성과 리포트 기능 추가
알림 이력과 일정 완료 데이터를 바탕으로 팀의 업무 리듬을 시각화한다.
- 주간/월간 일정 완료율 대시보드
- 카테고리별 일정 분포 차트
- Claude AI를 활용한 주간 팀 리포트 자동 생성

### 감정 상태 기반 알림 기능 고도화
- 시간대 인식 (아침 vs 저녁의 다른 톤)
- 반복 일정 감지 ("이번 주 세 번째 팀 회의네요" 류의 누적 컨텍스트)
- 사용자 피드백(좋아요/별로) 기반 메시지 개선

### 팀 협업 기능 확장
- KakaoTalk 알림 채널 추가 (카카오 API 연동)
- 알림 채널 사용자 설정 UI (`/settings` — 채널 ON/OFF, 알림 시간 커스터마이징)

---

## Long-term Vision — 조직문화 인텔리전스 플랫폼

**Sprint 6 이후** (2026년 하반기~)

### 감정 데이터 기반 조직문화 인사이트 제공
Cheerly가 축적하는 것은 단순한 일정 데이터가 아니다. "어떤 일정에 어떤 메시지가 효과적이었는가", "어떤 시간대에 팀의 참여율이 높은가" — 이 데이터들이 조직의 건강 상태를 보여주는 신호가 된다.
- 팀별 번아웃 위험 지표 감지
- 조직 에너지 수준 트렌드 리포트
- 리더십을 위한 팀 컨디션 대시보드

### 리더십 지원 SaaS 서비스 확장
- 팀원별 일정 부하 시각화
- 번아웃 위험 신호 자동 감지 + 리더에게 알림
- 기업 단위 구독 모델 (팀 규모 기반 월정액)

---

## 기능 확장 로드맵

| 단계 | 기능 | 상태 |
|------|------|------|
| **Phase 1 (완료)** | 일정 CRUD + Claude AI 격려 메시지 + 자동 알림 스케줄러 + Teams Webhook + 앱 내 알림 UI | ✅ |
| **Phase 2** | KakaoTalk 알림 + 반복 일정 + 사용자 알림 설정 | 📋 |
| **Phase 3** | 모바일 Push 알림 + 개인 일정 통계 + 생산성 분석 리포트 | 📋 |
| **Phase 4** | 다중 사용자 인증 + 팀 성과 리포트 + 조직문화 인사이트 + SaaS 확장 | 📋 |

---

## 기술 진화 계획

| 항목 | 현재 | 확장 시점 | 목표 |
|------|------|---------|------|
| 데이터베이스 | SQLite (파일 기반) | 다중 사용자 도입 시 | PostgreSQL (분산 환경 지원) |
| 인증 | 미포함 (단일 사용자) | Phase 4 | OAuth (Google, GitHub) |
| 스케줄러 | instrumentation.ts + node-cron | 서버리스 배포 시 | 전용 큐 서비스 (BullMQ, AWS SQS) |
| AI 모델 | Claude Haiku (빠른 응답) | 메시지 품질 고도화 시 | Claude Sonnet (더 깊은 맥락 이해) |
| 알림 채널 | Teams + 앱 내 | Phase 2 | KakaoTalk, 모바일 Push 추가 |

---

## 기술적 교훈

Sprint 1~2를 완료하며 얻은 실전 인사이트:

1. **Prisma v7은 다르다** — 드라이버 어댑터, import 경로, seed 설정이 v6과 완전히 달라졌다. 공식 문서가 v6 기준인 경우가 많아 직접 탐구가 필요했다.

2. **AI는 폴백이 필수다** — 프로덕션에서 AI는 언제든 실패할 수 있다. 처음부터 폴백 아키텍처를 설계에 포함하면 불필요한 방어 코드 없이 자연스럽게 무중단 구조가 완성된다.

3. **테스트가 자신감이다** — 빌드가 실패하는 상황에서도 "우리 코드는 맞다"고 말할 수 있는 근거는 53개의 테스트였다. TDD는 속도를 늦추는 것이 아니라 확신을 만들어주는 것이다.

4. **Server/Client 경계는 명확히** — Next.js App Router에서 Date 직렬화 문제는 경계를 설계 단계에서 명확히 하면 자연스럽게 해결된다. `SerializedSchedule` 인터페이스처럼 경계에서의 타입을 명시적으로 정의하는 것이 핵심이다.

---

## 우리가 믿는 것

우리는 **기술이 사람의 감정에 개입할 수 있다**고 믿는다. 알림 하나가 누군가의 하루를 바꿀 수 있다고 믿는다. 팀장의 수고 없이도 팀원이 응원받을 수 있어야 한다고 믿는다.

Short-term은 그것을 더 많은 사람이 경험할 수 있게 만드는 것이고, Mid-term은 더 깊이 개인화하는 것이며, Long-term은 조직이 서로를 더 잘 이해하는 문화를 만드는 것이다.

> **"우리가 만드는 것은 SaaS 서비스가 아니라, 매일 당신 편이 되어주는 동반자입니다."**
