/**
 * Supabase 세션 기반 인증 미들웨어
 */
import type { Context, Next } from 'hono'
import { supabaseAdmin } from '../lib/supabase'

interface SessionInfo {
  sessionId: string
  userId: string
  email: string
  accessToken: string
}

/**
 * 세션 ID로 Supabase auth.sessions 테이블에서 세션 정보 조회
 */
export async function getSessionInfo(sessionId: string): Promise<SessionInfo | null> {
  try {
    // Supabase에서 세션 검증 및 사용자 정보 조회
    const { data: user, error } = await supabaseAdmin.auth.getUser(sessionId)

    if (error || !user?.user) {
      console.log('Session validation failed:', error?.message)
      return null
    }

    // JWT에서 session_id 추출 (토큰이 유효한 경우)
    let actualSessionId = sessionId
    try {
      const payload = JSON.parse(atob(sessionId.split('.')[1]))
      actualSessionId = payload.session_id || sessionId
    } catch {
      // JWT가 아닌 경우 원본 사용
    }

    return {
      sessionId: actualSessionId,
      userId: user.user.id,
      email: user.user.email || '',
      accessToken: sessionId, // 원본 토큰 사용
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return null
  }
}

/**
 * 세션 검증 미들웨어
 */
export async function validateSession(c: Context, next: Next) {
  // Authorization 헤더에서 Bearer 토큰 추출
  const authHeader = c.req.header('Authorization')
  let sessionId = c.req.header('x-session-id') || c.req.query('session_id')

  if (authHeader?.startsWith('Bearer ')) {
    sessionId = authHeader.substring(7) // 'Bearer ' 제거
  }

  if (!sessionId) {
    return c.json(
      {
        success: false,
        error: 'Authentication required',
        message: 'No session ID provided',
      },
      401
    )
  }

  const sessionInfo = await getSessionInfo(sessionId)

  if (!sessionInfo) {
    return c.json(
      {
        success: false,
        error: 'Invalid or expired session',
        message: 'Session validation failed',
      },
      401
    )
  }

  // Context에 세션 정보 저장
  c.set('sessionInfo', sessionInfo)
  c.set('userId', sessionInfo.userId)
  c.set('accessToken', sessionInfo.accessToken)

  await next()
}

/**
 * 선택적 세션 검증 미들웨어 (세션이 없어도 진행)
 */
export async function optionalSession(c: Context, next: Next) {
  // Authorization 헤더에서 Bearer 토큰 추출
  const authHeader = c.req.header('Authorization')
  let sessionId = c.req.header('x-session-id') || c.req.query('session_id')

  if (authHeader?.startsWith('Bearer ')) {
    sessionId = authHeader.substring(7) // 'Bearer ' 제거
  }

  if (sessionId) {
    const sessionInfo = await getSessionInfo(sessionId)
    if (sessionInfo) {
      c.set('sessionInfo', sessionInfo)
      c.set('userId', sessionInfo.userId)
      c.set('accessToken', sessionInfo.accessToken)
    }
  }

  await next()
}
