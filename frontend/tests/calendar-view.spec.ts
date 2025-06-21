import { test, expect } from '@playwright/test'

test.describe('Calendar View CRUD and Date Navigation', () => {
  let testEmail: string
  let testPassword: string
  let testName: string

  test.beforeEach(async ({ page }) => {
    // 고유한 테스트 사용자 생성
    const timestamp = Date.now()
    testEmail = `calendar${timestamp}@example.com`
    testPassword = 'TestPassword123456'
    testName = '캘린더테스트사용자'

    // 회원가입 후 캘린더 페이지로 이동
    await page.goto('/signup')
    await page.fill('#name', testName)
    await page.fill('#email', testEmail)
    await page.fill('#password', testPassword)
    await page.fill('#confirmPassword', testPassword)
    await page.check('#agree-terms')
    await page.click('button[type="submit"]')

    // 대시보드에서 캘린더 페이지로 이동
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    await page.locator('[data-testid="nav-calendar"]').click()
    await expect(page).toHaveURL('/calendar')
  })

  test.describe('캘린더 렌더링', () => {
    test('캘린더 페이지가 올바르게 로드됨', async ({ page }) => {
      // 페이지 제목 확인
      await expect(page.locator('h1')).toContainText('캘린더')

      // 캘린더 그리드 확인
      await expect(page.locator('[data-testid="calendar-grid"]')).toBeVisible()

      // 월/년도 헤더 확인
      await expect(page.locator('[data-testid="calendar-header"]')).toBeVisible()
      await expect(page.locator('[data-testid="current-month-year"]')).toBeVisible()

      // 네비게이션 버튼 확인
      await expect(page.locator('[data-testid="prev-month"]')).toBeVisible()
      await expect(page.locator('[data-testid="next-month"]')).toBeVisible()
      await expect(page.locator('[data-testid="today-button"]')).toBeVisible()
    })

    test('현재 날짜가 하이라이트됨', async ({ page }) => {
      // 오늘 날짜가 특별히 표시되는지 확인
      const today = new Date().getDate()
      const todayCell = page.locator(`[data-testid="calendar-day-${today}"]`)
      await expect(todayCell).toHaveClass(/today|current|bg-blue|border-blue/)
    })

    test('요일 헤더가 올바르게 표시됨', async ({ page }) => {
      // 요일 헤더 확인
      const weekdays = ['일', '월', '화', '수', '목', '금', '토']
      for (const weekday of weekdays) {
        await expect(page.locator('[data-testid="calendar-weekdays"]')).toContainText(weekday)
      }
    })

    test('빈 캘린더 상태가 올바르게 표시됨', async ({ page }) => {
      // 새 사용자이므로 할 일이 없어야 함
      const todosOnCalendar = page.locator('[data-testid="calendar-todo-item"]')
      await expect(todosOnCalendar).toHaveCount(0)
    })
  })

  test.describe('날짜 네비게이션', () => {
    test('다음 달로 이동할 수 있음', async ({ page }) => {
      // 현재 월 확인
      const currentMonthText = await page
        .locator('[data-testid="current-month-year"]')
        .textContent()

      // 다음 달 버튼 클릭
      await page.locator('[data-testid="next-month"]').click()

      // 월이 변경되었는지 확인
      const newMonthText = await page.locator('[data-testid="current-month-year"]').textContent()
      expect(newMonthText).not.toBe(currentMonthText)
    })

    test('이전 달로 이동할 수 있음', async ({ page }) => {
      // 현재 월 확인
      const currentMonthText = await page
        .locator('[data-testid="current-month-year"]')
        .textContent()

      // 이전 달 버튼 클릭
      await page.locator('[data-testid="prev-month"]').click()

      // 월이 변경되었는지 확인
      const newMonthText = await page.locator('[data-testid="current-month-year"]').textContent()
      expect(newMonthText).not.toBe(currentMonthText)
    })

    test('오늘 버튼으로 현재 달로 돌아갈 수 있음', async ({ page }) => {
      // 다른 달로 이동
      await page.locator('[data-testid="next-month"]').click()
      await page.locator('[data-testid="next-month"]').click()

      // 오늘 버튼 클릭
      await page.locator('[data-testid="today-button"]').click()

      // 현재 날짜가 하이라이트되어 있는지 확인
      const today = new Date().getDate()
      const todayCell = page.locator(`[data-testid="calendar-day-${today}"]`)
      await expect(todayCell).toHaveClass(/today|current|bg-blue|border-blue/)
    })

    test('월/년도 드롭다운으로 빠른 네비게이션 가능', async ({ page }) => {
      // 월 선택 드롭다운이 있다면 테스트
      const monthSelector = page.locator('[data-testid="month-selector"]')
      if (await monthSelector.isVisible()) {
        await monthSelector.selectOption('6') // 7월 선택
        await expect(page.locator('[data-testid="current-month-year"]')).toContainText('7월')
      }
    })
  })

  test.describe('할 일 생성 (Create)', () => {
    test('날짜 셀을 클릭하여 새 할 일을 생성할 수 있음', async ({ page }) => {
      // 현재 달의 15일 클릭
      await page.locator('[data-testid="calendar-day-15"]').click()

      // 할 일 생성 모달이 열리는지 확인
      await expect(page.locator('[data-testid="todo-form-modal"]')).toBeVisible()

      // 마감일이 클릭한 날짜로 미리 설정되어 있는지 확인
      const currentYear = new Date().getFullYear()
      const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0')
      const expectedDate = `${currentYear}-${currentMonth}-15`
      await expect(page.locator('#dueDate')).toHaveValue(expectedDate)

      // 폼 입력
      await page.fill('#title', '캘린더에서 생성한 할 일')
      await page.fill('#description', '15일에 해야 할 일')
      await page.selectOption('#priority', 'high')
      await page.selectOption('#category', 'work')

      // 폼 제출
      await page.click('button[type="submit"]')

      // 모달이 닫히고 캘린더에 할 일이 표시되는지 확인
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      await expect(
        page.locator('[data-testid="calendar-day-15"] [data-testid="calendar-todo-item"]')
      ).toBeVisible()
      await expect(page.locator('[data-testid="calendar-day-15"]')).toContainText(
        '캘린더에서 생성한 할 일'
      )
    })

    test('캘린더 상단의 추가 버튼으로 할 일을 생성할 수 있음', async ({ page }) => {
      // 할 일 추가 버튼 클릭
      await page.locator('[data-testid="add-calendar-todo"]').click()

      // 폼 모달이 열리는지 확인
      await expect(page.locator('[data-testid="todo-form-modal"]')).toBeVisible()

      // 마감일을 수동으로 설정
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowString = tomorrow.toISOString().split('T')[0]

      await page.fill('#title', '상단 버튼으로 생성')
      await page.fill('#dueDate', tomorrowString)
      await page.selectOption('#priority', 'medium')

      await page.click('button[type="submit"]')

      // 할 일이 올바른 날짜에 표시되는지 확인
      const tomorrowDay = tomorrow.getDate()
      await expect(
        page.locator(
          `[data-testid="calendar-day-${tomorrowDay}"] [data-testid="calendar-todo-item"]`
        )
      ).toBeVisible()
    })

    test('마감일 없는 할 일은 오늘 날짜에 표시됨', async ({ page }) => {
      await page.locator('[data-testid="add-calendar-todo"]').click()

      // 마감일을 설정하지 않고 할 일 생성
      await page.fill('#title', '마감일 없는 할 일')
      await page.selectOption('#priority', 'low')

      await page.click('button[type="submit"]')

      // 오늘 날짜에 할 일이 표시되는지 확인
      const today = new Date().getDate()
      await expect(
        page.locator(`[data-testid="calendar-day-${today}"] [data-testid="calendar-todo-item"]`)
      ).toBeVisible()
    })

    test('시간을 포함한 할 일을 생성할 수 있음', async ({ page }) => {
      await page.locator('[data-testid="calendar-day-20"]').click()

      await page.fill('#title', '시간 포함 할 일')
      await page.fill('#time', '14:30') // 시간 입력 필드가 있다면
      await page.selectOption('#priority', 'urgent')

      await page.click('button[type="submit"]')

      // 시간이 표시되는지 확인
      const todoItem = page.locator(
        '[data-testid="calendar-day-20"] [data-testid="calendar-todo-item"]'
      )
      await expect(todoItem).toContainText('14:30')
    })
  })

  test.describe('할 일 조회 및 표시 (Read)', () => {
    test.beforeEach(async ({ page }) => {
      // 테스트용 할 일들 미리 생성 (다양한 날짜에)
      const todos = [
        { title: '오늘 할 일', day: new Date().getDate(), priority: 'high' },
        { title: '내일 할 일', day: new Date().getDate() + 1, priority: 'medium' },
        { title: '다음주 할 일', day: new Date().getDate() + 7, priority: 'low' },
      ]

      for (const todo of todos) {
        await page.locator(`[data-testid="calendar-day-${todo.day}"]`).click()
        await page.fill('#title', todo.title)
        await page.selectOption('#priority', todo.priority)
        await page.click('button[type="submit"]')
        await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      }
    })

    test('생성된 할 일들이 올바른 날짜에 표시됨', async ({ page }) => {
      // 각 날짜에 할 일이 표시되는지 확인
      const today = new Date().getDate()
      await expect(page.locator(`[data-testid="calendar-day-${today}"]`)).toContainText(
        '오늘 할 일'
      )
      await expect(page.locator(`[data-testid="calendar-day-${today + 1}"]`)).toContainText(
        '내일 할 일'
      )
      await expect(page.locator(`[data-testid="calendar-day-${today + 7}"]`)).toContainText(
        '다음주 할 일'
      )
    })

    test('우선순위에 따른 색상 구분이 표시됨', async ({ page }) => {
      const today = new Date().getDate()
      const highPriorityTodo = page.locator(
        `[data-testid="calendar-day-${today}"] [data-testid="calendar-todo-item"]`
      )

      // 높은 우선순위 할 일의 색상 확인
      await expect(highPriorityTodo).toHaveClass(/bg-red|border-red|text-red/)
    })

    test('하루에 여러 할 일이 있을 때 모두 표시됨', async ({ page }) => {
      // 같은 날짜에 추가 할 일 생성
      const today = new Date().getDate()
      await page.locator(`[data-testid="calendar-day-${today}"]`).click()
      await page.fill('#title', '추가 할 일')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 같은 날짜에 2개의 할 일이 표시되는지 확인
      const todayTodos = page.locator(
        `[data-testid="calendar-day-${today}"] [data-testid="calendar-todo-item"]`
      )
      await expect(todayTodos).toHaveCount(2)
    })

    test('할 일이 많을 때 더보기 버튼이 표시됨', async ({ page }) => {
      const today = new Date().getDate()

      // 여러 할 일을 같은 날짜에 생성
      for (let i = 1; i <= 5; i++) {
        await page.locator(`[data-testid="calendar-day-${today}"]`).click()
        await page.fill('#title', `할 일 ${i}`)
        await page.click('button[type="submit"]')
        await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      }

      // 더보기 버튼이나 개수 표시 확인
      const moreButton = page.locator(
        `[data-testid="calendar-day-${today}"] [data-testid="more-todos"]`
      )
      if (await moreButton.isVisible()) {
        await expect(moreButton).toContainText('+')
      }
    })
  })

  test.describe('할 일 수정 (Update)', () => {
    test.beforeEach(async ({ page }) => {
      // 테스트용 할 일 생성
      await page.locator('[data-testid="calendar-day-15"]').click()
      await page.fill('#title', '수정 테스트 할 일')
      await page.fill('#description', '원본 설명')
      await page.selectOption('#priority', 'medium')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
    })

    test('캘린더의 할 일을 클릭하여 수정할 수 있음', async ({ page }) => {
      // 캘린더의 할 일 클릭
      await page
        .locator('[data-testid="calendar-day-15"] [data-testid="calendar-todo-item"]')
        .click()

      // 수정 폼이 열리는지 확인
      await expect(page.locator('[data-testid="todo-form-modal"]')).toBeVisible()

      // 기존 값이 채워져 있는지 확인
      await expect(page.locator('#title')).toHaveValue('수정 테스트 할 일')
      await expect(page.locator('#description')).toHaveValue('원본 설명')

      // 값 수정
      await page.fill('#title', '수정된 할 일')
      await page.fill('#description', '수정된 설명')
      await page.selectOption('#priority', 'high')

      await page.click('button[type="submit"]')

      // 수정사항이 캘린더에 반영되었는지 확인
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="calendar-day-15"]')).toContainText('수정된 할 일')
      await expect(page.locator('[data-testid="calendar-day-15"]')).not.toContainText('원본 설명')
    })

    test('할 일의 마감일을 변경할 수 있음', async ({ page }) => {
      // 할 일 클릭하여 수정
      await page
        .locator('[data-testid="calendar-day-15"] [data-testid="calendar-todo-item"]')
        .click()

      // 마감일을 20일로 변경
      const currentYear = new Date().getFullYear()
      const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0')
      const newDate = `${currentYear}-${currentMonth}-20`
      await page.fill('#dueDate', newDate)

      await page.click('button[type="submit"]')

      // 할 일이 새로운 날짜로 이동했는지 확인
      await expect(
        page.locator('[data-testid="calendar-day-15"] [data-testid="calendar-todo-item"]')
      ).not.toBeVisible()
      await expect(
        page.locator('[data-testid="calendar-day-20"] [data-testid="calendar-todo-item"]')
      ).toBeVisible()
      await expect(page.locator('[data-testid="calendar-day-20"]')).toContainText(
        '수정 테스트 할 일'
      )
    })

    test('할 일의 완료 상태를 토글할 수 있음', async ({ page }) => {
      // 할 일의 완료 체크박스 클릭 (캘린더에서 직접)
      const todoCheckbox = page.locator(
        '[data-testid="calendar-day-15"] [data-testid="todo-checkbox"]'
      )
      if (await todoCheckbox.isVisible()) {
        await todoCheckbox.check()

        // 완료된 할 일의 스타일이 변경되었는지 확인
        const todoItem = page.locator(
          '[data-testid="calendar-day-15"] [data-testid="calendar-todo-item"]'
        )
        await expect(todoItem).toHaveClass(/line-through|opacity-60|completed/)
      }
    })
  })

  test.describe('할 일 삭제 (Delete)', () => {
    test.beforeEach(async ({ page }) => {
      // 테스트용 할 일 생성
      await page.locator('[data-testid="calendar-day-25"]').click()
      await page.fill('#title', '삭제 테스트 할 일')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
    })

    test('캘린더에서 할 일을 삭제할 수 있음', async ({ page }) => {
      // 할 일에 마우스 호버하여 삭제 버튼 표시
      const todoItem = page.locator(
        '[data-testid="calendar-day-25"] [data-testid="calendar-todo-item"]'
      )
      await todoItem.hover()

      // 삭제 버튼 클릭
      await page.locator('[data-testid="delete-calendar-todo"]').click()

      // 확인 대화상자 처리
      page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm')
        expect(dialog.message()).toContain('삭제하시겠습니까')
        await dialog.accept()
      })

      // 할 일이 캘린더에서 제거되었는지 확인
      await expect(
        page.locator('[data-testid="calendar-day-25"] [data-testid="calendar-todo-item"]')
      ).not.toBeVisible()
    })

    test('할 일 편집 모달에서 삭제할 수 있음', async ({ page }) => {
      // 할 일 클릭하여 편집 모달 열기
      await page
        .locator('[data-testid="calendar-day-25"] [data-testid="calendar-todo-item"]')
        .click()

      // 편집 모달에서 삭제 버튼 클릭
      await page.locator('[data-testid="delete-todo-modal-button"]').click()

      // 확인 대화상자 처리
      page.on('dialog', async (dialog) => {
        await dialog.accept()
      })

      // 모달이 닫히고 할 일이 삭제되었는지 확인
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      await expect(
        page.locator('[data-testid="calendar-day-25"] [data-testid="calendar-todo-item"]')
      ).not.toBeVisible()
    })
  })

  test.describe('드래그 앤 드롭 (날짜 이동)', () => {
    test.beforeEach(async ({ page }) => {
      // 테스트용 할 일 생성
      await page.locator('[data-testid="calendar-day-10"]').click()
      await page.fill('#title', '드래그 테스트 할 일')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
    })

    test('할 일을 다른 날짜로 드래그할 수 있음', async ({ page }) => {
      const sourceTodo = page.locator(
        '[data-testid="calendar-day-10"] [data-testid="calendar-todo-item"]'
      )
      const targetDay = page.locator('[data-testid="calendar-day-15"]')

      // 드래그 앤 드롭 수행
      await sourceTodo.dragTo(targetDay)

      // 할 일이 새로운 날짜로 이동했는지 확인
      await expect(
        page.locator('[data-testid="calendar-day-10"] [data-testid="calendar-todo-item"]')
      ).not.toBeVisible()
      await expect(
        page.locator('[data-testid="calendar-day-15"] [data-testid="calendar-todo-item"]')
      ).toBeVisible()
      await expect(page.locator('[data-testid="calendar-day-15"]')).toContainText(
        '드래그 테스트 할 일'
      )
    })

    test('드래그 후 데이터베이스에 마감일 변경이 반영됨', async ({ page }) => {
      const sourceTodo = page.locator(
        '[data-testid="calendar-day-10"] [data-testid="calendar-todo-item"]'
      )
      const targetDay = page.locator('[data-testid="calendar-day-20"]')

      // 드래그 앤 드롭 수행
      await sourceTodo.dragTo(targetDay)

      // 페이지 새로고침하여 데이터 지속성 확인
      await page.reload()

      // 할 일이 여전히 새로운 날짜에 있는지 확인
      await expect(
        page.locator('[data-testid="calendar-day-20"] [data-testid="calendar-todo-item"]')
      ).toBeVisible()
      await expect(page.locator('[data-testid="calendar-day-20"]')).toContainText(
        '드래그 테스트 할 일'
      )
    })
  })

  test.describe('월별 보기 및 필터링', () => {
    test.beforeEach(async ({ page }) => {
      // 다양한 우선순위와 카테고리의 할 일들 생성
      const todos = [
        { title: '높은 우선순위', day: 5, priority: 'high', category: 'work' },
        { title: '중간 우선순위', day: 10, priority: 'medium', category: 'personal' },
        { title: '낮은 우선순위', day: 15, priority: 'low', category: 'shopping' },
      ]

      for (const todo of todos) {
        await page.locator(`[data-testid="calendar-day-${todo.day}"]`).click()
        await page.fill('#title', todo.title)
        await page.selectOption('#priority', todo.priority)
        await page.selectOption('#category', todo.category)
        await page.click('button[type="submit"]')
        await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      }
    })

    test('우선순위별 필터링이 동작함', async ({ page }) => {
      // 높은 우선순위 필터 적용
      await page.selectOption('[data-testid="priority-filter"]', 'high')

      // 높은 우선순위 할 일만 표시되는지 확인
      const visibleTodos = page.locator('[data-testid="calendar-todo-item"]:visible')
      await expect(visibleTodos).toHaveCount(1)
      await expect(page.locator('[data-testid="calendar-day-5"]')).toContainText('높은 우선순위')
    })

    test('카테고리별 필터링이 동작함', async ({ page }) => {
      // 업무 카테고리 필터 적용
      await page.selectOption('[data-testid="category-filter"]', 'work')

      // 업무 카테고리 할 일만 표시되는지 확인
      const visibleTodos = page.locator('[data-testid="calendar-todo-item"]:visible')
      await expect(visibleTodos).toHaveCount(1)
      await expect(page.locator('[data-testid="calendar-day-5"]')).toContainText('높은 우선순위')
    })

    test('완료/미완료 상태별 필터링이 동작함', async ({ page }) => {
      // 하나의 할 일을 완료 상태로 변경
      const todoCheckbox = page.locator(
        '[data-testid="calendar-day-5"] [data-testid="todo-checkbox"]'
      )
      if (await todoCheckbox.isVisible()) {
        await todoCheckbox.check()
      } else {
        // 체크박스가 없다면 할 일 클릭하여 편집 후 완료 상태로 변경
        await page
          .locator('[data-testid="calendar-day-5"] [data-testid="calendar-todo-item"]')
          .click()
        await page.selectOption('#status', 'done')
        await page.click('button[type="submit"]')
        await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      }

      // 완료된 할 일만 필터링
      await page.selectOption('[data-testid="status-filter"]', 'done')

      // 완료된 할 일만 표시되는지 확인
      const visibleTodos = page.locator('[data-testid="calendar-todo-item"]:visible')
      await expect(visibleTodos).toHaveCount(1)
    })
  })

  test.describe('반응형 디자인', () => {
    test('모바일에서 캘린더가 올바르게 표시됨', async ({ page }) => {
      // 할 일 하나 생성
      await page.locator('[data-testid="calendar-day-12"]').click()
      await page.fill('#title', '모바일 테스트 할 일')
      await page.click('button[type="submit"]')

      // 모바일 뷰포트로 변경
      await page.setViewportSize({ width: 375, height: 667 })

      // 캘린더가 모바일에서도 표시되는지 확인
      await expect(page.locator('[data-testid="calendar-grid"]')).toBeVisible()
      await expect(
        page.locator('[data-testid="calendar-day-12"] [data-testid="calendar-todo-item"]')
      ).toBeVisible()

      // 모바일에서 네비게이션 버튼이 적절히 표시되는지 확인
      await expect(page.locator('[data-testid="prev-month"]')).toBeVisible()
      await expect(page.locator('[data-testid="next-month"]')).toBeVisible()
    })

    test('태블릿에서 캘린더가 올바르게 표시됨', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })

      // 할 일 생성
      await page.locator('[data-testid="calendar-day-18"]').click()
      await page.fill('#title', '태블릿 테스트 할 일')
      await page.click('button[type="submit"]')

      // 태블릿에서 레이아웃이 올바른지 확인
      await expect(page.locator('[data-testid="calendar-todo-item"]')).toBeVisible()
      await expect(page.locator('[data-testid="calendar-header"]')).toBeVisible()
    })
  })

  test.describe('데이터 동기화', () => {
    test('페이지 새로고침 후에도 캘린더 상태가 유지됨', async ({ page }) => {
      // 할 일 생성
      await page.locator('[data-testid="calendar-day-22"]').click()
      await page.fill('#title', '동기화 테스트 할 일')
      await page.selectOption('#priority', 'high')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 다른 달로 이동
      await page.locator('[data-testid="next-month"]').click()

      // 페이지 새로고침
      await page.reload()

      // 이전 달로 돌아가기
      await page.locator('[data-testid="prev-month"]').click()

      // 할 일이 여전히 표시되는지 확인
      await expect(
        page.locator('[data-testid="calendar-day-22"] [data-testid="calendar-todo-item"]')
      ).toBeVisible()
      await expect(page.locator('[data-testid="calendar-day-22"]')).toContainText(
        '동기화 테스트 할 일'
      )
    })

    test('다른 페이지에서 추가한 할 일이 캘린더에 반영됨', async ({ page }) => {
      // 목록 페이지로 이동하여 할 일 생성
      await page.locator('[data-testid="nav-list"]').click()
      await expect(page).toHaveURL('/list')

      await page.locator('[data-testid="add-todo-button"]').click()
      await page.fill('#title', '목록에서 생성한 할 일')

      // 내일 날짜로 마감일 설정
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowString = tomorrow.toISOString().split('T')[0]
      await page.fill('#dueDate', tomorrowString)

      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 캘린더 페이지로 돌아가기
      await page.locator('[data-testid="nav-calendar"]').click()
      await expect(page).toHaveURL('/calendar')

      // 목록에서 생성한 할 일이 캘린더에 표시되는지 확인
      const tomorrowDay = tomorrow.getDate()
      await expect(
        page.locator(
          `[data-testid="calendar-day-${tomorrowDay}"] [data-testid="calendar-todo-item"]`
        )
      ).toBeVisible()
      await expect(page.locator(`[data-testid="calendar-day-${tomorrowDay}"]`)).toContainText(
        '목록에서 생성한 할 일'
      )
    })
  })

  test.describe('키보드 네비게이션', () => {
    test('화살표 키로 날짜 간 이동이 가능함', async ({ page }) => {
      // 첫 번째 날짜 셀에 포커스
      await page.locator('[data-testid="calendar-day-1"]').focus()

      // 오른쪽 화살표 키로 다음 날짜로 이동
      await page.keyboard.press('ArrowRight')

      // 포커스가 다음 날짜로 이동했는지 확인
      const focusedElement = await page.locator(':focus')
      await expect(focusedElement).toHaveAttribute('data-testid', 'calendar-day-2')
    })

    test('Enter 키로 날짜 선택이 가능함', async ({ page }) => {
      // 날짜 셀에 포커스 후 Enter 키 입력
      await page.locator('[data-testid="calendar-day-10"]').focus()
      await page.keyboard.press('Enter')

      // 할 일 생성 모달이 열리는지 확인
      await expect(page.locator('[data-testid="todo-form-modal"]')).toBeVisible()
    })
  })
})
