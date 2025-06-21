import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  let testEmail: string
  let testPassword: string
  let testName: string

  test.beforeEach(async ({ page }) => {
    // 고유한 테스트 사용자 생성
    const timestamp = Date.now()
    testEmail = `dashboard${timestamp}@example.com`
    testPassword = 'TestPassword123456'
    testName = '대시보드테스트사용자'

    // 회원가입 후 대시보드로 이동
    await page.goto('/signup')
    await page.fill('#name', testName)
    await page.fill('#email', testEmail)
    await page.fill('#password', testPassword)
    await page.fill('#confirmPassword', testPassword)
    await page.check('#agree-terms')
    await page.click('button[type="submit"]')

    // 대시보드 페이지 로드 대기
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
  })

  test.describe('대시보드 렌더링', () => {
    test('대시보드 페이지가 올바르게 로드됨', async ({ page }) => {
      // 대시보드 헤더 확인
      await expect(page.locator('h1')).toContainText('대시보드')

      // 주요 통계 카드들이 표시되는지 확인
      await expect(page.locator('[data-testid="total-todos"]')).toBeVisible()
      await expect(page.locator('[data-testid="completed-todos"]')).toBeVisible()
      await expect(page.locator('[data-testid="active-todos"]')).toBeVisible()
      await expect(page.locator('[data-testid="completion-rate"]')).toBeVisible()
    })

    test('빈 대시보드 상태가 올바르게 표시됨', async ({ page }) => {
      // 새 사용자이므로 통계가 0이어야 함
      await expect(page.locator('[data-testid="total-todos"]')).toContainText('0')
      await expect(page.locator('[data-testid="completed-todos"]')).toContainText('0')
      await expect(page.locator('[data-testid="active-todos"]')).toContainText('0')
      await expect(page.locator('[data-testid="completion-rate"]')).toContainText('0%')
    })

    test('우선순위별 통계 섹션이 표시됨', async ({ page }) => {
      // 우선순위별 차트나 통계 섹션 확인
      const prioritySection = page.locator('[data-testid="priority-stats"]')
      await expect(prioritySection).toBeVisible()

      // 각 우선순위 레벨 확인
      await expect(prioritySection.locator('text=높음')).toBeVisible()
      await expect(prioritySection.locator('text=보통')).toBeVisible()
      await expect(prioritySection.locator('text=낮음')).toBeVisible()
    })

    test('카테고리별 통계 섹션이 표시됨', async ({ page }) => {
      // 카테고리별 차트나 통계 섹션 확인
      const categorySection = page.locator('[data-testid="category-stats"]')
      await expect(categorySection).toBeVisible()

      // 주요 카테고리들 확인
      await expect(categorySection.locator('text=업무')).toBeVisible()
      await expect(categorySection.locator('text=개인')).toBeVisible()
    })
  })

  test.describe('퀵 액션 버튼', () => {
    test('할 일 추가 퀵 버튼이 동작함', async ({ page }) => {
      // 퀵 액션 버튼 클릭
      const quickAddButton = page.locator('[data-testid="quick-add-todo"]')
      await expect(quickAddButton).toBeVisible()
      await quickAddButton.click()

      // Todo 폼 모달이 열리는지 확인
      const modal = page.locator('[data-testid="todo-form-modal"]')
      await expect(modal).toBeVisible()

      // 폼 필드들이 표시되는지 확인
      await expect(page.locator('#title')).toBeVisible()
      await expect(page.locator('#description')).toBeVisible()
      await expect(page.locator('#priority')).toBeVisible()
      await expect(page.locator('#category')).toBeVisible()
    })

    test('목록 보기 버튼이 동작함', async ({ page }) => {
      const listViewButton = page.locator('[data-testid="go-to-list"]')
      await expect(listViewButton).toBeVisible()
      await listViewButton.click()

      // 목록 페이지로 이동 확인
      await expect(page).toHaveURL('/list', { timeout: 5000 })
    })

    test('칸반 보기 버튼이 동작함', async ({ page }) => {
      const kanbanViewButton = page.locator('[data-testid="go-to-kanban"]')
      await expect(kanbanViewButton).toBeVisible()
      await kanbanViewButton.click()

      // 칸반 페이지로 이동 확인
      await expect(page).toHaveURL('/kanban', { timeout: 5000 })
    })

    test('캘린더 보기 버튼이 동작함', async ({ page }) => {
      const calendarViewButton = page.locator('[data-testid="go-to-calendar"]')
      await expect(calendarViewButton).toBeVisible()
      await calendarViewButton.click()

      // 캘린더 페이지로 이동 확인
      await expect(page).toHaveURL('/calendar', { timeout: 5000 })
    })
  })

  test.describe('할 일 추가 후 통계 업데이트', () => {
    test('할 일을 추가하면 대시보드 통계가 업데이트됨', async ({ page }) => {
      // 할 일 추가
      await page.locator('[data-testid="quick-add-todo"]').click()
      await page.fill('#title', '대시보드 테스트 할일')
      await page.fill('#description', '통계 업데이트 테스트용')
      await page.selectOption('#priority', 'high')
      await page.selectOption('#category', 'work')
      await page.click('button[type="submit"]')

      // 모달이 닫힐 때까지 대기
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 통계가 업데이트되었는지 확인
      await expect(page.locator('[data-testid="total-todos"]')).toContainText('1')
      await expect(page.locator('[data-testid="active-todos"]')).toContainText('1')
      await expect(page.locator('[data-testid="completed-todos"]')).toContainText('0')
    })

    test('여러 할 일 추가 후 통계 검증', async ({ page }) => {
      // 첫 번째 할 일 추가
      await page.locator('[data-testid="quick-add-todo"]').click()
      await page.fill('#title', '첫 번째 할일')
      await page.selectOption('#priority', 'high')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 두 번째 할 일 추가
      await page.locator('[data-testid="quick-add-todo"]').click()
      await page.fill('#title', '두 번째 할일')
      await page.selectOption('#priority', 'medium')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 통계 확인
      await expect(page.locator('[data-testid="total-todos"]')).toContainText('2')
      await expect(page.locator('[data-testid="active-todos"]')).toContainText('2')

      // 우선순위별 통계 확인 (높음: 1, 보통: 1)
      const prioritySection = page.locator('[data-testid="priority-stats"]')
      await expect(prioritySection).toContainText('1') // high priority count
    })
  })

  test.describe('반응형 디자인', () => {
    test('모바일 뷰포트에서 대시보드가 올바르게 표시됨', async ({ page }) => {
      // 모바일 크기로 변경
      await page.setViewportSize({ width: 375, height: 667 })

      // 대시보드 요소들이 모바일에서도 표시되는지 확인
      await expect(page.locator('[data-testid="total-todos"]')).toBeVisible()
      await expect(page.locator('[data-testid="quick-add-todo"]')).toBeVisible()

      // 통계 카드들이 세로로 스택되는지 확인 (레이아웃 테스트)
      const statsContainer = page.locator('[data-testid="stats-container"]')
      await expect(statsContainer).toBeVisible()
    })

    test('태블릿 뷰포트에서 대시보드가 올바르게 표시됨', async ({ page }) => {
      // 태블릿 크기로 변경
      await page.setViewportSize({ width: 768, height: 1024 })

      await expect(page.locator('[data-testid="total-todos"]')).toBeVisible()
      await expect(page.locator('[data-testid="priority-stats"]')).toBeVisible()
      await expect(page.locator('[data-testid="category-stats"]')).toBeVisible()
    })
  })

  test.describe('데이터 로딩 상태', () => {
    test('페이지 새로고침 후에도 대시보드가 올바르게 로드됨', async ({ page }) => {
      // 할 일 하나 추가
      await page.locator('[data-testid="quick-add-todo"]').click()
      await page.fill('#title', '새로고침 테스트 할일')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 페이지 새로고침
      await page.reload()

      // 대시보드가 올바르게 로드되고 통계가 유지되는지 확인
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('[data-testid="total-todos"]')).toContainText('1')
    })
  })
})
