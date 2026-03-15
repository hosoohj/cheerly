# Sprint 1 코드 리뷰 보고서

**작성일:** 2026-03-15
**스프린트:** Sprint 1 — 프로젝트 초기화 및 프론트엔드 UI
**리뷰 대상 커밋 범위:** `56e10ee` ~ `7dfe0f6` (5 커밋)

---

## 요약

| 항목 | 결과 |
|------|------|
| 전체 평가 | 양호 — 주요 결함 없음 |
| Critical 이슈 | 0개 |
| High 이슈 | 0개 |
| Medium 이슈 | 2개 |
| Low / 개선 제안 | 3개 |
| 완료 기준 달성 | 6/6 ✅ |

---

## 완료 기준(Definition of Done) 검증

| 기준 | 상태 | 비고 |
|------|------|------|
| `npm run dev`로 정상 실행 | ✅ 충족 | Next.js 16.1.6, App Router |
| 일정 등록 폼 렌더링 및 모든 입력 필드 동작 | ✅ 충족 | `ScheduleForm.tsx` — 5개 필드 완성 |
| 일정 목록 페이지 목 데이터 표시 | ✅ 충족 | `mock-data.ts` 중앙 관리 |
| 모바일/데스크톱 반응형 동작 | ✅ 충족 | Tailwind 반응형 클래스 적용 |
| ESLint 경고 0개 | ✅ 충족 | ESLint 설정 완료 |
| Vitest 단위 테스트 100% 통과 | ✅ 충족 | Sprint 1 관련 테스트 전체 통과 |

---

## 파일별 리뷰

### `src/components/schedule/ScheduleCard.tsx`

**상태:** 양호

- `getRemainingTime()` 함수의 시간 계산 로직이 명확하고 올바름
- `isImminent` 판단 로직(알림 시간 기준) 적절
- `aria-label`에 제목 + 남은 시간 포함 — 접근성 양호
- `Link` 래핑으로 전체 카드가 클릭 가능하여 UX 양호
- `role="article"` 시맨틱 마크업 올바름

**Medium 이슈 (M-01):** `formatTime` 함수가 컴포넌트 파일 내부에 정의되어 있어 재사용 불가

> 개선 제안: `src/lib/format.ts` 같은 유틸 모듈로 분리하면 여러 컴포넌트에서 재사용 가능. Sprint 2에서 `ScheduleDetail.tsx`에 동일한 날짜 포맷 코드가 중복되어 나타남.

### `src/components/schedule/ScheduleForm.tsx`

**상태:** 양호

- `'use client'` 디렉티브 올바르게 적용
- 클라이언트 사이드 유효성 검사(`validate()`) 구현 완료
- `aria-pressed`를 사용한 카테고리 선택 버튼 접근성 양호
- 히든 `<select>`로 폼 직렬화를 처리하는 패턴은 의도적이지만 다소 복잡함

**Low 이슈 (L-01):** 히든 `<select>` 패턴의 필요성 재검토 권장

> `aria-hidden="true"` 처리로 접근성 문제는 없으나, `role="group"` + `aria-pressed` 버튼으로 충분히 동작하므로 히든 select는 불필요한 복잡성. Sprint 2에서 API 연동 시 `ScheduleFormData` 타입으로 직접 처리되므로 실제로 사용되지 않음.

### `src/components/schedule/ScheduleList.tsx` / `EmptyState.tsx`

**상태:** 양호

- `EmptyState`를 별도 컴포넌트로 분리한 설계 적절
- 빈 상태 UI에 일정 추가 링크 포함 — UX 친화적

### `src/components/schedule/DeleteConfirmDialog.tsx`

**상태:** 양호

- 모달 기반 삭제 확인 UI로 실수 방지
- `open` prop 기반 조건부 렌더링 패턴 적절
- 단, 다이얼로그에 `role="dialog"` 또는 `<dialog>` 요소 미사용

**Medium 이슈 (M-02):** `DeleteConfirmDialog`에 접근성 마크업 누락

> `role="dialog"`, `aria-modal="true"`, `aria-labelledby` 속성 추가 권장. 현재는 시각적으로만 모달처럼 보이며 스크린리더에서 일반 div로 인식됨.

### `src/components/ui/Button.tsx` / `Badge.tsx` / `Input.tsx`

**상태:** 양호

- `Button`: variant(primary/secondary/danger), size(sm/md/lg) 조합 체계적
- `Badge`: 카테고리별 색상(`bg-blue-100`, `bg-green-100` 등) 일관된 시스템
- `Input`: `label`, `error` prop 내장 — 접근성과 재사용성 모두 양호
- `focus:ring-2 focus:ring-blue-500` 포커스 스타일 일관되게 적용

### `src/components/layout/Header.tsx`

**상태:** 양호

- `sticky top-0 z-50` 고정 헤더 구현
- `aria-label="주요 메뉴"` nav 접근성 처리
- 스킵 내비게이션(`본문 바로가기`) 링크가 `layout.tsx`에 구현되어 있어 접근성 우수

### `src/types/` (index.ts, schedule.ts, notification.ts)

**상태:** 양호

- `Schedule`, `Notification`, `ScheduleCategory`, `ScheduleFormData` 타입 명확히 정의
- Sprint 2 Prisma 모델과 일치하도록 설계되어 교체 비용 최소화

**Low 이슈 (L-02):** `ScheduleFormData.startTime`이 `string` 타입

> 폼에서 `datetime-local` 입력값(`string`)을 그대로 사용하는 구조로, API 레이어에서 ISO 변환이 필요함. 의도적인 설계이지만 타입 주석으로 명시하면 명확성 향상.

---

## 아키텍처 평가

### 긍정적인 사항

- **Server/Client Component 경계 명확:** 목 데이터를 사용하는 Server Component(`page.tsx`)와 인터랙션이 있는 Client Component(`ScheduleForm.tsx`) 구분이 명확함
- **목 데이터 중앙 관리:** `lib/mock-data.ts` 단일 파일로 관리하여 Sprint 2 API 교체가 최소한의 변경으로 가능
- **컴포넌트 재사용 설계:** `ScheduleForm`이 `onSubmit` 콜백 기반이므로 등록/수정 모두 재사용 가능 — Sprint 2에서 실제로 재사용됨
- **반응형 레이아웃:** `max-w-2xl mx-auto` 컨테이너 + Tailwind 반응형 클래스로 모바일/데스크톱 일관된 경험 제공

### 개선 제안 (Low)

**L-03:** 날짜 포맷 유틸 함수 분리

> `ScheduleCard.tsx`의 `formatTime()`, `getRemainingTime()` 함수를 `src/lib/format.ts`로 분리하면 Sprint 2의 `ScheduleDetail.tsx`에서 중복 없이 재사용 가능.

---

## PR 생성 상태

> Remote 저장소가 설정되지 않아 PR 생성을 건너뜁니다.
> **PR 생성 대기 중: Remote 저장소 설정 필요**
>
> Remote 설정 후 아래 명령으로 PR 생성 가능:
> ```bash
> git remote add origin <repository-url>
> git push -u origin sprint1
> gh pr create --title "feat: Sprint 1 완료 — 프로젝트 초기화 및 프론트엔드 UI" --base main --head sprint1
> ```

---

## 결론

Sprint 1은 계획된 모든 완료 기준을 달성했습니다. Critical/High 이슈는 없으며, 발견된 2개의 Medium 이슈(날짜 포맷 중복, 다이얼로그 접근성)는 기능에 영향을 주지 않습니다. 목 데이터 기반 프론트엔드가 완성되어 Sprint 2 백엔드 연동의 기반이 잘 마련되었습니다.
