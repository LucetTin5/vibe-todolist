import { test, expect } from '@playwright/test'

test.describe('Cross-View Data Synchronization', () => {
  let testEmail: string
  let testPassword: string
  let testName: string

  test.beforeEach(async ({ page }) => {
    // 고유한 테스트 사용자 생성
    const timestamp = Date.now()
    testEmail = `crossview${timestamp}@example.com`
    testPassword = 'TestPassword123456'
    testName = '크로스뷰테스트사용자'

    // 회원가입 후 대시보드로 이동
    await page.goto('/signup')
    await page.fill('#name', testName)
    await page.fill('#email', testEmail)
    await page.fill('#password', testPassword)
    await page.fill('#confirmPassword', testPassword)
    await page.check('#agree-terms')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
  })

  test.describe('대시보드 ↔ 목록 뷰 동기화', () => {
    test('대시보드에서 생성한 할 일이 목록 뷰에 반영됨', async ({ page }) => {
      // 대시보드에서 할 일 생성
      await page.locator('[data-testid="quick-add-todo"]').click()
      await page.fill('#title', '대시보드에서 생성')
      await page.fill('#description', '대시보드 → 목록 동기화 테스트')
      await page.selectOption('#priority', 'high')
      await page.selectOption('#category', 'work')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 대시보드 통계 업데이트 확인
      await expect(page.locator('[data-testid="total-todos"]')).toContainText('1')
      await expect(page.locator('[data-testid="active-todos"]')).toContainText('1')

      // 목록 뷰로 이동
      await page.locator('[data-testid="nav-list"]').click()
      await expect(page).toHaveURL('/list')

      // 목록 뷰에 할 일이 표시되는지 확인
      await expect(page.locator('[data-testid="todo-item"]')).toHaveCount(1)
      await expect(page.locator('[data-testid="todo-item"]')).toContainText('대시보드에서 생성')
      await expect(page.locator('[data-testid="todo-item"]')).toContainText(
        '대시보드 → 목록 동기화 테스트'
      )
    })

    test('목록 뷰에서 수정한 할 일이 대시보드에 반영됨', async ({ page }) => {
      // 먼저 할 일 생성
      await page.locator('[data-testid="quick-add-todo"]').click()
      await page.fill('#title', '수정 전 제목')
      await page.selectOption('#priority', 'medium')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 목록 뷰로 이동
      await page.locator('[data-testid="nav-list"]').click()

      // 할 일 수정
      await page.locator('[data-testid="todo-item"]').click()
      await page.fill('#title', '수정 후 제목')
      await page.selectOption('#priority', 'high')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 대시보드로 돌아가기
      await page.locator('[data-testid="nav-dashboard"]').click()
      await expect(page).toHaveURL('/dashboard')

      // 대시보드에서 우선순위 통계가 업데이트되었는지 확인
      const prioritySection = page.locator('[data-testid="priority-stats"]')
      await expect(prioritySection).toContainText('높음')
    })

    test('목록 뷰에서 삭제한 할 일이 대시보드 통계에 반영됨', async ({ page }) => {
      // 할 일 2개 생성
      for (let i = 1; i <= 2; i++) {
        await page.locator('[data-testid="quick-add-todo"]').click()
        await page.fill('#title', `할 일 ${i}`)
        await page.click('button[type="submit"]')
        await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      }

      // 통계 확인 (2개)
      await expect(page.locator('[data-testid="total-todos"]')).toContainText('2')

      // 목록 뷰로 이동하여 하나 삭제
      await page.locator('[data-testid="nav-list"]').click()
      await page.locator('[data-testid="delete-todo-button"]').first().click()

      page.on('dialog', async (dialog) => {
        await dialog.accept()
      })

      // 대시보드로 돌아가서 통계 확인
      await page.locator('[data-testid="nav-dashboard"]').click()
      await expect(page.locator('[data-testid="total-todos"]')).toContainText('1')
    })
  })

  test.describe('목록 뷰 ↔ 칸반 뷰 동기화', () => {
    test('목록 뷰에서 생성한 할 일이 칸반 뷰에 반영됨', async ({ page }) => {
      // 목록 뷰로 이동
      await page.locator('[data-testid="nav-list"]').click()

      // 할 일 생성
      await page.locator('[data-testid="add-todo-button"]').click()
      await page.fill('#title', '목록에서 생성한 할 일')
      await page.fill('#description', '목록 → 칸반 동기화 테스트')
      await page.selectOption('#status', 'in-progress')
      await page.selectOption('#priority', 'high')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 칸반 뷰로 이동
      await page.locator('[data-testid="nav-kanban"]').click()
      await expect(page).toHaveURL('/kanban')

      // 칸반의 진행 중 컬럼에 할 일이 표시되는지 확인
      await expect(
        page.locator('[data-testid="kanban-column-in-progress"] [data-testid="kanban-card"]')
      ).toHaveCount(1)
      await expect(page.locator('[data-testid="kanban-column-in-progress"]')).toContainText(
        '목록에서 생성한 할 일'
      )
    })

    test('칸반 뷰에서 드래그한 할 일 상태가 목록 뷰에 반영됨', async ({ page }) => {
      // 칸반 뷰로 이동
      await page.locator('[data-testid="nav-kanban"]').click()

      // 할 일 생성 (할 일 컬럼에)
      await page.locator('[data-testid="add-todo-todo"]').click()
      await page.fill('#title', '칸반 드래그 테스트')
      await page.selectOption('#priority', 'medium')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 할 일을 진행 중으로 드래그
      const sourceCard = page.locator(
        '[data-testid="kanban-column-todo"] [data-testid="kanban-card"]'
      )
      const targetColumn = page.locator('[data-testid="kanban-column-in-progress"]')
      await sourceCard.dragTo(targetColumn)

      // 목록 뷰로 이동
      await page.locator('[data-testid="nav-list"]').click()

      // 할 일의 상태가 '진행 중'으로 표시되는지 확인
      await expect(page.locator('[data-testid="todo-status"]')).toContainText('진행 중')
    })

    test('목록 뷰에서 완료한 할 일이 칸반의 완료 컬럼에 표시됨', async ({ page }) => {
      // 목록 뷰로 이동
      await page.locator('[data-testid="nav-list"]').click()

      // 할 일 생성
      await page.locator('[data-testid="add-todo-button"]').click()
      await page.fill('#title', '완료 테스트 할 일')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 체크박스 클릭하여 완료 상태로 변경
      await page.locator('[data-testid="todo-checkbox"]').check()

      // 칸반 뷰로 이동
      await page.locator('[data-testid="nav-kanban"]').click()

      // 완료 컬럼에 할 일이 표시되는지 확인
      await expect(
        page.locator('[data-testid="kanban-column-done"] [data-testid="kanban-card"]')
      ).toHaveCount(1)
      await expect(page.locator('[data-testid="kanban-column-done"]')).toContainText(
        '완료 테스트 할 일'
      )
    })
  })

  test.describe('칸반 뷰 ↔ 캘린더 뷰 동기화', () => {
    test('칸반 뷰에서 생성한 할 일이 캘린더 뷰에 반영됨', async ({ page }) => {
      // 칸반 뷰로 이동
      await page.locator('[data-testid="nav-kanban"]').click()

      // 마감일이 있는 할 일 생성
      await page.locator('[data-testid="add-todo-todo"]').click()
      await page.fill('#title', '칸반에서 생성한 할 일')

      // 내일 날짜로 마감일 설정
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowString = tomorrow.toISOString().split('T')[0]
      await page.fill('#dueDate', tomorrowString)

      await page.selectOption('#priority', 'high')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 캘린더 뷰로 이동
      await page.locator('[data-testid="nav-calendar"]').click()
      await expect(page).toHaveURL('/calendar')

      // 내일 날짜에 할 일이 표시되는지 확인
      const tomorrowDay = tomorrow.getDate()
      await expect(
        page.locator(
          `[data-testid="calendar-day-${tomorrowDay}"] [data-testid="calendar-todo-item"]`
        )
      ).toBeVisible()
      await expect(page.locator(`[data-testid="calendar-day-${tomorrowDay}"]`)).toContainText(
        '칸반에서 생성한 할 일'
      )
    })

    test('캘린더 뷰에서 날짜 변경한 할 일이 칸반 뷰에 반영됨', async ({ page }) => {
      // 캘린더 뷰로 이동
      await page.locator('[data-testid="nav-calendar"]').click()

      // 특정 날짜에 할 일 생성
      await page.locator('[data-testid="calendar-day-15"]').click()
      await page.fill('#title', '캘린더 날짜 변경 테스트')
      await page.selectOption('#status', 'todo')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 할 일을 다른 날짜로 드래그 (20일로)
      const sourceTodo = page.locator(
        '[data-testid="calendar-day-15"] [data-testid="calendar-todo-item"]'
      )
      const targetDay = page.locator('[data-testid="calendar-day-20"]')
      await sourceTodo.dragTo(targetDay)

      // 칸반 뷰로 이동
      await page.locator('[data-testid="nav-kanban"]').click()

      // 할 일이 칸반에 여전히 표시되는지 확인 (마감일이 변경되었지만)
      await expect(
        page.locator('[data-testid="kanban-column-todo"] [data-testid="kanban-card"]')
      ).toContainText('캘린더 날짜 변경 테스트')
    })

    test('칸반에서 완료한 할 일이 캘린더에서도 완료 표시됨', async ({ page }) => {
      // 캘린더에서 할 일 생성
      await page.locator('[data-testid="nav-calendar"]').click()
      await page.locator('[data-testid="calendar-day-10"]').click()
      await page.fill('#title', '완료 상태 동기화 테스트')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 칸반으로 이동하여 완료 컬럼으로 드래그
      await page.locator('[data-testid="nav-kanban"]').click()
      const todoCard = page.locator(
        '[data-testid="kanban-column-todo"] [data-testid="kanban-card"]'
      )
      const doneColumn = page.locator('[data-testid="kanban-column-done"]')
      await todoCard.dragTo(doneColumn)

      // 캘린더로 다시 이동
      await page.locator('[data-testid="nav-calendar"]').click()

      // 캘린더에서 할 일이 완료 스타일로 표시되는지 확인
      const calendarTodo = page.locator(
        '[data-testid="calendar-day-10"] [data-testid="calendar-todo-item"]'
      )
      await expect(calendarTodo).toHaveClass(/line-through|opacity-60|completed/)
    })
  })

  test.describe('목록 뷰 ↔ 캘린더 뷰 동기화', () => {
    test('목록 뷰에서 생성한 마감일 있는 할 일이 캘린더에 표시됨', async ({ page }) => {
      // 목록 뷰로 이동
      await page.locator('[data-testid="nav-list"]').click()

      // 마감일이 있는 할 일 생성
      await page.locator('[data-testid="add-todo-button"]').click()
      await page.fill('#title', '목록에서 마감일 설정')

      // 다음주 금요일로 마감일 설정
      const nextFriday = new Date()
      nextFriday.setDate(nextFriday.getDate() + ((5 + 7 - nextFriday.getDay()) % 7 || 7))
      const nextFridayString = nextFriday.toISOString().split('T')[0]
      await page.fill('#dueDate', nextFridayString)

      await page.selectOption('#priority', 'urgent')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 캘린더로 이동
      await page.locator('[data-testid="nav-calendar"]').click()

      // 해당 날짜가 다음달이라면 다음달로 이동
      const currentMonth = new Date().getMonth()
      const nextFridayMonth = nextFriday.getMonth()
      if (nextFridayMonth !== currentMonth) {
        await page.locator('[data-testid="next-month"]').click()
      }

      // 금요일에 할 일이 표시되는지 확인
      const fridayDay = nextFriday.getDate()
      await expect(
        page.locator(`[data-testid="calendar-day-${fridayDay}"] [data-testid="calendar-todo-item"]`)
      ).toBeVisible()
      await expect(page.locator(`[data-testid="calendar-day-${fridayDay}"]`)).toContainText(
        '목록에서 마감일 설정'
      )
    })

    test('캘린더에서 생성한 할 일이 목록 뷰에 정확한 마감일로 표시됨', async ({ page }) => {
      // 캘린더로 이동
      await page.locator('[data-testid="nav-calendar"]').click()

      // 특정 날짜에 할 일 생성
      await page.locator('[data-testid="calendar-day-25"]').click()
      await page.fill('#title', '캘린더에서 날짜 지정')
      await page.selectOption('#priority', 'medium')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 목록 뷰로 이동
      await page.locator('[data-testid="nav-list"]').click()

      // 할 일이 표시되고 마감일이 올바른지 확인
      await expect(page.locator('[data-testid="todo-item"]')).toContainText('캘린더에서 날짜 지정')
      await expect(page.locator('[data-testid="todo-due-date"]')).toContainText('25')
    })
  })

  test.describe('실시간 동기화 (여러 탭)', () => {
    test('한 탭에서 생성한 할 일이 다른 탭에서 새로고침 시 보임', async ({ browser }) => {
      // 첫 번째 탭 (현재)에서 할 일 생성
      const page = await browser.newPage()
      await page.goto('/login')
      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

      await page.locator('[data-testid="quick-add-todo"]').click()
      await page.fill('#title', '멀티탭 동기화 테스트')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 두 번째 탭 생성
      const secondPage = await browser.newPage()
      await secondPage.goto('/login')
      await secondPage.fill('#email', testEmail)
      await secondPage.fill('#password', testPassword)
      await secondPage.click('button[type="submit"]')
      await expect(secondPage).toHaveURL('/dashboard', { timeout: 10000 })

      // 목록 뷰로 이동
      await secondPage.locator('[data-testid="nav-list"]').click()

      // 할 일이 표시되는지 확인
      await expect(secondPage.locator('[data-testid="todo-item"]')).toContainText(
        '멀티탭 동기화 테스트'
      )

      await page.close()
      await secondPage.close()
    })
  })

  test.describe('모든 뷰 통합 데이터 일관성', () => {
    test('하나의 할 일이 모든 뷰에서 일관되게 표시됨', async ({ page }) => {
      // 대시보드에서 상세한 할 일 생성
      await page.locator('[data-testid="quick-add-todo"]').click()
      await page.fill('#title', '통합 테스트 할 일')
      await page.fill('#description', '모든 뷰에서 확인될 상세 설명')
      await page.selectOption('#priority', 'high')
      await page.selectOption('#category', 'work')
      await page.selectOption('#status', 'in-progress')

      // 내일 날짜로 마감일 설정
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowString = tomorrow.toISOString().split('T')[0]
      await page.fill('#dueDate', tomorrowString)

      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 1. 대시보드에서 통계 확인
      await expect(page.locator('[data-testid="total-todos"]')).toContainText('1')
      await expect(page.locator('[data-testid="active-todos"]')).toContainText('1')

      // 2. 목록 뷰에서 확인
      await page.locator('[data-testid="nav-list"]').click()
      await expect(page.locator('[data-testid="todo-item"]')).toContainText('통합 테스트 할 일')
      await expect(page.locator('[data-testid="todo-item"]')).toContainText(
        '모든 뷰에서 확인될 상세 설명'
      )
      await expect(page.locator('[data-testid="todo-status"]')).toContainText('진행 중')

      // 3. 칸반 뷰에서 확인
      await page.locator('[data-testid="nav-kanban"]').click()
      await expect(
        page.locator('[data-testid="kanban-column-in-progress"] [data-testid="kanban-card"]')
      ).toContainText('통합 테스트 할 일')
      await expect(
        page.locator('[data-testid="kanban-column-in-progress"] [data-testid="priority-badge"]')
      ).toContainText('높음')

      // 4. 캘린더 뷰에서 확인
      await page.locator('[data-testid="nav-calendar"]').click()
      const tomorrowDay = tomorrow.getDate()
      await expect(
        page.locator(
          `[data-testid="calendar-day-${tomorrowDay}"] [data-testid="calendar-todo-item"]`
        )
      ).toContainText('통합 테스트 할 일')
    })

    test('한 뷰에서 삭제한 할 일이 모든 뷰에서 제거됨', async ({ page }) => {
      // 먼저 할 일 생성
      await page.locator('[data-testid="quick-add-todo"]').click()
      await page.fill('#title', '삭제 동기화 테스트')

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowString = tomorrow.toISOString().split('T')[0]
      await page.fill('#dueDate', tomorrowString)

      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 모든 뷰에서 할 일이 있는지 확인
      await expect(page.locator('[data-testid="total-todos"]')).toContainText('1')

      // 목록 뷰에서 삭제
      await page.locator('[data-testid="nav-list"]').click()
      await page.locator('[data-testid="delete-todo-button"]').click()

      page.on('dialog', async (dialog) => {
        await dialog.accept()
      })

      // 1. 목록 뷰에서 제거 확인
      await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()

      // 2. 대시보드에서 통계 업데이트 확인
      await page.locator('[data-testid="nav-dashboard"]').click()
      await expect(page.locator('[data-testid="total-todos"]')).toContainText('0')

      // 3. 칸반 뷰에서 제거 확인
      await page.locator('[data-testid="nav-kanban"]').click()
      await expect(page.locator('[data-testid="kanban-card"]')).toHaveCount(0)

      // 4. 캘린더 뷰에서 제거 확인
      await page.locator('[data-testid="nav-calendar"]').click()
      const tomorrowDay = tomorrow.getDate()
      await expect(
        page.locator(
          `[data-testid="calendar-day-${tomorrowDay}"] [data-testid="calendar-todo-item"]`
        )
      ).toHaveCount(0)
    })

    test('복잡한 상태 변경이 모든 뷰에 정확히 반영됨', async ({ page }) => {
      // 여러 할 일 생성
      const todos = [
        { title: '할 일 1', status: 'todo', priority: 'high' },
        { title: '할 일 2', status: 'in-progress', priority: 'medium' },
        { title: '할 일 3', status: 'todo', priority: 'low' },
      ]

      for (const todo of todos) {
        await page.locator('[data-testid="quick-add-todo"]').click()
        await page.fill('#title', todo.title)
        await page.selectOption('#status', todo.status)
        await page.selectOption('#priority', todo.priority)
        await page.click('button[type="submit"]')
        await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      }

      // 칸반에서 할 일 1을 완료로 이동
      await page.locator('[data-testid="nav-kanban"]').click()
      const todoCard = page
        .locator('[data-testid="kanban-column-todo"] [data-testid="kanban-card"]')
        .first()
      const doneColumn = page.locator('[data-testid="kanban-column-done"]')
      await todoCard.dragTo(doneColumn)

      // 목록 뷰에서 할 일 2를 수정
      await page.locator('[data-testid="nav-list"]').click()
      const inProgressTodo = page
        .locator('[data-testid="todo-item"]')
        .filter({ hasText: '할 일 2' })
      await inProgressTodo.click()
      await page.selectOption('#priority', 'urgent')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 대시보드에서 최종 통계 확인
      await page.locator('[data-testid="nav-dashboard"]').click()
      await expect(page.locator('[data-testid="total-todos"]')).toContainText('3')
      await expect(page.locator('[data-testid="completed-todos"]')).toContainText('1')
      await expect(page.locator('[data-testid="active-todos"]')).toContainText('2')

      // 칸반에서 최종 배치 확인
      await page.locator('[data-testid="nav-kanban"]').click()
      await expect(
        page.locator('[data-testid="kanban-column-todo"] [data-testid="kanban-card"]')
      ).toHaveCount(1)
      await expect(
        page.locator('[data-testid="kanban-column-in-progress"] [data-testid="kanban-card"]')
      ).toHaveCount(1)
      await expect(
        page.locator('[data-testid="kanban-column-done"] [data-testid="kanban-card"]')
      ).toHaveCount(1)

      // 목록에서 우선순위 확인
      await page.locator('[data-testid="nav-list"]').click()
      const urgentTodo = page.locator('[data-testid="todo-item"]').filter({ hasText: '할 일 2' })
      await expect(urgentTodo.locator('[data-testid="priority-badge"]')).toContainText('긴급')
    })
  })

  test.describe('오프라인/온라인 동기화', () => {
    test('네트워크 연결 후 데이터 동기화', async ({ page }) => {
      // 온라인 상태에서 할 일 생성
      await page.locator('[data-testid="quick-add-todo"]').click()
      await page.fill('#title', '네트워크 동기화 테스트')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 네트워크 오프라인 시뮬레이션
      await page.context().setOffline(true)

      // 목록 뷰로 이동 시도 (캐시된 데이터 확인)
      await page.locator('[data-testid="nav-list"]').click()

      // 네트워크 다시 온라인
      await page.context().setOffline(false)

      // 페이지 새로고침하여 동기화 확인
      await page.reload()

      // 데이터가 여전히 존재하는지 확인
      await expect(page.locator('[data-testid="todo-item"]')).toContainText(
        '네트워크 동기화 테스트'
      )
    })
  })
})
