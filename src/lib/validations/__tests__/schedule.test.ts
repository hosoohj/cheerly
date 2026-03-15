import { describe, it, expect } from 'vitest'
import { createScheduleSchema, updateScheduleSchema } from '../schedule'

describe('createScheduleSchema', () => {
  const validData = {
    title: '팀 회의',
    description: '주간 업무 공유',
    startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    reminderMinutes: 10,
    category: 'WORK' as const,
  }

  it('유효한 데이터는 파싱에 성공한다', () => {
    const result = createScheduleSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('title이 비어있으면 실패한다', () => {
    const result = createScheduleSchema.safeParse({ ...validData, title: '' })
    expect(result.success).toBe(false)
  })

  it('title이 100자를 초과하면 실패한다', () => {
    const result = createScheduleSchema.safeParse({ ...validData, title: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('startTime이 ISO string이 아니면 실패한다', () => {
    const result = createScheduleSchema.safeParse({ ...validData, startTime: 'not-a-date' })
    expect(result.success).toBe(false)
  })

  it('reminderMinutes가 0이면 실패한다', () => {
    const result = createScheduleSchema.safeParse({ ...validData, reminderMinutes: 0 })
    expect(result.success).toBe(false)
  })

  it('reminderMinutes가 1440을 초과하면 실패한다', () => {
    const result = createScheduleSchema.safeParse({ ...validData, reminderMinutes: 1441 })
    expect(result.success).toBe(false)
  })

  it('유효하지 않은 category는 실패한다', () => {
    const result = createScheduleSchema.safeParse({ ...validData, category: 'INVALID' })
    expect(result.success).toBe(false)
  })

  it('description 없이도 성공한다', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { description: _desc, ...dataWithoutDesc } = validData
    const result = createScheduleSchema.safeParse(dataWithoutDesc)
    expect(result.success).toBe(true)
  })
})

describe('updateScheduleSchema', () => {
  it('모든 필드가 선택적이다', () => {
    const result = updateScheduleSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('title만 업데이트 가능하다', () => {
    const result = updateScheduleSchema.safeParse({ title: '수정된 제목' })
    expect(result.success).toBe(true)
  })

  it('category만 업데이트 가능하다', () => {
    const result = updateScheduleSchema.safeParse({ category: 'STUDY' })
    expect(result.success).toBe(true)
  })

  it('유효하지 않은 category는 실패한다', () => {
    const result = updateScheduleSchema.safeParse({ category: 'INVALID' })
    expect(result.success).toBe(false)
  })
})
