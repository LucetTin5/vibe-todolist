import { createMiddleware } from 'hono/factory'
import type { Context } from 'hono'
import { createSupabaseClient } from '../lib/supabase'

// 인증 정보를 컨텍스트에 추가하기 위한 타입 확장
declare module 'hono' {
  interface ContextVariableMap {
    user: unknown // User 타입으로 나중에 교체
    userId: string
  }
}

/**
 * 필수 인증 미들웨어
 * Authorization 헤더에서 JWT 토큰을 확인하고 사용자 정보를 검증합니다.
 */
export const authMiddleware = createMiddleware(async (c: Context, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      },
      401
    )
  }

  const token = authHeader.substring(7)

  try {
    const supabase = createSupabaseClient(token)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error('Auth verification error:', error)
      return c.json(
        {
          error: 'Unauthorized',
          message: 'Invalid token',
        },
        401
      )
    }

    if (!user) {
      return c.json(
        {
          error: 'Unauthorized',
          message: 'User not found',
        },
        401
      )
    }

    // 사용자 정보를 컨텍스트에 저장
    c.set('user', user)
    c.set('userId', user.id)

    await next()
  } catch (error) {
    console.error('Authentication middleware error:', error)
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Authentication failed',
      },
      500
    )
  }
})

/**
 * 선택적 인증 미들웨어
 * 인증이 있으면 사용하고, 없어도 계속 진행합니다.
 */
export const optionalAuthMiddleware = createMiddleware(async (c: Context, next) => {
  const authHeader = c.req.header('Authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)

    try {
      const supabase = createSupabaseClient(token)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        c.set('user', user)
        c.set('userId', user.id)
      }
    } catch (error) {
      // 선택적 인증이므로 에러를 무시하고 계속 진행
      console.warn('Optional auth failed:', error)
    }
  }

  await next()
})

/**
 * 사용자 ID를 추출하는 헬퍼 함수
 */
export const getUserId = (c: Context): string => {
  const userId = c.get('userId')
  if (!userId) {
    throw new Error('User ID not found in context. Make sure auth middleware is applied.')
  }
  return userId
}

/**
 * 사용자 정보를 추출하는 헬퍼 함수
 */
export const getUser = (c: Context) => {
  const user = c.get('user')
  if (!user) {
    throw new Error('User not found in context. Make sure auth middleware is applied.')
  }
  return user
}
