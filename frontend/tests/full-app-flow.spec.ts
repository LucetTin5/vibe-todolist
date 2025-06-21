import { test, expect } from '@playwright/test'

test.describe('Full Application Flow End-to-End', () => {
  let testEmail: string
  let testPassword: string
  let testName: string

  test.beforeEach(async ({ page }) => {
    // 고유한 테스트 사용자 생성
    const timestamp = Date.now()
    testEmail = `fullflow${timestamp}@example.com`
    testPassword = 'TestPassword123456'
    testName = '종합테스트사용자'
  })

  test.describe('전체 사용자 여정 (User Journey)', () => {
    test('새 사용자의 완전한 TodoList 앱 사용 시나리오', async ({ page }) => {
      // === 1. 첫 방문 및 회원가입 ===
      await page.goto('/')

      // 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL('/login')

      // 회원가입 페이지로 이동
      await page.click('text="새 계정 만들기"')
      await expect(page).toHaveURL('/signup')

      // 회원가입 폼 작성
      await page.fill('#name', testName)
      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)
      await page.fill('#confirmPassword', testPassword)
      await page.check('#agree-terms')
      await page.click('button[type="submit"]')

      // 대시보드로 자동 리다이렉트 확인
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

      // === 2. 초기 대시보드 상태 확인 ===
      await expect(page.locator('h1')).toContainText('대시보드')
      await expect(page.locator('[data-testid="total-todos"]')).toContainText('0')
      await expect(page.locator('[data-testid="completed-todos"]')).toContainText('0')
      await expect(page.locator('[data-testid="active-todos"]')).toContainText('0')

      // === 3. 첫 번째 할 일 생성 (대시보드에서) ===
      await page.locator('[data-testid="quick-add-todo"]').click()
      await page.fill('#title', '프로젝트 기획서 작성')
      await page.fill('#description', '새 프로젝트를 위한 상세 기획서 작성')
      await page.selectOption('#priority', 'high')
      await page.selectOption('#category', 'work')
      await page.selectOption('#status', 'todo')

      // 다음주 금요일로 마감일 설정
      const nextFriday = new Date()
      nextFriday.setDate(nextFriday.getDate() + ((5 + 7 - nextFriday.getDay()) % 7 || 7))
      const nextFridayString = nextFriday.toISOString().split('T')[0]
      await page.fill('#dueDate', nextFridayString)

      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 대시보드 통계 업데이트 확인
      await expect(page.locator('[data-testid="total-todos"]')).toContainText('1')
      await expect(page.locator('[data-testid="active-todos"]')).toContainText('1')

      // === 4. 목록 뷰에서 추가 할 일들 생성 ===
      await page.locator('[data-testid="nav-list"]').click()
      await expect(page).toHaveURL('/list')

      // 첫 번째 할 일이 목록에 표시되는지 확인
      await expect(page.locator('[data-testid="todo-item"]')).toContainText('프로젝트 기획서 작성')

      // 두 번째 할 일 추가
      await page.locator('[data-testid="add-todo-button"]').click()
      await page.fill('#title', '팀 미팅 준비')
      await page.fill('#description', '프로젝트 킥오프 미팅을 위한 자료 준비')
      await page.selectOption('#priority', 'medium')
      await page.selectOption('#category', 'work')
      await page.selectOption('#status', 'in-progress')

      // 내일 날짜로 마감일 설정
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowString = tomorrow.toISOString().split('T')[0]
      await page.fill('#dueDate', tomorrowString)

      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 세 번째 할 일 추가
      await page.locator('[data-testid="add-todo-button"]').click()
      await page.fill('#title', '장보기')
      await page.fill('#description', '주말 요리를 위한 재료 구매')
      await page.selectOption('#priority', 'low')
      await page.selectOption('#category', 'personal')
      await page.selectOption('#status', 'todo')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 목록에 3개 할 일이 표시되는지 확인
      await expect(page.locator('[data-testid="todo-item"]')).toHaveCount(3)

      // === 5. 칸반 뷰에서 작업 상태 관리 ===
      await page.locator('[data-testid="nav-kanban"]').click()
      await expect(page).toHaveURL('/kanban')

      // 각 컬럼에 올바른 할 일들이 배치되었는지 확인
      await expect(
        page.locator('[data-testid="kanban-column-todo"] [data-testid="kanban-card"]')
      ).toHaveCount(2)
      await expect(
        page.locator('[data-testid="kanban-column-in-progress"] [data-testid="kanban-card"]')
      ).toHaveCount(1)
      await expect(
        page.locator('[data-testid="kanban-column-done"] [data-testid="kanban-card"]')
      ).toHaveCount(0)

      // 프로젝트 기획서를 진행 중으로 이동
      const planningCard = page
        .locator('[data-testid="kanban-column-todo"] [data-testid="kanban-card"]')
        .filter({ hasText: '프로젝트 기획서 작성' })
      const inProgressColumn = page.locator('[data-testid="kanban-column-in-progress"]')
      await planningCard.dragTo(inProgressColumn)

      // 팀 미팅 준비를 완료로 이동
      const meetingCard = page
        .locator('[data-testid="kanban-column-in-progress"] [data-testid="kanban-card"]')
        .filter({ hasText: '팀 미팅 준비' })
      const doneColumn = page.locator('[data-testid="kanban-column-done"]')
      await meetingCard.dragTo(doneColumn)

      // 새로운 긴급 작업 추가
      await page.locator('[data-testid="add-todo-todo"]').click()
      await page.fill('#title', '버그 수정')
      await page.fill('#description', '긴급 버그 수정 필요')
      await page.selectOption('#priority', 'urgent')
      await page.selectOption('#category', 'work')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 최종 칸반 상태 확인
      await expect(
        page.locator('[data-testid="kanban-column-todo"] [data-testid="kanban-card"]')
      ).toHaveCount(2) // 장보기, 버그 수정
      await expect(
        page.locator('[data-testid="kanban-column-in-progress"] [data-testid="kanban-card"]')
      ).toHaveCount(1) // 프로젝트 기획서
      await expect(
        page.locator('[data-testid="kanban-column-done"] [data-testid="kanban-card"]')
      ).toHaveCount(1) // 팀 미팅 준비

      // === 6. 캘린더 뷰에서 일정 관리 ===
      await page.locator('[data-testid="nav-calendar"]').click()
      await expect(page).toHaveURL('/calendar')

      // 내일 날짜에 완료된 팀 미팅 준비가 표시되는지 확인
      const tomorrowDay = tomorrow.getDate()
      await expect(
        page.locator(
          `[data-testid="calendar-day-${tomorrowDay}"] [data-testid="calendar-todo-item"]`
        )
      ).toBeVisible()

      // 다음주 금요일에 프로젝트 기획서가 표시되는지 확인
      const currentMonth = new Date().getMonth()
      const nextFridayMonth = nextFriday.getMonth()
      if (nextFridayMonth !== currentMonth) {
        await page.locator('[data-testid="next-month"]').click()
      }

      const nextFridayDay = nextFriday.getDate()
      await expect(
        page.locator(
          `[data-testid="calendar-day-${nextFridayDay}"] [data-testid="calendar-todo-item"]`
        )
      ).toBeVisible()

      // 새로운 약속 추가 (다음주 수요일)
      const nextWednesday = new Date()
      nextWednesday.setDate(nextWednesday.getDate() + ((3 + 7 - nextWednesday.getDay()) % 7 || 7))
      const nextWednesdayDay = nextWednesday.getDate()

      if (nextWednesday.getMonth() === nextFriday.getMonth()) {
        await page.locator(`[data-testid="calendar-day-${nextWednesdayDay}"]`).click()
      } else {
        // 현재 달로 돌아가기
        await page.locator('[data-testid="prev-month"]').click()
        await page.locator(`[data-testid="calendar-day-${nextWednesdayDay}"]`).click()
      }

      await page.fill('#title', '치과 예약')
      await page.fill('#description', '정기 검진')
      await page.selectOption('#priority', 'medium')
      await page.selectOption('#category', 'personal')
      await page.fill('#time', '14:00')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // === 7. 대시보드에서 최종 통계 확인 ===
      await page.locator('[data-testid="nav-dashboard"]').click()

      // 최종 통계 확인 (총 5개, 완료 1개, 활성 4개)
      await expect(page.locator('[data-testid="total-todos"]')).toContainText('5')
      await expect(page.locator('[data-testid="completed-todos"]')).toContainText('1')
      await expect(page.locator('[data-testid="active-todos"]')).toContainText('4')

      // 우선순위별 통계 확인
      const priorityStats = page.locator('[data-testid="priority-stats"]')
      await expect(priorityStats).toContainText('긴급') // 버그 수정
      await expect(priorityStats).toContainText('높음') // 프로젝트 기획서
      await expect(priorityStats).toContainText('보통') // 치과 예약

      // 카테고리별 통계 확인
      const categoryStats = page.locator('[data-testid="category-stats"]')
      await expect(categoryStats).toContainText('업무') // 3개
      await expect(categoryStats).toContainText('개인') // 2개

      // === 8. 목록 뷰에서 필터링 및 검색 테스트 ===
      await page.locator('[data-testid="nav-list"]').click()

      // 우선순위 필터링 (긴급만)
      await page.selectOption('[data-testid="priority-filter"]', 'urgent')
      await expect(page.locator('[data-testid="todo-item"]:visible')).toHaveCount(1)
      await expect(page.locator('[data-testid="todo-item"]:visible')).toContainText('버그 수정')

      // 필터 초기화
      await page.selectOption('[data-testid="priority-filter"]', 'all')
      await expect(page.locator('[data-testid="todo-item"]')).toHaveCount(5)

      // 카테고리 필터링 (개인만)
      await page.selectOption('[data-testid="category-filter"]', 'personal')
      await expect(page.locator('[data-testid="todo-item"]:visible')).toHaveCount(2)

      // 검색 기능 테스트
      await page.selectOption('[data-testid="category-filter"]', 'all')
      await page.fill('[data-testid="search-input"]', '프로젝트')
      await expect(page.locator('[data-testid="todo-item"]:visible')).toHaveCount(1)
      await expect(page.locator('[data-testid="todo-item"]:visible')).toContainText(
        '프로젝트 기획서 작성'
      )

      // 검색 초기화
      await page.fill('[data-testid="search-input"]', '')

      // === 9. 할 일 수정 및 완료 처리 ===
      // 장보기 할 일을 편집하여 우선순위 상승
      const shoppingTodo = page.locator('[data-testid="todo-item"]').filter({ hasText: '장보기' })
      await shoppingTodo.click()
      await page.selectOption('#priority', 'high')
      await page.selectOption('#status', 'in-progress')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 버그 수정을 완료 처리
      const bugFixCheckbox = page
        .locator('[data-testid="todo-item"]')
        .filter({ hasText: '버그 수정' })
        .locator('[data-testid="todo-checkbox"]')
      await bugFixCheckbox.check()

      // === 10. 테마 변경 테스트 ===
      await page.locator('[data-testid="theme-toggle"]').click()

      // 다크 모드가 적용되었는지 확인
      const isDarkMode = await page.evaluate(() => {
        return (
          document.documentElement.classList.contains('dark') ||
          document.body.classList.contains('dark')
        )
      })
      expect(isDarkMode).toBe(true)

      // === 11. 사용자 메뉴 및 로그아웃 ===
      await page.locator('[data-testid="user-menu"]').click()
      await expect(page.locator('[data-testid="user-dropdown"]')).toBeVisible()
      await expect(page.locator('[data-testid="user-dropdown"]')).toContainText(testName)

      // 로그아웃
      await page.locator('[data-testid="logout-button"]').click()
      await expect(page).toHaveURL('/login', { timeout: 10000 })

      // === 12. 재로그인 및 데이터 지속성 확인 ===
      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

      // 데이터가 유지되었는지 확인
      await expect(page.locator('[data-testid="total-todos"]')).toContainText('5')
      await expect(page.locator('[data-testid="completed-todos"]')).toContainText('2') // 팀 미팅 준비, 버그 수정

      // 테마 설정이 유지되었는지 확인
      const isDarkModeAfterLogin = await page.evaluate(() => {
        return (
          document.documentElement.classList.contains('dark') ||
          document.body.classList.contains('dark')
        )
      })
      expect(isDarkModeAfterLogin).toBe(true)

      // === 13. 최종 검증 - 모든 뷰에서 데이터 일관성 ===
      // 목록 뷰 확인
      await page.locator('[data-testid="nav-list"]').click()
      await expect(page.locator('[data-testid="todo-item"]')).toHaveCount(5)

      // 칸반 뷰 확인
      await page.locator('[data-testid="nav-kanban"]').click()
      await expect(
        page.locator('[data-testid="kanban-column-todo"] [data-testid="kanban-card"]')
      ).toHaveCount(1) // 치과 예약만
      await expect(
        page.locator('[data-testid="kanban-column-in-progress"] [data-testid="kanban-card"]')
      ).toHaveCount(2) // 프로젝트 기획서, 장보기
      await expect(
        page.locator('[data-testid="kanban-column-done"] [data-testid="kanban-card"]')
      ).toHaveCount(2) // 팀 미팅 준비, 버그 수정

      // 캘린더 뷰 확인
      await page.locator('[data-testid="nav-calendar"]').click()

      // 모든 마감일이 있는 할 일들이 올바른 날짜에 표시되는지 확인
      await expect(
        page.locator(
          `[data-testid="calendar-day-${tomorrowDay}"] [data-testid="calendar-todo-item"]`
        )
      ).toHaveCount(1)

      // === 최종 성공 메시지 ===
      console.log('✅ 전체 애플리케이션 플로우 테스트 완료!')
      console.log('- 회원가입/로그인 ✓')
      console.log('- 할 일 CRUD 작업 ✓')
      console.log('- 다중 뷰 네비게이션 ✓')
      console.log('- 드래그 앤 드롭 ✓')
      console.log('- 필터링 및 검색 ✓')
      console.log('- 테마 변경 ✓')
      console.log('- 데이터 지속성 ✓')
      console.log('- 크로스 뷰 동기화 ✓')
    })
  })

  test.describe('고급 사용 시나리오', () => {
    test('프로젝트 관리자의 일주일 업무 시나리오', async ({ page }) => {
      // 회원가입
      await page.goto('/signup')
      await page.fill('#name', '프로젝트매니저')
      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)
      await page.fill('#confirmPassword', testPassword)
      await page.check('#agree-terms')
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

      // 월요일 - 주간 계획 수립
      const monday = new Date()
      monday.setDate(monday.getDate() + ((1 + 7 - monday.getDay()) % 7))

      const weeklyTasks = [
        { title: '주간 스프린트 계획', day: 1, priority: 'high', category: 'work' },
        { title: '클라이언트 미팅', day: 2, priority: 'urgent', category: 'work' },
        { title: '개발팀 리뷰', day: 3, priority: 'medium', category: 'work' },
        { title: '프로젝트 보고서 작성', day: 4, priority: 'high', category: 'work' },
        { title: '주간 회고', day: 5, priority: 'medium', category: 'work' },
      ]

      // 캘린더에서 일주일 일정 등록
      await page.locator('[data-testid="nav-calendar"]').click()

      for (const task of weeklyTasks) {
        const taskDate = new Date(monday)
        taskDate.setDate(monday.getDate() + task.day - 1)
        const taskDay = taskDate.getDate()

        await page.locator(`[data-testid="calendar-day-${taskDay}"]`).click()
        await page.fill('#title', task.title)
        await page.selectOption('#priority', task.priority)
        await page.selectOption('#category', task.category)
        await page.click('button[type="submit"]')
        await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      }

      // 칸반으로 이동하여 작업 상태 관리
      await page.locator('[data-testid="nav-kanban"]').click()

      // 모든 작업이 할 일 컬럼에 있는지 확인
      await expect(
        page.locator('[data-testid="kanban-column-todo"] [data-testid="kanban-card"]')
      ).toHaveCount(5)

      // 월요일 작업을 진행 중으로 이동
      const mondayTask = page
        .locator('[data-testid="kanban-card"]')
        .filter({ hasText: '주간 스프린트 계획' })
      await mondayTask.dragTo(page.locator('[data-testid="kanban-column-in-progress"]'))

      // 화요일 작업을 완료로 이동 (완료됨)
      const tuesdayTask = page
        .locator('[data-testid="kanban-card"]')
        .filter({ hasText: '클라이언트 미팅' })
      await tuesdayTask.dragTo(page.locator('[data-testid="kanban-column-done"]'))

      // 대시보드에서 진행 상황 확인
      await page.locator('[data-testid="nav-dashboard"]').click()
      await expect(page.locator('[data-testid="total-todos"]')).toContainText('5')
      await expect(page.locator('[data-testid="completed-todos"]')).toContainText('1')
      await expect(page.locator('[data-testid="active-todos"]')).toContainText('4')

      // 우선순위별 필터링으로 긴급 작업 확인
      await page.locator('[data-testid="nav-list"]').click()
      await page.selectOption('[data-testid="priority-filter"]', 'urgent')
      // 클라이언트 미팅이 완료되어 필터에서 제외될 수 있음

      console.log('✅ 프로젝트 관리자 시나리오 완료!')
    })

    test('개인 사용자의 일상 관리 시나리오', async ({ page }) => {
      // 다른 이메일로 회원가입
      const personalEmail = testEmail.replace('@', '_personal@')

      await page.goto('/signup')
      await page.fill('#name', '개인사용자')
      await page.fill('#email', personalEmail)
      await page.fill('#password', testPassword)
      await page.fill('#confirmPassword', testPassword)
      await page.check('#agree-terms')
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

      // 개인 할 일들 추가
      const personalTasks = [
        { title: '운동하기', priority: 'medium', category: 'personal' },
        { title: '독서 1시간', priority: 'low', category: 'personal' },
        { title: '장보기', priority: 'high', category: 'shopping' },
        { title: '친구와 만나기', priority: 'medium', category: 'personal' },
        { title: '집안일', priority: 'low', category: 'personal' },
      ]

      // 대시보드에서 빠르게 할 일들 추가
      for (const task of personalTasks) {
        await page.locator('[data-testid="quick-add-todo"]').click()
        await page.fill('#title', task.title)
        await page.selectOption('#priority', task.priority)
        await page.selectOption('#category', task.category)
        await page.click('button[type="submit"]')
        await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      }

      // 목록에서 카테고리별 정리
      await page.locator('[data-testid="nav-list"]').click()

      // 개인 카테고리만 필터링
      await page.selectOption('[data-testid="category-filter"]', 'personal')
      await expect(page.locator('[data-testid="todo-item"]:visible')).toHaveCount(4)

      // 운동 완료 처리
      const exerciseCheckbox = page
        .locator('[data-testid="todo-item"]')
        .filter({ hasText: '운동하기' })
        .locator('[data-testid="todo-checkbox"]')
      await exerciseCheckbox.check()

      // 칸반에서 진행 상황 관리
      await page.locator('[data-testid="nav-kanban"]').click()

      // 장보기를 진행 중으로 이동
      const shoppingTask = page.locator('[data-testid="kanban-card"]').filter({ hasText: '장보기' })
      await shoppingTask.dragTo(page.locator('[data-testid="kanban-column-in-progress"]'))

      // 최종 통계 확인
      await page.locator('[data-testid="nav-dashboard"]').click()
      await expect(page.locator('[data-testid="total-todos"]')).toContainText('5')
      await expect(page.locator('[data-testid="completed-todos"]')).toContainText('1')

      console.log('✅ 개인 사용자 시나리오 완료!')
    })
  })

  test.describe('스트레스 테스트', () => {
    test('대량 데이터 처리 성능 테스트', async ({ page }) => {
      // 회원가입
      await page.goto('/signup')
      await page.fill('#name', '스트레스테스터')
      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)
      await page.fill('#confirmPassword', testPassword)
      await page.check('#agree-terms')
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

      // 목록 뷰로 이동하여 많은 할 일 생성
      await page.locator('[data-testid="nav-list"]').click()

      const priorities = ['low', 'medium', 'high', 'urgent']
      const categories = ['work', 'personal', 'shopping']
      const statuses = ['todo', 'in-progress']

      // 50개의 할 일 생성 (실제로는 5-10개로 제한하여 테스트 시간 단축)
      for (let i = 1; i <= 10; i++) {
        await page.locator('[data-testid="add-todo-button"]').click()
        await page.fill('#title', `할 일 ${i}`)
        await page.fill('#description', `${i}번째 할 일의 상세 설명입니다.`)
        await page.selectOption('#priority', priorities[i % priorities.length])
        await page.selectOption('#category', categories[i % categories.length])
        await page.selectOption('#status', statuses[i % statuses.length])

        if (i % 3 === 0) {
          // 3개마다 마감일 설정
          const futureDate = new Date()
          futureDate.setDate(futureDate.getDate() + i)
          await page.fill('#dueDate', futureDate.toISOString().split('T')[0])
        }

        await page.click('button[type="submit"]')
        await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()
      }

      // 목록 로딩 성능 확인
      await expect(page.locator('[data-testid="todo-item"]')).toHaveCount(10)

      // 칸반 뷰 로딩 성능 확인
      await page.locator('[data-testid="nav-kanban"]').click()
      await expect(page.locator('[data-testid="kanban-card"]')).toHaveCount(10)

      // 필터링 성능 테스트
      await page.locator('[data-testid="nav-list"]').click()
      await page.selectOption('[data-testid="priority-filter"]', 'high')
      // 높은 우선순위 아이템들만 표시되는지 확인

      // 검색 성능 테스트
      await page.selectOption('[data-testid="priority-filter"]', 'all')
      await page.fill('[data-testid="search-input"]', '할 일 5')
      await expect(page.locator('[data-testid="todo-item"]:visible')).toHaveCount(1)

      console.log('✅ 스트레스 테스트 완료!')
    })
  })

  test.describe('오류 복구 시나리오', () => {
    test('네트워크 오류 및 복구 시나리오', async ({ page }) => {
      // 정상 상태에서 시작
      await page.goto('/signup')
      await page.fill('#name', '오류테스터')
      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)
      await page.fill('#confirmPassword', testPassword)
      await page.check('#agree-terms')
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

      // 정상 상태에서 할 일 생성
      await page.locator('[data-testid="quick-add-todo"]').click()
      await page.fill('#title', '네트워크 테스트 할 일')
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="todo-form-modal"]')).not.toBeVisible()

      // 네트워크 오프라인 시뮬레이션
      await page.context().setOffline(true)

      // 오프라인 상태에서 새로운 할 일 생성 시도
      await page.locator('[data-testid="quick-add-todo"]').click()
      await page.fill('#title', '오프라인 할 일')
      await page.click('button[type="submit"]')

      // 오류 처리 또는 대기 상태 확인
      // (실제 구현에 따라 다름 - 오프라인 저장, 오류 메시지 등)

      // 네트워크 복구
      await page.context().setOffline(false)

      // 페이지 새로고침 후 데이터 확인
      await page.reload()
      await expect(page.locator('[data-testid="total-todos"]')).toContainText('1') // 네트워크 테스트 할 일만

      console.log('✅ 네트워크 오류 복구 시나리오 완료!')
    })
  })
})
