/**
 * OpenAPI 호환 Zod 스키마 정의
 */
import { z } from 'zod'

// 기본 Todo 스키마 (OpenAPI 메타데이터 포함)
export const TodoSchema = z.object({
  id: z.string().openapi({
    example: 'todo_1737606271352',
    description: 'Todo 고유 식별자',
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
})

// 쿼리 파라미터 스키마
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
  search: z
    .string()
    .optional()
    .openapi({
      param: { name: 'search', in: 'query' },
      example: '검색어',
      description: '제목 또는 설명에서 검색할 키워드',
    }),
})

// Todo 목록 응답 스키마
export const TodoListResponseSchema = z.object({
  todos: z.array(TodoSchema).openapi({
    description: 'Todo 목록',
  }),
  total: z.number().openapi({
    example: 25,
    description: '전체 Todo 개수',
  }),
  currentPage: z.number().openapi({
    example: 1,
    description: '현재 페이지 번호',
  }),
  totalPages: z.number().openapi({
    example: 3,
    description: '전체 페이지 수',
  }),
  hasNext: z.boolean().openapi({
    example: true,
    description: '다음 페이지 존재 여부',
  }),
  hasPrev: z.boolean().openapi({
    example: false,
    description: '이전 페이지 존재 여부',
  }),
})

// Todo 통계 응답 스키마
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
})

// 기본 응답 스키마
export const SuccessResponseSchema = z.object({
  success: z.boolean().openapi({
    example: true,
    description: '성공 여부',
  }),
  message: z.string().optional().openapi({
    example: '작업이 성공적으로 완료되었습니다',
    description: '응답 메시지',
  }),
})

// 에러 응답 스키마
export const ErrorResponseSchema = z.object({
  success: z.boolean().openapi({
    example: false,
    description: '성공 여부',
  }),
  error: z.string().openapi({
    example: '요청된 Todo를 찾을 수 없습니다',
    description: '에러 메시지',
  }),
  details: z.string().optional().openapi({
    example: 'Todo ID: invalid_id',
    description: '상세 에러 정보',
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
