import { describe, test, expect, beforeEach } from "bun:test";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { todoRoutes } from "../routes/todos";
import { todoStorage } from "../utils/in-memory-storage";

describe("Todo API Routes", () => {
  let app: Hono;

  beforeEach(() => {
    // 테스트용 앱 설정
    app = new Hono();
    app.use("*", cors());
    app.route("/api/todos", todoRoutes);

    // 스토리지 초기화
    todoStorage.clear();
  });

  describe("POST /api/todos", () => {
    test("유효한 데이터로 Todo를 생성할 수 있다", async () => {
      const requestBody = {
        title: "새로운 할일",
        description: "할일 설명",
      };

      const response = await app.request("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(201);

      const todo = await response.json();
      expect(todo.title).toBe(requestBody.title);
      expect(todo.description).toBe(requestBody.description);
      expect(todo.completed).toBe(false);
      expect(todo.id).toMatch(/^todo_\d+$/);
      expect(new Date(todo.createdAt)).toBeInstanceOf(Date);
      expect(new Date(todo.updatedAt)).toBeInstanceOf(Date);
    });

    test("설명 없이도 Todo를 생성할 수 있다", async () => {
      const requestBody = {
        title: "간단한 할일",
      };

      const response = await app.request("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(201);

      const todo = await response.json();
      expect(todo.title).toBe(requestBody.title);
      expect(todo.description).toBeUndefined();
    });

    test("제목이 없으면 400 에러가 발생한다", async () => {
      const requestBody = {
        description: "설명만 있음",
      };

      const response = await app.request("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(400);
    });

    test("빈 제목으로는 Todo를 생성할 수 없다", async () => {
      const requestBody = {
        title: "",
        description: "설명",
      };

      const response = await app.request("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(400);
    });

    test("잘못된 JSON 형식이면 400 에러가 발생한다", async () => {
      const response = await app.request("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "invalid json",
      });

      expect(response.status).toBe(400); // 에러 핸들러로 인해 400으로 처리됨
    });
  });

  describe("GET /api/todos", () => {
    beforeEach(async () => {
      // 테스트 데이터 생성
      for (let i = 1; i <= 5; i++) {
        const todo = todoStorage.create({
          title: `Todo ${i}`,
          description: `설명 ${i}`,
          completed: i % 2 === 0, // 짝수는 완료 상태
        });
      }
    });

    test("모든 Todo 목록을 조회할 수 있다", async () => {
      const response = await app.request("/api/todos");

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.todos).toHaveLength(5);
      expect(result.total).toBe(5);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    test("페이지네이션이 동작한다", async () => {
      const response = await app.request("/api/todos?page=1&limit=3");

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.todos).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(2);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    test("활성 상태 Todo만 필터링할 수 있다", async () => {
      const response = await app.request("/api/todos?filter=active");

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(
        result.todos.every((todo: { completed: boolean }) => !todo.completed)
      ).toBe(true);
      expect(result.total).toBe(3); // 1, 3, 5번이 활성 상태
    });

    test("완료된 Todo만 필터링할 수 있다", async () => {
      const response = await app.request("/api/todos?filter=completed");

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(
        result.todos.every((todo: { completed: boolean }) => todo.completed)
      ).toBe(true);
      expect(result.total).toBe(2); // 2, 4번이 완료 상태
    });

    test("검색어로 Todo를 필터링할 수 있다", async () => {
      // 특별한 제목으로 Todo 추가
      todoStorage.create({
        title: "JavaScript 학습",
        description: "React 공부하기",
        completed: false,
      });

      const response = await app.request("/api/todos?search=JavaScript");

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.todos).toHaveLength(1);
      expect(result.todos[0].title).toBe("JavaScript 학습");
    });

    test("잘못된 페이지 번호는 400 에러가 발생한다", async () => {
      const response = await app.request("/api/todos?page=0");

      expect(response.status).toBe(400);
    });

    test("잘못된 페이지 크기는 400 에러가 발생한다", async () => {
      const response = await app.request("/api/todos?limit=101");

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/todos/:id", () => {
    test("존재하는 Todo를 조회할 수 있다", async () => {
      const created = todoStorage.create({
        title: "조회할 할일",
        description: "설명",
        completed: false,
      });

      const response = await app.request(`/api/todos/${created.id}`);

      expect(response.status).toBe(200);

      const todo = await response.json();
      expect(todo.id).toBe(created.id);
      expect(todo.title).toBe(created.title);
    });

    test("존재하지 않는 Todo를 조회하면 404 에러가 발생한다", async () => {
      const response = await app.request("/api/todos/nonexistent");

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/todos/:id", () => {
    test("기존 Todo를 업데이트할 수 있다", async () => {
      const created = todoStorage.create({
        title: "원본 제목",
        description: "원본 설명",
        completed: false,
      });

      const updateData = {
        title: "수정된 제목",
        completed: true,
      };

      const response = await app.request(`/api/todos/${created.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      const updated = await response.json();
      expect(updated.title).toBe(updateData.title);
      expect(updated.description).toBe("원본 설명");
      expect(updated.completed).toBe(true);
    });

    test("존재하지 않는 Todo를 업데이트하면 404 에러가 발생한다", async () => {
      const updateData = {
        title: "새 제목",
      };

      const response = await app.request("/api/todos/nonexistent", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(404);
    });

    test("빈 제목으로 업데이트하면 400 에러가 발생한다", async () => {
      const created = todoStorage.create({
        title: "원본 제목",
        completed: false,
      });

      const updateData = {
        title: "",
      };

      const response = await app.request(`/api/todos/${created.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/todos/:id", () => {
    test("기존 Todo를 삭제할 수 있다", async () => {
      const created = todoStorage.create({
        title: "삭제할 할일",
        completed: false,
      });

      const response = await app.request(`/api/todos/${created.id}`, {
        method: "DELETE",
      });

      expect(response.status).toBe(204);

      // 삭제 확인
      const checkResponse = await app.request(`/api/todos/${created.id}`);
      expect(checkResponse.status).toBe(404);
    });

    test("존재하지 않는 Todo를 삭제하면 404 에러가 발생한다", async () => {
      const response = await app.request("/api/todos/nonexistent", {
        method: "DELETE",
      });

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/todos/:id/toggle", () => {
    test("Todo의 완료 상태를 토글할 수 있다", async () => {
      const created = todoStorage.create({
        title: "토글할 할일",
        completed: false,
      });

      const response = await app.request(`/api/todos/${created.id}/toggle`, {
        method: "PATCH",
      });

      expect(response.status).toBe(200);

      const toggled = await response.json();
      expect(toggled.completed).toBe(true);
    });

    test("완료된 Todo를 다시 토글하면 미완료 상태가 된다", async () => {
      const created = todoStorage.create({
        title: "토글할 할일",
        completed: true,
      });

      const response = await app.request(`/api/todos/${created.id}/toggle`, {
        method: "PATCH",
      });

      expect(response.status).toBe(200);

      const toggled = await response.json();
      expect(toggled.completed).toBe(false);
    });

    test("존재하지 않는 Todo를 토글하면 404 에러가 발생한다", async () => {
      const response = await app.request("/api/todos/nonexistent/toggle", {
        method: "PATCH",
      });

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/todos/stats", () => {
    test("Todo 통계를 조회할 수 있다", async () => {
      // 테스트 데이터 생성
      todoStorage.create({ title: "Todo 1", completed: false });
      todoStorage.create({ title: "Todo 2", completed: true });
      todoStorage.create({ title: "Todo 3", completed: true });

      const response = await app.request("/api/todos/stats");

      expect(response.status).toBe(200);

      const stats = await response.json();
      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(2);
      expect(stats.active).toBe(1);
    });

    test("데이터가 없으면 모든 통계가 0이다", async () => {
      const response = await app.request("/api/todos/stats");

      expect(response.status).toBe(200);

      const stats = await response.json();
      expect(stats.total).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.active).toBe(0);
    });
  });

  describe("DELETE /api/todos", () => {
    test("모든 Todo를 삭제할 수 있다", async () => {
      // 테스트 데이터 생성
      todoStorage.create({ title: "Todo 1", completed: false });
      todoStorage.create({ title: "Todo 2", completed: true });

      const response = await app.request("/api/todos", {
        method: "DELETE",
      });

      expect(response.status).toBe(204);

      // 삭제 확인
      const listResponse = await app.request("/api/todos");
      const result = await listResponse.json();
      expect(result.total).toBe(0);
    });
  });

  describe("CORS 설정", () => {
    test("CORS 헤더가 포함되어 있다", async () => {
      const response = await app.request("/api/todos", {
        method: "OPTIONS",
      });

      expect(response.headers.get("Access-Control-Allow-Origin")).toBeDefined();
    });
  });

  describe("에러 처리", () => {
    test("지원하지 않는 HTTP 메서드는 404 에러가 발생한다", async () => {
      const response = await app.request("/api/todos", {
        method: "PATCH",
      });

      expect(response.status).toBe(404);
    });

    test("존재하지 않는 엔드포인트는 404 에러가 발생한다", async () => {
      const response = await app.request("/api/todos/nonexistent/invalid");

      expect(response.status).toBe(404);
    });
  });
});
