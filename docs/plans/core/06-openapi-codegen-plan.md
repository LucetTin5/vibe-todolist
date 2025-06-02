# 🔄 OpenAPI 기반 코드 제너레이션 계획

## 📋 개요

백엔드의 Hono API를 OpenAPI 스키마로 정의하고, 프론트엔드에서 이를 활용해 타입 안전한 API 클라이언트와 React Query 훅을 자동 생성하는 개발 워크플로우를 구축합니다.

## 🛠️ 기술 스택

### 백엔드 (OpenAPI 스키마 생성)

- **@hono/zod-openapi**: Hono + Zod + OpenAPI 통합
- **@hono/swagger-ui**: API 문서화 UI
- **zod**: 스키마 검증 및 타입 정의

### 프론트엔드 (코드 제너레이션)

- **orval**: OpenAPI → React Query + TypeScript 코드젠
- **@tanstack/react-query**: 서버 상태 관리
- **axios**: HTTP 클라이언트 (orval 기본값)

## 🎯 구현 목표

### Phase 1.5: OpenAPI + 코드젠 도입

1. **백엔드 OpenAPI 스키마 생성**
2. **프론트엔드 자동 코드 생성**
3. **타입 안전성 보장**
4. **개발 워크플로우 최적화**

## 🚀 단계별 구현 계획

### Step 1: 백엔드 OpenAPI 설정

#### 1-1. 패키지 설치

```bash
cd backend
bun add @hono/zod-openapi @hono/swagger-ui
```

#### 1-2. OpenAPI 앱 설정

```typescript
// backend/src/app.ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";

const app = new OpenAPIHono();

// Swagger UI 설정
app.get(
  "/docs",
  swaggerUI({
    url: "/openapi.json",
  })
);

// OpenAPI 스키마 JSON 엔드포인트
app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "TodoList API",
    description: "Todo 관리 애플리케이션 API",
  },
});
```

#### 1-3. Zod 스키마를 OpenAPI 호환으로 변환

```typescript
// backend/src/schemas/todo.schemas.ts
import { z } from "zod";
import { createRoute } from "@hono/zod-openapi";

export const TodoSchema = z.object({
  id: z.string().openapi({
    example: "todo_1",
    description: "Todo 고유 식별자",
  }),
  title: z.string().min(1).max(200).openapi({
    example: "프로젝트 완료하기",
    description: "Todo 제목",
  }),
  description: z.string().optional().openapi({
    example: "마감일까지 모든 기능 구현",
    description: "Todo 상세 설명",
  }),
  completed: z.boolean().openapi({
    example: false,
    description: "완료 여부",
  }),
  createdAt: z.string().datetime().openapi({
    example: "2025-06-02T04:44:31.352Z",
    description: "생성 시간",
  }),
  updatedAt: z.string().datetime().openapi({
    example: "2025-06-02T04:44:31.352Z",
    description: "수정 시간",
  }),
});

export const CreateTodoSchema = TodoSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateTodoSchema = TodoSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
```

#### 1-4. OpenAPI 라우트 정의

```typescript
// backend/src/routes/todos.openapi.ts
import { createRoute } from "@hono/zod-openapi";
import {
  TodoSchema,
  CreateTodoSchema,
  UpdateTodoSchema,
} from "../schemas/todo.schemas";

export const createTodoRoute = createRoute({
  method: "post",
  path: "/todos",
  tags: ["Todos"],
  summary: "Todo 생성",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateTodoSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: TodoSchema,
        },
      },
      description: "생성된 Todo",
    },
    400: {
      description: "잘못된 요청",
    },
  },
});

export const getTodosRoute = createRoute({
  method: "get",
  path: "/todos",
  tags: ["Todos"],
  summary: "Todo 목록 조회",
  request: {
    query: z.object({
      page: z
        .string()
        .optional()
        .openapi({
          param: { name: "page", in: "query" },
          example: "1",
        }),
      limit: z
        .string()
        .optional()
        .openapi({
          param: { name: "limit", in: "query" },
          example: "10",
        }),
      filter: z
        .enum(["all", "active", "completed"])
        .optional()
        .openapi({
          param: { name: "filter", in: "query" },
          example: "all",
        }),
      search: z
        .string()
        .optional()
        .openapi({
          param: { name: "search", in: "query" },
          example: "검색어",
        }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            todos: z.array(TodoSchema),
            total: z.number(),
            currentPage: z.number(),
            totalPages: z.number(),
            hasNext: z.boolean(),
            hasPrev: z.boolean(),
          }),
        },
      },
      description: "Todo 목록",
    },
  },
});
```

### Step 2: 프론트엔드 코드젠 설정

#### 2-1. 패키지 설치

```bash
cd frontend
bun add @tanstack/react-query axios
bun add -D orval
```

#### 2-2. Orval 설정 파일 생성

```typescript
// frontend/orval.config.ts
import { defineConfig } from "orval";

export default defineConfig({
  todoApi: {
    input: {
      target: "http://localhost:3001/openapi.json",
    },
    output: {
      target: "./src/api/generated.ts",
      client: "react-query",
      mode: "split",
      override: {
        mutator: {
          path: "./src/api/mutator.ts",
          name: "customInstance",
        },
      },
    },
    hooks: {
      afterAllFilesWrite: "bun run format",
    },
  },
});
```

#### 2-3. API 클라이언트 기본 설정

```typescript
// frontend/src/api/mutator.ts
import axios, { AxiosRequestConfig } from "axios";

export const customInstance = axios.create({
  baseURL: "http://localhost:3001/api",
});

// 요청 인터셉터
customInstance.interceptors.request.use((config) => {
  // 인증 토큰 추가 등
  return config;
});

// 응답 인터셉터
customInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 전역 에러 처리
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default <T = any>(config: AxiosRequestConfig): Promise<T> => {
  return customInstance(config).then(({ data }) => data);
};
```

#### 2-4. React Query 설정

```typescript
// frontend/src/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      retry: (failureCount, error: any) => {
        if (error?.status === 404) return false;
        return failureCount < 3;
      },
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Step 3: 자동화된 개발 워크플로우

#### 3-1. 스크립트 설정

```json
// frontend/package.json
{
  "scripts": {
    "codegen": "orval",
    "codegen:watch": "orval --watch",
    "dev": "bun run codegen && vite",
    "build": "bun run codegen && vite build"
  }
}
```

#### 3-2. VS Code 태스크 설정

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "🔄 Generate API Client",
      "type": "shell",
      "command": "bun",
      "args": ["run", "codegen"],
      "options": {
        "cwd": "${workspaceFolder}/frontend"
      },
      "group": "build",
      "problemMatcher": []
    },
    {
      "label": "👀 Watch API Changes",
      "type": "shell",
      "command": "bun",
      "args": ["run", "codegen:watch"],
      "options": {
        "cwd": "${workspaceFolder}/frontend"
      },
      "isBackground": true,
      "group": "build"
    }
  ]
}
```

## 🎨 생성되는 코드 예시

### 자동 생성되는 React Query 훅

```typescript
// frontend/src/api/generated/todos/todos.ts (자동 생성됨)

// Todo 목록 조회 훅
export const useGetTodos = (
  params?: GetTodosParams,
  options?: UseQueryOptions<TodoListResponse>
) => {
  return useQuery({
    queryKey: getTodosQueryKey(params),
    queryFn: () => getTodos(params),
    ...options,
  });
};

// Todo 생성 훅
export const useCreateTodo = (
  options?: UseMutationOptions<Todo, Error, CreateTodoRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
    ...options,
  });
};

// Todo 업데이트 훅
export const useUpdateTodo = (
  options?: UseMutationOptions<
    Todo,
    Error,
    { id: string; data: UpdateTodoRequest }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateTodo(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(["todos", data.id], data);
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
    ...options,
  });
};
```

### 컴포넌트에서 사용

```typescript
// frontend/src/components/todo/TodoList.tsx
import { useGetTodos, useUpdateTodo, useDeleteTodo } from "@/api/generated";

export function TodoList() {
  const {
    data: todosData,
    isLoading,
    error,
  } = useGetTodos({
    page: "1",
    limit: "10",
  });

  const updateTodoMutation = useUpdateTodo({
    onSuccess: () => {
      // 성공 알림 등
    },
    onError: (error) => {
      // 에러 처리
    },
  });

  const deleteTodoMutation = useDeleteTodo();

  const handleToggleComplete = (todo: Todo) => {
    updateTodoMutation.mutate({
      id: todo.id,
      data: { completed: !todo.completed },
    });
  };

  const handleDelete = (id: string) => {
    deleteTodoMutation.mutate({ id });
  };

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error.message}</div>;

  return (
    <div>
      {todosData?.todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
```

## 🎯 장점

### 개발 효율성

- ✅ **타입 안전성**: 컴파일 타임에 API 스키마 불일치 감지
- ✅ **자동화**: API 변경 시 클라이언트 코드 자동 업데이트
- ✅ **일관성**: 백엔드와 프론트엔드 간 스키마 동기화
- ✅ **생산성**: boilerplate 코드 자동 생성

### 유지보수성

- ✅ **문서화**: 자동 생성된 Swagger UI
- ✅ **테스트**: API 스키마 기반 자동 검증
- ✅ **리팩토링**: 타입 시스템으로 안전한 코드 변경

## ⚠️ 고려사항

### 초기 설정 복잡성

- OpenAPI 스키마 정의 학습 곡선
- 코드젠 설정 및 커스터마이징

### 의존성 관리

- 백엔드 API가 실행 중이어야 코드젠 가능
- 스키마 변경 시 전체 재생성 필요

## 🔄 다음 단계

1. **백엔드 OpenAPI 스키마 구현**
2. **프론트엔드 Orval 설정**
3. **자동 생성된 훅으로 기존 컴포넌트 마이그레이션**
4. **개발 워크플로우 최적화**

## 📚 참고 자료

- [Hono OpenAPI Guide](https://hono.dev/guides/zod-openapi)
- [Orval Documentation](https://orval.dev)
- [OpenAPI Specification](https://swagger.io/specification/)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
