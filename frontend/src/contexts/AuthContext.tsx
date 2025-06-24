import type React from 'react'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { usePostApiAuthLogin, usePostApiAuthSignup } from '../api/generated'
import type { PostApiAuthLogin200DataUser } from '../api/model/postApiAuthLogin200DataUser'
import { extractErrorMessage } from '../utils/errorUtils'
import { setGlobalLogoutHandler } from '../orval/mutator'

interface User {
  id: string
  email: string
  name?: string
}

interface AuthContextType {
  user: User | null
  sessionId: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  signup: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const SESSION_ID_KEY = 'session_id'
const USER_KEY = 'auth_user'
const EXPIRES_AT_KEY = 'expires_at'

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // API 훅들
  const loginMutation = usePostApiAuthLogin()
  const signupMutation = usePostApiAuthSignup()

  // 로컬/세션 스토리지에서 인증 정보 복원
  useEffect(() => {
    let savedSessionId = localStorage.getItem(SESSION_ID_KEY)
    let savedUser = localStorage.getItem(USER_KEY)

    // localStorage에 없으면 sessionStorage 확인
    if (!savedSessionId || !savedUser) {
      savedSessionId = sessionStorage.getItem(SESSION_ID_KEY)
      savedUser = sessionStorage.getItem(USER_KEY)
    }

    if (savedSessionId && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setSessionId(savedSessionId)
        setUser(parsedUser)
      } catch (error) {
        console.error('Failed to parse saved user data:', error)
        localStorage.removeItem(SESSION_ID_KEY)
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(EXPIRES_AT_KEY)
        sessionStorage.removeItem(SESSION_ID_KEY)
        sessionStorage.removeItem(USER_KEY)
        sessionStorage.removeItem(EXPIRES_AT_KEY)
      }
    }

    setIsLoading(false)
  }, [])

  // 사용자 정보 저장 헬퍼
  const saveUserData = useCallback(
    (
      sessionIdValue: string,
      userData: PostApiAuthLogin200DataUser,
      expiresAt?: number,
      rememberMe = false
    ) => {
      const userWithName: User = {
        id: userData.id,
        email: userData.email,
        name: userData.email.split('@')[0],
      }

      console.log('Saving user data:', {
        userWithName,
        hasSessionId: !!sessionIdValue,
        expiresAt,
        rememberMe,
      })

      setSessionId(sessionIdValue)
      setUser(userWithName)

      if (rememberMe) {
        // 로그인 상태 유지 시 localStorage 사용
        localStorage.setItem(SESSION_ID_KEY, sessionIdValue)
        localStorage.setItem(USER_KEY, JSON.stringify(userWithName))
        if (expiresAt && typeof expiresAt === 'number') {
          localStorage.setItem(EXPIRES_AT_KEY, expiresAt.toString())
        }
      } else {
        // 로그인 상태 유지하지 않을 시 sessionStorage 사용
        sessionStorage.setItem(SESSION_ID_KEY, sessionIdValue)
        sessionStorage.setItem(USER_KEY, JSON.stringify(userWithName))
        if (expiresAt && typeof expiresAt === 'number') {
          sessionStorage.setItem(EXPIRES_AT_KEY, expiresAt.toString())
        }
        // localStorage에서는 제거
        localStorage.removeItem(SESSION_ID_KEY)
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(EXPIRES_AT_KEY)
      }

      console.log('User data saved to', rememberMe ? 'localStorage' : 'sessionStorage')
    },
    []
  )

  // 로그아웃 함수
  const logout = useCallback(() => {
    setUser(null)
    setSessionId(null)

    // 스토리지 청소
    localStorage.removeItem(SESSION_ID_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(EXPIRES_AT_KEY)
    sessionStorage.removeItem(SESSION_ID_KEY)
    sessionStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(EXPIRES_AT_KEY)

    console.log('Logout completed: storage cleared')
  }, [])

  // 전역 로그아웃 핸들러 등록
  useEffect(() => {
    setGlobalLogoutHandler(logout)
  }, [logout])

  // 세션 갱신 함수 (현재는 placeholder - 필요시 구현)
  const refreshToken = useCallback(async (): Promise<void> => {
    // 세션 기반 인증에서는 보통 자동 갱신이 됨
    // 필요한 경우 여기서 세션 검증 로직 구현
    console.log('Session refresh called (session-based auth)')
  }, [])

  // 세션 만료 체크
  useEffect(() => {
    if (!sessionId) return

    // 저장된 만료 시간 확인
    let savedExpiresAt = localStorage.getItem(EXPIRES_AT_KEY)
    if (!savedExpiresAt) {
      savedExpiresAt = sessionStorage.getItem(EXPIRES_AT_KEY)
    }

    if (savedExpiresAt) {
      const expiresAt = Number.parseInt(savedExpiresAt, 10)

      // parseInt 실패 시 NaN 체크
      if (Number.isNaN(expiresAt)) {
        console.warn('Invalid expires_at value, clearing session')
        logout()
        return
      }

      const currentTime = Math.floor(Date.now() / 1000)

      if (expiresAt < currentTime) {
        console.log('Session expired, logging out')
        logout()
      }
    }
  }, [sessionId, logout])

  // 로그인 함수
  const login = useCallback(
    async (email: string, password: string, rememberMe = false): Promise<void> => {
      setIsLoading(true)

      try {
        const response = await loginMutation.mutateAsync({
          data: { email, password },
        })

        if (response.success && response.data) {
          saveUserData(
            response.data.session_id,
            response.data.user,
            response.data.expires_at,
            rememberMe
          )
        }
      } catch (error) {
        const errorMessage = extractErrorMessage(error, 'Unknown login error')
        console.error('Login error:', {
          originalError: error,
          extractedMessage: errorMessage,
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [loginMutation, saveUserData]
  )

  // 회원가입 함수
  const signup = useCallback(
    async (email: string, password: string, name?: string): Promise<void> => {
      console.log('Starting signup for:', email)
      setIsLoading(true)

      try {
        const response = await signupMutation.mutateAsync({
          data: { email, password, name: name || '' },
        })

        console.log('Signup response received:', {
          success: response.success,
          hasData: !!response.data,
        })

        if (response.success && response.data) {
          console.log('Signup successful, saving user data')
          saveUserData(response.data.session_id, response.data.user, response.data.expires_at)
          console.log('Signup completed successfully')
        } else {
          console.error('Signup failed: invalid response format')
        }
      } catch (error) {
        const errorMessage = extractErrorMessage(error, 'Unknown signup error')
        console.error('Signup error:', {
          originalError: error,
          extractedMessage: errorMessage,
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [signupMutation, saveUserData]
  )

  const value: AuthContextType = {
    user,
    sessionId,
    isLoading,
    isAuthenticated: !!user && !!sessionId,
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
