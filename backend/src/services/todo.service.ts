/**
 * Enhanced Todo Service - 고급 기능 포함
 */
import { InMemoryStorage } from "../utils/in-memory-storage";
import type {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoListResponse,
  TodoStatsResponse,
  TodoQuery,
  Priority,
  Category,
} from "../schemas/todo.schemas";

interface PaginationOptions {
  page: number;
  limit: number;
}

export class TodoService {
  private storage = InMemoryStorage.getInstance();

  /**
   * 고급 필터링 및 정렬 기능이 포함된 Todo 목록 조회
   */
  async getTodos(
    pagination: PaginationOptions,
    filter: "all" | "active" | "completed" = "all",
    search?: string,
    priority?: Priority,
    category?: Category,
    sortBy:
      | "createdAt"
      | "updatedAt"
      | "dueDate"
      | "priority"
      | "title" = "createdAt",
    sortOrder: "asc" | "desc" = "desc",
    dueDateFrom?: string,
    dueDateTo?: string
  ): Promise<TodoListResponse> {
    if (pagination.page <= 0) {
      throw new Error("페이지 번호는 1 이상이어야 합니다");
    }
    if (pagination.limit <= 0 || pagination.limit > 100) {
      throw new Error("페이지 크기는 1-100 사이여야 합니다");
    }

    let todos = await this.storage.findAll<Todo>();

    // 상태 필터링
    if (filter === "active") {
      todos = todos.filter((todo) => !todo.completed);
    } else if (filter === "completed") {
      todos = todos.filter((todo) => todo.completed);
    }

    // 검색 필터링
    if (search) {
      const searchLower = search.toLowerCase();
      todos = todos.filter(
        (todo) =>
          todo.title.toLowerCase().includes(searchLower) ||
          todo.description?.toLowerCase().includes(searchLower) ||
          todo.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // 우선순위 필터링
    if (priority) {
      todos = todos.filter((todo) => todo.priority === priority);
    }

    // 카테고리 필터링
    if (category) {
      todos = todos.filter((todo) => todo.category === category);
    }

    // 마감일 범위 필터링
    if (dueDateFrom || dueDateTo) {
      todos = todos.filter((todo) => {
        if (!todo.dueDate) return false;

        const dueDate = new Date(todo.dueDate);

        if (dueDateFrom) {
          const fromDate = new Date(dueDateFrom);
          if (dueDate < fromDate) return false;
        }

        if (dueDateTo) {
          const toDate = new Date(dueDateTo);
          if (dueDate > toDate) return false;
        }

        return true;
      });
    }

    // 정렬
    todos.sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "priority": {
          const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        }
        case "dueDate":
          aValue = a.dueDate ? new Date(a.dueDate) : new Date(0);
          bValue = b.dueDate ? new Date(b.dueDate) : new Date(0);
          break;
        case "updatedAt":
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    // 페이지네이션 적용
    const total = todos.length;
    const totalPages = Math.ceil(total / pagination.limit);
    const currentPage = pagination.page;
    const startIndex = (currentPage - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;

    const paginatedTodos = todos.slice(startIndex, endIndex);

    return {
      todos: paginatedTodos,
      total,
      currentPage,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
    };
  }

  /**
   * Todo 생성 (enhanced 필드 포함)
   */
  async createTodo(data: CreateTodoRequest): Promise<Todo> {
    const now = new Date();

    const todo: Todo = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      completed: false,
      priority: data.priority || "medium",
      category: data.category || "other",
      dueDate: data.dueDate,
      tags: data.tags || [],
      estimatedMinutes: data.estimatedMinutes,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await this.storage.create(todo.id, todo);
    return todo;
  }

  /**
   * Todo 조회
   */
  async getTodoById(id: string): Promise<Todo> {
    const todo = await this.storage.findById<Todo>(id);
    if (!todo) {
      throw new Error("Todo를 찾을 수 없습니다");
    }
    return todo;
  }

  /**
   * Todo 업데이트 (enhanced 필드 포함)
   */
  async updateTodo(id: string, data: UpdateTodoRequest): Promise<Todo> {
    const existingTodo = await this.getTodoById(id);

    // 업데이트 시간이 생성 시간과 다르도록 약간의 지연 추가
    await new Promise((resolve) => setTimeout(resolve, 1));

    const updatedTodo: Todo = {
      ...existingTodo,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await this.storage.update(id, updatedTodo);
    return updatedTodo;
  }

  /**
   * Todo 삭제
   */
  async deleteTodo(id: string): Promise<void> {
    const exists = await this.storage.findById<Todo>(id);
    if (!exists) {
      throw new Error("Todo를 찾을 수 없습니다");
    }
    await this.storage.delete(id);
  }

  /**
   * Todo 완료 상태 토글
   */
  async toggleTodo(id: string): Promise<Todo> {
    const todo = await this.getTodoById(id);
    return this.updateTodo(id, { completed: !todo.completed });
  }

  /**
   * 고급 통계 정보 조회
   */
  async getStats(): Promise<TodoStatsResponse> {
    const todos = await this.storage.findAll<Todo>();

    const total = todos.length;
    const completed = todos.filter((todo) => todo.completed).length;
    const active = total - completed;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    // 우선순위별 통계
    const byPriority = {
      low: todos.filter((todo) => todo.priority === "low").length,
      medium: todos.filter((todo) => todo.priority === "medium").length,
      high: todos.filter((todo) => todo.priority === "high").length,
      urgent: todos.filter((todo) => todo.priority === "urgent").length,
    };

    // 카테고리별 통계
    const byCategory = {
      work: todos.filter((todo) => todo.category === "work").length,
      personal: todos.filter((todo) => todo.category === "personal").length,
      shopping: todos.filter((todo) => todo.category === "shopping").length,
      health: todos.filter((todo) => todo.category === "health").length,
      other: todos.filter((todo) => todo.category === "other").length,
    };

    // 마감일 관련 통계 (KST 기준)
    const now = new Date();
    
    // KST 기준으로 오늘 날짜 범위 계산
    const startOfTodayUTC = new Date(now);
    startOfTodayUTC.setUTCHours(-9, 0, 0, 0); // KST 00:00 = UTC 15:00 (전날)
    
    const endOfTodayUTC = new Date(now);
    endOfTodayUTC.setUTCDate(endOfTodayUTC.getUTCDate() + 1); // 다음날
    endOfTodayUTC.setUTCHours(14, 59, 59, 999); // KST 23:59 = UTC 14:59 (다음날)
    
    const endOfWeekUTC = new Date(startOfTodayUTC);
    endOfWeekUTC.setUTCDate(endOfWeekUTC.getUTCDate() + 6);
    endOfWeekUTC.setUTCHours(14, 59, 59, 999);

    const overdue = todos.filter((todo) => {
      if (!todo.dueDate || todo.completed) return false;
      const dueDate = new Date(todo.dueDate);
      return dueDate < startOfTodayUTC;
    }).length;

    const dueToday = todos.filter((todo) => {
      if (!todo.dueDate || todo.completed) return false;
      const dueDate = new Date(todo.dueDate);
      return dueDate >= startOfTodayUTC && dueDate <= endOfTodayUTC;
    }).length;

    const dueThisWeek = todos.filter((todo) => {
      if (!todo.dueDate || todo.completed) return false;
      const dueDate = new Date(todo.dueDate);
      return dueDate >= startOfTodayUTC && dueDate <= endOfWeekUTC;
    }).length;

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
    };
  }

  /**
   * 모든 Todo 삭제
   */
  async clearTodos(): Promise<void> {
    await this.storage.clear();
  }

  /**
   * 대량 업데이트 (여러 Todo를 한 번에 업데이트)
   */
  async bulkUpdate(
    ids: string[],
    data: Partial<UpdateTodoRequest>
  ): Promise<Todo[]> {
    const updatedTodos: Todo[] = [];

    for (const id of ids) {
      try {
        const updatedTodo = await this.updateTodo(id, data);
        updatedTodos.push(updatedTodo);
      } catch (error) {
        // 존재하지 않는 Todo 업데이트 실패는 무시하고 계속 진행
        console.warn(`Failed to update todo ${id}:`, error);
      }
    }

    return updatedTodos;
  }

  /**
   * 특정 태그로 Todo 조회
   */
  async getTodosByTag(tag: string): Promise<Todo[]> {
    const todos = await this.storage.findAll<Todo>();
    return todos.filter((todo) =>
      todo.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
    );
  }

  /**
   * 사용된 모든 태그 목록 조회
   */
  async getAllTags(): Promise<string[]> {
    const todos = await this.storage.findAll<Todo>();
    const allTags = todos.flatMap((todo) => todo.tags);
    return [...new Set(allTags)].sort();
  }
}
