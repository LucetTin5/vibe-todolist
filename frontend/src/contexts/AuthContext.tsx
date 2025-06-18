import type React from 'react'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { usePostApiAuthLogin, usePostApiAuthSignup, usePostApiAuthRefresh } from '../api/generated'
import type { PostApiAuthLogin200DataUser } from '../api/model/postApiAuthLogin200DataUser'

interface User {
  id: string
  email: string
  name?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, displayName?: string) => Promise<void>
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

  // API 훅들
  const loginMutation = usePostApiAuthLogin()
  const signupMutation = usePostApiAuthSignup()
  const refreshMutation = usePostApiAuthRefresh()

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
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
      }
    }

    setIsLoading(false)
  }, [])

  // 사용자 정보 저장 헬퍼
  const saveUserData = useCallback(
    (accessToken: string, refreshToken: string, userData: PostApiAuthLogin200DataUser) => {
      const userWithName: User = {
        id: userData.id,
        email: userData.email,
        name: userData.email.split('@')[0],
      }

      setToken(accessToken)
      setUser(userWithName)

      localStorage.setItem(TOKEN_KEY, accessToken)
      localStorage.setItem(USER_KEY, JSON.stringify(userWithName))
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    },
    []
  )

  // 로그아웃 함수
  const logout = useCallback(() => {
    setUser(null)
    setToken(null)

    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }, [])

  // 토큰 갱신 함수
  const refreshToken = useCallback(async (): Promise<void> => {
    const savedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

    if (!savedRefreshToken) {
      logout()
      return
    }

    try {
      const response = await refreshMutation.mutateAsync({
        data: { refresh_token: savedRefreshToken },
      })

      if (response.success && response.data) {
        setToken(response.data.access_token)
        localStorage.setItem(TOKEN_KEY, response.data.access_token)

        if (response.data.refresh_token) {
          localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token)
        }
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
    }
  }, [refreshMutation, logout])

  // 토큰 만료 체크 및 자동 갱신
  useEffect(() => {
    if (!token) return

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000

      const refreshTime = (payload.exp - 300) * 1000
      const timeUntilRefresh = refreshTime - Date.now()

      if (timeUntilRefresh > 0) {
        const refreshTimer = setTimeout(() => {
          refreshToken()
        }, timeUntilRefresh)

        return () => clearTimeout(refreshTimer)
      }
      if (payload.exp < currentTime) {
        logout()
      }
    } catch (error) {
      console.error('Invalid token format:', error)
      logout()
    }
  }, [token, refreshToken, logout])

  // 로그인 함수
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setIsLoading(true)

      try {
        const response = await loginMutation.mutateAsync({
          data: { email, password },
        })

        if (response.success && response.data) {
          saveUserData(response.data.access_token, response.data.refresh_token, response.data.user)
        }
      } catch (error) {
        console.error('Login error:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [loginMutation, saveUserData]
  )

  // 회원가입 함수
  const signup = useCallback(
    async (email: string, password: string, displayName?: string): Promise<void> => {
      setIsLoading(true)

      try {
        const response = await signupMutation.mutateAsync({
          data: { email, password, displayName },
        })

        if (response.success && response.data) {
          saveUserData(response.data.access_token, response.data.refresh_token, response.data.user)
        }
      } catch (error) {
        console.error('Signup error:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [signupMutation, saveUserData]
  )

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
