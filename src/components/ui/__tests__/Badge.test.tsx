import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '../Badge'

describe('Badge', () => {
  it('WORK 카테고리 레이블을 표시한다', () => {
    render(<Badge category="WORK" />)
    expect(screen.getByText('업무')).toBeInTheDocument()
  })

  it('STUDY 카테고리 레이블을 표시한다', () => {
    render(<Badge category="STUDY" />)
    expect(screen.getByText('공부')).toBeInTheDocument()
  })

  it('PERSONAL 카테고리 레이블을 표시한다', () => {
    render(<Badge category="PERSONAL" />)
    expect(screen.getByText('개인')).toBeInTheDocument()
  })

  it('FAMILY 카테고리 레이블을 표시한다', () => {
    render(<Badge category="FAMILY" />)
    expect(screen.getByText('가족')).toBeInTheDocument()
  })

  it('WORK 카테고리에 파란색 스타일이 적용된다', () => {
    render(<Badge category="WORK" />)
    const badge = screen.getByText('업무')
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-700')
  })
})
