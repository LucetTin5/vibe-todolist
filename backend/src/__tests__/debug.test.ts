import { describe, test, expect, beforeEach } from "bun:test";
import { TodoService } from "../services/todo.service";
import { InMemoryStorage } from "../utils/in-memory-storage";

describe("Debug TodoService", () => {
  let service: TodoService;
  let storage: InMemoryStorage;

  beforeEach(() => {
    service = new TodoService();
    storage = InMemoryStorage.getInstance();
    storage.clear();
  });

  test("간단한 Todo 생성 및 조회 테스트", async () => {
    console.log("1. 초기 상태 확인");
    const initialTodos = await service.getTodos({ page: 1, limit: 10 });
    console.log("초기 Todo 개수:", initialTodos.total);

    console.log("2. Todo 생성");
    const created = await service.createTodo({
      title: "Test Todo",
      priority: "high",
      category: "work",
    });
    console.log("생성된 Todo:", created);

    console.log("3. 생성 후 조회");
    const afterCreate = await service.getTodos({ page: 1, limit: 10 });
    console.log("생성 후 Todo 개수:", afterCreate.total);
    console.log("조회된 Todos:", afterCreate.todos);

    console.log("4. Storage 직접 확인");
    console.log("Storage count:", storage.count());

    expect(afterCreate.total).toBe(1);
    expect(afterCreate.todos).toHaveLength(1);
  });

  test("다중 Todo 생성 및 필터링 테스트", async () => {
    console.log("===== 다중 Todo 테스트 시작 =====");

    const testTodos = [
      {
        title: "High Priority Task",
        priority: "high" as const,
        category: "work" as const,
      },
      {
        title: "Medium Priority Task",
        priority: "medium" as const,
        category: "personal" as const,
      },
      {
        title: "Low Priority Task",
        priority: "low" as const,
        category: "work" as const,
      },
    ];

    console.log("1. 다중 Todo 생성");
    for (const todoData of testTodos) {
      const created = await service.createTodo(todoData);
      console.log(`생성됨: ${created.title} (${created.priority})`);
    }

    console.log("2. 전체 조회");
    const allTodos = await service.getTodos({ page: 1, limit: 10 });
    console.log(`전체 Todo 개수: ${allTodos.total}`);
    console.log(
      "조회된 Todo들:",
      allTodos.todos.map((t) => `${t.title} (${t.priority})`)
    );

    console.log("3. 우선순위 필터링 테스트");
    const highTodos = await service.getTodos(
      { page: 1, limit: 10 },
      "all",
      undefined,
      "high"
    );
    console.log(`High 우선순위 Todo 개수: ${highTodos.total}`);
    console.log(
      "High Todo들:",
      highTodos.todos.map((t) => `${t.title} (${t.priority})`)
    );

    expect(allTodos.total).toBe(3);
    expect(highTodos.total).toBe(1);
  });
});
