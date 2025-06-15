/**
 * OpenAPI Hono 앱 설정
 */
import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { todoRoutes } from './routes/todos'
import todoAuthRoutes from './routes/todos.auth'

// OpenAPI 앱 생성
export const app = new OpenAPIHono()

// 미들웨어 설정
app.use('*', logger())
app.use('*', prettyJSON())
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
)

// OpenAPI 문서 정의
app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'TodoList API',
    description: `
TodoList 애플리케이션의 REST API입니다.

## 주요 기능
- Todo CRUD 작업
- 페이징 및 필터링
- 검색 기능
- 통계 조회

## 인증
Bearer 토큰을 사용한 JWT 인증이 필요합니다. Authorization 헤더에 'Bearer {token}' 형식으로 전달하세요.

## 에러 처리
모든 에러 응답은 다음 형식을 따릅니다:
\`\`\`json
{
  "success": false,
  "error": "에러 메시지",
  "details": "상세 정보 (선택사항)"
}
\`\`\`
    `.trim(),
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3300',
      description: '개발 서버',
    },
  ],
  tags: [
    {
      name: 'Todos',
      description: 'Todo 관리 API (Enhanced)',
    },
    {
      name: 'Stats',
      description: 'Todo 통계 API',
    },
  ],
})

// Swagger UI 설정
app.get(
  '/docs',
  swaggerUI({
    url: '/openapi.json',
    persistAuthorization: true,
  })
)

// 기본 라우트
app.get('/', (c) => {
  return c.json({
    message: 'TodoList API Server',
    version: '1.0.0',
    docs: '/docs',
    openapi: '/openapi.json',
  })
})

// 헬스체크 엔드포인트
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

// Supabase 연결 테스트 엔드포인트
app.get('/supabase/status', async (c) => {
  try {
    const { supabaseAdmin } = await import('./lib/supabase')

    // 간단한 쿼리로 연결 테스트
    const { data, error } = await supabaseAdmin.from('profiles').select('count').limit(1)

    if (error) {
      return c.json(
        {
          status: 'error',
          message: 'Supabase 연결 실패',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        500
      )
    }

    return c.json({
      status: 'connected',
      message: 'Supabase 연결 성공',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return c.json(
      {
        status: 'error',
        message: 'Supabase 클라이언트 초기화 실패',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      500
    )
  }
})

// Drizzle ORM 연결 테스트 엔드포인트
app.get('/drizzle/status', async (c) => {
  try {
    const { db } = await import('./db/connection')

    // 간단한 쿼리로 연결 테스트
    const result = await db.execute(
      `SELECT 'Drizzle ORM 연결 성공' as message, current_timestamp as timestamp`
    )

    return c.json({
      status: 'connected',
      message: 'Drizzle ORM 연결 성공',
      data: result[0] || result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return c.json(
      {
        status: 'error',
        message: 'Drizzle ORM 연결 실패',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      500
    )
  }
})

// Drizzle Todo 서비스 테스트 엔드포인트
app.get('/test/drizzle-todos', async (c) => {
  try {
    const { DrizzleTodoService } = await import('./services/drizzle-todo.service')
    const todoService = new DrizzleTodoService()

    // 테스트 사용자 ID
    const testUserId = '550e8400-e29b-41d4-a716-446655440000'

    const result = await todoService.getTodos(testUserId)

    return c.json({
      status: 'success',
      message: 'Drizzle Todo 서비스 테스트 성공',
      data: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return c.json(
      {
        status: 'error',
        message: 'Drizzle Todo 서비스 테스트 실패',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      500
    )
  }
})

// 라우트 등록 (테스트/헬스체크 엔드포인트 이후에 등록)
app.route('/', todoRoutes)
app.route('/', todoAuthRoutes)
