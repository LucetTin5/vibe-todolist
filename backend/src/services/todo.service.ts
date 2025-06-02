import type {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoFilter,
  TodoQueryParams,
  TodoListResponse,
  TodoResponse,
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
  async createTodo(data: CreateTodoRequest): Promise<TodoResponse> {
    try {
      // 입력 검증
      if (!data.title || data.title.trim().length === 0) {
        return {
          success: false,
          error: "제목은 필수입니다.",
        };
      }

      if (data.title.length > 200) {
        return {
          success: false,
          error: "제목은 200자를 초과할 수 없습니다.",
        };
      }

      if (data.description && data.description.length > 1000) {
        return {
          success: false,
          error: "설명은 1000자를 초과할 수 없습니다.",
        };
      }

      const todo = await this.todoRepository.create({
        title: data.title.trim(),
        description: data.description?.trim(),
      });

      return {
        success: true,
        data: todo,
        message: "Todo가 성공적으로 생성되었습니다.",
      };
    } catch (error) {
      return {
        success: false,
        error: "Todo 생성 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * Todo 목록 조회 (페이지네이션, 필터링, 검색 지원)
   */
  async getTodos(params: TodoQueryParams): Promise<TodoListResponse> {
    try {
      // 기본값 설정
      const pagination = {
        page: Math.max(1, params.page || 1),
        limit: Math.min(50, Math.max(1, params.limit || 10)),
      };

      const filter = params.filter || "all";
      const search = params.search?.trim();

      const { todos, total } = await this.todoRepository.findMany(
        pagination,
        filter,
        search
      );

      const totalPages = Math.ceil(total / pagination.limit);

      return {
        success: true,
        data: {
          todos,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total,
            totalPages,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        data: {
          todos: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        },
        error: "Todo 목록 조회 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * ID로 Todo 조회
   */
  async getTodoById(id: string): Promise<TodoResponse> {
    try {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error: "유효하지 않은 Todo ID입니다.",
        };
      }

      const todo = await this.todoRepository.findById(id);

      if (!todo) {
        return {
          success: false,
          error: "해당 Todo를 찾을 수 없습니다.",
        };
      }

      return {
        success: true,
        data: todo,
      };
    } catch (error) {
      return {
        success: false,
        error: "Todo 조회 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * Todo 업데이트
   */
  async updateTodo(id: string, data: UpdateTodoRequest): Promise<TodoResponse> {
    try {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error: "유효하지 않은 Todo ID입니다.",
        };
      }

      // 입력 검증
      if (data.title !== undefined) {
        if (!data.title || data.title.trim().length === 0) {
          return {
            success: false,
            error: "제목은 필수입니다.",
          };
        }

        if (data.title.length > 200) {
          return {
            success: false,
            error: "제목은 200자를 초과할 수 없습니다.",
          };
        }
      }

      if (data.description !== undefined && data.description.length > 1000) {
        return {
          success: false,
          error: "설명은 1000자를 초과할 수 없습니다.",
        };
      }

      // Todo 존재 확인
      const exists = await this.todoRepository.exists(id);
      if (!exists) {
        return {
          success: false,
          error: "해당 Todo를 찾을 수 없습니다.",
        };
      }

      // 업데이트 데이터 정리
      const updateData: UpdateTodoRequest = {};
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
        return {
          success: false,
          error: "Todo 업데이트에 실패했습니다.",
        };
      }

      return {
        success: true,
        data: updatedTodo,
        message: "Todo가 성공적으로 업데이트되었습니다.",
      };
    } catch (error) {
      return {
        success: false,
        error: "Todo 업데이트 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * Todo 삭제
   */
  async deleteTodo(id: string): Promise<TodoResponse> {
    try {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error: "유효하지 않은 Todo ID입니다.",
        };
      }

      // Todo 존재 확인
      const exists = await this.todoRepository.exists(id);
      if (!exists) {
        return {
          success: false,
          error: "해당 Todo를 찾을 수 없습니다.",
        };
      }

      const deleted = await this.todoRepository.delete(id);

      if (!deleted) {
        return {
          success: false,
          error: "Todo 삭제에 실패했습니다.",
        };
      }

      return {
        success: true,
        message: "Todo가 성공적으로 삭제되었습니다.",
      };
    } catch (error) {
      return {
        success: false,
        error: "Todo 삭제 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * Todo 통계 조회
   */
  async getTodoStats() {
    try {
      const stats = await this.todoRepository.getStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: "통계 조회 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * 개발용: 모든 Todo 삭제
   */
  async clearAllTodos(): Promise<TodoResponse> {
    try {
      await this.todoRepository.clear();
      return {
        success: true,
        message: "모든 Todo가 삭제되었습니다.",
      };
    } catch (error) {
      return {
        success: false,
        error: "Todo 전체 삭제 중 오류가 발생했습니다.",
      };
    }
  }
}
