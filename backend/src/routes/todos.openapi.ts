/**
 * OpenAPI 호환 Todo 라우터
 */
import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { TodoService } from "../services/todo.service";
import {
  getTodosRoute,
  createTodoRoute,
  getTodoRoute,
  updateTodoRoute,
  deleteTodoRoute,
  getTodoStatsRoute,
  deleteAllTodosRoute,
} from "./todo.routes";
import {
  CreateTodoSchema,
  UpdateTodoSchema,
  TodoQuerySchema,
  type TodoQuery,
  TodoSchema,
  ErrorResponseSchema,
} from "../schemas/todo.schemas";

const app = new OpenAPIHono();
const todoService = new TodoService();

// 전역 에러 핸들러
app.onError((err, c) => {
  console.error("Todo API Error:", err);

  if (err.message.includes("페이지") || err.message.includes("크기")) {
    return c.json(
      {
        success: false,
        error: err.message,
      },
      400
    );
  }

  if (err.message.includes("JSON") || err.message.includes("parse")) {
    return c.json(
      {
        success: false,
        error: "잘못된 JSON 형식입니다",
      },
      400
    );
  }

  return c.json(
    {
      success: false,
      error: "Internal Server Error",
    },
    500
  );
});

// Todo 목록 조회
app.openapi(getTodosRoute, async (c) => {
  try {
    const query = c.req.valid("query") as TodoQuery;
    const { filter = "all", search, page = 1, limit = 10 } = query;

    const result = await todoService.getTodos({ page, limit }, filter, search);

    return c.json(result, 200);
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      400
    );
  }
});

// Todo 생성
app.openapi(createTodoRoute, async (c) => {
  try {
    const data = c.req.valid("json");
    const result = await todoService.createTodo(data);

    // 날짜를 ISO 문자열로 변환
    const todo = {
      ...result,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    return c.json(todo, 201);
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      400
    );
  }
});

// 특정 Todo 조회
app.openapi(getTodoRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const result = await todoService.getTodoById(id);

    // 날짜를 ISO 문자열로 변환
    const todo = {
      ...result,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    return c.json(todo, 200);
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      404
    );
  }
});

// Todo 업데이트
app.openapi(updateTodoRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");
    const result = await todoService.updateTodo(id, data);

    // 날짜를 ISO 문자열로 변환
    const todo = {
      ...result,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    return c.json(todo, 200);
  } catch (error) {
    if (error instanceof Error && error.message.includes("찾을 수 없습니다")) {
      return c.json(
        {
          success: false,
          error: (error as Error).message,
        },
        404
      );
    }

    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      400
    );
  }
});

// Todo 삭제
app.openapi(deleteTodoRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    await todoService.deleteTodo(id);

    return c.json(
      {
        success: true,
        message: "Todo가 성공적으로 삭제되었습니다",
      },
      200
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      404
    );
  }
});

// Todo 통계 조회
app.openapi(getTodoStatsRoute, async (c) => {
  const result = await todoService.getStats();
  return c.json(result, 200);
});

// 모든 Todo 삭제
app.openapi(deleteAllTodosRoute, async (c) => {
  await todoService.clearTodos();

  return c.json(
    {
      success: true,
      message: "모든 Todo가 성공적으로 삭제되었습니다",
    },
    200
  );
});

// 추가 엔드포인트: Todo 완료 상태 토글
const toggleTodoRoute = {
  method: "patch" as const,
  path: "/todos/{id}/toggle",
  tags: ["Todos"],
  summary: "Todo 완료 상태 토글",
  description: "Todo의 완료 상태를 토글합니다.",
  request: {
    params: z.object({
      id: z.string().openapi({
        param: { name: "id", in: "path" },
        example: "todo_1737606271352",
        description: "Todo ID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TodoSchema,
        },
      },
      description: "Todo 토글 성공",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Todo를 찾을 수 없음",
    },
  },
};

app.openapi(toggleTodoRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const result = await todoService.toggleTodo(id);

    // 날짜를 ISO 문자열로 변환
    const todo = {
      ...result,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    return c.json(todo, 200);
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      404
    );
  }
});

export default app;
export { app as todoOpenApiRoutes };
