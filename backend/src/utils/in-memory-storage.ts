import type { Todo } from "../types/todo.types";

/**
 * 인메모리 Todo 데이터 스토리지
 * 개발 단계에서 사용하는 임시 저장소
 */
class InMemoryStorage {
  private todos: Map<string, Todo> = new Map();
  private nextId = 1;

  /**
   * 새로운 ID 생성
   */
  generateId(): string {
    return `todo_${this.nextId++}`;
  }

  /**
   * Todo 생성
   */
  create(todoData: Omit<Todo, "id" | "createdAt" | "updatedAt">): Todo {
    // Ensure unique timestamps for proper sorting
    const now = new Date(Date.now() + this.nextId);
    const todo: Todo = {
      id: this.generateId(),
      ...todoData,
      createdAt: now,
      updatedAt: now,
    };

    this.todos.set(todo.id, todo);
    return todo;
  }

  /**
   * 모든 Todo 조회
   */
  findAll(): Todo[] {
    return Array.from(this.todos.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * ID로 Todo 조회
   */
  findById(id: string): Todo | undefined {
    return this.todos.get(id);
  }

  /**
   * Todo 업데이트
   */
  update(
    id: string,
    updates: Partial<Omit<Todo, "id" | "createdAt">>
  ): Todo | undefined {
    const todo = this.todos.get(id);
    if (!todo) {
      return undefined;
    }

    // Ensure updatedAt is always later than createdAt
    const updatedAt = new Date(
      Math.max(Date.now(), todo.createdAt.getTime() + 1)
    );

    const updatedTodo: Todo = {
      ...todo,
      ...updates,
      updatedAt,
    };

    this.todos.set(id, updatedTodo);
    return updatedTodo;
  }

  /**
   * Todo 삭제
   */
  delete(id: string): boolean {
    return this.todos.delete(id);
  }

  /**
   * 완료 상태별 필터링
   */
  findByCompleted(completed: boolean): Todo[] {
    return this.findAll().filter((todo) => todo.completed === completed);
  }

  /**
   * 제목으로 검색
   */
  search(query: string): Todo[] {
    const lowerQuery = query.toLowerCase();
    return this.findAll().filter(
      (todo) =>
        todo.title.toLowerCase().includes(lowerQuery) ||
        todo.description?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 전체 개수 조회
   */
  count(): number {
    return this.todos.size;
  }

  /**
   * 완료된 Todo 개수 조회
   */
  countCompleted(): number {
    return this.findByCompleted(true).length;
  }

  /**
   * 미완료 Todo 개수 조회
   */
  countActive(): number {
    return this.findByCompleted(false).length;
  }

  /**
   * 개발용: 모든 데이터 초기화
   */
  clear(): void {
    this.todos.clear();
    this.nextId = 1;
  }
}

// 싱글톤 인스턴스
export const todoStorage = new InMemoryStorage();
