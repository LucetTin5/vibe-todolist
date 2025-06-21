import { test, expect } from '@playwright/test'

test.describe('Kanban View CRUD and Drag-Drop Operations', () => {
  let testEmail: string
  let testPassword: string
  let testName: string

  test.beforeEach(async ({ page }) => {
    // 고유한 테스트 사용자 생성
    const timestamp = Date.now()
    testEmail = `kanban${timestamp}@example.com`
    testPassword = 'TestPassword123456'
    testName = '칸반테스트사용자'

    // 회원가입 후 칸반 페이지로 이동
    await page.goto('/signup')
    await page.fill('#name', testName)
    await page.fill('#email', testEmail)
    await page.fill('#password', testPassword)
    await page.fill('#confirmPassword', testPassword)
    await page.check('#agree-terms')
    await page.click('button[type="submit"]')

    // 대시보드에서 칸반 페이지로 이동
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    await page.locator('[data-testid="nav-kanban"]').click()
    await expect(page).toHaveURL('/kanban')
  })

  test.describe('칸반 보드 렌더링', () => {
    test('칸반 보드가 올바르게 로드됨', async ({ page }) => {
      // 페이지 제목 확인
      await expect(page.locator('h1')).toContainText('칸반 보드')

      // 세 개의 컬럼이 표시되는지 확인
      await expect(page.locator('[data-testid="kanban-column-todo"]')).toBeVisible()
      await expect(page.locator('[data-testid="kanban-column-in-progress"]')).toBeVisible()
      await expect(page.locator('[data-testid="kanban-column-done"]')).toBeVisible()

      // 컬럼 제목 확인
      await expect(page.locator('[data-testid="kanban-column-todo"]')).toContainText('할 일')
      await expect(page.locator('[data-testid="kanban-column-in-progress"]')).toContainText(
        '진행 중'
      )
      await expect(page.locator('[data-testid="kanban-column-done"]')).toContainText('완료')
    })

    test('새 할 일 추가 버튼이 각 컬럼에 표시됨', async ({ page }) => {
      // 각 컬럼의 추가 버튼 확인
      await expect(page.locator('[data-testid="add-todo-todo"]')).toBeVisible()
      await expect(page.locator('[data-testid="add-todo-in-progress"]')).toBeVisible()
      await expect(page.locator('[data-testid="add-todo-done"]')).toBeVisible()
    })

    test('빈 칸반 보드 상태가 올바르게 표시됨', async ({ page }) => {
      // 새 사용자이므로 모든 컬럼이 비어있어야 함
      await expect(
        page.locator('[data-testid="kanban-column-todo"] [data-testid="kanban-card"]')
      ).toHaveCount(0)
      await expect(
        page.locator('[data-testid="kanban-column-in-progress"] [data-testid="kanban-card"]')
      ).toHaveCount(0)
      await expect(
        page.locator('[data-testid="kanban-column-done"] [data-testid="kanban-card"]')
      ).toHaveCount(0)

      // 빈 상태 메시지 확인
      await expect(page.locator('[data-testid="empty-kanban-todo"]')).toBeVisible()
      await expect(page.locator('[data-testid="empty-kanban-in-progress"]')).toBeVisible()
      await expect(page.locator('[data-testid="empty-kanban-done"]')).toBeVisible()
    })
  })

  test.describe('할 일 생성 (Create)', () => {
    test('할 일 컬럼에서 새 할 일을 생성할 수 있음', async ({ page }) => {
      // 할 일 컬럼에서 추가 버튼 클릭
      await page.locator('[data-testid="add-todo-todo"]').click()

      // 폼 모달이 열리는지 확인
      await expect(page.locator('[data-testid="todo-form-modal"]')).toBeVisible()

      // 상태가 'todo'로 미리 설정되어 있는지 확인
      await expect(page.locator('#status')).toHaveValue('todo')

      // 폼 입력
      await page.fill('#title', '칸반 할 일 카드')
      await page.fill('#description', '칸반 보드에서 생성한 할 일')
      await page.selectOption('#priority', 'high')
      await page.selectOption('#category', 'work')

      // 폼 제출
      await page.click('button[type="submit"]')

      // 모달이 닫히고 할 일 컬럼에 카드가 나타나는지 확인
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      await expect(
        page.locator('[data-testid="kanban-column-todo"] [data-testid="kanban-card"]')
      ).toHaveCount(1)
      await expect(
        page.locator('[data-testid="kanban-column-todo"] [data-testid="kanban-card"]')
      ).toContainText('칸반 할 일 카드')
    })

    test('진행 중 컬럼에서 새 할 일을 생성할 수 있음', async ({ page }) => {
      await page.locator('[data-testid="add-todo-in-progress"]').click()

      // 상태가 'in-progress'로 미리 설정되어 있는지 확인
      await expect(page.locator('#status')).toHaveValue('in-progress')

      await page.fill('#title', '진행 중인 작업')
      await page.fill('#description', '현재 작업 중인 할 일')
      await page.selectOption('#priority', 'medium')

      await page.click('button[type="submit"]')

      // 진행 중 컬럼에 카드가 생성되었는지 확인
      await expect(
        page.locator('[data-testid="kanban-column-in-progress"] [data-testid="kanban-card"]')
      ).toHaveCount(1)
      await expect(
        page.locator('[data-testid="kanban-column-in-progress"] [data-testid="kanban-card"]')
      ).toContainText('진행 중인 작업')
    })

    test('완료 컬럼에서 새 할 일을 생성할 수 있음', async ({ page }) => {
      await page.locator('[data-testid="add-todo-done"]').click()

      // 상태가 'done'으로 미리 설정되어 있는지 확인
      await expect(page.locator('#status')).toHaveValue('done')

      await page.fill('#title', '완료된 작업')
      await page.selectOption('#priority', 'low')

      await page.click('button[type="submit"]')

      // 완료 컬럼에 카드가 생성되었는지 확인
      await expect(
        page.locator('[data-testid="kanban-column-done"] [data-testid="kanban-card"]')
      ).toHaveCount(1)
      await expect(
        page.locator('[data-testid="kanban-column-done"] [data-testid="kanban-card"]')
      ).toContainText('완료된 작업')
    })

    test('마감일을 포함한 칸반 카드를 생성할 수 있음', async ({ page }) => {
      await page.locator('[data-testid="add-todo-todo"]').click()

      await page.fill('#title', '마감일 있는 칸반 카드')
      await page.selectOption('#priority', 'urgent')

      // 마감일 설정 (내일 날짜)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowString = tomorrow.toISOString().split('T')[0]
      await page.fill('#dueDate', tomorrowString)

      await page.click('button[type="submit"]')

      // 카드에 마감일이 표시되는지 확인
      const card = page.locator('[data-testid="kanban-column-todo"] [data-testid="kanban-card"]')
      await expect(card).toContainText('마감일 있는 칸반 카드')
      await expect(card.locator('[data-testid="card-due-date"]')).toBeVisible()
    })
  })

  test.describe('칸반 카드 조회 및 표시 (Read)', () => {
    test.beforeEach(async ({ page }) => {
      // 각 컬럼에 테스트용 할 일들 미리 생성
      const todos = [
        { title: '디자인 작업', status: 'todo', priority: 'high', category: 'work' },
        { title: '개발 작업', status: 'in-progress', priority: 'medium', category: 'work' },
        { title: '테스트 작업', status: 'done', priority: 'low', category: 'work' },
      ]

      for (const todo of todos) {
        const columnTestId = `add-todo-${todo.status}`
        await page.locator(`[data-testid="${columnTestId}"]`).click()
        await page.fill('#title', todo.title)
        await page.selectOption('#priority', todo.priority)
        await page.selectOption('#category', todo.category)
        await page.click('button[type="submit"]')
        await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      }
    })

    test('생성된 카드들이 올바른 컬럼에 표시됨', async ({ page }) => {
      // 각 컬럼에 1개씩 카드가 있는지 확인
      await expect(
        page.locator('[data-testid="kanban-column-todo"] [data-testid="kanban-card"]')
      ).toHaveCount(1)
      await expect(
        page.locator('[data-testid="kanban-column-in-progress"] [data-testid="kanban-card"]')
      ).toHaveCount(1)
      await expect(
        page.locator('[data-testid="kanban-column-done"] [data-testid="kanban-card"]')
      ).toHaveCount(1)

      // 각 카드의 제목이 올바른 컬럼에 표시되는지 확인
      await expect(page.locator('[data-testid="kanban-column-todo"]')).toContainText('디자인 작업')
      await expect(page.locator('[data-testid="kanban-column-in-progress"]')).toContainText(
        '개발 작업'
      )
      await expect(page.locator('[data-testid="kanban-column-done"]')).toContainText('테스트 작업')
    })

    test('카드에 우선순위 표시가 올바르게 됨', async ({ page }) => {
      // 높은 우선순위 카드의 스타일 확인
      const highPriorityCard = page.locator(
        '[data-testid="kanban-column-todo"] [data-testid="kanban-card"]'
      )
      await expect(highPriorityCard.locator('[data-testid="priority-badge"]')).toBeVisible()
      await expect(highPriorityCard.locator('[data-testid="priority-badge"]')).toContainText('높음')

      // 카드에 우선순위 색상이 적용되었는지 확인
      await expect(highPriorityCard.locator('[data-testid="priority-badge"]')).toHaveClass(
        /bg-red|border-red|text-red/
      )
    })

    test('카테고리 표시가 올바르게 됨', async ({ page }) => {
      const card = page.locator('[data-testid="kanban-column-todo"] [data-testid="kanban-card"]')
      await expect(card.locator('[data-testid="category-badge"]')).toBeVisible()
      await expect(card.locator('[data-testid="category-badge"]')).toContainText('업무')
    })
  })

  test.describe('칸반 카드 수정 (Update)', () => {
    test.beforeEach(async ({ page }) => {
      // 테스트용 할 일 생성
      await page.locator('[data-testid="add-todo-todo"]').click()
      await page.fill('#title', '수정 테스트 카드')
      await page.fill('#description', '원본 설명')
      await page.selectOption('#priority', 'medium')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
    })

    test('카드를 클릭하여 수정할 수 있음', async ({ page }) => {
      // 카드 클릭하여 수정 모드 진입
      await page.locator('[data-testid="kanban-card"]').click()

      // 수정 폼이 열리는지 확인
      await expect(page.locator('[data-testid="todo-form-modal"]')).toBeVisible()

      // 기존 값이 채워져 있는지 확인
      await expect(page.locator('#title')).toHaveValue('수정 테스트 카드')
      await expect(page.locator('#description')).toHaveValue('원본 설명')

      // 값 수정
      await page.fill('#title', '수정된 카드')
      await page.fill('#description', '수정된 설명')
      await page.selectOption('#priority', 'high')

      await page.click('button[type="submit"]')

      // 수정사항이 카드에 반영되었는지 확인
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="kanban-card"]')).toContainText('수정된 카드')
      await expect(page.locator('[data-testid="kanban-card"]')).not.toContainText('원본 설명')
    })

    test('카드의 편집 버튼으로 수정할 수 있음', async ({ page }) => {
      // 카드에 마우스 호버하여 편집 버튼 표시
      await page.locator('[data-testid="kanban-card"]').hover()

      // 편집 버튼 클릭
      await page.locator('[data-testid="edit-card-button"]').click()

      await expect(page.locator('[data-testid="todo-form-modal"]')).toBeVisible()

      // 제목 수정
      await page.fill('#title', '편집 버튼으로 수정')
      await page.click('button[type="submit"]')

      await expect(page.locator('[data-testid="kanban-card"]')).toContainText('편집 버튼으로 수정')
    })
  })

  test.describe('드래그 앤 드롭 기능', () => {
    test.beforeEach(async ({ page }) => {
      // 테스트용 할 일 생성 (할 일 컬럼에)
      await page.locator('[data-testid="add-todo-todo"]').click()
      await page.fill('#title', '드래그 테스트 카드')
      await page.fill('#description', '이동할 카드')
      await page.selectOption('#priority', 'high')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
    })

    test('할 일에서 진행 중으로 카드를 드래그할 수 있음', async ({ page }) => {
      const sourceCard = page.locator(
        '[data-testid="kanban-column-todo"] [data-testid="kanban-card"]'
      )
      const targetColumn = page.locator('[data-testid="kanban-column-in-progress"]')

      // 드래그 앤 드롭 수행
      await sourceCard.dragTo(targetColumn)

      // 카드가 진행 중 컬럼으로 이동했는지 확인
      await expect(
        page.locator('[data-testid="kanban-column-todo"] [data-testid="kanban-card"]')
      ).toHaveCount(0)
      await expect(
        page.locator('[data-testid="kanban-column-in-progress"] [data-testid="kanban-card"]')
      ).toHaveCount(1)
      await expect(page.locator('[data-testid="kanban-column-in-progress"]')).toContainText(
        '드래그 테스트 카드'
      )
    })

    test('진행 중에서 완료로 카드를 드래그할 수 있음', async ({ page }) => {
      // 먼저 할 일에서 진행 중으로 이동
      const sourceCard = page.locator(
        '[data-testid="kanban-column-todo"] [data-testid="kanban-card"]'
      )
      const inProgressColumn = page.locator('[data-testid="kanban-column-in-progress"]')
      await sourceCard.dragTo(inProgressColumn)

      // 이제 진행 중에서 완료로 이동
      const inProgressCard = page.locator(
        '[data-testid="kanban-column-in-progress"] [data-testid="kanban-card"]'
      )
      const doneColumn = page.locator('[data-testid="kanban-column-done"]')
      await inProgressCard.dragTo(doneColumn)

      // 카드가 완료 컬럼으로 이동했는지 확인
      await expect(
        page.locator('[data-testid="kanban-column-in-progress"] [data-testid="kanban-card"]')
      ).toHaveCount(0)
      await expect(
        page.locator('[data-testid="kanban-column-done"] [data-testid="kanban-card"]')
      ).toHaveCount(1)
      await expect(page.locator('[data-testid="kanban-column-done"]')).toContainText(
        '드래그 테스트 카드'
      )
    })

    test('완료에서 다시 할 일로 카드를 되돌릴 수 있음', async ({ page }) => {
      // 카드를 완료 상태까지 이동
      const sourceCard = page.locator(
        '[data-testid="kanban-column-todo"] [data-testid="kanban-card"]'
      )
      const doneColumn = page.locator('[data-testid="kanban-column-done"]')
      await sourceCard.dragTo(doneColumn)

      // 완료에서 다시 할 일로 이동
      const doneCard = page.locator(
        '[data-testid="kanban-column-done"] [data-testid="kanban-card"]'
      )
      const todoColumn = page.locator('[data-testid="kanban-column-todo"]')
      await doneCard.dragTo(todoColumn)

      // 카드가 할 일 컬럼으로 되돌아갔는지 확인
      await expect(
        page.locator('[data-testid="kanban-column-done"] [data-testid="kanban-card"]')
      ).toHaveCount(0)
      await expect(
        page.locator('[data-testid="kanban-column-todo"] [data-testid="kanban-card"]')
      ).toHaveCount(1)
      await expect(page.locator('[data-testid="kanban-column-todo"]')).toContainText(
        '드래그 테스트 카드'
      )
    })

    test('드래그 후 데이터베이스에 상태 변경이 반영됨', async ({ page }) => {
      const sourceCard = page.locator(
        '[data-testid="kanban-column-todo"] [data-testid="kanban-card"]'
      )
      const targetColumn = page.locator('[data-testid="kanban-column-in-progress"]')

      // 드래그 앤 드롭 수행
      await sourceCard.dragTo(targetColumn)

      // 페이지 새로고침하여 데이터 지속성 확인
      await page.reload()

      // 카드가 여전히 진행 중 컬럼에 있는지 확인
      await expect(
        page.locator('[data-testid="kanban-column-in-progress"] [data-testid="kanban-card"]')
      ).toHaveCount(1)
      await expect(page.locator('[data-testid="kanban-column-in-progress"]')).toContainText(
        '드래그 테스트 카드'
      )
    })

    test('여러 카드가 있을 때 순서 변경이 가능함', async ({ page }) => {
      // 추가 카드 생성
      await page.locator('[data-testid="add-todo-todo"]').click()
      await page.fill('#title', '두 번째 카드')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      await page.locator('[data-testid="add-todo-todo"]').click()
      await page.fill('#title', '세 번째 카드')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 할 일 컬럼에 3개 카드가 있는지 확인
      await expect(
        page.locator('[data-testid="kanban-column-todo"] [data-testid="kanban-card"]')
      ).toHaveCount(3)

      // 첫 번째 카드를 진행 중으로 이동
      const firstCard = page
        .locator('[data-testid="kanban-column-todo"] [data-testid="kanban-card"]')
        .first()
      const inProgressColumn = page.locator('[data-testid="kanban-column-in-progress"]')
      await firstCard.dragTo(inProgressColumn)

      // 할 일 컬럼에 2개, 진행 중 컬럼에 1개 카드가 있는지 확인
      await expect(
        page.locator('[data-testid="kanban-column-todo"] [data-testid="kanban-card"]')
      ).toHaveCount(2)
      await expect(
        page.locator('[data-testid="kanban-column-in-progress"] [data-testid="kanban-card"]')
      ).toHaveCount(1)
    })
  })

  test.describe('칸반 카드 삭제 (Delete)', () => {
    test.beforeEach(async ({ page }) => {
      // 테스트용 할 일 생성
      await page.locator('[data-testid="add-todo-todo"]').click()
      await page.fill('#title', '삭제 테스트 카드')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
    })

    test('카드의 삭제 버튼으로 삭제할 수 있음', async ({ page }) => {
      // 카드에 마우스 호버하여 삭제 버튼 표시
      await page.locator('[data-testid="kanban-card"]').hover()

      // 삭제 버튼 클릭
      await page.locator('[data-testid="delete-card-button"]').click()

      // 확인 대화상자 처리
      page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm')
        expect(dialog.message()).toContain('삭제하시겠습니까')
        await dialog.accept()
      })

      // 카드가 제거되었는지 확인
      await expect(page.locator('[data-testid="kanban-card"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="empty-kanban-todo"]')).toBeVisible()
    })

    test('카드 편집 모달에서 삭제할 수 있음', async ({ page }) => {
      // 카드 클릭하여 편집 모달 열기
      await page.locator('[data-testid="kanban-card"]').click()

      // 편집 모달에서 삭제 버튼 클릭
      await page.locator('[data-testid="delete-todo-modal-button"]').click()

      // 확인 대화상자 처리
      page.on('dialog', async (dialog) => {
        await dialog.accept()
      })

      // 모달이 닫히고 카드가 삭제되었는지 확인
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="kanban-card"]')).not.toBeVisible()
    })

    test('삭제 취소가 동작함', async ({ page }) => {
      await page.locator('[data-testid="kanban-card"]').hover()
      await page.locator('[data-testid="delete-card-button"]').click()

      // 확인 대화상자에서 취소
      page.on('dialog', async (dialog) => {
        await dialog.dismiss()
      })

      // 카드가 여전히 남아있는지 확인
      await expect(page.locator('[data-testid="kanban-card"]')).toBeVisible()
      await expect(page.locator('[data-testid="kanban-card"]')).toContainText('삭제 테스트 카드')
    })
  })

  test.describe('필터링 및 검색', () => {
    test.beforeEach(async ({ page }) => {
      // 다양한 우선순위와 카테고리의 카드들 생성
      const cards = [
        { title: '높은 우선순위 업무', priority: 'high', category: 'work', status: 'todo' },
        {
          title: '중간 우선순위 개인',
          priority: 'medium',
          category: 'personal',
          status: 'in-progress',
        },
        { title: '낮은 우선순위 쇼핑', priority: 'low', category: 'shopping', status: 'done' },
      ]

      for (const card of cards) {
        const columnTestId = `add-todo-${card.status}`
        await page.locator(`[data-testid="${columnTestId}"]`).click()
        await page.fill('#title', card.title)
        await page.selectOption('#priority', card.priority)
        await page.selectOption('#category', card.category)
        await page.click('button[type="submit"]')
        await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      }
    })

    test('우선순위별 필터링이 동작함', async ({ page }) => {
      // 높은 우선순위 필터 적용
      await page.selectOption('[data-testid="priority-filter"]', 'high')

      // 높은 우선순위 카드만 표시되는지 확인
      const visibleCards = page.locator('[data-testid="kanban-card"]:visible')
      await expect(visibleCards).toHaveCount(1)
      await expect(visibleCards).toContainText('높은 우선순위 업무')
    })

    test('카테고리별 필터링이 동작함', async ({ page }) => {
      // 업무 카테고리 필터 적용
      await page.selectOption('[data-testid="category-filter"]', 'work')

      // 업무 카테고리 카드만 표시되는지 확인
      const visibleCards = page.locator('[data-testid="kanban-card"]:visible')
      await expect(visibleCards).toHaveCount(1)
      await expect(visibleCards).toContainText('높은 우선순위 업무')
    })

    test('검색 기능이 동작함', async ({ page }) => {
      // 검색어 입력
      await page.fill('[data-testid="search-input"]', '개인')

      // 검색 결과 확인
      const visibleCards = page.locator('[data-testid="kanban-card"]:visible')
      await expect(visibleCards).toHaveCount(1)
      await expect(visibleCards).toContainText('중간 우선순위 개인')
    })
  })

  test.describe('반응형 디자인', () => {
    test('모바일에서 칸반 보드가 올바르게 표시됨', async ({ page }) => {
      // 할 일 하나 생성
      await page.locator('[data-testid="add-todo-todo"]').click()
      await page.fill('#title', '모바일 테스트 카드')
      await page.click('button[type="submit"]')

      // 모바일 뷰포트로 변경
      await page.setViewportSize({ width: 375, height: 667 })

      // 칸반 컬럼들이 모바일에서도 표시되는지 확인
      await expect(page.locator('[data-testid="kanban-column-todo"]')).toBeVisible()
      await expect(page.locator('[data-testid="kanban-column-in-progress"]')).toBeVisible()
      await expect(page.locator('[data-testid="kanban-column-done"]')).toBeVisible()

      // 카드가 모바일에서도 올바르게 표시되는지 확인
      await expect(page.locator('[data-testid="kanban-card"]')).toBeVisible()
    })

    test('태블릿에서 칸반 보드가 올바르게 표시됨', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })

      // 할 일 생성
      await page.locator('[data-testid="add-todo-todo"]').click()
      await page.fill('#title', '태블릿 테스트 카드')
      await page.click('button[type="submit"]')

      // 태블릿에서 레이아웃이 올바른지 확인
      await expect(page.locator('[data-testid="kanban-card"]')).toBeVisible()
      await expect(page.locator('[data-testid="kanban-columns-container"]')).toBeVisible()
    })
  })

  test.describe('데이터 동기화', () => {
    test('페이지 새로고침 후에도 칸반 상태가 유지됨', async ({ page }) => {
      // 카드 생성 및 이동
      await page.locator('[data-testid="add-todo-todo"]').click()
      await page.fill('#title', '동기화 테스트 카드')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 카드를 진행 중으로 이동
      const sourceCard = page.locator(
        '[data-testid="kanban-column-todo"] [data-testid="kanban-card"]'
      )
      const targetColumn = page.locator('[data-testid="kanban-column-in-progress"]')
      await sourceCard.dragTo(targetColumn)

      // 페이지 새로고침
      await page.reload()

      // 칸반 보드가 올바르게 로드되고 카드 위치가 유지되는지 확인
      await expect(page).toHaveURL('/kanban')
      await expect(
        page.locator('[data-testid="kanban-column-in-progress"] [data-testid="kanban-card"]')
      ).toHaveCount(1)
      await expect(page.locator('[data-testid="kanban-column-in-progress"]')).toContainText(
        '동기화 테스트 카드'
      )
    })
  })
})
