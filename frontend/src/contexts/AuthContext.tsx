import type React from 'react'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'
const REFRESH_TOKEN_KEY = 'refresh_token'

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 로컬 스토리지에서 인증 정보 복원
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    const savedUser = localStorage.getItem(USER_KEY)

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setToken(savedToken)
        setUser(parsedUser)
      } catch (error) {
        console.error('Failed to parse saved user data:', error)
        // 저장된 데이터가 손상된 경우 제거
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
      }
    }

    setIsLoading(false)
  }, [])

  // 토큰 만료 체크 및 자동 갱신
  useEffect(() => {
    if (!token) return

    // JWT 토큰 만료 체크 (실제 구현에서는 jwt-decode 라이브러리 사용 권장)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000

      // 토큰이 만료되기 5분 전에 갱신 시도
      const refreshTime = (payload.exp - 300) * 1000
      const timeUntilRefresh = refreshTime - Date.now()

      if (timeUntilRefresh > 0) {
        const refreshTimer = setTimeout(() => {
          refreshToken()
        }, timeUntilRefresh)

        return () => clearTimeout(refreshTimer)
      } else if (payload.exp < currentTime) {
        // 이미 만료된 토큰
        logout()
      }
    } catch (error) {
      console.error('Invalid token format:', error)
      logout()
    }
  }, [token])

  // 로그인 함수
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setIsLoading(true)

    try {
      // TODO: 실제 로그인 API 호출
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '로그인에 실패했습니다.')
      }

      const data = await response.json()
      const { token: newToken, refreshToken: newRefreshToken, user: userData } = data

      // 상태 업데이트
      setToken(newToken)
      setUser(userData)

      // 로컬 스토리지에 저장
      localStorage.setItem(TOKEN_KEY, newToken)
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      if (newRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken)
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 회원가입 함수
  const signup = useCallback(
    async (email: string, password: string, name: string): Promise<void> => {
      setIsLoading(true)

      try {
        // TODO: 실제 회원가입 API 호출
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || '회원가입에 실패했습니다.')
        }

        const data = await response.json()
        const { token: newToken, refreshToken: newRefreshToken, user: userData } = data

        // 상태 업데이트
        setToken(newToken)
        setUser(userData)

        // 로컬 스토리지에 저장
        localStorage.setItem(TOKEN_KEY, newToken)
        localStorage.setItem(USER_KEY, JSON.stringify(userData))
        if (newRefreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken)
        }
      } catch (error) {
        console.error('Signup error:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // 로그아웃 함수
  const logout = useCallback(() => {
    setUser(null)
    setToken(null)

    // 로컬 스토리지에서 제거
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)

    // TODO: 서버에 로그아웃 알림 (optional)
    // fetch('/api/auth/logout', { method: 'POST' })
  }, [])

  // 토큰 갱신 함수
  const refreshToken = useCallback(async (): Promise<void> => {
    const savedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

    if (!savedRefreshToken) {
      logout()
      return
    }

    try {
      // TODO: 실제 토큰 갱신 API 호출
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: savedRefreshToken }),
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      const { token: newToken, refreshToken: newRefreshToken } = data

      // 새로운 토큰으로 업데이트
      setToken(newToken)
      localStorage.setItem(TOKEN_KEY, newToken)

      if (newRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken)
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
    }
  }, [logout])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    signup,
    logout,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Auth 훅
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 인증 상태 체크 훅
export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth()

  return {
    isAuthenticated,
    isLoading,
    shouldRedirect: !isLoading && !isAuthenticated,
  }
}
