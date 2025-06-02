import { app } from './app'
import { todoOpenApiRoutes } from './routes/todos.openapi'

// API 라우트 설정
app.route('/api/todos', todoOpenApiRoutes)

// 404 핸들러
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'API 엔드포인트를 찾을 수 없습니다.',
      availableEndpoints: {
        api: '/api/todos',
        docs: '/docs',
        openapi: '/openapi.json',
        health: '/health',
      },
    },
    404
  )
})

export default {
  port: 3001,
  fetch: app.fetch,
}
