/**
 * Todo 관련 TypeScript 타입 정의
 */

export interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateTodoRequest {
  title: string
  description?: string
}

export interface UpdateTodoRequest {
  title?: string
  description?: string
  completed?: boolean
}

export interface TodoResponse {
  success: boolean
  data?: Todo | Todo[]
  message?: string
  error?: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface TodoListResponse {
  todos: Todo[]
  total: number
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface TodoStats {
  total: number
  completed: number
  active: number
  completionRate: number
}

export type TodoFilter = 'all' | 'active' | 'completed'

export interface TodoQueryParams extends PaginationParams {
  filter?: TodoFilter
  search?: string
}
