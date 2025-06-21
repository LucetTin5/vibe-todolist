/**
 * Enhanced Todo Service - Drizzle ORM 기반
 */
import { DrizzleTodoService } from './drizzle-todo.service'
import type {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoListResponse,
  TodoStatsResponse,
  TodoQuery,
  Priority,
  Category,
  Status,
  BulkUpdateItem,
  BulkUpdateResponse,
} from '../schemas/todo.schemas'

interface PaginationOptions {
  page: number
  limit: number
}

export class TodoService {
  private drizzleService = new DrizzleTodoService()

  /**
   * 고급 필터링 및 정렬 기능이 포함된 Todo 목록 조회
   */
  async getTodos(
    userId: string,
    pagination: PaginationOptions,
    filter: 'all' | 'active' | 'completed' = 'all',
    search?: string,
    priority?: Priority,
    category?: Category,
    status?: Status,
    sortBy: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title' | 'order' = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    dueDateFrom?: string,
    dueDateTo?: string
  ): Promise<TodoListResponse> {
    if (pagination.page <= 0) {
      throw new Error('페이지 번호는 1 이상이어야 합니다')
    }
    if (pagination.limit <= 0 || pagination.limit > 100) {
      throw new Error('페이지 크기는 1-100 사이여야 합니다')
    }

    return await this.drizzleService.getTodos(
      userId,
      pagination,
      {
        filter,
        search,
        priority,
        category,
        status,
        dueDateFrom: dueDateFrom ? new Date(dueDateFrom) : undefined,
        dueDateTo: dueDateTo ? new Date(dueDateTo) : undefined,
      },
      { sortBy, sortOrder }
    )
  }

  /**
   * Todo 생성 (enhanced 필드 포함)
   */
  async createTodo(userId: string, data: CreateTodoRequest): Promise<Todo> {
    return await this.drizzleService.createTodo(userId, data)
  }

  /**
   * Todo 조회
   */
  async getTodoById(userId: string, id: string): Promise<Todo> {
    const todo = await this.drizzleService.getTodoById(userId, id)
    if (!todo) {
      throw new Error('Todo를 찾을 수 없습니다')
    }
    return todo
  }

  /**
   * Todo 업데이트 (enhanced 필드 포함)
   */
  async updateTodo(userId: string, id: string, data: UpdateTodoRequest): Promise<Todo> {
    const updatedTodo = await this.drizzleService.updateTodo(userId, id, data)
    if (!updatedTodo) {
      throw new Error('Todo를 찾을 수 없습니다')
    }
    return updatedTodo
  }

  /**
   * Todo 삭제
   */
  async deleteTodo(userId: string, id: string): Promise<void> {
    const deleted = await this.drizzleService.deleteTodo(userId, id)
    if (!deleted) {
      throw new Error('Todo를 찾을 수 없습니다')
    }
  }

  /**
   * Todo 완료 상태 토글
   */
  async toggleTodo(userId: string, id: string): Promise<Todo> {
    const toggledTodo = await this.drizzleService.toggleTodo(userId, id)
    if (!toggledTodo) {
      throw new Error('Todo를 찾을 수 없습니다')
    }
    return toggledTodo
  }

  /**
   * 고급 통계 정보 조회
   */
  async getStats(userId: string): Promise<TodoStatsResponse> {
    return await this.drizzleService.getStats(userId)
  }

  /**
   * 모든 Todo 삭제
   */
  async clearTodos(userId: string): Promise<void> {
    await this.drizzleService.deleteAllTodos(userId)
  }

  /**
   * 대량 업데이트 (여러 Todo를 한 번에 업데이트)
   */
  async bulkUpdate(
    userId: string,
    ids: string[],
    data: Partial<UpdateTodoRequest>
  ): Promise<Todo[]> {
    const updatedTodos: Todo[] = []

    for (const id of ids) {
      try {
        const updatedTodo = await this.updateTodo(userId, id, data)
        updatedTodos.push(updatedTodo)
      } catch (error) {
        // 존재하지 않는 Todo 업데이트 실패는 무시하고 계속 진행
        console.warn(`Failed to update todo ${id}:`, error)
      }
    }

    return updatedTodos
  }

  /**
   * Kanban용 고급 대량 업데이트 (각 Todo마다 다른 업데이트 적용)
   */
  async advancedBulkUpdate(userId: string, updates: BulkUpdateItem[]): Promise<BulkUpdateResponse> {
    const updatedTodos: Todo[] = []
    const errors: string[] = []

    for (const update of updates) {
      try {
        const { id, ...updateData } = update
        const updatedTodo = await this.updateTodo(userId, id, updateData)
        updatedTodos.push(updatedTodo)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Todo ${update.id}: ${errorMessage}`)
        console.warn(`Failed to update todo ${update.id}:`, error)
      }
    }

    const updatedCount = updatedTodos.length
    const totalRequested = updates.length
    const failedCount = totalRequested - updatedCount

    let message: string
    if (failedCount === 0) {
      message = `${updatedCount}개의 Todo가 성공적으로 업데이트되었습니다`
    } else {
      message = `${updatedCount}개의 Todo가 업데이트되었습니다 (${failedCount}개 실패)`
    }

    return {
      success: failedCount === 0,
      updatedTodos,
      updatedCount,
      message,
    }
  }

  /**
   * 특정 태그로 Todo 조회 (현재 미지원)
   */
  async getTodosByTag(userId: string, tag: string): Promise<Todo[]> {
    // Drizzle 서비스에서 태그 기능이 아직 구현되지 않음
    return []
  }

  /**
   * 사용된 모든 태그 목록 조회 (현재 미지원)
   */
  async getAllTags(userId: string): Promise<string[]> {
    // Drizzle 서비스에서 태그 기능이 아직 구현되지 않음
    return []
  }
}
