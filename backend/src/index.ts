import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('TodoList Backend API')
})

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export default {
  port: 3001,
  fetch: app.fetch,
}
