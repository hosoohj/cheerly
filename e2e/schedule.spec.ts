import { test, expect } from '@playwright/test'

test.describe('일정 목록 (홈)', () => {
  test('홈 페이지가 로드된다', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '오늘의 일정' })).toBeVisible()
  })

  test('헤더에 Cheerly 로고와 일정 추가 버튼이 있다', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Cheerly')).toBeVisible()
    await expect(page.getByRole('link', { name: '+ 일정 추가' })).toBeVisible()
  })

  test('알림 벨 아이콘이 표시된다', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: '알림 보기' })).toBeVisible()
  })

  test('일정이 없으면 빈 상태 메시지를 보여준다', async ({ page }) => {
    await page.goto('/')
    const emptyState = page.getByText('등록된 일정이 없습니다')
    const scheduleList = page.getByRole('list', { name: '일정 목록' })
    // 일정이 없는 경우에만 빈 상태 표시
    const hasSchedules = await scheduleList.isVisible()
    if (!hasSchedules) {
      await expect(emptyState).toBeVisible()
    }
  })
})

test.describe('일정 등록', () => {
  test('일정 추가 버튼 클릭 시 등록 페이지로 이동한다', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: '+ 일정 추가' }).click()
    await expect(page).toHaveURL('/schedules/new')
    await expect(page.getByRole('heading', { name: '새 일정 등록' })).toBeVisible()
  })

  test('필수 필드 미입력 시 에러 메시지가 표시된다', async ({ page }) => {
    await page.goto('/schedules/new')
    await page.getByRole('button', { name: '일정 등록' }).click()
    await expect(page.getByText('제목을 입력해 주세요')).toBeVisible()
    await expect(page.getByText('시작 시간을 입력해 주세요')).toBeVisible()
  })

  test('유효한 데이터로 일정을 등록한다', async ({ page }) => {
    await page.goto('/schedules/new')

    // 제목 입력
    await page.getByLabel('일정 제목 *').fill('E2E 테스트 회의')

    // 시작 시간 입력 (현재 시간 + 1시간)
    const future = new Date(Date.now() + 60 * 60 * 1000)
    const localISO = future.toISOString().slice(0, 16)
    await page.getByLabel('시작 시간 *').fill(localISO)

    // 카테고리 선택 (기본값: 업무)
    await page.getByRole('button', { name: '업무' }).click()

    // 제출
    await page.getByRole('button', { name: '일정 등록' }).click()

    // 성공 화면 확인
    await expect(page.getByText('일정이 등록되었습니다!')).toBeVisible({ timeout: 5000 })
  })

  test('등록 성공 후 목록 보기를 클릭하면 홈으로 이동한다', async ({ page }) => {
    await page.goto('/schedules/new')
    await page.getByLabel('일정 제목 *').fill('E2E 이동 테스트')
    const future = new Date(Date.now() + 60 * 60 * 1000)
    await page.getByLabel('시작 시간 *').fill(future.toISOString().slice(0, 16))
    await page.getByRole('button', { name: '일정 등록' }).click()
    await page.getByRole('button', { name: '목록 보기' }).click()
    await expect(page).toHaveURL('/')
  })
})

test.describe('일정 상세/수정/삭제', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트용 일정 등록
    await page.goto('/schedules/new')
    await page.getByLabel('일정 제목 *').fill('상세 테스트 일정')
    const future = new Date(Date.now() + 2 * 60 * 60 * 1000)
    await page.getByLabel('시작 시간 *').fill(future.toISOString().slice(0, 16))
    await page.getByRole('button', { name: '일정 등록' }).click()
    await page.getByRole('button', { name: '목록 보기' }).click()
    // 홈에서 방금 등록한 일정 클릭
    await page.getByRole('link', { name: /상세 테스트 일정/ }).click()
  })

  test('일정 상세 페이지가 로드된다', async ({ page }) => {
    await expect(page.getByText('상세 테스트 일정')).toBeVisible()
    await expect(page.getByRole('heading', { name: '일정 상세' })).toBeVisible()
    await expect(page.getByRole('button', { name: '수정' })).toBeVisible()
    await expect(page.getByRole('button', { name: '삭제' })).toBeVisible()
  })

  test('수정 버튼 클릭 시 수정 폼이 표시된다', async ({ page }) => {
    await page.getByRole('button', { name: '수정' }).click()
    await expect(page.getByRole('heading', { name: '일정 수정' })).toBeVisible()
    await expect(page.getByRole('button', { name: '일정 수정' })).toBeVisible()
  })

  test('삭제 버튼 클릭 시 확인 다이얼로그가 표시된다', async ({ page }) => {
    await page.getByRole('button', { name: '삭제' }).click()
    await expect(page.getByText(/삭제하시겠습니까/)).toBeVisible()
    await expect(page.getByRole('button', { name: '취소' })).toBeVisible()
  })

  test('삭제 취소 시 상세 페이지에 남아있다', async ({ page }) => {
    await page.getByRole('button', { name: '삭제' }).click()
    await page.getByRole('button', { name: '취소' }).click()
    await expect(page.getByRole('heading', { name: '일정 상세' })).toBeVisible()
  })

  test('일정을 삭제하면 홈으로 이동한다', async ({ page }) => {
    await page.getByRole('button', { name: '삭제' }).click()
    // 다이얼로그 안의 삭제 버튼 클릭
    const deleteButtons = page.getByRole('button', { name: '삭제' })
    await deleteButtons.last().click()
    await expect(page).toHaveURL('/', { timeout: 5000 })
  })
})

test.describe('알림 패널', () => {
  test('알림 벨 클릭 시 패널이 열린다', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: '알림 보기' }).click()
    await expect(page.getByRole('heading', { name: '알림' })).toBeVisible()
  })

  test('패널 닫기 버튼이 동작한다', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: '알림 보기' }).click()
    await page.getByRole('button', { name: '닫기' }).click()
    await expect(page.getByRole('heading', { name: '알림' })).not.toBeVisible()
  })
})

test.describe('404 페이지', () => {
  test('존재하지 않는 경로는 404 페이지를 보여준다', async ({ page }) => {
    await page.goto('/does-not-exist')
    await expect(page.getByText('404')).toBeVisible()
    await expect(page.getByText('페이지를 찾을 수 없습니다')).toBeVisible()
    await expect(page.getByRole('link', { name: '홈으로 돌아가기' })).toBeVisible()
  })

  test('404 페이지에서 홈으로 이동한다', async ({ page }) => {
    await page.goto('/does-not-exist')
    await page.getByRole('link', { name: '홈으로 돌아가기' }).click()
    await expect(page).toHaveURL('/')
  })
})

test.describe('반응형 (Mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('모바일에서 홈 페이지가 정상 표시된다', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Cheerly')).toBeVisible()
    await expect(page.getByRole('link', { name: '+ 일정 추가' })).toBeVisible()
  })

  test('모바일에서 일정 등록 폼이 정상 표시된다', async ({ page }) => {
    await page.goto('/schedules/new')
    await expect(page.getByLabel('일정 제목 *')).toBeVisible()
    await expect(page.getByRole('button', { name: '일정 등록' })).toBeVisible()
  })
})
