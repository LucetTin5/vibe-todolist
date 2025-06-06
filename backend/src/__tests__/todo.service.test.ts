import { describe, test, expect, beforeEach } from "bun:test";
import { TodoService } from "../services/todo.service";
import { InMemoryStorage } from "../utils/in-memory-storage";
import type {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  Priority,
  Category,
} from "../schemas/todo.schemas";

describe("TodoService", () => {
  let service: TodoService;
  let storage: InMemoryStorage;

  beforeEach(() => {
    service = new TodoService();
    storage = InMemoryStorage.getInstance();
    storage.clear();
  });

  describe("Todo 생성 (Enhanced)", () => {
    test("유효한 데이터로 Todo를 생성할 수 있다", async () => {
      const createData: CreateTodoRequest = {
        title: "새로운 할일",
        description: "할일 설명",
        priority: "high",
        category: "work",
        dueDate: "2025-06-10T09:00:00.000Z",
        tags: ["프로젝트", "중요"],
        estimatedMinutes: 120,
      };

      const todo = await service.createTodo(createData);

      expect(todo).toBeDefined();
      expect(todo.title).toBe("새로운 할일");
      expect(todo.description).toBe("할일 설명");
      expect(todo.priority).toBe("high");
      expect(todo.category).toBe("work");
      expect(todo.dueDate).toBe("2025-06-10T09:00:00.000Z");
      expect(todo.tags).toEqual(["프로젝트", "중요"]);
      expect(todo.estimatedMinutes).toBe(120);
      expect(todo.completed).toBe(false);
      expect(todo.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      expect(new Date(todo.createdAt)).toBeInstanceOf(Date);
      expect(new Date(todo.updatedAt)).toBeInstanceOf(Date);
    });

    test("기본값으로 Todo를 생성할 수 있다", async () => {
      const createData: CreateTodoRequest = {
        title: "간단한 할일",
      };

      const todo = await service.createTodo(createData);

      expect(todo.title).toBe(createData.title);
      expect(todo.priority).toBe("medium"); // 기본값
      expect(todo.category).toBe("other"); // 기본값
      expect(todo.tags).toEqual([]); // 기본값
      expect(todo.description).toBeUndefined();
      expect(todo.dueDate).toBeUndefined();
      expect(todo.estimatedMinutes).toBeUndefined();
    });
  });

  describe("확장된 필터링 기능", () => {
    beforeEach(async () => {
      // 테스트 데이터 생성
      const testTodos: CreateTodoRequest[] = [
        {
          title: "Work Task 1",
          description: "Important project task",
          priority: "high",
          category: "work",
          tags: ["project", "important"],
          dueDate: "2025-06-15T09:00:00.000Z",
        },
        {
          title: "Personal Task 1",
          description: "Personal development",
          priority: "medium",
          category: "personal",
          tags: ["learning"],
          dueDate: "2025-06-20T10:00:00.000Z",
        },
        {
          title: "Shopping Task",
          description: "Buy groceries",
          priority: "low",
          category: "shopping",
          tags: ["shopping"],
          dueDate: "2025-06-10T08:00:00.000Z",
        },
        {
          title: "Urgent Health Task",
          description: "Doctor appointment",
          priority: "urgent",
          category: "health",
          tags: ["health", "urgent"],
          dueDate: "2025-06-08T14:00:00.000Z",
        },
        {
          title: "Other Task",
          description: "Miscellaneous task",
          priority: "medium",
          category: "other",
          tags: [],
        },
      ];

      for (const todoData of testTodos) {
        await service.createTodo(todoData);
      }

      // 일부 완료 처리 (3번째, 4번째 Todo만 완료)
      const todos = await service.getTodos({ page: 1, limit: 10 });
      await service.updateTodo(todos.todos[2].id, { completed: true }); // Shopping Task
      await service.updateTodo(todos.todos[3].id, { completed: true }); // Urgent Health Task
    });

    test("우선순위로 필터링할 수 있다", async () => {
      const highPriorityResult = await service.getTodos(
        { page: 1, limit: 10 },
        "all",
        undefined,
        "high"
      );

      expect(highPriorityResult.todos).toHaveLength(1);
      expect(highPriorityResult.todos[0].priority).toBe("high");

      const urgentPriorityResult = await service.getTodos(
        { page: 1, limit: 10 },
        "all",
        undefined,
        "urgent"
      );

      expect(urgentPriorityResult.todos).toHaveLength(1);
      expect(urgentPriorityResult.todos[0].priority).toBe("urgent");
    });

    test("카테고리로 필터링할 수 있다", async () => {
      const workResult = await service.getTodos(
        { page: 1, limit: 10 },
        "all",
        undefined,
        undefined,
        "work"
      );

      expect(workResult.todos).toHaveLength(1);
      expect(workResult.todos[0].category).toBe("work");

      const personalResult = await service.getTodos(
        { page: 1, limit: 10 },
        "all",
        undefined,
        undefined,
        "personal"
      );

      expect(personalResult.todos).toHaveLength(1);
      expect(personalResult.todos[0].category).toBe("personal");
    });

    test("태그로 검색할 수 있다", async () => {
      const projectResult = await service.getTodos(
        { page: 1, limit: 10 },
        "all",
        "project"
      );

      expect(projectResult.todos).toHaveLength(1);
      expect(projectResult.todos[0].tags).toContain("project");

      const urgentResult = await service.getTodos(
        { page: 1, limit: 10 },
        "all",
        "urgent"
      );

      expect(urgentResult.todos).toHaveLength(1);
      expect(urgentResult.todos[0].tags).toContain("urgent");
    });

    test("제목과 설명에서 검색할 수 있다", async () => {
      const titleResult = await service.getTodos(
        { page: 1, limit: 10 },
        "all",
        "Work Task"
      );

      expect(titleResult.todos).toHaveLength(1);
      expect(titleResult.todos[0].title).toContain("Work Task");

      const descriptionResult = await service.getTodos(
        { page: 1, limit: 10 },
        "all",
        "Doctor appointment"
      );

      expect(descriptionResult.todos).toHaveLength(1);
      expect(descriptionResult.todos[0].description).toContain(
        "Doctor appointment"
      );
    });

    test("마감일 범위로 필터링할 수 있다", async () => {
      const result = await service.getTodos(
        { page: 1, limit: 10 },
        "all",
        undefined,
        undefined,
        undefined,
        "createdAt",
        "desc",
        "2025-06-01T00:00:00.000Z",
        "2025-06-15T23:59:59.999Z"
      );

      // 마감일이 범위 내에 있는 Todo들만 반환
      expect(result.todos.length).toBeGreaterThan(0);
      for (const todo of result.todos) {
        if (todo.dueDate) {
          const dueDate = new Date(todo.dueDate);
          expect(dueDate >= new Date("2025-06-01T00:00:00.000Z")).toBe(true);
          expect(dueDate <= new Date("2025-06-15T23:59:59.999Z")).toBe(true);
        }
      }
    });

    test("여러 필터를 조합할 수 있다", async () => {
      const result = await service.getTodos(
        { page: 1, limit: 10 },
        "active", // 활성 상태만
        "important", // 검색어
        "high", // 높은 우선순위
        "work" // 업무 카테고리
      );

      expect(result.todos).toHaveLength(1);
      const todo = result.todos[0];
      expect(todo.completed).toBe(false);
      expect(todo.priority).toBe("high");
      expect(todo.category).toBe("work");
      expect(todo.tags).toContain("important");
    });
  });

  describe("정렬 기능", () => {
    beforeEach(async () => {
      // 정렬 테스트용 데이터
      await service.createTodo({
        title: "Z Task",
        priority: "low",
        dueDate: "2025-06-20T00:00:00.000Z",
      });
      await service.createTodo({
        title: "A Task",
        priority: "urgent",
        dueDate: "2025-06-10T00:00:00.000Z",
      });
      await service.createTodo({
        title: "M Task",
        priority: "high",
        dueDate: "2025-06-15T00:00:00.000Z",
      });
    });

    test("제목으로 정렬할 수 있다", async () => {
      const ascResult = await service.getTodos(
        { page: 1, limit: 10 },
        "all",
        undefined,
        undefined,
        undefined,
        "title",
        "asc"
      );

      const titles = ascResult.todos.map((todo) => todo.title);
      expect(titles).toEqual(["A Task", "M Task", "Z Task"]);

      const descResult = await service.getTodos(
        { page: 1, limit: 10 },
        "all",
        undefined,
        undefined,
        undefined,
        "title",
        "desc"
      );

      const titlesDesc = descResult.todos.map((todo) => todo.title);
      expect(titlesDesc).toEqual(["Z Task", "M Task", "A Task"]);
    });

    test("우선순위로 정렬할 수 있다", async () => {
      const ascResult = await service.getTodos(
        { page: 1, limit: 10 },
        "all",
        undefined,
        undefined,
        undefined,
        "priority",
        "asc"
      );

      const priorities = ascResult.todos.map((todo) => todo.priority);
      expect(priorities).toEqual(["low", "high", "urgent"]);

      const descResult = await service.getTodos(
        { page: 1, limit: 10 },
        "all",
        undefined,
        undefined,
        undefined,
        "priority",
        "desc"
      );

      const prioritiesDesc = descResult.todos.map((todo) => todo.priority);
      expect(prioritiesDesc).toEqual(["urgent", "high", "low"]);
    });

    test("마감일로 정렬할 수 있다", async () => {
      const ascResult = await service.getTodos(
        { page: 1, limit: 10 },
        "all",
        undefined,
        undefined,
        undefined,
        "dueDate",
        "asc"
      );

      const dueDates = ascResult.todos
        .map((todo) => todo.dueDate)
        .filter(Boolean);
      expect(dueDates).toEqual([
        "2025-06-10T00:00:00.000Z",
        "2025-06-15T00:00:00.000Z",
        "2025-06-20T00:00:00.000Z",
      ]);
    });
  });

  describe("확장된 통계 기능", () => {
    beforeEach(async () => {
      // 통계 테스트용 데이터
      const testData = [
        {
          title: "Work 1",
          priority: "high" as Priority,
          category: "work" as Category,
          tags: [],
        },
        {
          title: "Work 2",
          priority: "medium" as Priority,
          category: "work" as Category,
          tags: [],
        },
        {
          title: "Personal 1",
          priority: "low" as Priority,
          category: "personal" as Category,
          tags: [],
        },
        {
          title: "Shopping 1",
          priority: "urgent" as Priority,
          category: "shopping" as Category,
          tags: [],
          dueDate: "2025-06-05T00:00:00.000Z",
        }, // 과거 날짜 (overdue)
        {
          title: "Health 1",
          priority: "medium" as Priority,
          category: "health" as Category,
          tags: [],
          dueDate: new Date().toISOString(),
        }, // 오늘
      ];

      const createdTodos = [];
      for (const data of testData) {
        const todo = await service.createTodo(data);
        createdTodos.push(todo);
      }

      // 일부 Todo를 완료 상태로 업데이트
      await service.updateTodo(createdTodos[0].id, { completed: true }); // Work 1
      await service.updateTodo(createdTodos[2].id, { completed: true }); // Personal 1
    });

    test("확장된 통계를 조회할 수 있다", async () => {
      const stats = await service.getStats();

      expect(stats.total).toBe(5);
      expect(stats.completed).toBe(2);
      expect(stats.active).toBe(3);
      expect(stats.completionRate).toBeCloseTo(40.0);

      // 우선순위별 통계
      expect(stats.byPriority.low).toBe(1);
      expect(stats.byPriority.medium).toBe(2);
      expect(stats.byPriority.high).toBe(1);
      expect(stats.byPriority.urgent).toBe(1);

      // 카테고리별 통계
      expect(stats.byCategory.work).toBe(2);
      expect(stats.byCategory.personal).toBe(1);
      expect(stats.byCategory.shopping).toBe(1);
      expect(stats.byCategory.health).toBe(1);
      expect(stats.byCategory.other).toBe(0);

      // 마감일 관련 통계
      expect(stats.overdue).toBe(1); // 과거 날짜인 shopping 1개
      expect(stats.dueToday).toBe(1); // 오늘 마감인 health 1개
    });
  });

  describe("대량 업데이트 기능", () => {
    test("여러 Todo를 한 번에 업데이트할 수 있다", async () => {
      // 3개의 Todo 생성
      const todo1 = await service.createTodo({ title: "Todo 1" });
      const todo2 = await service.createTodo({ title: "Todo 2" });
      const todo3 = await service.createTodo({ title: "Todo 3" });

      const ids = [todo1.id, todo2.id, todo3.id];
      const updateData = { completed: true, priority: "high" as Priority };

      const updatedTodos = await service.bulkUpdate(ids, updateData);

      expect(updatedTodos).toHaveLength(3);
      for (const todo of updatedTodos) {
        expect(todo.completed).toBe(true);
        expect(todo.priority).toBe("high");
      }
    });

    test("존재하지 않는 ID가 포함되어도 다른 Todo는 업데이트된다", async () => {
      const todo1 = await service.createTodo({ title: "Todo 1" });
      const todo2 = await service.createTodo({ title: "Todo 2" });

      const ids = [todo1.id, "nonexistent", todo2.id];
      const updateData = { completed: true };

      const updatedTodos = await service.bulkUpdate(ids, updateData);

      // 존재하는 2개만 업데이트됨
      expect(updatedTodos).toHaveLength(2);
      for (const todo of updatedTodos) {
        expect(todo.completed).toBe(true);
      }
    });
  });

  describe("태그 관리 기능", () => {
    beforeEach(async () => {
      await service.createTodo({
        title: "Todo 1",
        tags: ["work", "important"],
      });
      await service.createTodo({
        title: "Todo 2",
        tags: ["personal", "learning"],
      });
      await service.createTodo({ title: "Todo 3", tags: ["work", "project"] });
    });

    test("특정 태그로 Todo를 조회할 수 있다", async () => {
      const workTodos = await service.getTodosByTag("work");
      expect(workTodos).toHaveLength(2);

      const importantTodos = await service.getTodosByTag("important");
      expect(importantTodos).toHaveLength(1);

      const nonexistentTodos = await service.getTodosByTag("nonexistent");
      expect(nonexistentTodos).toHaveLength(0);
    });

    test("태그 검색은 대소문자를 구분하지 않는다", async () => {
      const workTodos = await service.getTodosByTag("WORK");
      expect(workTodos).toHaveLength(2);

      const importantTodos = await service.getTodosByTag("Important");
      expect(importantTodos).toHaveLength(1);
    });

    test("사용된 모든 태그 목록을 조회할 수 있다", async () => {
      const allTags = await service.getAllTags();

      expect(allTags).toHaveLength(5);
      expect(allTags).toContain("work");
      expect(allTags).toContain("important");
      expect(allTags).toContain("personal");
      expect(allTags).toContain("learning");
      expect(allTags).toContain("project");

      // 정렬되어 있는지 확인
      const sortedTags = [...allTags].sort();
      expect(allTags).toEqual(sortedTags);
    });

    test("중복된 태그는 제거된다", async () => {
      await service.createTodo({
        title: "Todo 4",
        tags: ["work", "work", "important"],
      });

      const allTags = await service.getAllTags();

      // 중복이 제거되어야 함
      const workCount = allTags.filter((tag) => tag === "work").length;
      expect(workCount).toBe(1);
    });
  });

  describe("Todo 업데이트 (Enhanced)", () => {
    test("enhanced 필드들을 업데이트할 수 있다", async () => {
      const created = await service.createTodo({
        title: "원본 제목",
        priority: "low",
        category: "other",
        tags: ["old"],
      });

      const updateData: UpdateTodoRequest = {
        title: "수정된 제목",
        priority: "urgent",
        category: "work",
        dueDate: "2025-06-10T09:00:00.000Z",
        tags: ["new", "updated"],
        estimatedMinutes: 90,
      };

      const updated = await service.updateTodo(created.id, updateData);

      expect(updated.title).toBe("수정된 제목");
      expect(updated.priority).toBe("urgent");
      expect(updated.category).toBe("work");
      expect(updated.dueDate).toBe("2025-06-10T09:00:00.000Z");
      expect(updated.tags).toEqual(["new", "updated"]);
      expect(updated.estimatedMinutes).toBe(90);
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
        new Date(created.updatedAt).getTime()
      );
    });
  });

  describe("에러 처리", () => {
    test("페이지네이션 에러 처리", async () => {
      await expect(service.getTodos({ page: 0, limit: 10 })).rejects.toThrow(
        "페이지 번호는 1 이상이어야 합니다"
      );

      await expect(service.getTodos({ page: 1, limit: 0 })).rejects.toThrow(
        "페이지 크기는 1-100 사이여야 합니다"
      );

      await expect(service.getTodos({ page: 1, limit: 101 })).rejects.toThrow(
        "페이지 크기는 1-100 사이여야 합니다"
      );
    });

    test("존재하지 않는 Todo 처리", async () => {
      await expect(service.getTodoById("nonexistent")).rejects.toThrow(
        "Todo를 찾을 수 없습니다"
      );
      await expect(
        service.updateTodo("nonexistent", { title: "새 제목" })
      ).rejects.toThrow("Todo를 찾을 수 없습니다");
      await expect(service.deleteTodo("nonexistent")).rejects.toThrow(
        "Todo를 찾을 수 없습니다"
      );
      await expect(service.toggleTodo("nonexistent")).rejects.toThrow(
        "Todo를 찾을 수 없습니다"
      );
    });
  });
});
