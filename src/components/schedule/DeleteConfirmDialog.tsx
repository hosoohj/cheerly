'use client'

import { Button } from '@/components/ui/Button'

interface DeleteConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title?: string
}

export function DeleteConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = '이 일정',
}: DeleteConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="text-center mb-5">
          <div className="text-4xl mb-3">🗑️</div>
          <h2 className="text-lg font-semibold text-gray-900">
            {title}을(를) 삭제하시겠습니까?
          </h2>
          <p className="text-sm text-gray-500 mt-1">삭제한 일정은 복구할 수 없습니다.</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
          >
            취소
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={onConfirm}
          >
            삭제
          </Button>
        </div>
      </div>
    </div>
  )
}
