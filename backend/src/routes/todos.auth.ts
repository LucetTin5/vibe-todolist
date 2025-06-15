/**
 * 인증이 포함된 Todo 라우트 - Supabase 연동
 */
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { DrizzleTodoService } from '../services/drizzle-todo.service'
import { authMiddleware, getUserId } from '../middleware/auth'
import {
  TodoSchema,
  CreateTodoSchema,
  UpdateTodoSchema,
  TodoQuerySchema,
  TodoListResponseSchema,
  TodoStatsResponseSchema,
  SuccessResponseSchema,
  type TodoQuery,
} from '../schemas/todo.schemas'
import { ErrorResponseSchema, TodoListResponse, DirectResponse } from '../types/api.types'

const app = new OpenAPIHono()
const todoService = new DrizzleTodoService()

// 모든 라우트에 인증 미들웨어 적용
app.use('/*', authMiddleware)

// 라우트 정의
const getTodosRoute = createRoute({
  method: 'get',
  path: '/auth/todos',
  tags: ['Todos'],
  summary: '사용자별 Todo 목록 조회',
  description: '인증된 사용자의 Todo 목록을 조회합니다.',
  security: [{ Bearer: [] }],
  request: {
    query: TodoQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: TodoListResponseSchema,
        },
      },
      description: 'Todo 목록 조회 성공',
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

const createTodoRoute = createRoute({
  method: 'post',
  path: '/auth/todos',
  tags: ['Todos'],
  summary: 'Todo 생성',
  description: '새로운 Todo를 생성합니다.',
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateTodoSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: TodoSchema,
        },
      },
      description: 'Todo 생성 성공',
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

const getTodoRoute = createRoute({
  method: 'get',
  path: '/auth/todos/{id}',
  tags: ['Todos'],
  summary: '개별 Todo 조회',
  description: 'ID로 특정 Todo를 조회합니다.',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({
        param: { name: 'id', in: 'path' },
        example: 'todo_1737606271352',
        description: 'Todo ID',
      }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: TodoSchema,
        },
      },
      description: '개별 Todo 조회 성공',
    },
    401: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '인증 실패',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Todo를 찾을 수 없음',
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

const updateTodoRoute = createRoute({
  method: 'put',
  path: '/auth/todos/{id}',
  tags: ['Todos'],
  summary: 'Todo 업데이트',
  description: 'Todo의 정보를 업데이트합니다.',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({
        param: { name: 'id', in: 'path' },
        description: 'Todo ID',
      }),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateTodoSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: TodoSchema,
        },
      },
      description: 'Todo 업데이트 성공',
    },
    401: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '인증 실패',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Todo를 찾을 수 없음',
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

const deleteTodoRoute = createRoute({
  method: 'delete',
  path: '/auth/todos/{id}',
  tags: ['Todos'],
  summary: 'Todo 삭제',
  description: 'Todo를 삭제합니다.',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({
        param: { name: 'id', in: 'path' },
        description: 'Todo ID',
      }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
      description: 'Todo 삭제 성공',
    },
    401: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '인증 실패',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Todo를 찾을 수 없음',
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

const toggleTodoRoute = createRoute({
  method: 'patch',
  path: '/auth/todos/{id}/toggle',
  tags: ['Todos'],
  summary: 'Todo 완료 상태 토글',
  description: 'Todo의 완료 상태를 토글합니다.',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({
        param: { name: 'id', in: 'path' },
        description: 'Todo ID',
      }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: TodoSchema,
        },
      },
      description: 'Todo 상태 토글 성공',
    },
    401: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '인증 실패',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Todo를 찾을 수 없음',
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

const getStatsRoute = createRoute({
  method: 'get',
  path: '/auth/todos/stats',
  tags: ['Todos'],
  summary: '사용자별 Todo 통계 조회',
  description: '인증된 사용자의 Todo 통계 정보를 조회합니다.',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: TodoStatsResponseSchema,
        },
      },
      description: 'Todo 통계 조회 성공',
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

// 라우트 핸들러 구현
app.openapi(getTodosRoute, async (c) => {
  try {
    const userId = getUserId(c)
    const query = c.req.valid('query') as TodoQuery

    const result = await todoService.getTodos(
      userId,
      { page: query.page || 1, limit: query.limit || 10 },
      {
        filter: query.filter,
        search: query.search,
        priority: query.priority,
        category: query.category,
        status: query.status,
        dueDateFrom: query.dueDateFrom ? new Date(query.dueDateFrom) : undefined,
        dueDateTo: query.dueDateTo ? new Date(query.dueDateTo) : undefined,
      },
      {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      }
    )

    return c.json(result, 200)
  } catch (error) {
    console.error('getTodos error:', error)
    return c.json(
      {
        success: false as const,
        error: 'Internal Server Error',
        message: 'An internal server error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

app.openapi(createTodoRoute, async (c) => {
  try {
    const userId = getUserId(c)
    const data = c.req.valid('json')

    const todo = await todoService.createTodo(userId, data)
    return c.json(todo, 201)
  } catch (error) {
    console.error('createTodo error:', error)
    return c.json(
      {
        success: false as const,
        error: 'Internal Server Error',
        message: 'An internal server error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

app.openapi(getTodoRoute, async (c) => {
  try {
    const userId = getUserId(c)
    const { id } = c.req.valid('param')

    const todo = await todoService.getTodoById(userId, id)
    if (!todo) {
      return c.json(
        {
          success: false as const,
          error: 'Not Found',
          message: 'Todo를 찾을 수 없습니다',
          details: 'Todo를 찾을 수 없습니다',
        },
        404
      )
    }
    return c.json(todo, 200)
  } catch (error) {
    console.error('getTodo error:', error)
    if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
      return c.json(
        {
          success: false as const,
          error: 'Not Found',
          message: 'Resource not found',
          details: error.message,
        },
        404
      )
    }
    return c.json(
      {
        success: false as const,
        error: 'Internal Server Error',
        message: 'An internal server error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

app.openapi(updateTodoRoute, async (c) => {
  try {
    const userId = getUserId(c)
    const { id } = c.req.valid('param')
    const data = c.req.valid('json')

    const todo = await todoService.updateTodo(userId, id, data)
    if (!todo) {
      return c.json(
        {
          success: false as const,
          error: 'Not Found',
          message: 'Todo를 찾을 수 없습니다',
          details: 'Todo를 찾을 수 없습니다',
        },
        404
      )
    }
    return c.json(todo, 200)
  } catch (error) {
    console.error('updateTodo error:', error)
    if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
      return c.json(
        {
          success: false as const,
          error: 'Not Found',
          message: 'Resource not found',
          details: error.message,
        },
        404
      )
    }
    return c.json(
      {
        success: false as const,
        error: 'Internal Server Error',
        message: 'An internal server error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

app.openapi(deleteTodoRoute, async (c) => {
  try {
    const userId = getUserId(c)
    const { id } = c.req.valid('param')

    await todoService.deleteTodo(userId, id)
    return c.json({ success: true as const, message: 'Todo deleted successfully' }, 200)
  } catch (error) {
    console.error('deleteTodo error:', error)
    if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
      return c.json(
        {
          success: false as const,
          error: 'Not Found',
          message: 'Resource not found',
          details: error.message,
        },
        404
      )
    }
    return c.json(
      {
        success: false as const,
        error: 'Internal Server Error',
        message: 'An internal server error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

app.openapi(toggleTodoRoute, async (c) => {
  try {
    const userId = getUserId(c)
    const { id } = c.req.valid('param')

    const todo = await todoService.toggleTodo(userId, id)
    if (!todo) {
      return c.json(
        {
          success: false as const,
          error: 'Not Found',
          message: 'Todo를 찾을 수 없습니다',
          details: 'Todo를 찾을 수 없습니다',
        },
        404
      )
    }
    return c.json(todo, 200)
  } catch (error) {
    console.error('toggleTodo error:', error)
    if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
      return c.json(
        {
          success: false as const,
          error: 'Not Found',
          message: 'Resource not found',
          details: error.message,
        },
        404
      )
    }
    return c.json(
      {
        success: false as const,
        error: 'Internal Server Error',
        message: 'An internal server error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

app.openapi(getStatsRoute, async (c) => {
  try {
    const userId = getUserId(c)

    const stats = await todoService.getStats(userId)
    return c.json(stats, 200)
  } catch (error) {
    console.error('getStats error:', error)
    return c.json(
      {
        success: false as const,
        error: 'Internal Server Error',
        message: 'An internal server error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default app
