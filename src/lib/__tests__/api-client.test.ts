import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { scheduleApi, notificationApi } from '../api-client'

function mockOk(data: unknown, status = 200) {
  return Promise.resolve({
    ok: true,
    status,
    json: () => Promise.resolve(data),
  })
}

function mockError(status: number, body: unknown = { error: '서버 오류' }) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  })
}

const mockSchedule = { id: 'cuid1', title: '팀 회의' }

describe('scheduleApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('list — 일정 목록을 반환한다', async () => {
    mockFetch.mockReturnValue(mockOk([mockSchedule]))
    const result = await scheduleApi.list()
    expect(result).toHaveLength(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/schedules')
  })

  it('list — 실패 시 에러를 던진다', async () => {
    mockFetch.mockReturnValue(mockError(500))
    await expect(scheduleApi.list()).rejects.toThrow('일정 목록 조회 실패')
  })

  it('get — 단일 일정을 반환한다', async () => {
    mockFetch.mockReturnValue(mockOk(mockSchedule))
    const result = await scheduleApi.get('cuid1')
    expect(result.id).toBe('cuid1')
    expect(mockFetch).toHaveBeenCalledWith('/api/schedules/cuid1')
  })

  it('create — 일정을 생성한다', async () => {
    mockFetch.mockReturnValue(mockOk(mockSchedule, 201))
    const result = await scheduleApi.create({
      title: '팀 회의',
      startTime: '2026-03-20T10:00',
      reminderMinutes: 10,
      category: 'WORK',
    })
    expect(result.id).toBe('cuid1')
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/schedules',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('create — 서버 오류 시 error 메시지를 포함한 에러를 던진다', async () => {
    mockFetch.mockReturnValue(mockError(400, { error: '유효성 검증 실패' }))
    await expect(
      scheduleApi.create({ title: '', startTime: '2026-03-20T10:00', reminderMinutes: 10, category: 'WORK' })
    ).rejects.toThrow('유효성 검증 실패')
  })

  it('update — 일정을 수정한다', async () => {
    mockFetch.mockReturnValue(mockOk({ ...mockSchedule, title: '수정된 제목' }))
    const result = await scheduleApi.update('cuid1', { title: '수정된 제목' })
    expect(result.title).toBe('수정된 제목')
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/schedules/cuid1',
      expect.objectContaining({ method: 'PUT' })
    )
  })

  it('delete — 일정을 삭제한다', async () => {
    mockFetch.mockReturnValue(Promise.resolve({ ok: true, status: 204 }))
    await expect(scheduleApi.delete('cuid1')).resolves.toBeUndefined()
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/schedules/cuid1',
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('delete — 실패 시 에러를 던진다', async () => {
    mockFetch.mockReturnValue(mockError(404))
    await expect(scheduleApi.delete('notexist')).rejects.toThrow('일정 삭제 실패')
  })
})

describe('notificationApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('list — 알림 목록을 반환한다', async () => {
    mockFetch.mockReturnValue(mockOk([{ id: 'notif1' }]))
    const result = await notificationApi.list()
    expect(result).toHaveLength(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/notifications')
  })

  it('list — 실패 시 에러를 던진다', async () => {
    mockFetch.mockReturnValue(mockError(500))
    await expect(notificationApi.list()).rejects.toThrow('알림 목록 조회 실패')
  })

  it('markAsRead — 알림을 읽음 처리한다', async () => {
    mockFetch.mockReturnValue(mockOk({ id: 'notif1', isRead: true }))
    const result = await notificationApi.markAsRead('notif1')
    expect(result.isRead).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/notifications/notif1/read',
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('markAsRead — 실패 시 에러를 던진다', async () => {
    mockFetch.mockReturnValue(mockError(404))
    await expect(notificationApi.markAsRead('notexist')).rejects.toThrow('알림 읽음 처리 실패')
  })
})
