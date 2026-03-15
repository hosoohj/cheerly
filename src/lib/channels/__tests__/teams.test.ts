import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendTeamsNotification } from '../teams'

describe('sendTeamsNotification', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('Teams 웹훅으로 메시지를 전송한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 200 }))

    const result = await sendTeamsNotification('https://webhook.url', {
      title: '팀 회의',
      message: '20분 후 팀 회의가 시작됩니다.',
      encouragement: '잘 준비하셨을 거예요. 화이팅!',
      scheduleId: 'cuid1',
    })

    expect(result).toBe(true)
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('웹훅 URL이 없으면 false를 반환한다', async () => {
    const result = await sendTeamsNotification('', {
      title: '팀 회의',
      message: '20분 후 팀 회의가 시작됩니다.',
      encouragement: '화이팅!',
      scheduleId: 'cuid1',
    })

    expect(result).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('HTTP 오류 시 재시도 후 false를 반환한다', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))

    const result = await sendTeamsNotification('https://webhook.url', {
      title: '팀 회의',
      message: '20분 후 팀 회의가 시작됩니다.',
      encouragement: '화이팅!',
      scheduleId: 'cuid1',
    })

    expect(result).toBe(false)
    expect(fetch).toHaveBeenCalledTimes(3) // 3회 재시도
  })
})
