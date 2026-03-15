'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Container } from '@/components/layout/Container'
import { ScheduleForm } from '@/components/schedule/ScheduleForm'
import { DeleteConfirmDialog } from '@/components/schedule/DeleteConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MOCK_SCHEDULES } from '@/lib/mock-data'
import type { ScheduleFormData } from '@/types'

interface PageProps {
  params: { id: string }
}

export default function ScheduleDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Sprint 2에서 실제 API 호출로 교체
  const schedule = MOCK_SCHEDULES.find((s) => s.id === params.id)

  if (!schedule) {
    return (
      <Container>
        <div className="text-center py-20">
          <p className="text-gray-500">일정을 찾을 수 없습니다.</p>
          <Link href="/" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
            목록으로 돌아가기
          </Link>
        </div>
      </Container>
    )
  }

  function handleUpdate(data: ScheduleFormData) {
    // Sprint 2에서 실제 API 호출로 교체
    console.log('일정 수정 데이터 (목):', data)
    setIsEditing(false)
  }

  function handleDelete() {
    // Sprint 2에서 실제 API 호출로 교체
    console.log('일정 삭제 (목):', schedule?.id)
    router.push('/')
  }

  if (isEditing) {
    return (
      <Container>
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setIsEditing(false)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="뒤로 가기"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold text-gray-900">일정 수정</h1>
        </div>
        <ScheduleForm
          onSubmit={handleUpdate}
          initialData={{
            title: schedule.title,
            description: schedule.description,
            startTime: schedule.startTime.toISOString().slice(0, 16),
            reminderMinutes: schedule.reminderMinutes,
            category: schedule.category,
          }}
        />
      </Container>
    )
  }

  return (
    <Container>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/" className="text-gray-500 hover:text-gray-700" aria-label="뒤로 가기">
          ←
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">일정 상세</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <Badge category={schedule.category} />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">{schedule.title}</h2>

        {schedule.description && (
          <p className="text-gray-600 mb-4">{schedule.description}</p>
        )}

        <div className="flex flex-col gap-2 text-sm text-gray-600 border-t border-gray-100 pt-4 mt-4">
          <div className="flex justify-between">
            <span className="text-gray-400">시작 시간</span>
            <span className="font-medium">
              {new Intl.DateTimeFormat('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).format(schedule.startTime)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">알림 시간</span>
            <span className="font-medium">{schedule.reminderMinutes}분 전</span>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setIsEditing(true)}
          >
            수정
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => setShowDeleteDialog(true)}
          >
            삭제
          </Button>
        </div>
      </div>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        title={schedule.title}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </Container>
  )
}
