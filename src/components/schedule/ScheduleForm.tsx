'use client'

import { useState } from 'react'
import type { ScheduleCategory, ScheduleFormData } from '@/types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface ScheduleFormProps {
  onSubmit: (data: ScheduleFormData) => void
  initialData?: Partial<ScheduleFormData>
  isLoading?: boolean
  submitLabel?: string
}

const CATEGORIES: { value: ScheduleCategory; label: string }[] = [
  { value: 'WORK', label: '업무' },
  { value: 'STUDY', label: '공부' },
  { value: 'PERSONAL', label: '개인' },
  { value: 'FAMILY', label: '가족' },
]

const REMINDER_OPTIONS = [
  { value: 5, label: '5분 전' },
  { value: 10, label: '10분 전' },
  { value: 20, label: '20분 전' },
  { value: 30, label: '30분 전' },
  { value: 60, label: '1시간 전' },
]

interface FormErrors {
  title?: string
  startTime?: string
}

export function ScheduleForm({ onSubmit, initialData, isLoading = false, submitLabel = '일정 등록' }: ScheduleFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [startTime, setStartTime] = useState(initialData?.startTime ?? '')
  const [reminderMinutes, setReminderMinutes] = useState(
    initialData?.reminderMinutes ?? 10
  )
  const [category, setCategory] = useState<ScheduleCategory>(
    initialData?.category ?? 'WORK'
  )
  const [errors, setErrors] = useState<FormErrors>({})

  function validate(): boolean {
    const newErrors: FormErrors = {}

    if (!title.trim()) {
      newErrors.title = '제목을 입력해 주세요'
    }
    if (!startTime) {
      newErrors.startTime = '시작 시간을 입력해 주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      startTime,
      reminderMinutes,
      category,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <Input
        id="title"
        label="일정 제목 *"
        placeholder="예: 팀 회의"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
      />

      <Input
        id="description"
        label="일정 설명 (선택)"
        placeholder="일정에 대한 간단한 메모"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Input
        id="startTime"
        label="시작 시간 *"
        type="datetime-local"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
        error={errors.startTime}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="reminderMinutes" className="text-sm font-medium text-gray-700">
          알림 시간 *
        </label>
        <select
          id="reminderMinutes"
          value={reminderMinutes}
          onChange={(e) => setReminderMinutes(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {REMINDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span id="category-label" className="text-sm font-medium text-gray-700">
          일정 유형 *
        </span>
        {/* 히든 select: 폼 직렬화용. aria-hidden으로 스크린리더 중복 방지 */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ScheduleCategory)}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        <div role="group" aria-labelledby="category-label" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              aria-pressed={category === cat.value}
              className={`
                py-2 px-3 rounded-lg border text-sm font-medium transition-colors
                ${
                  category === cat.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full mt-2">
        {isLoading ? '처리 중...' : submitLabel}
      </Button>
    </form>
  )
}
