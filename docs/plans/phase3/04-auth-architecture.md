# 인증 시스템 아키텍처 설계

## 인증 시스템 개요

### 현재 상태
- 인증 시스템 없음
- 모든 사용자가 동일한 데이터 접근
- 보안 정책 부재

### 목표 상태
- Supabase Auth 기반 인증
- JWT 토큰 기반 세션 관리
- 사용자별 데이터 격리
- 소셜 로그인 지원

## 아키텍처 설계

### 1. 인증 플로우 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Frontend      │    │   Supabase      │    │   Hono API      │
│   (React)       │    │   Auth          │    │   Server        │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Login Request      │                       │
         ├──────────────────────▶│                       │
         │                       │                       │
         │ 2. JWT Token          │                       │
         ◀──────────────────────┤                       │
         │                       │                       │
         │ 3. API Request        │                       │
         │    (with JWT)         │                       │
         ├───────────────────────┼──────────────────────▶│
         │                       │                       │
         │                       │ 4. Token Verification │
         │                       ◀──────────────────────┤
         │                       │                       │
         │                       │ 5. User Data          │
         │                       ├──────────────────────▶│
         │                       │                       │
         │ 6. Response           │                       │
         ◀───────────────────────┼──────────────────────┤
```

### 2. 인증 상태 관리

#### Frontend 상태 관리
```typescript
// 인증 상태 타입
interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

// 인증 액션 타입
type AuthAction = 
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; session: Session } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
```

#### 인증 컨텍스트 구조
```typescript
interface AuthContextType {
  // 상태
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  
  // 액션
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData?: any) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (data: ProfileUpdate) => Promise<void>
  
  // 상태 확인
  isAuthenticated: boolean
  isLoading: boolean
}
```

## 백엔드 인증 구현

### 1. 인증 미들웨어
```typescript
// backend/src/middleware/auth.ts
import { createMiddleware } from 'hono/factory'
import { createSupabaseClient } from '../lib/supabase'

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401)
  }
  
  const token = authHeader.substring(7)
  
  try {
    const supabase = createSupabaseClient(token)
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401)
    }
    
    // 사용자 정보를 컨텍스트에 저장
    c.set('user', user)
    c.set('userId', user.id)
    
    await next()
  } catch (error) {
    return c.json({ error: 'Authentication failed' }, 401)
  }
})

// 선택적 인증 미들웨어 (로그인 없이도 접근 가능)
export const optionalAuthMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    
    try {
      const supabase = createSupabaseClient(token)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        c.set('user', user)
        c.set('userId', user.id)
      }
    } catch (error) {
      // 선택적 인증이므로 에러 무시
    }
  }
  
  await next()
})
```

### 2. 인증 라우트
```typescript
// backend/src/routes/auth.ts
import { Hono } from 'hono'
import { supabaseAdmin } from '../lib/supabase'
import { authMiddleware } from '../middleware/auth'

const auth = new Hono()

// 사용자 프로필 조회
auth.get('/profile', authMiddleware, async (c) => {
  const userId = c.get('userId')
  
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    return c.json({ error: 'Profile not found' }, 404)
  }
  
  return c.json({ profile })
})

// 사용자 프로필 업데이트
auth.put('/profile', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .update(body)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) {
    return c.json({ error: 'Failed to update profile' }, 400)
  }
  
  return c.json({ profile })
})

export default auth
```

### 3. 보호된 Todo API
```typescript
// backend/src/routes/todos.openapi.ts 수정
import { authMiddleware } from '../middleware/auth'

// 모든 Todo 라우트에 인증 미들웨어 추가
app.use('/*', authMiddleware)

// Todo 생성 시 사용자 ID 자동 설정
app.openapi(createTodoRoute, async (c) => {
  const userId = c.get('userId')
  const todo = c.req.valid('json')
  
  const newTodo = await todoService.createTodo({
    ...todo,
    userId // 사용자 ID 자동 설정
  })
  
  return c.json({ todo: newTodo }, 201)
})

// Todo 조회 시 사용자 필터링
app.openapi(getTodosRoute, async (c) => {
  const userId = c.get('userId')
  const query = c.req.valid('query')
  
  const todos = await todoService.getTodos({
    ...query,
    userId // 사용자 필터링
  })
  
  return c.json({ todos })
})
```

## 프론트엔드 인증 구현

### 1. 인증 컨텍스트
```typescript
// frontend/src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useReducer, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData?: any) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    session: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: session?.user ?? null,
          session
        }
      })
    })

    // 인증 상태 변경 리스너
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: session?.user ?? null,
          session
        }
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    dispatch({ type: 'AUTH_LOADING' })
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message })
      throw error
    }
  }

  const signUp = async (email: string, password: string, userData?: any) => {
    dispatch({ type: 'AUTH_LOADING' })
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    
    if (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message })
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message })
      throw error
    }
    dispatch({ type: 'AUTH_LOGOUT' })
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message })
      throw error
    }
  }

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!state.user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
```

### 2. 보호된 라우트
```typescript
// frontend/src/components/auth/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div>Loading...</div> // 또는 로딩 스피너
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
```

### 3. 로그인 페이지
```typescript
// frontend/src/pages/auth/LoginPage.tsx
import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            계정에 로그인
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                placeholder="이메일 주소"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                placeholder="비밀번호"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/signup"
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              계정이 없으신가요? 회원가입
            </Link>
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
```

### 4. API 클라이언트 인증 통합
```typescript
// frontend/src/api/client.ts
import axios from 'axios'
import { supabase } from '../lib/supabase'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 요청 인터셉터: JWT 토큰 자동 추가
apiClient.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터: 401 에러 시 로그아웃
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

## 소셜 로그인 구현

### 1. Google OAuth 설정
```typescript
// 구글 로그인 버튼 컴포넌트
export const GoogleLoginButton = () => {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      console.error('Google login error:', error)
    }
  }

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        {/* Google 아이콘 */}
      </svg>
      Google로 로그인
    </button>
  )
}
```

### 2. OAuth 콜백 페이지
```typescript
// frontend/src/pages/auth/CallbackPage.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export const CallbackPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth callback error:', error)
        navigate('/login')
      } else if (data.session) {
        navigate('/dashboard')
      } else {
        navigate('/login')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  )
}
```

## 보안 고려사항

### 1. JWT 토큰 관리
- 자동 토큰 갱신
- 토큰 만료 처리
- 안전한 토큰 저장

### 2. CORS 설정
```typescript
// backend/src/app.ts
import { cors } from 'hono/cors'

app.use('/*', cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:5173'],
  credentials: true,
}))
```

### 3. 환경 변수 보안
```env
# backend/.env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
```

### 4. Rate Limiting
```typescript
// 로그인 시도 제한
const loginAttempts = new Map<string, number>()

export const rateLimitMiddleware = createMiddleware(async (c, next) => {
  const ip = c.req.header('x-forwarded-for') || 'unknown'
  const attempts = loginAttempts.get(ip) || 0
  
  if (attempts >= 5) {
    return c.json({ error: 'Too many login attempts' }, 429)
  }
  
  await next()
})
```

이 아키텍처를 통해 안전하고 확장 가능한 인증 시스템을 구축할 수 있습니다.