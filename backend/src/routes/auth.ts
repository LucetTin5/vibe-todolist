/**
 * 인증 API 라우터
 */
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase'
import { ErrorResponseSchema } from '../types/api.types'
import type { Context } from 'hono'

const auth = new OpenAPIHono()

// 스키마 정의
const LoginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(10, '비밀번호는 최소 10자 이상이어야 합니다'),
})

const SignupSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(10, '비밀번호는 최소 10자 이상이어야 합니다'),
  name: z.string().min(1, '이름을 입력해주세요'),
})

const RefreshTokenSchema = z.object({
  refresh_token: z.string(),
})

const LogoutSchema = z.object({
  session_id: z.string(),
})

const AuthResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    user: z.object({
      id: z.string(),
      email: z.string(),
    }),
    access_token: z.string(),
    refresh_token: z.string(),
  }),
})

const AuthSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    user: z.object({
      id: z.string(),
      email: z.string(),
    }),
    session_id: z.string(),
    expires_at: z.number().optional(),
  }),
})

const LogoutSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
})

// ErrorResponseSchema는 api.types.ts에서 import

// 로그인 라우트 정의
const loginRoute = createRoute({
  method: 'post',
  path: '/api/auth/login',
  summary: '사용자 로그인',
  description: '이메일과 비밀번호로 로그인합니다.',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: AuthSuccessResponseSchema,
        },
      },
      description: '로그인 성공',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '잘못된 요청',
    },
    401: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '인증 실패',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '서버 오류',
    },
  },
})

// 회원가입 라우트 정의
const signupRoute = createRoute({
  method: 'post',
  path: '/api/auth/signup',
  summary: '사용자 회원가입',
  description: '새 사용자 계정을 생성합니다.',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: SignupSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: AuthSuccessResponseSchema,
        },
      },
      description: '회원가입 성공',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '잘못된 요청',
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '이미 존재하는 사용자',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '서버 오류',
    },
  },
})

// 토큰 갱신 라우트 정의
const refreshRoute = createRoute({
  method: 'post',
  path: '/api/auth/refresh',
  summary: '토큰 갱신',
  description: 'Refresh token을 사용하여 새로운 access token을 발급받습니다.',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: RefreshTokenSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: AuthSuccessResponseSchema,
        },
      },
      description: '토큰 갱신 성공',
    },
    401: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '유효하지 않은 토큰',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '서버 오류',
    },
  },
})

// 로그아웃 라우트 정의
const logoutRoute = createRoute({
  method: 'post',
  path: '/api/auth/logout',
  summary: '사용자 로그아웃',
  description: '세션을 종료하고 로그아웃합니다.',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: LogoutSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: LogoutSuccessResponseSchema,
        },
      },
      description: '로그아웃 성공',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '잘못된 요청',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '서버 오류',
    },
  },
})

// 로그인 핸들러
auth.openapi(loginRoute, async (c) => {
  try {
    const { email, password } = c.req.valid('json')

    console.log('Login attempt for email:', email)

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    })

    console.log('Supabase login response:', {
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      userEmail: data?.user?.email,
      error: error?.message,
    })

    if (error) {
      console.error('Login failed:', error.message)
      return c.json(
        {
          success: false as const,
          error: error.message,
          message: error.message,
        },
        401
      )
    }

    if (!data.user || !data.session) {
      return c.json(
        {
          success: false as const,
          error: '로그인에 실패했습니다',
          message: '로그인에 실패했습니다',
        },
        401
      )
    }

    // access_token을 session_id로 사용 (Supabase 권장 방식)
    const sessionId = data.session.access_token

    // 세션 ID만 반환 (보안 강화)
    return c.json(
      {
        success: true as const,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email || '',
          },
          session_id: sessionId,
          expires_at: data.session.expires_at,
        },
      },
      200
    )
  } catch (error) {
    return c.json(
      {
        success: false as const,
        error: error instanceof Error ? error.message : '서버 오류가 발생했습니다',
        message: error instanceof Error ? error.message : '서버 오류가 발생했습니다',
      },
      500
    )
  }
})

// 회원가입 핸들러
auth.openapi(signupRoute, async (c) => {
  try {
    const { email, password, name } = c.req.valid('json')

    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
        },
      },
    })

    console.log('Supabase signup response:', {
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      userEmail: data?.user?.email,
      userConfirmed: data?.user?.email_confirmed_at,
      error: error?.message,
    })

    if (error) {
      console.error('Supabase signup error:', error)
      return c.json(
        {
          success: false as const,
          error: error.message,
          message: error.message,
        },
        error.message.includes('already registered') ? 409 : 400
      )
    }

    if (!data.user || !data.session) {
      console.error('Signup failed - missing user or session:', {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        userNeedsConfirmation: data?.user && !data?.session,
      })
      return c.json(
        {
          success: false as const,
          error: '회원가입에 실패했습니다',
          message: '회원가입에 실패했습니다',
        },
        400
      )
    }

    // access_token을 session_id로 사용 (Supabase 권장 방식)
    const sessionId = data.session.access_token

    // 세션 ID만 반환 (보안 강화)
    return c.json(
      {
        success: true as const,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email || '',
          },
          session_id: sessionId,
          expires_at: data.session.expires_at,
        },
      },
      201
    )
  } catch (error) {
    return c.json(
      {
        success: false as const,
        error: error instanceof Error ? error.message : '서버 오류가 발생했습니다',
        message: error instanceof Error ? error.message : '서버 오류가 발생했습니다',
      },
      500
    )
  }
})

// 토큰 갱신 핸들러
auth.openapi(refreshRoute, async (c) => {
  try {
    const { refresh_token } = c.req.valid('json')

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token,
    })

    if (error) {
      return c.json(
        {
          success: false as const,
          error: error.message,
          message: error.message,
        },
        401
      )
    }

    if (!data.user || !data.session) {
      return c.json(
        {
          success: false as const,
          error: '토큰 갱신에 실패했습니다',
          message: '토큰 갱신에 실패했습니다',
        },
        401
      )
    }

    // access_token을 session_id로 사용 (Supabase 권장 방식)
    const sessionId = data.session.access_token

    return c.json(
      {
        success: true as const,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email || '',
          },
          session_id: sessionId,
          expires_at: data.session.expires_at,
        },
      },
      200
    )
  } catch (error) {
    return c.json(
      {
        success: false as const,
        error: error instanceof Error ? error.message : '서버 오류가 발생했습니다',
        message: error instanceof Error ? error.message : '서버 오류가 발생했습니다',
      },
      500
    )
  }
})

// 로그아웃 핸들러
auth.openapi(logoutRoute, async (c) => {
  try {
    const { session_id } = c.req.valid('json')

    // Supabase에서 세션 종료 (JWT 토큰을 사용하여 로그아웃)
    const { error } = await supabaseAdmin.auth.admin.signOut(session_id)

    if (error) {
      console.error('Logout error:', error.message)
      return c.json(
        {
          success: false as const,
          error: error.message,
          message: '로그아웃에 실패했습니다',
        },
        400
      )
    }

    return c.json(
      {
        success: true as const,
        message: '로그아웃되었습니다',
      },
      200
    )
  } catch (error) {
    return c.json(
      {
        success: false as const,
        error: error instanceof Error ? error.message : '서버 오류가 발생했습니다',
        message: error instanceof Error ? error.message : '서버 오류가 발생했습니다',
      },
      500
    )
  }
})

export default auth
