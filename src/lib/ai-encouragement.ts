import Anthropic from '@anthropic-ai/sdk'
import type { ScheduleCategory } from '@/types'
import { getStaticEncouragement } from './encouragements'

export async function generateAIEncouragement(
  scheduleTitle: string,
  category: ScheduleCategory
): Promise<string> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const categoryLabels: Record<ScheduleCategory, string> = {
    WORK: '업무',
    STUDY: '공부',
    PERSONAL: '개인',
    FAMILY: '가족',
  }

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: `다음 일정을 앞두고 있는 사람에게 짧고 따뜻한 격려 메시지를 한국어로 작성해주세요.
일정: "${scheduleTitle}" (${categoryLabels[category]} 관련)
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
  } catch {
    return getStaticEncouragement(category)
  }
}
