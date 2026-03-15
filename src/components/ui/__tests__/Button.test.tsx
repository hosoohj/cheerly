import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button 컴포넌트', () => {
  it('텍스트가 렌더링된다', () => {
    render(<Button>클릭</Button>)
    expect(screen.getByText('클릭')).toBeInTheDocument()
  })

  it('onClick 핸들러가 호출된다', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>클릭</Button>)
    fireEvent.click(screen.getByText('클릭'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('disabled 상태에서 클릭이 동작하지 않는다', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick} disabled>클릭</Button>)
    fireEvent.click(screen.getByText('클릭'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('variant prop에 따라 다른 스타일이 적용된다', () => {
    const { rerender } = render(<Button variant="primary">버튼</Button>)
    expect(screen.getByText('버튼')).toHaveClass('bg-blue-600')

    rerender(<Button variant="secondary">버튼</Button>)
    expect(screen.getByText('버튼')).toHaveClass('bg-gray-100')
  })
})
