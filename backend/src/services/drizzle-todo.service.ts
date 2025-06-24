/**
 * Drizzle ORM Todo Service - 사용자별 Todo 관리
 */
import { eq, and, desc, asc, like, gte, lte, count, sql, type SQL } from 'drizzle-orm'
import { db } from '../db/connection'
import { todos, profiles } from '../db/schema'
import type { Todo as DrizzleTodo, NewTodo as DrizzleNewTodo } from '../db/schema'
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

interface PaginationOptions {
  page: number
  limit: number
}

interface FilterOptions {
  filter?: 'all' | 'active' | 'completed'
  priority?: Priority
  category?: Category
  status?: Status
  search?: string
  dueDateFrom?: Date
  dueDateTo?: Date
}

interface SortOptions {
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title' | 'order'
  sortOrder?: 'asc' | 'desc'
}

export class DrizzleTodoService {
  /**
   * Drizzle Row를 Todo 스키마로 변환
   */
  private mapRowToTodo(row: DrizzleTodo): Todo {
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      description: row.description || undefined,
      completed: row.status === 'completed',
      priority: row.priority,
      category: row.category,
      status:
        row.status === 'completed' ? 'done' : row.status === 'in_progress' ? 'in-progress' : 'todo',
      order: row.orderIndex || 0,
      dueDate: row.dueDate?.toISOString(),
      tags: [], // 나중에 구현
      estimatedMinutes: undefined, // 나중에 구현
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }

  /**
   * CreateTodoRequest를 Drizzle Insert로 변환
   */
  private mapCreateRequestToInsert(userId: string, data: CreateTodoRequest): DrizzleNewTodo {
    return {
      userId,
      title: data.title,
      description: data.description || null,
      priority: data.priority || 'medium',
      category: data.category || 'other',
      status:
        'completed' in data && data.completed
          ? 'completed'
          : data.status === 'in-progress'
            ? 'in_progress'
            : data.status === 'done'
              ? 'completed'
              : 'pending',
      orderIndex: data.order || 0,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    }
  }

  /**
   * 사용자별 Todo 목록 조회 (페이징, 필터링, 정렬)
   */
  async getTodos(
    userId: string,
    pagination: PaginationOptions = { page: 1, limit: 10 },
    filters: FilterOptions = {},
    sort: SortOptions = {}
  ): Promise<TodoListResponse> {
    const { page, limit } = pagination
    const { filter, priority, category, status, search, dueDateFrom, dueDateTo } = filters
    const { sortBy = 'createdAt', sortOrder = 'desc' } = sort

    // WHERE 조건 구성
    const conditions = [eq(todos.userId, userId)]

    // 필터 조건 추가
    if (filter === 'active') {
      conditions.push(eq(todos.status, 'pending'))
    } else if (filter === 'completed') {
      conditions.push(eq(todos.status, 'completed'))
    }

    if (priority) {
      conditions.push(eq(todos.priority, priority))
    }

    if (category) {
      conditions.push(eq(todos.category, category))
    }

    if (status) {
      const dbStatus =
        status === 'done' ? 'completed' : status === 'in-progress' ? 'in_progress' : 'pending'
      conditions.push(eq(todos.status, dbStatus))
    }

    if (search) {
      conditions.push(
        sql`(${todos.title} ILIKE ${`%${search}%`} OR ${todos.description} ILIKE ${`%${search}%`})`
      )
    }

    if (dueDateFrom) {
      conditions.push(gte(todos.dueDate, dueDateFrom))
    }

    if (dueDateTo) {
      conditions.push(lte(todos.dueDate, dueDateTo))
    }

    // 정렬 기준
    let orderBy: SQL
    if (sortBy === 'createdAt') {
      orderBy = sortOrder === 'asc' ? asc(todos.createdAt) : desc(todos.createdAt)
    } else if (sortBy === 'updatedAt') {
      orderBy = sortOrder === 'asc' ? asc(todos.updatedAt) : desc(todos.updatedAt)
    } else if (sortBy === 'dueDate') {
      orderBy = sortOrder === 'asc' ? asc(todos.dueDate) : desc(todos.dueDate)
    } else if (sortBy === 'priority') {
      orderBy = sortOrder === 'asc' ? asc(todos.priority) : desc(todos.priority)
    } else if (sortBy === 'title') {
      orderBy = sortOrder === 'asc' ? asc(todos.title) : desc(todos.title)
    } else if (sortBy === 'order') {
      orderBy = sortOrder === 'asc' ? asc(todos.orderIndex) : desc(todos.orderIndex)
    } else {
      orderBy = sortOrder === 'asc' ? asc(todos.createdAt) : desc(todos.createdAt)
    }

    // 전체 개수 조회
    const [totalResult] = await db
      .select({ count: count() })
      .from(todos)
      .where(and(...conditions))

    const total = totalResult.count

    // 페이징된 결과 조회
    const offset = (page - 1) * limit
    const rows = await db
      .select()
      .from(todos)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)

    const todoList = rows.map((row) => this.mapRowToTodo(row))

    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return {
      todos: todoList,
      total,
      currentPage: page,
      totalPages,
      hasNext,
      hasPrev,
    }
  }

  /**
   * 개별 Todo 조회
   */
  async getTodoById(userId: string, id: string): Promise<Todo | null> {
    const [row] = await db
      .select()
      .from(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .limit(1)

    return row ? this.mapRowToTodo(row) : null
  }

  /**
   * Todo 생성
   */
  async createTodo(userId: string, data: CreateTodoRequest): Promise<Todo> {
    const insertData = this.mapCreateRequestToInsert(userId, data)

    const [newTodo] = await db.insert(todos).values(insertData).returning()

    return this.mapRowToTodo(newTodo)
  }

  /**
   * Todo 업데이트
   */
  async updateTodo(userId: string, id: string, data: UpdateTodoRequest): Promise<Todo | null> {
    const updateData: Partial<DrizzleNewTodo> = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.category !== undefined) updateData.category = data.category
    if ('completed' in data && data.completed !== undefined)
      updateData.status = data.completed ? 'completed' : 'pending'
    if (data.status !== undefined) {
      // Kanban status를 DB status로 변환
      updateData.status =
        data.status === 'done'
          ? 'completed'
          : data.status === 'in-progress'
            ? 'in_progress'
            : 'pending'
    }
    if (data.order !== undefined) updateData.orderIndex = data.order
    if (data.dueDate !== undefined)
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null

    const [updatedTodo] = await db
      .update(todos)
      .set(updateData)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning()

    return updatedTodo ? this.mapRowToTodo(updatedTodo) : null
  }

  /**
   * Todo 삭제
   */
  async deleteTodo(userId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning({ id: todos.id })

    return result.length > 0
  }

  /**
   * Todo 완료 상태 토글
   */
  async toggleTodo(userId: string, id: string): Promise<Todo | null> {
    // 현재 상태 조회
    const [currentTodo] = await db
      .select()
      .from(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .limit(1)

    if (!currentTodo) return null

    // 상태 토글
    const newStatus = currentTodo.status === 'completed' ? 'pending' : 'completed'

    const [updatedTodo] = await db
      .update(todos)
      .set({ status: newStatus })
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning()

    return this.mapRowToTodo(updatedTodo)
  }

  /**
   * Todo 통계 조회
   */
  async getStats(userId: string): Promise<TodoStatsResponse> {
    try {
      // 기본 통계
      const [totalResult] = await db
        .select({ count: count() })
        .from(todos)
        .where(eq(todos.userId, userId))

      const [completedResult] = await db
        .select({ count: count() })
        .from(todos)
        .where(and(eq(todos.userId, userId), eq(todos.status, 'completed')))

      const total = totalResult.count
      const completed = completedResult.count
      const active = total - completed
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

      // 우선순위별 통계
      const priorityStats = await db
        .select({
          priority: todos.priority,
          count: count(),
        })
        .from(todos)
        .where(eq(todos.userId, userId))
        .groupBy(todos.priority)

      const byPriority = {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
      }

      for (const stat of priorityStats) {
        byPriority[stat.priority] = stat.count
      }

      // 카테고리별 통계
      const categoryStats = await db
        .select({
          category: todos.category,
          count: count(),
        })
        .from(todos)
        .where(eq(todos.userId, userId))
        .groupBy(todos.category)

      const byCategory = {
        work: 0,
        personal: 0,
        shopping: 0,
        health: 0,
        other: 0,
      }

      for (const stat of categoryStats) {
        byCategory[stat.category] = stat.count
      }

      // 마감일 관련 통계
      let overdueCount = 0
      let dueTodayCount = 0
      let dueThisWeekCount = 0

      try {
        // ISO 문자열로 변환하여 안전하게 날짜 비교
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1)
        const weekFromNow = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000)

        // 마감일이 지난 Todo 개수
        const [overdueResult] = await db
          .select({ count: count() })
          .from(todos)
          .where(
            and(
              eq(todos.userId, userId),
              eq(todos.status, 'pending'),
              sql`${todos.dueDate} IS NOT NULL`,
              sql`${todos.dueDate} < ${todayStart.toISOString()}`
            )
          )
        overdueCount = overdueResult.count

        // 오늘 마감인 Todo 개수
        const [dueTodayResult] = await db
          .select({ count: count() })
          .from(todos)
          .where(
            and(
              eq(todos.userId, userId),
              eq(todos.status, 'pending'),
              sql`${todos.dueDate} IS NOT NULL`,
              sql`${todos.dueDate} >= ${todayStart.toISOString()}`,
              sql`${todos.dueDate} < ${todayEnd.toISOString()}`
            )
          )
        dueTodayCount = dueTodayResult.count

        // 이번 주 마감인 Todo 개수 (오늘 포함)
        const [dueThisWeekResult] = await db
          .select({ count: count() })
          .from(todos)
          .where(
            and(
              eq(todos.userId, userId),
              eq(todos.status, 'pending'),
              sql`${todos.dueDate} IS NOT NULL`,
              sql`${todos.dueDate} >= ${todayStart.toISOString()}`,
              sql`${todos.dueDate} < ${weekFromNow.toISOString()}`
            )
          )
        dueThisWeekCount = dueThisWeekResult.count
      } catch (dateError) {
        console.warn('Error calculating due date stats, using defaults:', dateError)
        // 에러 시 기본값 0 사용
      }

      return {
        total,
        completed,
        active,
        completionRate,
        byPriority,
        byCategory,
        overdue: overdueCount,
        dueToday: dueTodayCount,
        dueThisWeek: dueThisWeekCount,
      }
    } catch (error) {
      console.error('Error in getStats:', error)
      throw error
    }
  }

  /**
   * 모든 Todo 삭제 (사용자별)
   */
  async deleteAllTodos(userId: string): Promise<number> {
    const result = await db
      .delete(todos)
      .where(eq(todos.userId, userId))
      .returning({ id: todos.id })

    return result.length
  }
}
