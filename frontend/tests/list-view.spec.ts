import { test, expect } from '@playwright/test'

test.describe('List View CRUD Operations', () => {
  let testEmail: string
  let testPassword: string
  let testName: string

  test.beforeEach(async ({ page }) => {
    // 고유한 테스트 사용자 생성
    const timestamp = Date.now()
    testEmail = `listview${timestamp}@example.com`
    testPassword = 'TestPassword123456'
    testName = '목록테스트사용자'

    // 회원가입 후 목록 페이지로 이동
    await page.goto('/signup')
    await page.fill('#name', testName)
    await page.fill('#email', testEmail)
    await page.fill('#password', testPassword)
    await page.fill('#confirmPassword', testPassword)
    await page.check('#agree-terms')
    await page.click('button[type="submit"]')

    // 대시보드에서 목록 페이지로 이동
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    await page.locator('[data-testid="nav-list"]').click()
    await expect(page).toHaveURL('/list')
  })

  test.describe('페이지 렌더링', () => {
    test('목록 페이지가 올바르게 로드됨', async ({ page }) => {
      // 페이지 제목 확인
      await expect(page.locator('h1')).toContainText('할 일 목록')

      // 새 할 일 추가 버튼 확인
      await expect(page.locator('[data-testid="add-todo-button"]')).toBeVisible()

      // 빈 상태 메시지 확인 (새 사용자이므로)
      await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()
      await expect(page.locator('[data-testid="empty-state"]')).toContainText('할 일이 없습니다')
    })

    test('필터링 및 정렬 컨트롤이 표시됨', async ({ page }) => {
      // 검색 입력창 확인
      await expect(page.locator('[data-testid="search-input"]')).toBeVisible()

      // 필터 옵션들 확인
      await expect(page.locator('[data-testid="priority-filter"]')).toBeVisible()
      await expect(page.locator('[data-testid="category-filter"]')).toBeVisible()
      await expect(page.locator('[data-testid="status-filter"]')).toBeVisible()

      // 정렬 옵션 확인
      await expect(page.locator('[data-testid="sort-dropdown"]')).toBeVisible()
    })
  })

  test.describe('할 일 생성 (Create)', () => {
    test('새 할 일을 성공적으로 생성할 수 있음', async ({ page }) => {
      // 할 일 추가 버튼 클릭
      await page.locator('[data-testid="add-todo-button"]').click()

      // 폼 모달이 열리는지 확인
      await expect(page.locator('[data-testid="todo-form-modal"]')).toBeVisible()

      // 폼 입력
      await page.fill('#title', '첫 번째 할 일')
      await page.fill('#description', '목록 뷰에서 생성한 할 일입니다')
      await page.selectOption('#priority', 'high')
      await page.selectOption('#category', 'work')

      // 폼 제출
      await page.click('button[type="submit"]')

      // 모달이 닫히고 할 일이 목록에 나타나는지 확인
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="todo-item"]')).toBeVisible()
      await expect(page.locator('[data-testid="todo-item"]')).toContainText('첫 번째 할 일')
    })

    test('마감일을 포함한 할 일을 생성할 수 있음', async ({ page }) => {
      await page.locator('[data-testid="add-todo-button"]').click()

      await page.fill('#title', '마감일 있는 할 일')
      await page.fill('#description', '내일까지 완료해야 함')
      await page.selectOption('#priority', 'urgent')

      // 마감일 설정 (내일 날짜)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowString = tomorrow.toISOString().split('T')[0]
      await page.fill('#dueDate', tomorrowString)

      await page.click('button[type="submit"]')

      // 할 일이 생성되고 마감일이 표시되는지 확인
      await expect(page.locator('[data-testid="todo-item"]')).toContainText('마감일 있는 할 일')
      await expect(page.locator('[data-testid="todo-due-date"]')).toBeVisible()
    })

    test('태그를 포함한 할 일을 생성할 수 있음', async ({ page }) => {
      await page.locator('[data-testid="add-todo-button"]').click()

      await page.fill('#title', '태그 포함 할 일')
      await page.fill('#tags', '중요, 프로젝트, 마케팅')
      await page.selectOption('#category', 'work')

      await page.click('button[type="submit"]')

      // 태그가 표시되는지 확인
      await expect(page.locator('[data-testid="todo-tags"]')).toBeVisible()
      await expect(page.locator('[data-testid="todo-tags"]')).toContainText('중요')
      await expect(page.locator('[data-testid="todo-tags"]')).toContainText('프로젝트')
    })

    test('필수 필드 누락 시 유효성 검사가 동작함', async ({ page }) => {
      await page.locator('[data-testid="add-todo-button"]').click()

      // 제목 없이 제출 시도
      await page.fill('#description', '제목이 없는 할 일')
      await page.click('button[type="submit"]')

      // 에러 메시지가 표시되는지 확인
      await expect(page.locator('[data-testid="title-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="title-error"]')).toContainText('제목을 입력해주세요')
    })
  })

  test.describe('할 일 조회 및 표시 (Read)', () => {
    test.beforeEach(async ({ page }) => {
      // 테스트용 할 일들 미리 생성
      const todos = [
        { title: '우선순위 높음', priority: 'high', category: 'work' },
        { title: '우선순위 보통', priority: 'medium', category: 'personal' },
        { title: '우선순위 낮음', priority: 'low', category: 'shopping' },
      ]

      for (const todo of todos) {
        await page.locator('[data-testid="add-todo-button"]').click()
        await page.fill('#title', todo.title)
        await page.selectOption('#priority', todo.priority)
        await page.selectOption('#category', todo.category)
        await page.click('button[type="submit"]')
        await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      }
    })

    test('생성된 할 일들이 목록에 표시됨', async ({ page }) => {
      // 3개의 할 일이 모두 표시되는지 확인
      const todoItems = page.locator('[data-testid="todo-item"]')
      await expect(todoItems).toHaveCount(3)

      // 각 할 일의 제목이 표시되는지 확인
      await expect(page.locator('text=우선순위 높음')).toBeVisible()
      await expect(page.locator('text=우선순위 보통')).toBeVisible()
      await expect(page.locator('text=우선순위 낮음')).toBeVisible()
    })

    test('우선순위별 필터링이 동작함', async ({ page }) => {
      // 높은 우선순위 필터 적용
      await page.selectOption('[data-testid="priority-filter"]', 'high')

      // 높은 우선순위 할 일만 표시되는지 확인
      const todoItems = page.locator('[data-testid="todo-item"]')
      await expect(todoItems).toHaveCount(1)
      await expect(page.locator('text=우선순위 높음')).toBeVisible()
      await expect(page.locator('text=우선순위 보통')).not.toBeVisible()
    })

    test('카테고리별 필터링이 동작함', async ({ page }) => {
      // 업무 카테고리 필터 적용
      await page.selectOption('[data-testid="category-filter"]', 'work')

      // 업무 카테고리 할 일만 표시되는지 확인
      const todoItems = page.locator('[data-testid="todo-item"]')
      await expect(todoItems).toHaveCount(1)
      await expect(page.locator('text=우선순위 높음')).toBeVisible()
    })

    test('검색 기능이 동작함', async ({ page }) => {
      // 검색어 입력
      await page.fill('[data-testid="search-input"]', '높음')

      // 검색 결과 확인
      const todoItems = page.locator('[data-testid="todo-item"]')
      await expect(todoItems).toHaveCount(1)
      await expect(page.locator('text=우선순위 높음')).toBeVisible()
    })

    test('정렬 기능이 동작함', async ({ page }) => {
      // 우선순위순 정렬
      await page.selectOption('[data-testid="sort-dropdown"]', 'priority-desc')

      // 정렬 순서 확인 (높음 > 보통 > 낮음)
      const todoTitles = await page.locator('[data-testid="todo-title"]').allTextContents()
      expect(todoTitles[0]).toContain('우선순위 높음')
      expect(todoTitles[1]).toContain('우선순위 보통')
      expect(todoTitles[2]).toContain('우선순위 낮음')
    })
  })

  test.describe('할 일 수정 (Update)', () => {
    test.beforeEach(async ({ page }) => {
      // 테스트용 할 일 생성
      await page.locator('[data-testid="add-todo-button"]').click()
      await page.fill('#title', '수정 테스트 할 일')
      await page.fill('#description', '원본 설명')
      await page.selectOption('#priority', 'medium')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
    })

    test('할 일을 수정할 수 있음', async ({ page }) => {
      // 할 일 항목 클릭하여 수정 모드 진입
      await page.locator('[data-testid="todo-item"]').click()

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

      // 수정사항이 반영되었는지 확인
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      await expect(page.locator('text=수정된 할 일')).toBeVisible()
      await expect(page.locator('text=원본 설명')).not.toBeVisible()
    })

    test('할 일 편집 버튼으로 수정할 수 있음', async ({ page }) => {
      // 편집 버튼 클릭
      await page.locator('[data-testid="edit-todo-button"]').first().click()

      await expect(page.locator('[data-testid="todo-form-modal"]')).toBeVisible()

      // 제목 수정
      await page.fill('#title', '편집 버튼으로 수정')
      await page.click('button[type="submit"]')

      await expect(page.locator('text=편집 버튼으로 수정')).toBeVisible()
    })

    test('할 일 상태를 변경할 수 있음', async ({ page }) => {
      // 할 일 수정
      await page.locator('[data-testid="todo-item"]').click()

      // 상태 변경
      await page.selectOption('#status', 'in-progress')
      await page.click('button[type="submit"]')

      // 상태가 변경되었는지 확인
      await expect(page.locator('[data-testid="todo-status"]')).toContainText('진행 중')
    })
  })

  test.describe('할 일 완료/미완료 토글', () => {
    test.beforeEach(async ({ page }) => {
      // 테스트용 할 일 생성
      await page.locator('[data-testid="add-todo-button"]').click()
      await page.fill('#title', '완료 테스트 할 일')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
    })

    test('체크박스로 할 일을 완료/미완료 상태로 토글할 수 있음', async ({ page }) => {
      const checkbox = page.locator('[data-testid="todo-checkbox"]').first()

      // 초기 상태 확인 (미완료)
      await expect(checkbox).not.toBeChecked()

      // 완료 상태로 변경
      await checkbox.check()

      // 완료 상태 확인
      await expect(checkbox).toBeChecked()

      // 할 일 항목에 완료 스타일이 적용되었는지 확인
      await expect(page.locator('[data-testid="todo-title"]').first()).toHaveClass(
        /line-through|completed/
      )

      // 다시 미완료 상태로 변경
      await checkbox.uncheck()

      // 미완료 상태 확인
      await expect(checkbox).not.toBeChecked()
      await expect(page.locator('[data-testid="todo-title"]').first()).not.toHaveClass(
        /line-through|completed/
      )
    })

    test('완료된 할 일의 표시 스타일이 변경됨', async ({ page }) => {
      const checkbox = page.locator('[data-testid="todo-checkbox"]').first()
      const todoItem = page.locator('[data-testid="todo-item"]').first()

      // 완료 상태로 변경
      await checkbox.check()

      // 완료된 할 일의 스타일 확인
      await expect(todoItem).toHaveClass(/opacity-60|completed/)
      await expect(page.locator('[data-testid="todo-title"]').first()).toHaveClass(/line-through/)
    })
  })

  test.describe('할 일 삭제 (Delete)', () => {
    test.beforeEach(async ({ page }) => {
      // 테스트용 할 일 생성
      await page.locator('[data-testid="add-todo-button"]').click()
      await page.fill('#title', '삭제 테스트 할 일')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
    })

    test('할 일을 삭제할 수 있음', async ({ page }) => {
      // 삭제 버튼 클릭
      await page.locator('[data-testid="delete-todo-button"]').first().click()

      // 확인 대화상자가 나타나는지 확인
      page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm')
        expect(dialog.message()).toContain('삭제하시겠습니까')
        await dialog.accept()
      })

      // 할 일이 목록에서 제거되었는지 확인
      await expect(page.locator('text=삭제 테스트 할 일')).not.toBeVisible()
      await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()
    })

    test('할 일 수정 모달에서 삭제할 수 있음', async ({ page }) => {
      // 할 일 클릭하여 수정 모달 열기
      await page.locator('[data-testid="todo-item"]').click()

      // 수정 모달에서 삭제 버튼 클릭
      await page.locator('[data-testid="delete-todo-modal-button"]').click()

      // 확인 대화상자 처리
      page.on('dialog', async (dialog) => {
        await dialog.accept()
      })

      // 모달이 닫히고 할 일이 삭제되었는지 확인
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      await expect(page.locator('text=삭제 테스트 할 일')).not.toBeVisible()
    })

    test('삭제 취소가 동작함', async ({ page }) => {
      await page.locator('[data-testid="delete-todo-button"]').first().click()

      // 확인 대화상자에서 취소
      page.on('dialog', async (dialog) => {
        await dialog.dismiss()
      })

      // 할 일이 여전히 남아있는지 확인
      await expect(page.locator('text=삭제 테스트 할 일')).toBeVisible()
    })
  })

  test.describe('페이지네이션', () => {
    test.beforeEach(async ({ page }) => {
      // 페이지네이션 테스트를 위해 많은 할 일 생성
      for (let i = 1; i <= 25; i++) {
        await page.locator('[data-testid="add-todo-button"]').click()
        await page.fill('#title', `할 일 ${i}`)
        await page.click('button[type="submit"]')
        await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      }
    })

    test('페이지네이션이 표시됨', async ({ page }) => {
      // 페이지네이션 컨트롤이 표시되는지 확인
      await expect(page.locator('[data-testid="pagination"]')).toBeVisible()
      await expect(page.locator('[data-testid="next-page"]')).toBeVisible()
      await expect(page.locator('[data-testid="page-info"]')).toBeVisible()
    })

    test('다음 페이지로 이동할 수 있음', async ({ page }) => {
      // 첫 페이지에서 보이는 할 일 개수 확인 (기본 20개)
      const firstPageItems = await page.locator('[data-testid="todo-item"]').count()
      expect(firstPageItems).toBe(20)

      // 다음 페이지로 이동
      await page.locator('[data-testid="next-page"]').click()

      // 두 번째 페이지의 할 일 개수 확인 (나머지 5개)
      const secondPageItems = await page.locator('[data-testid="todo-item"]').count()
      expect(secondPageItems).toBe(5)
    })

    test('이전 페이지로 이동할 수 있음', async ({ page }) => {
      // 다음 페이지로 이동
      await page.locator('[data-testid="next-page"]').click()

      // 이전 페이지로 이동
      await page.locator('[data-testid="prev-page"]').click()

      // 첫 페이지로 돌아왔는지 확인
      const items = await page.locator('[data-testid="todo-item"]').count()
      expect(items).toBe(20)
    })
  })

  test.describe('반응형 디자인', () => {
    test('모바일에서 목록이 올바르게 표시됨', async ({ page }) => {
      // 할 일 하나 생성
      await page.locator('[data-testid="add-todo-button"]').click()
      await page.fill('#title', '모바일 테스트 할 일')
      await page.click('button[type="submit"]')

      // 모바일 뷰포트로 변경
      await page.setViewportSize({ width: 375, height: 667 })

      // 할 일 항목이 모바일에서도 표시되는지 확인
      await expect(page.locator('[data-testid="todo-item"]')).toBeVisible()

      // 모바일에서 필터가 콜랩스되거나 적절히 표시되는지 확인
      await expect(page.locator('[data-testid="mobile-filter-toggle"]')).toBeVisible()
    })

    test('태블릿에서 목록이 올바르게 표시됨', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })

      // 할 일 생성
      await page.locator('[data-testid="add-todo-button"]').click()
      await page.fill('#title', '태블릿 테스트 할 일')
      await page.click('button[type="submit"]')

      // 태블릿에서 레이아웃이 올바른지 확인
      await expect(page.locator('[data-testid="todo-item"]')).toBeVisible()
      await expect(page.locator('[data-testid="desktop-filters"]')).toBeVisible()
    })
  })
})
