export interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  createdAt: string
  updatedAt: string
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

export interface TodoStats {
  total: number
  completed: number
  active: number
  completionRate: number
}

export interface TodoFilters {
  search?: string
}
