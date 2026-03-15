'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Container } from '@/components/layout/Container'
import { ScheduleForm } from '@/components/schedule/ScheduleForm'
import { DeleteConfirmDialog } from '@/components/schedule/DeleteConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { scheduleApi } from '@/lib/api-client'
import type { ScheduleFormData, ScheduleCategory } from '@/types'

// Server → Client 직렬화로 Date가 string이 됨
interface SerializedSchedule {
  id: string
  title: string
  description?: string | null
  startTime: string
  reminderMinutes: number
  category: string
  createdAt: string
  updatedAt: string
}

interface ScheduleDetailProps {
  schedule: SerializedSchedule
}

export function ScheduleDetail({ schedule }: ScheduleDetailProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const startTime = new Date(schedule.startTime)

  async function handleUpdate(data: ScheduleFormData) {
    setIsLoading(true)
    try {
      await scheduleApi.update(schedule.id, data)
      router.refresh()
      setIsEditing(false)
    } catch (err) {
      console.error('일정 수정 실패:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    setIsLoading(true)
    try {
      await scheduleApi.delete(schedule.id)
      router.push('/')
    } catch (err) {
      console.error('일정 삭제 실패:', err)
      setIsLoading(false)
    }
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
          isLoading={isLoading}
          initialData={{
            title: schedule.title,
            description: schedule.description ?? undefined,
            startTime: startTime.toISOString().slice(0, 16),
            reminderMinutes: schedule.reminderMinutes,
            category: schedule.category as ScheduleCategory,
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
          <Badge category={schedule.category as ScheduleCategory} />
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
              }).format(startTime)}
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
            disabled={isLoading}
          >
            수정
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading}
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
