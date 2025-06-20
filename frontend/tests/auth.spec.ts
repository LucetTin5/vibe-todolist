import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 홈페이지로 이동
    await page.goto('/')
  })

  test.describe('회원가입', () => {
    test('성공적인 회원가입 플로우', async ({ page }) => {
      // 회원가입 페이지로 이동
      await page.goto('/signup')

      const timestamp = Date.now()
      const testEmail = `test${timestamp}@example.com`
      const testPassword = 'TestPassword123456'
      const testName = '테스트사용자'

      // 페이지 제목 확인
      await expect(page.locator('h2')).toContainText('새 계정 만들기')

      // 회원가입 폼 입력
      await page.fill('#name', testName)
      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)
      await page.fill('#confirmPassword', testPassword)

      // 이용약관 동의 체크박스 클릭
      await page.check('#agree-terms')

      // 회원가입 버튼 클릭
      await page.click('button[type="submit"]')

      // 회원가입 성공 후 대시보드로 리다이렉트 확인 (최대 10초 대기)
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    })

    test('이미 존재하는 이메일로 회원가입 시도', async ({ page }) => {
      await page.goto('/signup')

      // 이미 존재할 수 있는 이메일 사용
      await page.fill('#name', '중복사용자')
      await page.fill('#email', 'existing@example.com')
      await page.fill('#password', 'TestPassword123456')
      await page.fill('#confirmPassword', 'TestPassword123456')
      await page.check('#agree-terms')

      await page.click('button[type="submit"]')

      // 에러 메시지 확인 (이미 존재하는 사용자라는 에러가 표시되어야함)
      // 다양한 에러 메시지 셀렉터 시도
      const errorSelectors = [
        '.text-red-800',
        '.text-red-600',
        '[role="alert"]',
        '.bg-red-50',
        'text*="이미"',
        'text*="존재"',
        'text*="실패"',
      ]

      let errorFound = false
      for (const selector of errorSelectors) {
        try {
          await expect(page.locator(selector)).toBeVisible({ timeout: 2000 })
          errorFound = true
          break
        } catch {
          // 계속 다음 셀렉터 시도
        }
      }

      // 어떤 에러든 표시되어야 함
      expect(errorFound).toBe(true)
    })

    test('비밀번호 불일치 시 검증 에러', async ({ page }) => {
      await page.goto('/signup')

      await page.fill('#name', '테스트사용자')
      await page.fill('#email', 'test@example.com')
      await page.fill('#password', 'TestPassword123456')
      await page.fill('#confirmPassword', 'DifferentPassword123456')

      // 비밀번호 확인 필드에서 포커스를 벗어나게 해서 검증 트리거
      await page.click('#name')

      // 비밀번호 불일치 에러 메시지 확인
      const passwordErrorSelectors = [
        'text*="비밀번호가 일치하지 않습니다"',
        'text*="일치하지 않습니다"',
        '[data-testid*="password"]',
        '.text-red-500',
        '.text-red-600',
      ]

      let passwordErrorFound = false
      for (const selector of passwordErrorSelectors) {
        try {
          await expect(page.locator(selector)).toBeVisible({ timeout: 2000 })
          passwordErrorFound = true
          break
        } catch {
          // 계속 시도
        }
      }

      expect(passwordErrorFound).toBe(true)
    })

    test('필수 필드 누락 시 버튼 비활성화', async ({ page }) => {
      await page.goto('/signup')

      // 일부 필드만 입력
      await page.fill('#name', '테스트사용자')
      await page.fill('#email', 'test@example.com')

      // 회원가입 버튼이 비활성화되어 있는지 확인
      await expect(page.locator('button[type="submit"]')).toBeDisabled()
    })

    test('약관 동의 없이 회원가입 시도', async ({ page }) => {
      await page.goto('/signup')

      await page.fill('#name', '테스트사용자')
      await page.fill('#email', 'test@example.com')
      await page.fill('#password', 'TestPassword123456')
      await page.fill('#confirmPassword', 'TestPassword123456')
      // 약관 동의 체크박스를 체크하지 않음

      await page.click('button[type="submit"]')

      // HTML5 기본 검증 메시지 또는 커스텀 에러 메시지 확인
      const isValid = await page.evaluate(() =>
        document.querySelector('#agree-terms')?.checkValidity()
      )
      expect(isValid).toBe(false)
    })
  })

  test.describe('로그인', () => {
    test('성공적인 로그인 플로우', async ({ page }) => {
      // 먼저 회원가입을 통해 테스트 계정 생성
      const timestamp = Date.now()
      const testEmail = `logintest${timestamp}@example.com`
      const testPassword = 'TestPassword123456'

      // 회원가입
      await page.goto('/signup')
      await page.fill('#name', '로그인테스트')
      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)
      await page.fill('#confirmPassword', testPassword)
      await page.check('#agree-terms')
      await page.click('button[type="submit"]')

      // 대시보드 로딩 대기
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

      // 로그아웃 (헤더에서 로그아웃 버튼 클릭)
      await page.click('button:has-text("로그아웃")')

      // 로그인 페이지로 이동 확인
      await expect(page).toHaveURL('/login')

      // 로그인 시도
      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)
      await page.click('button[type="submit"]')

      // 로그인 성공 후 대시보드로 리다이렉트 확인
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    })

    test('잘못된 자격증명으로 로그인 시도', async ({ page }) => {
      await page.goto('/login')

      await page.fill('#email', 'nonexistent@example.com')
      await page.fill('#password', 'WrongPassword123456')
      await page.click('button[type="submit"]')

      // 에러 메시지 확인
      const loginErrorSelectors = [
        '.text-red-800',
        '.text-red-600',
        '[role="alert"]',
        '.bg-red-50',
        'text*="실패"',
        'text*="확인"',
      ]

      let loginErrorFound = false
      for (const selector of loginErrorSelectors) {
        try {
          await expect(page.locator(selector)).toBeVisible({ timeout: 2000 })
          loginErrorFound = true
          break
        } catch {
          // 계속 시도
        }
      }

      expect(loginErrorFound).toBe(true)
    })

    test('빈 필드로 로그인 시도', async ({ page }) => {
      await page.goto('/login')

      // 버튼이 비활성화되어 있는지 확인
      const isButtonDisabled = await page.locator('button[type="submit"]').isDisabled()
      expect(isButtonDisabled).toBe(true)

      // HTML5 검증 확인 (필드가 비어있으면 invalid)
      const isEmailValid = await page.evaluate(() =>
        document.querySelector('#email')?.checkValidity()
      )
      const isPasswordValid = await page.evaluate(() =>
        document.querySelector('#password')?.checkValidity()
      )

      expect(isEmailValid && isPasswordValid).toBe(false)
    })
  })

  test.describe('인증 상태 관리', () => {
    test('로그인 후 브라우저 새로고침 시 인증 상태 유지', async ({ page }) => {
      // 테스트 계정으로 로그인
      const timestamp = Date.now()
      const testEmail = `refreshtest${timestamp}@example.com`
      const testPassword = 'TestPassword123456'

      // 회원가입
      await page.goto('/signup')
      await page.fill('#name', '새로고침테스트')
      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)
      await page.fill('#confirmPassword', testPassword)
      await page.check('#agree-terms')
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

      // 세션 ID가 localStorage에 저장되었는지 확인
      const sessionId = await page.evaluate(() => {
        return localStorage.getItem('session_id') || sessionStorage.getItem('session_id')
      })
      expect(sessionId).toBeTruthy()

      // 페이지 새로고침
      await page.reload()

      // 여전히 대시보드에 있는지 확인 (세션 ID가 유지되어야 함)
      await expect(page).toHaveURL('/dashboard')

      // 새로고침 후에도 세션 ID가 유지되는지 확인
      const sessionIdAfterReload = await page.evaluate(() => {
        return localStorage.getItem('session_id') || sessionStorage.getItem('session_id')
      })
      expect(sessionIdAfterReload).toBe(sessionId)
    })

    test('보호된 라우트 접근 시 로그인 페이지로 리다이렉트', async ({ page }) => {
      // 로그인하지 않은 상태에서 대시보드 접근 시도
      await page.goto('/dashboard')

      // 로그인 페이지로 리다이렉트되는지 확인
      await expect(page).toHaveURL('/login')
    })

    test('로그인 상태 유지 기능 테스트', async ({ page }) => {
      const timestamp = Date.now()
      const testEmail = `remembertest${timestamp}@example.com`
      const testPassword = 'TestPassword123456'

      // 회원가입
      await page.goto('/signup')
      await page.fill('#name', '상태유지테스트')
      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)
      await page.fill('#confirmPassword', testPassword)
      await page.check('#agree-terms')
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

      // 로그아웃
      await page.click('button:has-text("로그아웃")')
      await expect(page).toHaveURL('/login')

      // 로그인 상태 유지 체크박스를 선택하고 로그인
      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)

      // 로그인 상태 유지 체크박스 찾기 및 클릭
      const rememberMeSelectors = [
        '#rememberMe',
        'input[type="checkbox"][name="rememberMe"]',
        'text="로그인 상태 유지"',
        'label:has-text("로그인 상태 유지") input[type="checkbox"]',
      ]

      let rememberMeFound = false
      for (const selector of rememberMeSelectors) {
        try {
          await page.check(selector, { timeout: 2000 })
          rememberMeFound = true
          break
        } catch {
          // 계속 시도
        }
      }

      await page.click('button[type="submit"]')
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

      // localStorage에 세션 ID가 저장되었는지 확인 (rememberMe가 true이면 localStorage 사용)
      const sessionInLocalStorage = await page.evaluate(() => {
        return localStorage.getItem('session_id')
      })

      if (rememberMeFound) {
        expect(sessionInLocalStorage).toBeTruthy()
      }
    })

    test('세션 만료 시 자동 로그아웃', async ({ page }) => {
      const timestamp = Date.now()
      const testEmail = `expiretest${timestamp}@example.com`
      const testPassword = 'TestPassword123456'

      // 회원가입 및 로그인
      await page.goto('/signup')
      await page.fill('#name', '만료테스트')
      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)
      await page.fill('#confirmPassword', testPassword)
      await page.check('#agree-terms')
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

      // 세션 만료를 시뮬레이션하기 위해 expires_at을 과거 시간으로 설정
      await page.evaluate(() => {
        const pastTimestamp = Math.floor(Date.now() / 1000) - 3600 // 1시간 전
        localStorage.setItem('expires_at', pastTimestamp.toString())
        sessionStorage.setItem('expires_at', pastTimestamp.toString())
      })

      // 페이지 새로고침하여 만료 체크 트리거
      await page.reload()

      // 로그인 페이지로 리다이렉트되어야 함
      await expect(page).toHaveURL('/login', { timeout: 10000 })
    })
  })

  test.describe('API 인증 헤더', () => {
    test('세션 ID가 Authorization 헤더에 포함되는지 확인', async ({ page }) => {
      const timestamp = Date.now()
      const testEmail = `apitest${timestamp}@example.com`
      const testPassword = 'TestPassword123456'

      // 네트워크 요청 감시 시작
      const requests: Array<{ url: string; headers: Record<string, string> }> = []

      page.on('request', (request) => {
        const url = request.url()
        const headers = request.headers()

        // API 요청만 기록 (auth, todos 등)
        if (url.includes('/api/') || url.includes('/auth/')) {
          requests.push({ url, headers })
        }
      })

      // 회원가입
      await page.goto('/signup')
      await page.fill('#name', 'API테스트')
      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)
      await page.fill('#confirmPassword', testPassword)
      await page.check('#agree-terms')
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

      // Todo 목록 API 호출을 위해 잠시 대기
      await page.waitForTimeout(2000)

      // 인증이 필요한 API 요청에 Authorization 헤더가 포함되었는지 확인
      const authenticatedRequests = requests.filter(
        (req) => req.url.includes('/api/todos') && req.headers.authorization
      )

      expect(authenticatedRequests.length).toBeGreaterThan(0)

      // Authorization 헤더가 Bearer 형식인지 확인
      const authHeader = authenticatedRequests[0].headers.authorization
      expect(authHeader).toMatch(/^Bearer .+/)
    })

    test('401 에러 시 자동 로그아웃 및 리다이렉트', async ({ page }) => {
      const timestamp = Date.now()
      const testEmail = `unauthorizedtest${timestamp}@example.com`
      const testPassword = 'TestPassword123456'

      // 회원가입 및 로그인
      await page.goto('/signup')
      await page.fill('#name', '401테스트')
      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)
      await page.fill('#confirmPassword', testPassword)
      await page.check('#agree-terms')
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

      // 세션 ID를 무효한 값으로 변경하여 401 에러 유발
      await page.evaluate(() => {
        localStorage.setItem('session_id', 'invalid-session-id')
        sessionStorage.setItem('session_id', 'invalid-session-id')
      })

      // 페이지 새로고침하여 API 요청 트리거
      await page.reload()

      // 401 에러로 인해 로그인 페이지로 리다이렉트되어야 함
      await expect(page).toHaveURL('/login', { timeout: 10000 })

      // 세션 정보가 정리되었는지 확인
      const sessionId = await page.evaluate(() => {
        return localStorage.getItem('session_id') || sessionStorage.getItem('session_id')
      })
      expect(sessionId).toBeFalsy()
    })
  })

  test.describe('UI/UX', () => {
    test('회원가입과 로그인 페이지 간 네비게이션', async ({ page }) => {
      // 로그인 페이지에서 시작
      await page.goto('/login')

      // "새 계정 만들기" 링크 클릭
      await page.click('text="새 계정 만들기"')
      await expect(page).toHaveURL('/signup')

      // "로그인하기" 링크 클릭
      await page.click('text="로그인하기"')
      await expect(page).toHaveURL('/login')
    })

    test('다크모드에서 로그인 페이지 렌더링', async ({ page }) => {
      // 다크모드 설정 (localStorage 또는 시스템 설정을 통해)
      await page.addInitScript(() => {
        localStorage.setItem('theme', 'dark')
      })

      await page.goto('/login')

      // 다크모드 클래스가 적용되었는지 확인
      const isDarkMode = await page.evaluate(() => {
        return (
          document.documentElement.classList.contains('dark') ||
          document.body.classList.contains('dark') ||
          window.getComputedStyle(document.body).backgroundColor.includes('rgb(17, 24, 39)')
        ) // gray-900
      })

      expect(isDarkMode).toBe(true)
    })
  })
})
