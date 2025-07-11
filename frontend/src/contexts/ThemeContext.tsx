import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme | ((prev: Theme) => Theme)) => void
  actualTheme: 'light' | 'dark' // 실제 적용되는 테마 (system 해석 후)
  toggleTheme: () => void // 테마 토글 함수 추가
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // 저장된 테마 설정 확인
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme
      return stored || defaultTheme
    }
    return defaultTheme
  })

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(() => {
    // 초기 actualTheme을 theme 값 기반으로 계산
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme
      const initialTheme = stored || defaultTheme

      if (initialTheme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        return mediaQuery.matches ? 'dark' : 'light'
      }
      return initialTheme === 'dark' ? 'dark' : 'light'
    }
    return 'light'
  })

  // 시스템 테마 변경 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const updateActualTheme = () => {
      if (theme === 'system') {
        setActualTheme(mediaQuery.matches ? 'dark' : 'light')
      } else {
        setActualTheme(theme)
      }
    }

    // 초기 설정
    updateActualTheme()

    // 시스템 테마 변경 감지
    const handleChange = () => {
      if (theme === 'system') {
        updateActualTheme()
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // DOM에 테마 클래스 적용 (useLayoutEffect로 즉시 적용)
  useLayoutEffect(() => {
    const root = window.document.documentElement

    // 기존 테마 클래스 제거
    root.classList.remove('light', 'dark')

    // 새 테마 클래스 추가
    root.classList.add(actualTheme)

    // localStorage에 테마 저장
    localStorage.setItem('theme', theme)
  }, [theme, actualTheme])

  const handleSetTheme = (newTheme: Theme | ((prev: Theme) => Theme)) => {
    const resolvedTheme = typeof newTheme === 'function' ? newTheme(theme) : newTheme
    setTheme(resolvedTheme)

    // 즉시 actualTheme 업데이트 (system이 아닌 경우)
    if (resolvedTheme !== 'system') {
      setActualTheme(resolvedTheme)
    } else {
      // system인 경우 현재 시스템 설정 확인
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      setActualTheme(mediaQuery.matches ? 'dark' : 'light')
    }
  }

  const toggleTheme = () => {
    switch (theme) {
      case 'light':
        handleSetTheme('dark')
        break
      case 'dark':
        handleSetTheme('system')
        break
      case 'system':
        handleSetTheme('light')
        break
    }
  }

  const value: ThemeContextValue = {
    theme,
    setTheme: handleSetTheme,
    actualTheme,
    toggleTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
