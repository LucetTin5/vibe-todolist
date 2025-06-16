/**
 * Supabase Todo Service - 사용자별 Todo 관리
 */
import { supabaseAdmin } from '../lib/supabase'
import type { Database } from '../lib/supabase'
import type {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoListResponse,
  TodoStatsResponse,
  Priority,
  Category,
  Status,
} from '../schemas/todo.schemas'

type TodoRow = Database['public']['Tables']['todos']['Row']
type TodoInsert = Database['public']['Tables']['todos']['Insert']
type TodoUpdate = Database['public']['Tables']['todos']['Update']

interface PaginationOptions {
  page: number
  limit: number
}

export class SupabaseTodoService {
  /**
   * DB Row를 Todo 스키마로 변환
   */
  private mapRowToTodo(row: TodoRow): Todo {
    return {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      completed: row.status === 'completed',
      priority: row.priority,
      category: row.category,
      status: row.status === 'completed' ? 'done' : 'todo', // status 매핑
      order: 0, // DB에 없는 필드는 기본값
      dueDate: row.due_date || undefined,
      tags: [], // DB에 없는 필드는 기본값
      estimatedMinutes: undefined, // DB에 없는 필드는 기본값
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  /**
   * Todo 스키마를 DB Insert로 변환
   */
  private mapTodoToInsert(userId: string, data: CreateTodoRequest): TodoInsert {
    return {
      user_id: userId,
      title: data.title,
      description: data.description || null,
      priority: data.priority || 'medium',
      category: data.category || 'other',
      status: 'completed' in data && data.completed ? 'completed' : 'pending',
      due_date: data.dueDate || null,
    }
  }

  /**
   * Todo 스키마를 DB Update로 변환
   */
  private mapTodoToUpdate(data: UpdateTodoRequest): TodoUpdate {
    const update: TodoUpdate = {}

    if (data.title !== undefined) update.title = data.title
    if (data.description !== undefined) update.description = data.description || null
    if (data.priority !== undefined) update.priority = data.priority
    if (data.category !== undefined) update.category = data.category
    if ('completed' in data && data.completed !== undefined)
      update.status = data.completed ? 'completed' : 'pending'
    if (data.dueDate !== undefined) update.due_date = data.dueDate || null

    return update
  }

  /**
   * 사용자별 Todo 목록 조회
   */
  async getTodos(
    userId: string,
    pagination: PaginationOptions,
    filter: 'all' | 'active' | 'completed' = 'all',
    search?: string,
    priority?: Priority,
    category?: Category,
    status?: Status,
    sortBy: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title' = 'createdAt',
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

    let query = supabaseAdmin.from('todos').select('*', { count: 'exact' }).eq('user_id', userId)

    // 상태 필터링
    if (filter === 'active') {
      query = query.eq('status', 'pending')
    } else if (filter === 'completed') {
      query = query.eq('status', 'completed')
    }

    // 검색 필터링 (제목에서만 검색 - 추후 전문 검색으로 확장 가능)
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    // 우선순위 필터링
    if (priority) {
      query = query.eq('priority', priority)
    }

    // 카테고리 필터링
    if (category) {
      query = query.eq('category', category)
    }

    // 마감일 범위 필터링
    if (dueDateFrom) {
      query = query.gte('due_date', dueDateFrom)
    }
    if (dueDateTo) {
      query = query.lte('due_date', dueDateTo)
    }

    // 정렬
    const orderColumn =
      sortBy === 'createdAt'
        ? 'created_at'
        : sortBy === 'updatedAt'
          ? 'updated_at'
          : sortBy === 'dueDate'
            ? 'due_date'
            : sortBy

    query = query.order(orderColumn, { ascending: sortOrder === 'asc' })

    // 페이지네이션
    const startIndex = (pagination.page - 1) * pagination.limit
    query = query.range(startIndex, startIndex + pagination.limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      throw new Error('Todo 목록 조회에 실패했습니다')
    }

    const todos = (data || []).map((row) => this.mapRowToTodo(row))
    const total = count || 0
    const totalPages = Math.ceil(total / pagination.limit)
    const currentPage = pagination.page

    return {
      todos,
      total,
      currentPage,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
    }
  }

  /**
   * Todo 생성
   */
  async createTodo(userId: string, data: CreateTodoRequest): Promise<Todo> {
    const insertData = this.mapTodoToInsert(userId, data)

    const { data: result, error } = await supabaseAdmin
      .from('todos')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Todo 생성에 실패했습니다')
    }

    return this.mapRowToTodo(result)
  }

  /**
   * Todo 조회
   */
  async getTodoById(userId: string, id: string): Promise<Todo> {
    const { data, error } = await supabaseAdmin
      .from('todos')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        throw new Error('Todo를 찾을 수 없습니다')
      }
      console.error('Database error:', error)
      throw new Error('Todo 조회에 실패했습니다')
    }

    return this.mapRowToTodo(data)
  }

  /**
   * Todo 업데이트
   */
  async updateTodo(userId: string, id: string, data: UpdateTodoRequest): Promise<Todo> {
    const updateData = this.mapTodoToUpdate(data)

    const { data: result, error } = await supabaseAdmin
      .from('todos')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        throw new Error('Todo를 찾을 수 없습니다')
      }
      console.error('Database error:', error)
      throw new Error('Todo 업데이트에 실패했습니다')
    }

    return this.mapRowToTodo(result)
  }

  /**
   * Todo 삭제
   */
  async deleteTodo(userId: string, id: string): Promise<void> {
    const { error } = await supabaseAdmin.from('todos').delete().eq('id', id).eq('user_id', userId)

    if (error) {
      console.error('Database error:', error)
      throw new Error('Todo 삭제에 실패했습니다')
    }
  }

  /**
   * Todo 완료 상태 토글
   */
  async toggleTodo(userId: string, id: string): Promise<Todo> {
    // 먼저 현재 상태를 조회
    const currentTodo = await this.getTodoById(userId, id)

    // 상태 토글
    return this.updateTodo(userId, id, {
      completed: !currentTodo.completed,
    })
  }

  /**
   * 사용자별 통계 정보 조회
   */
  async getStats(userId: string): Promise<TodoStatsResponse> {
    const { data: todos, error } = await supabaseAdmin
      .from('todos')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('Database error:', error)
      throw new Error('통계 조회에 실패했습니다')
    }

    const mappedTodos = todos.map((row) => this.mapRowToTodo(row))

    const total = mappedTodos.length
    const completed = mappedTodos.filter((todo) => todo.completed).length
    const active = total - completed
    const completionRate = total > 0 ? (completed / total) * 100 : 0

    // 우선순위별 통계
    const byPriority = {
      low: mappedTodos.filter((todo) => todo.priority === 'low').length,
      medium: mappedTodos.filter((todo) => todo.priority === 'medium').length,
      high: mappedTodos.filter((todo) => todo.priority === 'high').length,
      urgent: mappedTodos.filter((todo) => todo.priority === 'urgent').length,
    }

    // 카테고리별 통계
    const byCategory = {
      work: mappedTodos.filter((todo) => todo.category === 'work').length,
      personal: mappedTodos.filter((todo) => todo.category === 'personal').length,
      shopping: mappedTodos.filter((todo) => todo.category === 'shopping').length,
      health: mappedTodos.filter((todo) => todo.category === 'health').length,
      other: mappedTodos.filter((todo) => todo.category === 'other').length,
    }

    // 마감일 관련 통계
    const now = new Date()
    const startOfTodayUTC = new Date(now)
    startOfTodayUTC.setUTCHours(-9, 0, 0, 0)

    const endOfTodayUTC = new Date(now)
    endOfTodayUTC.setUTCDate(endOfTodayUTC.getUTCDate() + 1)
    endOfTodayUTC.setUTCHours(14, 59, 59, 999)

    const endOfWeekUTC = new Date(startOfTodayUTC)
    endOfWeekUTC.setUTCDate(endOfWeekUTC.getUTCDate() + 6)
    endOfWeekUTC.setUTCHours(14, 59, 59, 999)

    const overdue = mappedTodos.filter((todo) => {
      if (!todo.dueDate || todo.completed) return false
      const dueDate = new Date(todo.dueDate)
      return dueDate < startOfTodayUTC
    }).length

    const dueToday = mappedTodos.filter((todo) => {
      if (!todo.dueDate || todo.completed) return false
      const dueDate = new Date(todo.dueDate)
      return dueDate >= startOfTodayUTC && dueDate <= endOfTodayUTC
    }).length

    const dueThisWeek = mappedTodos.filter((todo) => {
      if (!todo.dueDate || todo.completed) return false
      const dueDate = new Date(todo.dueDate)
      return dueDate >= startOfTodayUTC && dueDate <= endOfWeekUTC
    }).length

    return {
      total,
      completed,
      active,
      completionRate: Math.round(completionRate * 100) / 100,
      byPriority,
      byCategory,
      overdue,
      dueToday,
      dueThisWeek,
    }
  }

  /**
   * 사용자의 모든 Todo 삭제
   */
  async clearTodos(userId: string): Promise<void> {
    const { error } = await supabaseAdmin.from('todos').delete().eq('user_id', userId)

    if (error) {
      console.error('Database error:', error)
      throw new Error('Todo 삭제에 실패했습니다')
    }
  }
}
