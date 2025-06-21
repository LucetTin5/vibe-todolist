/**
 * OpenAPI 호환 Todo 스키마 - Enhanced 기능 포함
 */
import { z } from '@hono/zod-openapi'
import {
  createSuccessResponseSchema,
  createTodoListResponseSchema,
  type ErrorResponseSchema,
  SimpleSuccessResponseSchema,
} from '../types/api.types'

// 우선순위 타입
export const PriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']).openapi({
  description: '우선순위 레벨',
  example: 'medium',
})

// 카테고리 타입
export const CategoryEnum = z.enum(['work', 'personal', 'shopping', 'health', 'other']).openapi({
  description: '카테고리 타입',
  example: 'work',
})

// 상태 타입 (Kanban용)
export const StatusEnum = z.enum(['todo', 'in-progress', 'done']).openapi({
  description: 'Todo 상태 (Kanban 뷰용)',
  example: 'todo',
})

// 확장된 Todo 스키마
export const TodoSchema = z.object({
  id: z.string().openapi({
    example: 'todo_1737606271352',
    description: 'Todo 고유 식별자',
  }),
  userId: z.string().openapi({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: '사용자 ID (데이터 격리용)',
  }),
  title: z.string().min(1).max(200).openapi({
    example: '프로젝트 완료하기',
    description: 'Todo 제목 (1-200자)',
  }),
  description: z.string().optional().openapi({
    example: '마감일까지 모든 기능 구현 완료',
    description: 'Todo 상세 설명 (선택사항)',
  }),
  completed: z.boolean().openapi({
    example: false,
    description: '완료 여부',
  }),
  priority: PriorityEnum.default('medium').openapi({
    description: '우선순위 (기본값: medium)',
  }),
  category: CategoryEnum.default('other').openapi({
    description: '카테고리 (기본값: other)',
  }),
  status: StatusEnum.default('todo').openapi({
    description: 'Todo 상태 (Kanban 뷰용, 기본값: todo)',
  }),
  order: z.number().default(0).openapi({
    example: 0,
    description: 'Todo 정렬 순서 (Kanban 뷰용)',
  }),
  dueDate: z.string().datetime().optional().openapi({
    example: '2025-06-10T09:00:00.000Z',
    description: '마감일 (ISO 8601, 선택사항)',
  }),
  tags: z
    .array(z.string())
    .default([])
    .openapi({
      example: ['프로젝트', '중요'],
      description: '태그 목록',
    }),
  estimatedMinutes: z.number().optional().openapi({
    example: 120,
    description: '예상 소요 시간 (분 단위)',
  }),
  createdAt: z.string().datetime().openapi({
    example: '2025-06-02T04:44:31.352Z',
    description: '생성 시간 (ISO 8601)',
  }),
  updatedAt: z.string().datetime().openapi({
    example: '2025-06-02T04:44:31.352Z',
    description: '수정 시간 (ISO 8601)',
  }),
})

// Todo 생성 요청 스키마
export const CreateTodoSchema = z.object({
  title: z.string().min(1).max(200).openapi({
    example: '새로운 할일',
    description: 'Todo 제목 (1-200자)',
  }),
  description: z.string().optional().openapi({
    example: '상세한 설명',
    description: 'Todo 상세 설명 (선택사항)',
  }),
  priority: PriorityEnum.optional().openapi({
    description: '우선순위 (기본값: medium)',
  }),
  category: CategoryEnum.optional().openapi({
    description: '카테고리 (기본값: other)',
  }),
  status: StatusEnum.optional().openapi({
    description: 'Todo 상태 (Kanban 뷰용)',
  }),
  order: z.number().optional().openapi({
    example: 0,
    description: 'Todo 정렬 순서 (Kanban 뷰용)',
  }),
  dueDate: z.string().datetime().optional().openapi({
    example: '2025-06-10T09:00:00.000Z',
    description: '마감일 (ISO 8601, 선택사항)',
  }),
  tags: z
    .array(z.string())
    .optional()
    .openapi({
      example: ['프로젝트', '중요'],
      description: '태그 목록',
    }),
  estimatedMinutes: z.number().optional().openapi({
    example: 120,
    description: '예상 소요 시간 (분 단위)',
  }),
})

// Todo 업데이트 요청 스키마
export const UpdateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional().openapi({
    example: '수정된 제목',
    description: 'Todo 제목 (1-200자)',
  }),
  description: z.string().optional().openapi({
    example: '수정된 설명',
    description: 'Todo 상세 설명',
  }),
  completed: z.boolean().optional().openapi({
    example: true,
    description: '완료 여부',
  }),
  priority: PriorityEnum.optional().openapi({
    description: '우선순위',
  }),
  category: CategoryEnum.optional().openapi({
    description: '카테고리',
  }),
  status: StatusEnum.optional().openapi({
    description: 'Todo 상태 (Kanban 뷰용)',
  }),
  order: z.number().optional().openapi({
    example: 0,
    description: 'Todo 정렬 순서 (Kanban 뷰용)',
  }),
  dueDate: z.string().datetime().optional().openapi({
    example: '2025-06-10T09:00:00.000Z',
    description: '마감일 (ISO 8601, 선택사항)',
  }),
  tags: z
    .array(z.string())
    .optional()
    .openapi({
      example: ['프로젝트', '중요'],
      description: '태그 목록',
    }),
  estimatedMinutes: z.number().optional().openapi({
    example: 120,
    description: '예상 소요 시간 (분 단위)',
  }),
})

// 확장된 쿼리 파라미터 스키마
export const TodoQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('1')
    .openapi({
      param: { name: 'page', in: 'query' },
      example: '1',
      description: '페이지 번호 (기본값: 1)',
    }),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('10')
    .openapi({
      param: { name: 'limit', in: 'query' },
      example: '10',
      description: '페이지당 항목 수 (기본값: 10)',
    }),
  filter: z
    .enum(['all', 'active', 'completed'])
    .default('all')
    .openapi({
      param: { name: 'filter', in: 'query' },
      example: 'all',
      description: '필터링 옵션 (all: 전체, active: 미완료, completed: 완료)',
    }),
  priority: PriorityEnum.optional().openapi({
    param: { name: 'priority', in: 'query' },
    description: '우선순위 필터',
  }),
  category: CategoryEnum.optional().openapi({
    param: { name: 'category', in: 'query' },
    description: '카테고리 필터',
  }),
  status: StatusEnum.optional().openapi({
    param: { name: 'status', in: 'query' },
    description: '상태 필터 (Kanban 뷰용)',
  }),
  search: z
    .string()
    .optional()
    .openapi({
      param: { name: 'search', in: 'query' },
      example: '검색어',
      description: '제목 또는 설명에서 검색할 키워드',
    }),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'title', 'order'])
    .default('createdAt')
    .openapi({
      param: { name: 'sortBy', in: 'query' },
      example: 'createdAt',
      description: '정렬 기준 (기본값: createdAt)',
    }),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc')
    .openapi({
      param: { name: 'sortOrder', in: 'query' },
      example: 'desc',
      description: '정렬 순서 (기본값: desc)',
    }),
  dueDateFrom: z
    .string()
    .datetime()
    .optional()
    .openapi({
      param: { name: 'dueDateFrom', in: 'query' },
      example: '2025-06-01T00:00:00.000Z',
      description: '마감일 시작 범위 (ISO 8601)',
    }),
  dueDateTo: z
    .string()
    .datetime()
    .optional()
    .openapi({
      param: { name: 'dueDateTo', in: 'query' },
      example: '2025-06-30T23:59:59.999Z',
      description: '마감일 종료 범위 (ISO 8601)',
    }),
})

// Todo 목록 응답 스키마 (Generic 타입 사용)
export const TodoListResponseSchema = createTodoListResponseSchema(TodoSchema)

// 확장된 Todo 통계 응답 스키마
export const TodoStatsResponseSchema = z.object({
  total: z.number().openapi({
    example: 25,
    description: '전체 Todo 개수',
  }),
  completed: z.number().openapi({
    example: 10,
    description: '완료된 Todo 개수',
  }),
  active: z.number().openapi({
    example: 15,
    description: '미완료 Todo 개수',
  }),
  completionRate: z.number().openapi({
    example: 40.0,
    description: '완료율 (%)',
  }),
  byPriority: z
    .object({
      low: z.number().openapi({ example: 5, description: '낮은 우선순위 Todo 개수' }),
      medium: z.number().openapi({ example: 10, description: '보통 우선순위 Todo 개수' }),
      high: z.number().openapi({ example: 8, description: '높은 우선순위 Todo 개수' }),
      urgent: z.number().openapi({ example: 2, description: '긴급 우선순위 Todo 개수' }),
    })
    .openapi({
      description: '우선순위별 Todo 개수',
    }),
  byCategory: z
    .object({
      work: z.number().openapi({ example: 10, description: '업무 Todo 개수' }),
      personal: z.number().openapi({ example: 8, description: '개인 Todo 개수' }),
      shopping: z.number().openapi({ example: 3, description: '쇼핑 Todo 개수' }),
      health: z.number().openapi({ example: 2, description: '건강 Todo 개수' }),
      other: z.number().openapi({ example: 2, description: '기타 Todo 개수' }),
    })
    .openapi({
      description: '카테고리별 Todo 개수',
    }),
  overdue: z.number().openapi({
    example: 3,
    description: '마감일이 지난 Todo 개수',
  }),
  dueToday: z.number().openapi({
    example: 2,
    description: '오늘 마감인 Todo 개수',
  }),
  dueThisWeek: z.number().openapi({
    example: 5,
    description: '이번 주 마감인 Todo 개수',
  }),
})

// 기존 스키마들을 Generic 타입으로 대체
export const SuccessResponseSchema = SimpleSuccessResponseSchema
// ErrorResponseSchema는 이미 import됨

// Bulk Update 스키마 (Kanban용)
export const BulkUpdateItemSchema = z.object({
  id: z.string().openapi({
    example: 'todo_1737606271352',
    description: '업데이트할 Todo ID',
  }),
  status: StatusEnum.optional().openapi({
    description: '변경할 상태',
  }),
  order: z.number().optional().openapi({
    example: 1,
    description: '변경할 정렬 순서',
  }),
  priority: PriorityEnum.optional().openapi({
    description: '변경할 우선순위',
  }),
})

export const BulkUpdateSchema = z.object({
  data: z.array(BulkUpdateItemSchema).min(1).openapi({
    description: '일괄 업데이트할 Todo 목록',
  }),
})

export const BulkUpdateResponseSchema = z.object({
  success: z.boolean().openapi({
    example: true,
    description: '성공 여부',
  }),
  updatedTodos: z.array(TodoSchema).openapi({
    description: '업데이트된 Todo 목록',
  }),
  updatedCount: z.number().openapi({
    example: 3,
    description: '업데이트된 Todo 개수',
  }),
  message: z.string().openapi({
    example: '3개의 Todo가 성공적으로 업데이트되었습니다',
    description: '결과 메시지',
  }),
})

// TypeScript 타입 추출
export type Todo = z.infer<typeof TodoSchema>
export type CreateTodoRequest = z.infer<typeof CreateTodoSchema>
export type UpdateTodoRequest = z.infer<typeof UpdateTodoSchema>
export type TodoQuery = z.infer<typeof TodoQuerySchema>
export type TodoListResponse = z.infer<typeof TodoListResponseSchema>
export type TodoStatsResponse = z.infer<typeof TodoStatsResponseSchema>
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
export type Priority = z.infer<typeof PriorityEnum>
export type Category = z.infer<typeof CategoryEnum>
export type Status = z.infer<typeof StatusEnum>
export type BulkUpdateItem = z.infer<typeof BulkUpdateItemSchema>
export type BulkUpdateRequest = z.infer<typeof BulkUpdateSchema>
export type BulkUpdateResponse = z.infer<typeof BulkUpdateResponseSchema>
