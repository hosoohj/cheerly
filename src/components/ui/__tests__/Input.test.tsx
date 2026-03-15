import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../Input'

describe('Input', () => {
  it('label이 있으면 렌더링한다', () => {
    render(<Input id="title" label="제목" />)
    expect(screen.getByLabelText('제목')).toBeInTheDocument()
  })

  it('error 메시지를 표시한다', () => {
    render(<Input error="필수 항목입니다" />)
    expect(screen.getByText('필수 항목입니다')).toBeInTheDocument()
  })

  it('error 시 입력 필드에 border-red-500 클래스가 적용된다', () => {
    render(<Input error="오류" />)
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500')
  })

  it('사용자 입력을 처리한다', async () => {
    const onChange = vi.fn()
    render(<Input onChange={onChange} />)
    await userEvent.type(screen.getByRole('textbox'), '안녕')
    expect(onChange).toHaveBeenCalled()
  })

  it('disabled 상태일 때 입력이 비활성화된다', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})
