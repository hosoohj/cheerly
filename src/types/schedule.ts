export type ScheduleCategory = 'WORK' | 'STUDY' | 'PERSONAL' | 'FAMILY'

export interface Schedule {
  id: string
  title: string
  description?: string
  startTime: Date
  reminderMinutes: number
  category: ScheduleCategory
  createdAt: Date
  updatedAt: Date
}

export interface ScheduleFormData {
  title: string
  description?: string
  startTime: string   // HTML datetime-local 입력값 (string)
  reminderMinutes: number
  category: ScheduleCategory
}
