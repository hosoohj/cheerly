import type { ScheduleFormData } from '@/types'

const BASE_URL = '/api'

export const scheduleApi = {
  async list() {
    const res = await fetch(`${BASE_URL}/schedules`)
    if (!res.ok) throw new Error('일정 목록 조회 실패')
    return res.json()
  },

  async get(id: string) {
    const res = await fetch(`${BASE_URL}/schedules/${id}`)
    if (!res.ok) throw new Error('일정 조회 실패')
    return res.json()
  },

  async create(data: ScheduleFormData) {
    const payload = {
      ...data,
      startTime: new Date(data.startTime).toISOString(),
    }
    const res = await fetch(`${BASE_URL}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message ?? '일정 등록 실패')
    }
    return res.json()
  },

  async update(id: string, data: Partial<ScheduleFormData>) {
    const payload = {
      ...data,
      startTime: data.startTime ? new Date(data.startTime).toISOString() : undefined,
    }
    const res = await fetch(`${BASE_URL}/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('일정 수정 실패')
    return res.json()
  },

  async delete(id: string) {
    const res = await fetch(`${BASE_URL}/schedules/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('일정 삭제 실패')
  },
}

export const notificationApi = {
  async list() {
    const res = await fetch(`${BASE_URL}/notifications`)
    if (!res.ok) throw new Error('알림 목록 조회 실패')
    return res.json()
  },

  async markAsRead(id: string) {
    const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
    })
    if (!res.ok) throw new Error('알림 읽음 처리 실패')
    return res.json()
  },
}
