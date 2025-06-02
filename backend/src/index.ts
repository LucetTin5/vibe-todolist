import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import todosRoute from "./routes/todos";

const app = new Hono();

// 미들웨어 설정
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"], // Vite 개발 서버
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// 라우트 설정
app.route("/api/todos", todosRoute);

// 기본 라우트
app.get("/", (c) => {
  return c.json({
    message: "TodoList Backend API",
    version: "1.0.0",
    endpoints: {
      todos: "/api/todos",
      health: "/health",
    },
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 핸들러
app.notFound((c) => {
  return c.json(
    { success: false, error: "API 엔드포인트를 찾을 수 없습니다." },
    404
  );
});

// 에러 핸들러
app.onError((err, c) => {
  console.error("서버 에러:", err);
  return c.json(
    {
      success: false,
      error: "서버 내부 오류가 발생했습니다.",
    },
    500
  );
});

export default {
  port: 3001,
  fetch: app.fetch,
};
