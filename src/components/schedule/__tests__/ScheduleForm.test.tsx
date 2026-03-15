import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScheduleForm } from '../ScheduleForm'

describe('ScheduleForm 컴포넌트', () => {
  it('폼 필드가 모두 렌더링된다', () => {
    render(<ScheduleForm onSubmit={vi.fn()} />)
    expect(screen.getByLabelText(/일정 제목/)).toBeInTheDocument()
    expect(screen.getByLabelText(/시작 시간/)).toBeInTheDocument()
    expect(screen.getByLabelText(/알림 시간/)).toBeInTheDocument()
    expect(screen.getByLabelText(/일정 유형/)).toBeInTheDocument()
  })

  it('알림 시간 기본값이 10분이다', () => {
    render(<ScheduleForm onSubmit={vi.fn()} />)
    const reminderSelect = screen.getByLabelText(/알림 시간/) as HTMLSelectElement
    expect(reminderSelect.value).toBe('10')
  })

  it('제목이 비어있으면 제출이 막힌다', async () => {
    const onSubmit = vi.fn()
    render(<ScheduleForm onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: /일정 등록/ }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(await screen.findByText(/제목을 입력해 주세요/)).toBeInTheDocument()
  })

  it('유효한 데이터로 제출하면 onSubmit이 호출된다', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ScheduleForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/일정 제목/), '팀 회의')
    await user.type(screen.getByLabelText(/시작 시간/), '2026-03-15T10:00')
    fireEvent.click(screen.getByRole('button', { name: /일정 등록/ }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: '팀 회의' })
      )
    })
  })
})
