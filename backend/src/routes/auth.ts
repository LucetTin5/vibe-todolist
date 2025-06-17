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
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
})

const SignupSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  displayName: z.string().optional(),
})

const RefreshTokenSchema = z.object({
  refresh_token: z.string(),
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
    access_token: z.string(),
    refresh_token: z.string(),
  }),
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

// 로그인 핸들러
auth.openapi(loginRoute, async (c) => {
  try {
    const { email, password } = c.req.valid('json')

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
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
          error: '로그인에 실패했습니다',
          message: '로그인에 실패했습니다',
        },
        401
      )
    }

    return c.json(
      {
        success: true as const,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email || '',
          },
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
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
    const { email, password, displayName } = c.req.valid('json')

    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    })

    if (error) {
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
      return c.json(
        {
          success: false as const,
          error: '회원가입에 실패했습니다',
          message: '회원가입에 실패했습니다',
        },
        400
      )
    }

    return c.json(
      {
        success: true as const,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email || '',
          },
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
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

    return c.json(
      {
        success: true as const,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email || '',
          },
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
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

export default auth
