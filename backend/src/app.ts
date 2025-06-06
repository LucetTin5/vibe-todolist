/**
 * OpenAPI Hono 앱 설정
 */
import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { todoRoutes } from './routes/todos'

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
현재 버전에서는 인증이 필요하지 않습니다.

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

// Todo 라우터 등록 (Enhanced API)
app.route('/', todoRoutes)
