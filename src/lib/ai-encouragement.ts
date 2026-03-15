import Anthropic from '@anthropic-ai/sdk'
import type { ScheduleCategory } from '@/types'
import { CATEGORY_LABELS } from '@/lib/constants'
import { getStaticEncouragement } from './encouragements'

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'

export async function generateAIEncouragement(
  scheduleTitle: string,
  category: ScheduleCategory
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return getStaticEncouragement(category)

  const client = new Anthropic({ apiKey })
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL

  const response = await client.messages.create({
    model,
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: `다음 일정을 앞두고 있는 사람에게 짧고 따뜻한 격려 메시지를 한국어로 작성해주세요.
일정: "${scheduleTitle}" (${CATEGORY_LABELS[category]} 관련)
요구사항:
- 2~3문장으로 간결하게
- 따뜻하고 진심 어린 톤으로
- 구체적인 일정 내용을 반영하여
- 이모지 없이 텍스트만`,
      },
    ],
  })

  const content = response.content[0]
  if (content.type === 'text') {
    return content.text.trim()
  }

  return getStaticEncouragement(category)
}

export async function getEncouragementMessage(
  scheduleTitle: string,
  category: ScheduleCategory
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return getStaticEncouragement(category)
  }

  try {
    return await generateAIEncouragement(scheduleTitle, category)
  } catch (err) {
    console.error('[AI] 격려 메시지 생성 실패, 정적 메시지로 폴백:', err)
    return getStaticEncouragement(category)
  }
}
