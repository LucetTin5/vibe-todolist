import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { TodoQueryParams } from "../types/todo.types";
import { TodoService } from "../services/todo.service";

const app = new Hono();
const todoService = new TodoService();

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
    .transform((val) => Number.parseInt(val) || 1)
    .optional(),
  limit: z
    .string()
    .transform((val) => Number.parseInt(val) || 10)
    .optional(),
  filter: z.enum(["all", "active", "completed"]).optional(),
  search: z.string().optional(),
});

/**
 * GET /todos - Todo 목록 조회
 */
app.get("/", zValidator("query", querySchema), async (c) => {
  const query = c.req.valid("query") as TodoQueryParams;
  const result = await todoService.getTodos(query);

  if (!result.success) {
    return c.json(result, 500);
  }

  return c.json(result);
});

/**
 * POST /todos - 새 Todo 생성
 */
app.post("/", zValidator("json", createTodoSchema), async (c) => {
  const data = c.req.valid("json");
  const result = await todoService.createTodo(data);

  if (!result.success) {
    return c.json(result, 400);
  }

  return c.json(result, 201);
});

/**
 * GET /todos/:id - 특정 Todo 조회
 */
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const result = await todoService.getTodoById(id);

  if (!result.success) {
    if (result.error?.includes("찾을 수 없습니다")) {
      return c.json(result, 404);
    }
    return c.json(result, 400);
  }

  return c.json(result);
});

/**
 * PUT /todos/:id - Todo 업데이트
 */
app.put("/:id", zValidator("json", updateTodoSchema), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");
  const result = await todoService.updateTodo(id, data);

  if (!result.success) {
    if (result.error?.includes("찾을 수 없습니다")) {
      return c.json(result, 404);
    }
    return c.json(result, 400);
  }

  return c.json(result);
});

/**
 * DELETE /todos/:id - Todo 삭제
 */
app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const result = await todoService.deleteTodo(id);

  if (!result.success) {
    if (result.error?.includes("찾을 수 없습니다")) {
      return c.json(result, 404);
    }
    return c.json(result, 400);
  }

  return c.json(result);
});

/**
 * GET /todos/stats - Todo 통계 조회
 */
app.get("/stats", async (c) => {
  const result = await todoService.getTodoStats();

  if (!result.success) {
    return c.json(result, 500);
  }

  return c.json(result);
});

/**
 * DELETE /todos - 모든 Todo 삭제 (개발용)
 */
app.delete("/", async (c) => {
  const result = await todoService.clearAllTodos();

  if (!result.success) {
    return c.json(result, 500);
  }

  return c.json(result);
});

export default app;
