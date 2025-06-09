/**
 * OpenAPI 라우트 정의
 */
import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'
import {
  TodoSchema,
  CreateTodoSchema,
  UpdateTodoSchema,
  TodoQuerySchema,
  TodoListResponseSchema,
  TodoStatsResponseSchema,
  SuccessResponseSchema,
  ErrorResponseSchema,
  BulkUpdateSchema,
  BulkUpdateResponseSchema,
} from '../schemas/todo.schemas'

// Todo 목록 조회 라우트
export const getTodosRoute = createRoute({
  method: 'get',
  path: '/todos',
  tags: ['Todos'],
  summary: 'Todo 목록 조회',
  description: '페이징, 필터링, 검색을 지원하는 Todo 목록을 조회합니다.',
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
      description: '잘못된 요청 파라미터',
    },
  },
})

// Todo 생성 라우트
export const createTodoRoute = createRoute({
  method: 'post',
  path: '/todos',
  tags: ['Todos'],
  summary: 'Todo 생성',
  description: '새로운 Todo를 생성합니다.',
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
      description: '잘못된 요청 데이터',
    },
  },
})

// 특정 Todo 조회 라우트
export const getTodoRoute = createRoute({
  method: 'get',
  path: '/todos/{id}',
  tags: ['Todos'],
  summary: '특정 Todo 조회',
  description: 'ID로 특정 Todo를 조회합니다.',
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

// Todo 업데이트 라우트
export const updateTodoRoute = createRoute({
  method: 'put',
  path: '/todos/{id}',
  tags: ['Todos'],
  summary: 'Todo 업데이트',
  description: '기존 Todo를 업데이트합니다.',
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
      description: '잘못된 요청 데이터',
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

// Todo 삭제 라우트
export const deleteTodoRoute = createRoute({
  method: 'delete',
  path: '/todos/{id}',
  tags: ['Todos'],
  summary: 'Todo 삭제',
  description: '특정 Todo를 삭제합니다.',
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

// Todo 통계 조회 라우트
export const getTodoStatsRoute = createRoute({
  method: 'get',
  path: '/todos/stats',
  tags: ['Stats'],
  summary: 'Todo 통계 조회',
  description: 'Todo 완료율 및 개수 통계를 조회합니다.',
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

// 모든 Todo 삭제 라우트
export const deleteAllTodosRoute = createRoute({
  method: 'delete',
  path: '/todos',
  tags: ['Todos'],
  summary: '모든 Todo 삭제',
  description: '모든 Todo를 삭제합니다. (주의: 되돌릴 수 없습니다)',
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

// Todo 완료 상태 토글 라우트 (Kanban용)
export const toggleTodoRoute = createRoute({
  method: 'patch',
  path: '/todos/{id}/toggle',
  tags: ['Todos', 'Kanban'],
  summary: 'Todo 완료 상태 토글',
  description: 'Todo의 완료 상태를 토글합니다. (Kanban 뷰에서 사용)',
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
      description: 'Todo 상태 토글 성공',
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

// Bulk Update 라우트 (Kanban 드래그앤드롭용)
export const bulkUpdateTodosRoute = createRoute({
  method: 'patch',
  path: '/todos/bulk',
  tags: ['Todos', 'Kanban'],
  summary: 'Todo 일괄 업데이트',
  description: '여러 Todo를 한 번에 업데이트합니다. (Kanban 드래그앤드롭에서 사용)',
  request: {
    body: {
      content: {
        'application/json': {
          schema: BulkUpdateSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: BulkUpdateResponseSchema,
        },
      },
      description: 'Todo 일괄 업데이트 성공',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '잘못된 요청 데이터',
    },
  },
})

// 태그 목록 조회 라우트
export const getTagsRoute = createRoute({
  method: 'get',
  path: '/todos/tags',
  tags: ['Todos'],
  summary: '사용된 태그 목록 조회',
  description: '현재 Todo들에서 사용된 모든 태그 목록을 조회합니다.',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(z.string()).openapi({
            description: '사용된 태그 목록',
            example: ['프로젝트', '중요', '업무', '개인'],
          }),
        },
      },
      description: '태그 목록 조회 성공',
    },
  },
})
