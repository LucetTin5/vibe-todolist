/**
 * Enhanced OpenAPI 호환 Todo 라우트 v2
 */
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { TodoService } from '../services/todo.service'
import {
  TodoSchema,
  CreateTodoSchema,
  UpdateTodoSchema,
  TodoQuerySchema,
  TodoListResponseSchema,
  TodoStatsResponseSchema,
  SuccessResponseSchema,
  ErrorResponseSchema,
  type TodoQuery,
} from '../schemas/todo.schemas'

const app = new OpenAPIHono()
const todoService = new TodoService()

// 라우트 정의
const getTodosRoute = createRoute({
  method: 'get',
  path: '/api/todos',
  tags: ['Todos'],
  summary: 'Todo 목록 조회 (Enhanced)',
  description: '고급 필터링, 정렬, 검색 기능이 포함된 Todo 목록을 조회합니다.',
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
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '잘못된 요청',
    },
  },
})

const createTodoRoute = createRoute({
  method: 'post',
  path: '/api/todos',
  tags: ['Todos'],
  summary: 'Todo 생성 (Enhanced)',
  description: '우선순위, 카테고리, 태그 등의 고급 기능이 포함된 Todo를 생성합니다.',
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
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '잘못된 요청',
    },
  },
})

const getTodoRoute = createRoute({
  method: 'get',
  path: '/api/todos/{id}',
  tags: ['Todos'],
  summary: '개별 Todo 조회 (Enhanced)',
  description: 'ID로 특정 Todo의 상세 정보를 조회합니다.',
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
      description: 'Todo 조회 성공',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Todo를 찾을 수 없음',
    },
  },
})

const updateTodoRoute = createRoute({
  method: 'put',
  path: '/api/todos/{id}',
  tags: ['Todos'],
  summary: 'Todo 업데이트 (Enhanced)',
  description: 'ID로 특정 Todo를 업데이트합니다.',
  request: {
    params: z.object({
      id: z.string().openapi({
        param: { name: 'id', in: 'path' },
        example: 'todo_1737606271352',
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
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '잘못된 요청',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Todo를 찾을 수 없음',
    },
  },
})

const deleteTodoRoute = createRoute({
  method: 'delete',
  path: '/api/todos/{id}',
  tags: ['Todos'],
  summary: 'Todo 삭제',
  description: 'ID로 특정 Todo를 삭제합니다.',
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
          schema: SuccessResponseSchema,
        },
      },
      description: 'Todo 삭제 성공',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Todo를 찾을 수 없음',
    },
  },
})

const toggleTodoRoute = createRoute({
  method: 'patch',
  path: '/api/todos/{id}/toggle',
  tags: ['Todos'],
  summary: 'Todo 완료 상태 토글',
  description: 'Todo의 완료 상태를 토글합니다.',
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
      description: 'Todo 토글 성공',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Todo를 찾을 수 없음',
    },
  },
})

const getTodoStatsRoute = createRoute({
  method: 'get',
  path: '/api/todos/stats',
  tags: ['Todos'],
  summary: 'Todo 통계 조회 (Enhanced)',
  description: '우선순위별, 카테고리별, 마감일별 통계를 포함한 상세 Todo 통계를 조회합니다.',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: TodoStatsResponseSchema,
        },
      },
      description: 'Todo 통계 조회 성공',
    },
  },
})

const deleteAllTodosRoute = createRoute({
  method: 'delete',
  path: '/api/todos',
  tags: ['Todos'],
  summary: '모든 Todo 삭제',
  description: '모든 Todo를 삭제합니다.',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
      description: '모든 Todo 삭제 성공',
    },
  },
})

const bulkUpdateRoute = createRoute({
  method: 'patch',
  path: '/api/todos/bulk',
  tags: ['Todos'],
  summary: '대량 Todo 업데이트',
  description: '여러 Todo를 한 번에 업데이트합니다.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            ids: z.array(z.string()).openapi({
              example: ['todo_1', 'todo_2', 'todo_3'],
              description: '업데이트할 Todo ID 목록',
            }),
            data: UpdateTodoSchema.openapi({
              description: '업데이트할 데이터',
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            updatedTodos: z.array(TodoSchema),
            message: z.string().optional(),
          }),
        },
      },
      description: '대량 업데이트 성공',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '잘못된 요청',
    },
  },
})

const getTagsRoute = createRoute({
  method: 'get',
  path: '/api/todos/tags',
  tags: ['Todos'],
  summary: '사용된 태그 목록 조회',
  description: '모든 Todo에서 사용된 태그 목록을 조회합니다.',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            tags: z.array(z.string()).openapi({
              example: ['프로젝트', '중요', '급함'],
              description: '사용된 태그 목록',
            }),
          }),
        },
      },
      description: '태그 목록 조회 성공',
    },
  },
})

// 에러 핸들러 추가
app.onError((err, c) => {
  console.error('Todo API V2 Error:', err)

  if (err.message.includes('페이지') || err.message.includes('크기')) {
    return c.json(
      {
        success: false,
        error: err.message,
      },
      400
    )
  }

  if (err.message.includes('JSON') || err.message.includes('parse')) {
    return c.json(
      {
        success: false,
        error: '잘못된 JSON 형식입니다',
      },
      400
    )
  }

  return c.json(
    {
      success: false,
      error: 'Internal Server Error',
    },
    500
  )
})

// 라우트 핸들러 (구체적인 경로부터 등록)
app.openapi(getTodoStatsRoute, async (c) => {
  const result = await todoService.getStats()
  return c.json(result, 200)
})

app.openapi(getTagsRoute, async (c) => {
  const tags = await todoService.getAllTags()
  return c.json({ tags }, 200)
})

app.openapi(deleteAllTodosRoute, async (c) => {
  await todoService.clearTodos()

  return c.json(
    {
      success: true,
      message: '모든 Todo가 성공적으로 삭제되었습니다',
    },
    200
  )
})

app.openapi(bulkUpdateRoute, async (c) => {
  try {
    const { ids, data } = c.req.valid('json')
    const updatedTodos = await todoService.bulkUpdate(ids, data)

    return c.json(
      {
        success: true,
        updatedTodos,
        message: `${updatedTodos.length}개의 Todo가 업데이트되었습니다`,
      },
      200
    )
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      400
    )
  }
})

app.openapi(getTodosRoute, async (c) => {
  try {
    const query = c.req.valid('query') as TodoQuery
    const {
      filter = 'all',
      search,
      priority,
      category,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dueDateFrom,
      dueDateTo,
    } = query

    const result = await todoService.getTodos(
      { page, limit },
      filter,
      search,
      priority,
      category,
      sortBy,
      sortOrder,
      dueDateFrom,
      dueDateTo
    )

    return c.json(result, 200)
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      400
    )
  }
})

app.openapi(createTodoRoute, async (c) => {
  try {
    const data = c.req.valid('json')
    const result = await todoService.createTodo(data)
    return c.json(result, 201)
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      400
    )
  }
})

app.openapi(getTodoRoute, async (c) => {
  try {
    const { id } = c.req.valid('param')
    const result = await todoService.getTodoById(id)
    return c.json(result, 200)
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      404
    )
  }
})

app.openapi(updateTodoRoute, async (c) => {
  try {
    const { id } = c.req.valid('param')
    const data = c.req.valid('json')
    const result = await todoService.updateTodo(id, data)
    return c.json(result, 200)
  } catch (error) {
    if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
      return c.json(
        {
          success: false,
          error: (error as Error).message,
        },
        404
      )
    }

    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      400
    )
  }
})

app.openapi(deleteTodoRoute, async (c) => {
  try {
    const { id } = c.req.valid('param')
    await todoService.deleteTodo(id)

    return c.json(
      {
        success: true,
        message: 'Todo가 성공적으로 삭제되었습니다',
      },
      200
    )
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      404
    )
  }
})

app.openapi(toggleTodoRoute, async (c) => {
  try {
    const { id } = c.req.valid('param')
    const result = await todoService.toggleTodo(id)
    return c.json(result, 200)
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      404
    )
  }
})

export default app
export { app as todoRoutes }
