import { z } from 'zod'

const CATEGORIES = ['WORK', 'STUDY', 'PERSONAL', 'FAMILY'] as const

export const createScheduleSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100, '제목은 100자 이내로 입력해주세요'),
  description: z.string().optional(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: '유효한 날짜/시간 형식이 아닙니다',
  }),
  reminderMinutes: z
    .number()
    .int()
    .min(1, '알림은 최소 1분 전이어야 합니다')
    .max(1440, '알림은 최대 1440분(24시간) 전까지 설정 가능합니다'),
  category: z.enum(CATEGORIES, {
    error: '유효하지 않은 카테고리입니다',
  }),
})

export const updateScheduleSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  startTime: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: '유효한 날짜/시간 형식이 아닙니다',
    })
    .optional(),
  reminderMinutes: z.number().int().min(1).max(1440).optional(),
  category: z.enum(CATEGORIES).optional(),
})

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>
