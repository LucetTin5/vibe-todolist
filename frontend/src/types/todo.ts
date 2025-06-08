// Re-export generated API types for convenience
export type {
  GetApiTodos200TodosItem as Todo,
  PostApiTodosBody as CreateTodoRequest,
  PutApiTodosIdBody as UpdateTodoRequest,
  GetApiTodosStats200 as TodoStats,
  GetApiTodosParams as TodoFilters,
  GetApiTodos200 as TodosResponse,
} from '../api/model'

// Additional helper types
export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TodoCategory = 'work' | 'personal' | 'shopping' | 'health' | 'other'
