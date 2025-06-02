import type {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoFilter,
  TodoQueryParams,
  TodoListResponse,
  TodoStats,
} from "../types/todo.types";
import { TodoRepository } from "../repositories/todo.repository";

/**
 * Todo 비즈니스 로직 레이어
 * 비즈니스 규칙과 검증을 담당
 */
export class TodoService {
  private todoRepository: TodoRepository;

  constructor() {
    this.todoRepository = new TodoRepository();
  }

  /**
   * 새 Todo 생성
   */
  async createTodo(data: CreateTodoRequest): Promise<Todo> {
    // 입력 검증
    if (!data.title || data.title.trim().length === 0) {
      throw new Error("제목은 필수입니다");
    }

    if (data.title.length > 200) {
      throw new Error("제목은 200자를 초과할 수 없습니다");
    }

    if (data.description && data.description.length > 1000) {
      throw new Error("설명은 1000자를 초과할 수 없습니다");
    }

    const todo = await this.todoRepository.create({
      title: data.title.trim(),
      description: data.description?.trim(),
    });

    return todo;
  }

  /**
   * Todo 목록 조회 (페이지네이션, 필터링, 검색 지원)
   */
  async getTodos(
    params: TodoQueryParams,
    filter: TodoFilter = "all",
    search?: string
  ): Promise<TodoListResponse> {
    // 입력 검증
    if (params.page <= 0) {
      throw new Error("페이지 번호는 1 이상이어야 합니다");
    }

    if (params.limit <= 0) {
      throw new Error("페이지 크기는 1 이상이어야 합니다");
    }

    if (params.limit > 100) {
      throw new Error("페이지 크기는 100 이하여야 합니다");
    }

    // 기본값 설정
    const pagination = {
      page: Math.max(1, params.page || 1),
      limit: Math.min(50, Math.max(1, params.limit || 10)),
    };

    const searchQuery = search?.trim();

    const result = await this.todoRepository.findMany(
      pagination,
      filter,
      searchQuery
    );

    const { todos, total } = result;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      todos,
      total,
      currentPage: pagination.page,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    };
  }

  /**
   * ID로 Todo 조회
   */
  async getTodoById(id: string): Promise<Todo> {
    if (!id || id.trim().length === 0) {
      throw new Error("유효하지 않은 Todo ID입니다");
    }

    const todo = await this.todoRepository.findById(id);

    if (!todo) {
      throw new Error("Todo를 찾을 수 없습니다");
    }

    return todo;
  }

  /**
   * Todo 업데이트
   */
  async updateTodo(id: string, data: UpdateTodoRequest): Promise<Todo> {
    if (!id || id.trim().length === 0) {
      throw new Error("유효하지 않은 Todo ID입니다");
    }

    // 입력 검증
    if (data.title !== undefined) {
      if (!data.title || data.title.trim().length === 0) {
        throw new Error("제목은 필수입니다");
      }

      if (data.title.length > 200) {
        throw new Error("제목은 200자를 초과할 수 없습니다");
      }
    }

    if (data.description !== undefined && data.description.length > 1000) {
      throw new Error("설명은 1000자를 초과할 수 없습니다");
    }

    // 존재 여부 확인
    const exists = await this.todoRepository.exists(id);
    if (!exists) {
      throw new Error("Todo를 찾을 수 없습니다");
    }

    // 업데이트 데이터 준비
    const updateData: Partial<Todo> = {};

    if (data.title !== undefined) {
      updateData.title = data.title.trim();
    }
    if (data.description !== undefined) {
      updateData.description = data.description.trim();
    }
    if (data.completed !== undefined) {
      updateData.completed = data.completed;
    }

    const updatedTodo = await this.todoRepository.update(id, updateData);

    if (!updatedTodo) {
      throw new Error("Todo 업데이트에 실패했습니다");
    }

    return updatedTodo;
  }

  /**
   * Todo 삭제
   */
  async deleteTodo(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error("유효하지 않은 Todo ID입니다");
    }

    const exists = await this.todoRepository.exists(id);
    if (!exists) {
      throw new Error("Todo를 찾을 수 없습니다");
    }

    const deleted = await this.todoRepository.delete(id);

    if (!deleted) {
      throw new Error("Todo 삭제에 실패했습니다");
    }
  }

  /**
   * Todo 완료 상태 토글
   */
  async toggleTodo(id: string): Promise<Todo> {
    if (!id || id.trim().length === 0) {
      throw new Error("유효하지 않은 Todo ID입니다");
    }

    const todo = await this.todoRepository.findById(id);
    if (!todo) {
      throw new Error("Todo를 찾을 수 없습니다");
    }

    const updatedTodo = await this.todoRepository.update(id, {
      completed: !todo.completed,
    });

    if (!updatedTodo) {
      throw new Error("Todo 토글에 실패했습니다");
    }

    return updatedTodo;
  }

  /**
   * Todo 통계 조회
   */
  async getStats(): Promise<TodoStats> {
    const stats = await this.todoRepository.getStats();

    // 완료율 계산 (0-100 사이의 백분율)
    const completionRate =
      stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    return {
      ...stats,
      completionRate,
    };
  }

  /**
   * 개발용: 모든 Todo 삭제
   */
  async clearTodos(): Promise<void> {
    await this.todoRepository.clear();
  }
}
