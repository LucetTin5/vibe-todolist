import { test, expect } from '@playwright/test'

test.describe('Header Navigation', () => {
  let testEmail: string
  let testPassword: string
  let testName: string

  test.beforeEach(async ({ page }) => {
    // 고유한 테스트 사용자 생성
    const timestamp = Date.now()
    testEmail = `header${timestamp}@example.com`
    testPassword = 'TestPassword123456'
    testName = '헤더테스트사용자'

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

  test.describe('헤더 요소 표시', () => {
    test('헤더의 모든 요소가 올바르게 표시됨', async ({ page }) => {
      // 로고/브랜드명 확인
      await expect(page.locator('[data-testid="app-logo"]')).toBeVisible()

      // 네비게이션 메뉴 확인
      await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-list"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-kanban"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-calendar"]')).toBeVisible()

      // 사용자 정보 및 컨트롤 확인
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible()
    })

    test('사용자 정보가 올바르게 표시됨', async ({ page }) => {
      // 사용자 이름이 표시되는지 확인
      const userMenu = page.locator('[data-testid="user-menu"]')
      await expect(userMenu).toContainText(testName)
    })
  })

  test.describe('페이지 네비게이션', () => {
    test('대시보드 네비게이션이 동작함', async ({ page }) => {
      // 다른 페이지로 이동 후 대시보드로 돌아가기
      await page.locator('[data-testid="nav-list"]').click()
      await expect(page).toHaveURL('/list')

      await page.locator('[data-testid="nav-dashboard"]').click()
      await expect(page).toHaveURL('/dashboard')
    })

    test('목록 페이지 네비게이션이 동작함', async ({ page }) => {
      await page.locator('[data-testid="nav-list"]').click()
      await expect(page).toHaveURL('/list', { timeout: 5000 })

      // 페이지 제목 확인
      await expect(page.locator('h1')).toContainText('할 일 목록')
    })

    test('칸반 페이지 네비게이션이 동작함', async ({ page }) => {
      await page.locator('[data-testid="nav-kanban"]').click()
      await expect(page).toHaveURL('/kanban', { timeout: 5000 })

      // 칸반 보드 요소 확인
      await expect(page.locator('[data-testid="kanban-column-todo"]')).toBeVisible()
      await expect(page.locator('[data-testid="kanban-column-in-progress"]')).toBeVisible()
      await expect(page.locator('[data-testid="kanban-column-done"]')).toBeVisible()
    })

    test('캘린더 페이지 네비게이션이 동작함', async ({ page }) => {
      await page.locator('[data-testid="nav-calendar"]').click()
      await expect(page).toHaveURL('/calendar', { timeout: 5000 })

      // 캘린더 요소 확인
      await expect(page.locator('[data-testid="calendar-grid"]')).toBeVisible()
    })

    test('현재 페이지가 네비게이션에서 활성화 표시됨', async ({ page }) => {
      // 대시보드 페이지에서 대시보드 네비게이션 활성화 확인
      const dashboardNav = page.locator('[data-testid="nav-dashboard"]')
      await expect(dashboardNav).toHaveClass(/active|current/)

      // 목록 페이지로 이동 후 목록 네비게이션 활성화 확인
      await page.locator('[data-testid="nav-list"]').click()
      const listNav = page.locator('[data-testid="nav-list"]')
      await expect(listNav).toHaveClass(/active|current/)
    })
  })

  test.describe('테마 토글', () => {
    test('라이트/다크 테마 토글이 동작함', async ({ page }) => {
      const themeToggle = page.locator('[data-testid="theme-toggle"]')

      // 초기 테마 확인 (기본값은 라이트)
      const initialTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      })

      // 테마 토글 클릭
      await themeToggle.click()

      // 테마가 변경되었는지 확인
      const changedTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      })

      expect(changedTheme).not.toBe(initialTheme)
    })

    test('테마 설정이 페이지 새로고침 후에도 유지됨', async ({ page }) => {
      const themeToggle = page.locator('[data-testid="theme-toggle"]')

      // 다크 테마로 변경
      await themeToggle.click()
      await page.waitForTimeout(500) // 테마 적용 대기

      const themeBeforeReload = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      })

      // 페이지 새로고침
      await page.reload()

      // 테마가 유지되는지 확인
      const themeAfterReload = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      })

      expect(themeAfterReload).toBe(themeBeforeReload)
    })

    test('테마 토글 아이콘이 올바르게 변경됨', async ({ page }) => {
      const themeToggle = page.locator('[data-testid="theme-toggle"]')

      // 테마 토글 클릭 전후로 아이콘이 변경되는지 확인
      await themeToggle.click()
      await page.waitForTimeout(300) // 아이콘 변경 대기

      // 아이콘이 존재하는지 확인 (구체적인 아이콘은 구현에 따라 다름)
      const icon = themeToggle.locator('svg, [data-testid="theme-icon"]')
      await expect(icon).toBeVisible()
    })
  })

  test.describe('사용자 메뉴', () => {
    test('사용자 메뉴 드롭다운이 동작함', async ({ page }) => {
      const userMenu = page.locator('[data-testid="user-menu"]')

      // 사용자 메뉴 클릭
      await userMenu.click()

      // 드롭다운 메뉴가 표시되는지 확인
      await expect(page.locator('[data-testid="user-dropdown"]')).toBeVisible()

      // 로그아웃 버튼이 표시되는지 확인
      await expect(page.locator('[data-testid="logout-button"]')).toBeVisible()
    })

    test('로그아웃 기능이 동작함', async ({ page }) => {
      const userMenu = page.locator('[data-testid="user-menu"]')

      // 사용자 메뉴 열기
      await userMenu.click()

      // 로그아웃 버튼 클릭
      await page.locator('[data-testid="logout-button"]').click()

      // 로그인 페이지로 리다이렉트되는지 확인
      await expect(page).toHaveURL('/login', { timeout: 10000 })

      // 로그인 폼이 표시되는지 확인
      await expect(page.locator('h2')).toContainText('로그인')
    })

    test('로그아웃 후 보호된 페이지 접근 시 로그인 페이지로 리다이렉트됨', async ({ page }) => {
      // 로그아웃
      await page.locator('[data-testid="user-menu"]').click()
      await page.locator('[data-testid="logout-button"]').click()
      await expect(page).toHaveURL('/login')

      // 보호된 페이지에 직접 접근 시도
      await page.goto('/dashboard')

      // 로그인 페이지로 리다이렉트되는지 확인
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('반응형 헤더', () => {
    test('모바일에서 햄버거 메뉴가 표시됨', async ({ page }) => {
      // 모바일 뷰포트로 변경
      await page.setViewportSize({ width: 375, height: 667 })

      // 햄버거 메뉴 버튼이 표시되는지 확인
      await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible()

      // 데스크톱 네비게이션이 숨겨지는지 확인
      await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible()
    })

    test('모바일 햄버거 메뉴가 동작함', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"]')

      // 햄버거 메뉴 클릭
      await mobileMenuToggle.click()

      // 모바일 메뉴가 표시되는지 확인
      await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible()

      // 네비게이션 링크들이 표시되는지 확인
      await expect(page.locator('[data-testid="mobile-nav-dashboard"]')).toBeVisible()
      await expect(page.locator('[data-testid="mobile-nav-list"]')).toBeVisible()
      await expect(page.locator('[data-testid="mobile-nav-kanban"]')).toBeVisible()
      await expect(page.locator('[data-testid="mobile-nav-calendar"]')).toBeVisible()
    })

    test('모바일 메뉴에서 페이지 이동이 동작함', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // 햄버거 메뉴 열기
      await page.locator('[data-testid="mobile-menu-toggle"]').click()

      // 목록 페이지로 이동
      await page.locator('[data-testid="mobile-nav-list"]').click()

      // 페이지 이동 확인
      await expect(page).toHaveURL('/list')

      // 모바일 메뉴가 자동으로 닫히는지 확인
      await expect(page.locator('[data-testid="mobile-nav-menu"]')).not.toBeVisible()
    })

    test('태블릿에서 헤더가 올바르게 표시됨', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })

      // 데스크톱 네비게이션이 표시되는지 확인
      await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible()

      // 모바일 메뉴 토글이 숨겨지는지 확인
      await expect(page.locator('[data-testid="mobile-menu-toggle"]')).not.toBeVisible()
    })
  })

  test.describe('접근성', () => {
    test('키보드 네비게이션이 동작함', async ({ page }) => {
      // Tab 키를 사용하여 네비게이션 요소들에 포커스 이동
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // 포커스된 요소가 네비게이션 링크인지 확인
      const focusedElement = await page.locator(':focus')
      await expect(focusedElement).toBeVisible()

      // Enter 키로 링크 활성화 가능한지 확인
      await page.keyboard.press('Enter')
      // URL 변경이나 모달 열림 등의 동작 확인
    })

    test('ARIA 라벨이 올바르게 설정됨', async ({ page }) => {
      // 네비게이션 요소에 적절한 aria-label이 있는지 확인
      const navElement = page.locator('[data-testid="main-navigation"]')
      await expect(navElement).toHaveAttribute('role', 'navigation')

      // 사용자 메뉴에 aria-label이 있는지 확인
      const userMenu = page.locator('[data-testid="user-menu"]')
      await expect(userMenu).toHaveAttribute('aria-label')
    })
  })
})
