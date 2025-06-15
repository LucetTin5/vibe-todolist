/**
 * Generic API Response Types
 *
 * 모든 API 응답에 사용되는 일관된 타입 구조를 정의합니다.
 */
import { z } from '@hono/zod-openapi'

/**
 * Generic Success Response with Data
 * 성공적인 API 응답을 위한 제네릭 타입
 */
export const createSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
  return z.object({
    success: z.literal(true).openapi({
      description: '요청 성공 여부',
      example: true,
    }),
    data: dataSchema.openapi({
      description: '응답 데이터',
    }),
    message: z.string().optional().openapi({
      description: '추가 메시지 (선택사항)',
      example: '요청이 성공적으로 처리되었습니다',
    }),
  })
}

/**
 * Direct Data Response (기존 구조 호환)
 * 데이터를 직접 반환하는 응답 (TodoListResponse 등과 호환)
 */
export const createDirectResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
  return dataSchema
}

/**
 * Generic Error Response
 * 오류 응답을 위한 표준 타입
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false).openapi({
    description: '요청 성공 여부',
    example: false,
  }),
  error: z.string().openapi({
    description: '오류 코드 또는 메시지',
    example: 'NOT_FOUND',
  }),
  message: z.string().openapi({
    description: '사용자 친화적 오류 메시지',
    example: '요청한 리소스를 찾을 수 없습니다',
  }),
  details: z.string().optional().openapi({
    description: '상세 오류 정보 (개발용)',
    example: 'Todo with ID "invalid_id" not found',
  }),
})

/**
 * Simple Success Response (데이터 없음)
 * 단순한 성공 응답을 위한 타입 (예: 삭제 완료)
 */
export const SimpleSuccessResponseSchema = z.object({
  success: z.literal(true).openapi({
    description: '요청 성공 여부',
    example: true,
  }),
  message: z.string().openapi({
    description: '성공 메시지',
    example: '작업이 성공적으로 완료되었습니다',
  }),
})

/**
 * Todo 리스트 스타일 Paginated Response
 * 기존 TodoListResponse와 호환되는 구조
 */
export const createTodoListResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => {
  return z.object({
    todos: z.array(itemSchema).openapi({
      description: 'Todo 목록',
    }),
    total: z.number().int().openapi({
      description: '전체 항목 수',
      example: 25,
    }),
    currentPage: z.number().int().openapi({
      description: '현재 페이지',
      example: 1,
    }),
    totalPages: z.number().int().openapi({
      description: '전체 페이지 수',
      example: 3,
    }),
    hasNext: z.boolean().openapi({
      description: '다음 페이지 존재 여부',
      example: true,
    }),
    hasPrev: z.boolean().openapi({
      description: '이전 페이지 존재 여부',
      example: false,
    }),
  })
}

/**
 * Standard Paginated Response
 * 표준 REST API 스타일 페이지네이션
 */
export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => {
  return createSuccessResponseSchema(
    z.object({
      items: z.array(itemSchema).openapi({
        description: '페이지 항목들',
      }),
      pagination: z
        .object({
          total: z.number().int().openapi({
            description: '전체 항목 수',
            example: 150,
          }),
          currentPage: z.number().int().openapi({
            description: '현재 페이지',
            example: 1,
          }),
          totalPages: z.number().int().openapi({
            description: '전체 페이지 수',
            example: 15,
          }),
          hasNext: z.boolean().openapi({
            description: '다음 페이지 존재 여부',
            example: true,
          }),
          hasPrev: z.boolean().openapi({
            description: '이전 페이지 존재 여부',
            example: false,
          }),
        })
        .openapi({
          description: '페이지네이션 정보',
        }),
    })
  )
}

/**
 * TypeScript 타입 추론을 위한 유틸리티 타입들
 */
export type SuccessResponse<T> = {
  success: true
  data: T
  message?: string
}

export type ErrorResponse = {
  success: false
  error: string
  message: string
  details?: string
}

export type SimpleSuccessResponse = {
  success: true
  message: string
}

export type TodoListResponse = {
  todos: unknown[]
  total: number
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type PaginatedResponse<T> = {
  success: true
  data: {
    items: T[]
    pagination: {
      total: number
      currentPage: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
  message?: string
}

// API Response Union Types
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse
export type ApiSimpleResponse = SimpleSuccessResponse | ErrorResponse
export type ApiPaginatedResponse<T> = PaginatedResponse<T> | ErrorResponse
export type ApiTodoListResponse = TodoListResponse | ErrorResponse

// Helper type for direct responses (no wrapper)
export type DirectResponse<T> = T | ErrorResponse
