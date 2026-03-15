import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn().mockResolvedValue({
  content: [{ type: 'text', text: 'AI 격려 메시지입니다. 파이팅!' }],
})

// Anthropic SDK mock - class constructor 형태
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate }
  },
}))

import { generateAIEncouragement, getEncouragementMessage } from '../ai-encouragement'

describe('generateAIEncouragement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('AI 격려 메시지를 생성한다', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'AI 격려 메시지입니다. 파이팅!' }],
    })
    const msg = await generateAIEncouragement('팀 회의', 'WORK')
    expect(typeof msg).toBe('string')
    expect(msg.length).toBeGreaterThan(0)
  })
})

describe('getEncouragementMessage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('API 키가 있으면 AI 메시지를 반환한다', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'AI 격려 메시지입니다. 파이팅!' }],
    })
    const msg = await getEncouragementMessage('팀 회의', 'WORK')
    expect(msg).toBe('AI 격려 메시지입니다. 파이팅!')
  })

  it('API 키가 없으면 정적 메시지를 반환한다', async () => {
    delete process.env.ANTHROPIC_API_KEY
    const msg = await getEncouragementMessage('팀 회의', 'WORK')
    expect(typeof msg).toBe('string')
    expect(msg.length).toBeGreaterThan(0)
  })
})
