import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeleteConfirmDialog } from '../DeleteConfirmDialog'

describe('DeleteConfirmDialog 컴포넌트', () => {
  it('open이 false면 렌더링되지 않는다', () => {
    render(
      <DeleteConfirmDialog
        open={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.queryByText(/삭제하시겠습니까/)).not.toBeInTheDocument()
  })

  it('open이 true면 확인 메시지가 표시된다', () => {
    render(
      <DeleteConfirmDialog
        open={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByText(/삭제하시겠습니까/)).toBeInTheDocument()
  })

  it('삭제 버튼 클릭 시 onConfirm이 호출된다', () => {
    const onConfirm = vi.fn()
    render(
      <DeleteConfirmDialog
        open={true}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /삭제/ }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('취소 버튼 클릭 시 onCancel이 호출된다', () => {
    const onCancel = vi.fn()
    render(
      <DeleteConfirmDialog
        open={true}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /취소/ }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
