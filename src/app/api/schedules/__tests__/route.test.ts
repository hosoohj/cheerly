import { describe, it, expect, vi, beforeEach } from 'vitest'

// prisma mock
vi.mock('@/lib/db', () => ({
  prisma: {
    schedule: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'
import { GET, POST } from '../route'
import { GET as GET_ONE, PUT, DELETE } from '../[id]/route'

function makeRequest(method: string, body?: unknown, params?: Record<string, string>) {
  const req = new Request('http://localhost/api/schedules', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return req
}

const mockSchedule = {
  id: 'cuid1',
  title: '팀 회의',
  description: '주간 업무',
  startTime: new Date('2026-03-20T10:00:00Z'),
  reminderMinutes: 10,
  category: 'WORK',
  createdAt: new Date('2026-03-15T09:00:00Z'),
  updatedAt: new Date('2026-03-15T09:00:00Z'),
}

describe('GET /api/schedules', () => {
  beforeEach(() => vi.clearAllMocks())

  it('일정 목록을 반환한다', async () => {
    vi.mocked(prisma.schedule.findMany).mockResolvedValue([mockSchedule])
    const res = await GET()
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].title).toBe('팀 회의')
  })
})

describe('POST /api/schedules', () => {
  beforeEach(() => vi.clearAllMocks())

  it('유효한 데이터로 일정을 생성한다', async () => {
    vi.mocked(prisma.schedule.create).mockResolvedValue(mockSchedule)
    const req = makeRequest('POST', {
      title: '팀 회의',
      startTime: '2026-03-20T10:00:00.000Z',
      reminderMinutes: 10,
      category: 'WORK',
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it('유효하지 않은 데이터는 400을 반환한다', async () => {
    const req = makeRequest('POST', { title: '' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('GET /api/schedules/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('일정 상세를 반환한다', async () => {
    vi.mocked(prisma.schedule.findUnique).mockResolvedValue(mockSchedule)
    const res = await GET_ONE(makeRequest('GET'), { params: Promise.resolve({ id: 'cuid1' }) })
    expect(res.status).toBe(200)
  })

  it('존재하지 않는 일정은 404를 반환한다', async () => {
    vi.mocked(prisma.schedule.findUnique).mockResolvedValue(null)
    const res = await GET_ONE(makeRequest('GET'), { params: Promise.resolve({ id: 'notexist' }) })
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/schedules/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('일정을 수정한다', async () => {
    vi.mocked(prisma.schedule.findUnique).mockResolvedValue(mockSchedule)
    vi.mocked(prisma.schedule.update).mockResolvedValue({ ...mockSchedule, title: '수정된 제목' })
    const req = makeRequest('PUT', { title: '수정된 제목' })
    const res = await PUT(req, { params: Promise.resolve({ id: 'cuid1' }) })
    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/schedules/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('일정을 삭제한다', async () => {
    vi.mocked(prisma.schedule.findUnique).mockResolvedValue(mockSchedule)
    vi.mocked(prisma.schedule.delete).mockResolvedValue(mockSchedule)
    const res = await DELETE(makeRequest('DELETE'), { params: Promise.resolve({ id: 'cuid1' }) })
    expect(res.status).toBe(204)
  })
})
