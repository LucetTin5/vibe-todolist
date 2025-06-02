import type {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoFilter,
  PaginationParams,
} from '../types/todo.types'
import { todoStorage } from '../utils/in-memory-storage'

/**
 * Todo 데이터 접근 계층
 * 비즈니스 로직과 데이터 저장소 사이의 추상화 레이어
 */
export class TodoRepository {
  /**
   * 새 Todo 생성
   */
  async create(data: CreateTodoRequest): Promise<Todo> {
    const todo = todoStorage.create({
      title: data.title,
      description: data.description,
      completed: false,
    })

    return todo
  }

  /**
   * 페이지네이션과 필터를 적용한 Todo 목록 조회
   */
  async findMany(
    pagination: PaginationParams,
    filter: TodoFilter = 'all',
    search?: string
  ): Promise<{ todos: Todo[]; total: number }> {
    let todos = todoStorage.findAll()

    // 검색 필터 적용
    if (search) {
      todos = todoStorage.search(search)
    }

    // 상태 필터 적용
    if (filter === 'active') {
      todos = todos.filter((todo) => !todo.completed)
    } else if (filter === 'completed') {
      todos = todos.filter((todo) => todo.completed)
    }

    const total = todos.length

    // 페이지네이션 적용
    const startIndex = (pagination.page - 1) * pagination.limit
    const endIndex = startIndex + pagination.limit
    const paginatedTodos = todos.slice(startIndex, endIndex)

    return {
      todos: paginatedTodos,
      total,
    }
  }

  /**
   * ID로 Todo 조회
   */
  async findById(id: string): Promise<Todo | null> {
    const todo = todoStorage.findById(id)
    return todo || null
  }

  /**
   * Todo 업데이트
   */
  async update(id: string, data: UpdateTodoRequest): Promise<Todo | null> {
    const updatedTodo = todoStorage.update(id, data)
    return updatedTodo || null
  }

  /**
   * Todo 삭제
   */
  async delete(id: string): Promise<boolean> {
    return todoStorage.delete(id)
  }

  /**
   * Todo 존재 여부 확인
   */
  async exists(id: string): Promise<boolean> {
    return todoStorage.findById(id) !== undefined
  }

  /**
   * 통계 조회
   */
  async getStats(): Promise<{
    total: number
    completed: number
    active: number
  }> {
    return {
      total: todoStorage.count(),
      completed: todoStorage.countCompleted(),
      active: todoStorage.countActive(),
    }
  }

  /**
   * 개발용: 모든 Todo 삭제
   */
  async clear(): Promise<void> {
    todoStorage.clear()
  }
}
