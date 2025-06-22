import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { authMiddleware, getUser } from '../middleware/auth'
import { sseManager } from '../utils/sse-manager'
import { ErrorResponseSchema } from '../types/api.types'

const app = new OpenAPIHono()

// SSE 스트림 연결
app.get('/stream', authMiddleware, async (c) => {
  const user = getUser(c) as { id: string }

  return sseManager.createConnection(c, user.id)
})

// 스키마 정의
const NotificationSettingsSchema = z.object({
  browser_notifications: z.boolean(),
  toast_notifications: z.boolean(),
  reminder_times: z.array(z.string()),
  quiet_hours_start: z.string(),
  quiet_hours_end: z.string(),
  weekdays_only: z.boolean(),
  sound_enabled: z.boolean(),
})

// 알림 설정 조회 라우트
const getSettingsRoute = createRoute({
  method: 'get',
  path: '/settings',
  tags: ['Notifications'],
  middleware: [authMiddleware],
  responses: {
    200: {
      description: '알림 설정 조회 성공',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            data: NotificationSettingsSchema,
          }),
        },
      },
    },
    401: {
      description: '인증 실패',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
})

app.openapi(getSettingsRoute, async (c) => {
  const user = getUser(c) as { id: string }

  // 기본 설정 반환 (향후 Supabase에서 가져올 예정)
  const defaultSettings = {
    browser_notifications: true,
    toast_notifications: true,
    reminder_times: ['09:00', '18:00'],
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    weekdays_only: false,
    sound_enabled: true,
  }

  return c.json(
    {
      success: true as const,
      data: defaultSettings,
    },
    200
  )
})

// 알림 설정 업데이트 라우트
const updateSettingsRoute = createRoute({
  method: 'put',
  path: '/settings',
  tags: ['Notifications'],
  middleware: [authMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: NotificationSettingsSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      description: '알림 설정 업데이트 성공',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
          }),
        },
      },
    },
    401: {
      description: '인증 실패',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
})

app.openapi(updateSettingsRoute, async (c) => {
  const user = getUser(c) as { id: string }
  const body = await c.req.json()

  // 향후 Supabase에 저장할 예정
  console.log(`Updating notification settings for user ${user.id}:`, body)

  return c.json(
    {
      success: true as const,
      message: '알림 설정이 업데이트되었습니다.',
    },
    200
  )
})

export default app
