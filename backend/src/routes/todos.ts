import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { TodoQueryParams } from "../types/todo.types";
import { TodoService } from "../services/todo.service";

const app = new Hono();
const todoService = new TodoService();

// 전역 에러 핸들러
app.onError((err, c) => {
  if (err.message.includes("페이지") || err.message.includes("크기")) {
    return c.json({ error: err.message }, 400);
  }
  if (err.message.includes("JSON") || err.message.includes("parse")) {
    return c.json({ error: "잘못된 JSON 형식입니다" }, 400);
  }
  return c.json({ error: "Internal Server Error" }, 500);
});

// Zod 스키마 정의
const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, "제목은 필수입니다.")
    .max(200, "제목은 200자를 초과할 수 없습니다."),
  description: z
    .string()
    .max(1000, "설명은 1000자를 초과할 수 없습니다.")
    .optional(),
});

const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, "제목은 필수입니다.")
    .max(200, "제목은 200자를 초과할 수 없습니다.")
    .optional(),
  description: z
    .string()
    .max(1000, "설명은 1000자를 초과할 수 없습니다.")
    .optional(),
  completed: z.boolean().optional(),
});

const querySchema = z.object({
  page: z
    .string()
    .transform((val) => {
      const num = Number.parseInt(val);
      if (num <= 0) throw new Error("페이지 번호는 1 이상이어야 합니다");
      return num || 1;
    })
    .optional(),
  limit: z
    .string()
    .transform((val) => {
      const num = Number.parseInt(val);
      if (num <= 0) throw new Error("페이지 크기는 1 이상이어야 합니다");
      if (num > 100) throw new Error("페이지 크기는 100 이하여야 합니다");
      return num || 10;
    })
    .optional(),
  filter: z.enum(["all", "active", "completed"]).optional(),
  search: z.string().optional(),
});

/**
 * GET /todos - Todo 목록 조회
 */
app.get("/", zValidator("query", querySchema), async (c) => {
  try {
    const query = c.req.valid("query") as TodoQueryParams;
    const { filter = "all", search, ...params } = query;
    const result = await todoService.getTodos(params, filter, search);
    return c.json(result);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

/**
 * POST /todos - 새 Todo 생성
 */
app.post("/", zValidator("json", createTodoSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    const result = await todoService.createTodo(data);
    return c.json(result, 201);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

/**
 * GET /todos/stats - Todo 통계 조회
 */
app.get("/stats", async (c) => {
  try {
    const result = await todoService.getStats();
    return c.json(result);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

/**
 * GET /todos/:id - 특정 Todo 조회
 */
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await todoService.getTodoById(id);
    return c.json(result);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 404);
  }
});

/**
 * PUT /todos/:id - Todo 업데이트
 */
app.put("/:id", zValidator("json", updateTodoSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const result = await todoService.updateTodo(id, data);
    return c.json(result);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 404);
  }
});

/**
 * DELETE /todos/:id - Todo 삭제
 */
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await todoService.deleteTodo(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 404);
  }
});

/**
 * PATCH /todos/:id/toggle - Todo 완료 상태 토글
 */
app.patch("/:id/toggle", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await todoService.toggleTodo(id);
    return c.json(result);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 404);
  }
});

/**
 * DELETE /todos - 모든 Todo 삭제 (개발용)
 */
app.delete("/", async (c) => {
  try {
    await todoService.clearTodos();
    return new Response(null, { status: 204 });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

export default app;
export { app as todoRoutes };
