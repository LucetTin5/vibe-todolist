# 🌐 API 엔드포인트 설계

## 1. RESTful API 구조

### 기본 CRUD 엔드포인트

#### GET /api/todos
할 일 목록 조회
```typescript
// Query Parameters
interface TodoQueryParams {
  status?: 'todo' | 'in-progress' | 'done'
  priority?: 'low' | 'medium' | 'high'
  completed?: boolean
  parentId?: string | 'root'  // 'root'는 최상위 태스크만
  sort?: 'title' | 'createdAt' | 'dueDate' | 'priority' | 'order'
  order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// Response
interface TodoListResponse {
  data: Todo[]
  total: number
  pagination: {
    page: number
    limit: number
    hasNext: boolean
    hasPrev: boolean
  }
}
```

#### GET /api/todos/:id
특정 할 일 조회
```typescript
// Response
interface TodoDetailResponse {
  data: Todo & {
    subtasks?: Todo[]
    parent?: Partial<Todo>
  }
}
```

#### POST /api/todos
새 할 일 생성
```typescript
// Request Body
interface CreateTodoRequest {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string  // ISO 8601 format
  startDate?: string
  parentId?: string
}

// Response
interface CreateTodoResponse {
  data: Todo
  message: string
}
```

#### PUT /api/todos/:id
할 일 수정
```typescript
// Request Body
interface UpdateTodoRequest {
  title?: string
  description?: string
  completed?: boolean
  status?: 'todo' | 'in-progress' | 'done'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
  startDate?: string
  order?: number
}

// Response
interface UpdateTodoResponse {
  data: Todo
  message: string
}
```

#### DELETE /api/todos/:id
할 일 삭제
```typescript
// Response
interface DeleteTodoResponse {
  message: string
  deletedCount: number  // 서브태스크 포함 삭제된 총 개수
}
```

## 2. 특수 기능 엔드포인트

### PATCH /api/todos/bulk-update
여러 할 일 일괄 수정 (드래그앤드롭용)
```typescript
// Request Body
interface BulkUpdateRequest {
  updates: Array<{
    id: string
    order?: number
    status?: 'todo' | 'in-progress' | 'done'
    parentId?: string
  }>
}

// Response
interface BulkUpdateResponse {
  data: Todo[]
  updated: number
  message: string
}
```

### GET /api/todos/tree
계층 구조로 할 일 조회
```typescript
// Response
interface TodoTreeResponse {
  data: TodoWithChildren[]
}

interface TodoWithChildren extends Todo {
  children: TodoWithChildren[]
  depth: number
  hasChildren: boolean
}
```

### GET /api/todos/analytics
대시보드용 분석 데이터
```typescript
// Query Parameters
interface AnalyticsParams {
  period?: 'week' | 'month' | 'quarter' | 'year'
  startDate?: string
  endDate?: string
}

// Response
interface AnalyticsResponse {
  data: {
    totalTasks: number
    completedTasks: number
    completionRate: number
    tasksByStatus: Record<TodoStatus, number>
    tasksByPriority: Record<TodoPriority, number>
    completionTrend: Array<{
      date: string
      completed: number
      created: number
    }>
    overdueCount: number
    dueTodayCount: number
  }
}
```

## 3. Hono 라우터 구현 구조

### 라우터 파일 구성
```
backend/src/routes/
├── index.ts          # 메인 라우터 설정
├── todos.ts          # Todo CRUD 라우터
├── analytics.ts      # 분석 데이터 라우터
└── health.ts         # 헬스체크 라우터
```

### 기본 라우터 템플릿
```typescript
// backend/src/routes/todos.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { todoService } from '../services/todo.service'
import { 
  createTodoSchema, 
  updateTodoSchema, 
  todoParamsSchema 
} from '../schemas/todo.schema'

const todos = new Hono()

// GET /api/todos
todos.get('/', async (c) => {
  try {
    const query = c.req.query()
    const result = await todoService.findAll(query)
    return c.json({
      success: true,
      data: result.data,
      total: result.total,
      pagination: result.pagination
    })
  } catch (error) {
    return c.json({
      success: false,
      message: 'Failed to fetch todos',
      error: error.message
    }, 500)
  }
})

// GET /api/todos/:id
todos.get('/:id', zValidator('param', todoParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const todo = await todoService.findById(id)
    
    if (!todo) {
      return c.json({
        success: false,
        message: 'Todo not found'
      }, 404)
    }

    return c.json({
      success: true,
      data: todo
    })
  } catch (error) {
    return c.json({
      success: false,
      message: 'Failed to fetch todo',
      error: error.message
    }, 500)
  }
})

// POST /api/todos
todos.post('/', zValidator('json', createTodoSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    const todo = await todoService.create(data)
    
    return c.json({
      success: true,
      data: todo,
      message: 'Todo created successfully'
    }, 201)
  } catch (error) {
    return c.json({
      success: false,
      message: 'Failed to create todo',
      error: error.message
    }, 500)
  }
})

// PUT /api/todos/:id
todos.put('/:id', 
  zValidator('param', todoParamsSchema),
  zValidator('json', updateTodoSchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param')
      const data = c.req.valid('json')
      const todo = await todoService.update(id, data)
      
      if (!todo) {
        return c.json({
          success: false,
          message: 'Todo not found'
        }, 404)
      }

      return c.json({
        success: true,
        data: todo,
        message: 'Todo updated successfully'
      })
    } catch (error) {
      return c.json({
        success: false,
        message: 'Failed to update todo',
        error: error.message
      }, 500)
    }
  }
)

// DELETE /api/todos/:id
todos.delete('/:id', zValidator('param', todoParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const deletedCount = await todoService.delete(id)
    
    if (deletedCount === 0) {
      return c.json({
        success: false,
        message: 'Todo not found'
      }, 404)
    }

    return c.json({
      success: true,
      message: 'Todo deleted successfully',
      deletedCount
    })
  } catch (error) {
    return c.json({
      success: false,
      message: 'Failed to delete todo',
      error: error.message
    }, 500)
  }
})

export { todos }
```

## 4. 미들웨어 설계

### 에러 핸들링 미들웨어
```typescript
// backend/src/middleware/error.middleware.ts
import { Context, Next } from 'hono'

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next()
  } catch (error) {
    console.error('API Error:', error)
    
    if (error.name === 'ValidationError') {
      return c.json({
        success: false,
        message: 'Validation failed',
        errors: error.details
      }, 400)
    }

    return c.json({
      success: false,
      message: 'Internal server error'
    }, 500)
  }
}
```

### CORS 설정
```typescript
// backend/src/middleware/cors.middleware.ts
import { cors } from 'hono/cors'

export const corsConfig = cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
})
```

### 로깅 미들웨어
```typescript
// backend/src/middleware/logger.middleware.ts
import { logger } from 'hono/logger'

export const loggerConfig = logger((message) => {
  console.log(`[${new Date().toISOString()}] ${message}`)
})
```

## 5. API 응답 형식 표준화

### 성공 응답
```typescript
interface SuccessResponse<T = any> {
  success: true
  data?: T
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
}
```

### 에러 응답
```typescript
interface ErrorResponse {
  success: false
  message: string
  error?: string
  errors?: Record<string, string[]>
}
```

## 6. 구현 우선순위

### Phase 1: 기본 CRUD API
1. ✅ 기본 라우터 구조 설계
2. GET /api/todos (목록 조회)
3. GET /api/todos/:id (상세 조회)
4. POST /api/todos (생성)
5. PUT /api/todos/:id (수정)
6. DELETE /api/todos/:id (삭제)

### Phase 2: 고급 기능 API
1. PATCH /api/todos/bulk-update (일괄 수정)
2. GET /api/todos/tree (계층 구조)
3. GET /api/todos/analytics (분석 데이터)

### Phase 3: 미들웨어 & 최적화
1. 에러 핸들링 미들웨어
2. 요청 검증 강화
3. API 응답 캐싱
4. 요청 제한 (Rate Limiting)

## 7. 다음 단계

1. **백엔드 서비스 레이어** (`03-backend-services.md`)
2. **프론트엔드 API 클라이언트** (`04-frontend-api-client.md`)
3. **에러 핸들링 전략** (`05-error-handling.md`)
