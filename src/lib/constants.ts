import type { ScheduleCategory } from '@/types'

/**
 * 스케줄 카테고리 단일 소스 — 새 카테고리 추가 시 여기만 수정
 */
export const SCHEDULE_CATEGORIES: readonly ScheduleCategory[] = [
  'WORK',
  'STUDY',
  'PERSONAL',
  'FAMILY',
]

export const CATEGORY_LABELS: Record<ScheduleCategory, string> = {
  WORK: '업무',
  STUDY: '공부',
  PERSONAL: '개인',
  FAMILY: '가족',
}
