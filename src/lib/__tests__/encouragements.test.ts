import { describe, it, expect } from 'vitest'
import { getStaticEncouragement, ENCOURAGEMENT_MESSAGES } from '../encouragements'

describe('getStaticEncouragement', () => {
  it('카테고리별 메시지를 반환한다', () => {
    const msg = getStaticEncouragement('WORK')
    expect(typeof msg).toBe('string')
    expect(msg.length).toBeGreaterThan(0)
  })

  it('모든 카테고리에 메시지가 있다', () => {
    const categories = ['WORK', 'STUDY', 'PERSONAL', 'FAMILY'] as const
    categories.forEach((cat) => {
      const msg = getStaticEncouragement(cat)
      expect(msg).toBeTruthy()
    })
  })

  it('각 카테고리에 10개 이상의 메시지가 있다', () => {
    const categories = ['WORK', 'STUDY', 'PERSONAL', 'FAMILY'] as const
    categories.forEach((cat) => {
      expect(ENCOURAGEMENT_MESSAGES[cat].length).toBeGreaterThanOrEqual(10)
    })
  })

  it('동일 카테고리 호출 시 무작위 메시지를 반환한다', () => {
    const results = new Set<string>()
    for (let i = 0; i < 20; i++) {
      results.add(getStaticEncouragement('WORK'))
    }
    // 20번 호출 중 적어도 2개의 서로 다른 메시지가 나와야 함
    expect(results.size).toBeGreaterThan(1)
  })
})
