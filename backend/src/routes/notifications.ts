import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { authMiddleware, getUser } from '../middleware/auth'
import { getSessionInfo } from '../middleware/session'
import { sseManager } from '../utils/sse-manager'
import { notificationService } from '../services/notification.service'
import { notificationManager } from '../services/notification-manager'
import { ErrorResponseSchema } from '../types/api.types'

const app = new OpenAPIHono()

// 디버깅용 테스트 엔드포인트
app.get('/test', async (c) => {
  return c.json({
    message: 'Notifications route is working',
    query: c.req.query(),
    url: c.req.url,
    method: c.req.method,
  })
})

// SSE 스트림 연결 (query parameter로 sessionId 인증)
app.get('/stream', async (c) => {
  try {
    // 디버깅을 위한 로그
    console.log('SSE connection request received')
    console.log('Query params:', c.req.query())
    console.log('URL:', c.req.url)

    // Query parameter에서 sessionId 추출 (camelCase와 snake_case 모두 지원)
    const sessionId = c.req.query('sessionId') || c.req.query('session_id')
    console.log('Extracted sessionId:', `${sessionId?.substring(0, 50)}...`)

    if (!sessionId) {
      console.log('No sessionId provided')
      return c.json(
        {
          success: false,
          error: 'SessionId required',
          message: 'No session ID provided',
        },
        401
      )
    }

    // 실제 세션 검증
    console.log('Validating session...')
    const sessionInfo = await getSessionInfo(sessionId)

    if (!sessionInfo) {
      console.log('Session validation failed')
      return c.json(
        {
          success: false,
          error: 'Invalid session',
          message: 'Session validation failed',
        },
        401
      )
    }

    console.log(`SSE connection authenticated for user: ${sessionInfo.userId}`)

    return sseManager.createConnection(c, sessionInfo.userId)
  } catch (error) {
    console.error('SSE authentication error:', error)
    return c.json({ success: false, error: 'Authentication failed' }, 500)
  }
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
  try {
    const user = getUser(c) as { id: string }

    // 실제 설정 조회
    const settings = await notificationService.getUserNotificationSettings(user.id)

    if (!settings) {
      // 설정이 없으면 기본 설정 생성
      const defaultSettings = await notificationService.createDefaultUserNotificationSettings(
        user.id
      )

      return c.json(
        {
          success: true as const,
          data: {
            browser_notifications: defaultSettings.browserNotifications ?? true,
            toast_notifications: defaultSettings.toastNotifications ?? true,
            reminder_times: defaultSettings.reminderTimes || ['1h', '30m'],
            quiet_hours_start: defaultSettings.quietHoursStart || '22:00:00',
            quiet_hours_end: defaultSettings.quietHoursEnd || '08:00:00',
            weekdays_only: defaultSettings.weekdaysOnly ?? false,
            sound_enabled: defaultSettings.soundEnabled ?? true,
          },
        },
        200
      )
    }

    return c.json(
      {
        success: true as const,
        data: {
          browser_notifications: settings.browserNotifications ?? true,
          toast_notifications: settings.toastNotifications ?? true,
          reminder_times: settings.reminderTimes || ['1h', '30m'],
          quiet_hours_start: settings.quietHoursStart || '22:00:00',
          quiet_hours_end: settings.quietHoursEnd || '08:00:00',
          weekdays_only: settings.weekdaysOnly ?? false,
          sound_enabled: settings.soundEnabled ?? true,
        },
      },
      200
    )
  } catch (error) {
    console.error('Error getting notification settings:', error)
    return c.json(
      {
        success: false as const,
        error: 'Internal server error',
        message: 'Failed to get notification settings',
      },
      401
    )
  }
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
    500: {
      description: '서버 오류',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
})

app.openapi(updateSettingsRoute, async (c) => {
  try {
    const user = getUser(c) as { id: string }
    const body = await c.req.json()

    console.log(`Updating notification settings for user ${user.id}:`, body)

    // 설정 변환 (API 형식 -> DB 형식)
    const updateData: any = {}

    if (body.browser_notifications !== undefined) {
      updateData.browserNotifications = body.browser_notifications
    }
    if (body.toast_notifications !== undefined) {
      updateData.toastNotifications = body.toast_notifications
    }
    if (body.reminder_times !== undefined) {
      updateData.reminderTimes = body.reminder_times
    }
    if (body.quiet_hours_start !== undefined) {
      updateData.quietHoursStart = body.quiet_hours_start
    }
    if (body.quiet_hours_end !== undefined) {
      updateData.quietHoursEnd = body.quiet_hours_end
    }
    if (body.weekdays_only !== undefined) {
      updateData.weekdaysOnly = body.weekdays_only
    }
    if (body.sound_enabled !== undefined) {
      updateData.soundEnabled = body.sound_enabled
    }

    // 실제 설정 업데이트
    await notificationService.updateUserNotificationSettings(user.id, updateData)

    return c.json(
      {
        success: true as const,
        message: '알림 설정이 업데이트되었습니다.',
      },
      200
    )
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return c.json(
      {
        success: false as const,
        error: 'Internal server error',
        message: 'Failed to update notification settings',
      },
      500
    )
  }
})

// 강제 알림 체크 라우트 (테스트용)
const forceCheckRoute = createRoute({
  method: 'post',
  path: '/force-check',
  tags: ['Notifications'],
  middleware: [authMiddleware],
  responses: {
    200: {
      description: '강제 알림 체크 성공',
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
    500: {
      description: '서버 오류',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
})

app.openapi(forceCheckRoute, async (c) => {
  try {
    console.log('Force notification check requested')

    // 강제 알림 체크 실행
    await notificationManager.forceNotificationCheck()

    return c.json(
      {
        success: true as const,
        message: '알림 체크가 실행되었습니다.',
      },
      200
    )
  } catch (error) {
    console.error('Error during force notification check:', error)
    return c.json(
      {
        success: false as const,
        error: 'Internal server error',
        message: 'Failed to execute notification check',
      },
      500
    )
  }
})

// Todo 알림 스케줄링 라우트
const scheduleRoute = createRoute({
  method: 'post',
  path: '/schedule',
  tags: ['Notifications'],
  middleware: [authMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            todoId: z.string(),
            dueDate: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: '알림 스케줄링 성공',
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
    500: {
      description: '서버 오류',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
})

app.openapi(scheduleRoute, async (c) => {
  try {
    const user = getUser(c) as { id: string }
    const { todoId, dueDate } = await c.req.json()

    console.log(`Scheduling notifications for todo ${todoId}, user ${user.id}, due: ${dueDate}`)

    // 알림 스케줄링 실행
    await notificationManager.scheduleNotificationsForTodo(todoId, user.id, new Date(dueDate))

    return c.json(
      {
        success: true as const,
        message: '알림이 스케줄링되었습니다.',
      },
      200
    )
  } catch (error) {
    console.error('Error scheduling notifications:', error)
    return c.json(
      {
        success: false as const,
        error: 'Internal server error',
        message: 'Failed to schedule notifications',
      },
      500
    )
  }
})

// Todo 알림 삭제 라우트
const deleteTodoNotificationsRoute = createRoute({
  method: 'delete',
  path: '/todo/{todoId}',
  tags: ['Notifications'],
  middleware: [authMiddleware],
  request: {
    params: z.object({
      todoId: z.string(),
    }),
  },
  responses: {
    200: {
      description: '알림 삭제 성공',
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
    500: {
      description: '서버 오류',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
})

app.openapi(deleteTodoNotificationsRoute, async (c) => {
  try {
    const { todoId } = c.req.param()

    console.log(`Deleting notifications for todo ${todoId}`)

    // 알림 삭제 실행
    await notificationManager.deleteNotificationsForTodo(todoId)

    return c.json(
      {
        success: true as const,
        message: '알림이 삭제되었습니다.',
      },
      200
    )
  } catch (error) {
    console.error('Error deleting notifications:', error)
    return c.json(
      {
        success: false as const,
        error: 'Internal server error',
        message: 'Failed to delete notifications',
      },
      500
    )
  }
})

// 시스템 통계 조회 라우트 (관리자용)
const statsRoute = createRoute({
  method: 'get',
  path: '/stats',
  tags: ['Notifications'],
  middleware: [authMiddleware],
  responses: {
    200: {
      description: '시스템 통계 조회 성공',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              active_connections: z.number(),
              pending_notifications: z.number(),
              system_status: z.enum(['running', 'stopped', 'error']),
              last_check: z.string(),
            }),
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
    500: {
      description: '서버 오류',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
})

app.openapi(statsRoute, async (c) => {
  try {
    console.log('System stats requested')

    // 시스템 통계 조회
    const stats = await notificationManager.getSystemStats()

    return c.json(
      {
        success: true as const,
        data: stats,
      },
      200
    )
  } catch (error) {
    console.error('Error getting system stats:', error)
    return c.json(
      {
        success: false as const,
        error: 'Internal server error',
        message: 'Failed to get system stats',
      },
      500
    )
  }
})

export default app
