# 📊 데이터 모델 설계

## 1. Todo 엔티티 정의

### 기본 Todo 인터페이스
```typescript
interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  status: 'todo' | 'in-progress' | 'done'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: Date
  startDate?: Date
  parentId?: string  // 서브태스크 지원
  order: number      // 드래그앤드롭 정렬
  createdAt: Date
  updatedAt: Date
}
```

### 데이터베이스 스키마 (향후 확장)
```sql
CREATE TABLE todos (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  status ENUM('todo', 'in-progress', 'done') DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high'),
  due_date DATETIME,
  start_date DATETIME,
  parent_id VARCHAR(36),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (parent_id) REFERENCES todos(id) ON DELETE CASCADE,
  INDEX idx_parent_id (parent_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_due_date (due_date)
);
```

## 2. 타입 정의 파일 구조

### Backend Types (`backend/src/types/`)
```typescript
// todo.types.ts
export interface TodoEntity {
  id: string
  title: string
  description?: string
  completed: boolean
  status: TodoStatus
  priority?: TodoPriority
  dueDate?: Date
  startDate?: Date
  parentId?: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export type TodoStatus = 'todo' | 'in-progress' | 'done'
export type TodoPriority = 'low' | 'medium' | 'high'

export interface CreateTodoRequest {
  title: string
  description?: string
  priority?: TodoPriority
  dueDate?: string
  startDate?: string
  parentId?: string
}

export interface UpdateTodoRequest {
  title?: string
  description?: string
  completed?: boolean
  status?: TodoStatus
  priority?: TodoPriority
  dueDate?: string
  startDate?: string
  order?: number
}
```

### Frontend Types (`frontend/src/types/`)
```typescript
// todo.types.ts
export interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  status: TodoStatus
  priority?: TodoPriority
  dueDate?: Date
  startDate?: Date
  parentId?: string
  order: number
  createdAt: Date
  updatedAt: Date
  subtasks?: Todo[]  // 프론트엔드에서 계층 구조 표현
}

export type TodoStatus = 'todo' | 'in-progress' | 'done'
export type TodoPriority = 'low' | 'medium' | 'high'

export interface TodoFormData {
  title: string
  description?: string
  priority?: TodoPriority
  dueDate?: string
  startDate?: string
  parentId?: string
}

export interface TodoFilters {
  status?: TodoStatus
  priority?: TodoPriority
  completed?: boolean
  startDate?: Date
  endDate?: Date
}

export interface TodoSortOptions {
  field: 'title' | 'createdAt' | 'dueDate' | 'priority' | 'order'
  direction: 'asc' | 'desc'
}
```

## 3. 메모리 기반 스토리지 (초기 구현)

### 인메모리 데이터 저장소
```typescript
// backend/src/utils/in-memory-storage.ts
class InMemoryTodoStorage {
  private todos: Map<string, TodoEntity> = new Map()
  private nextOrderIndex = 0

  async create(todo: Omit<TodoEntity, 'id' | 'createdAt' | 'updatedAt' | 'order'>): Promise<TodoEntity> {
    const id = crypto.randomUUID()
    const now = new Date()
    const newTodo: TodoEntity = {
      ...todo,
      id,
      order: this.nextOrderIndex++,
      createdAt: now,
      updatedAt: now,
    }
    this.todos.set(id, newTodo)
    return newTodo
  }

  async findAll(): Promise<TodoEntity[]> {
    return Array.from(this.todos.values()).sort((a, b) => a.order - b.order)
  }

  async findById(id: string): Promise<TodoEntity | null> {
    return this.todos.get(id) || null
  }

  async update(id: string, updates: Partial<TodoEntity>): Promise<TodoEntity | null> {
    const existing = this.todos.get(id)
    if (!existing) return null

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    }
    this.todos.set(id, updated)
    return updated
  }

  async delete(id: string): Promise<boolean> {
    return this.todos.delete(id)
  }
}

export const todoStorage = new InMemoryTodoStorage()
```

## 4. 데이터 검증 스키마

### Zod 스키마 정의
```typescript
// backend/src/schemas/todo.schema.ts
import { z } from 'zod'

export const todoStatusSchema = z.enum(['todo', 'in-progress', 'done'])
export const todoPrioritySchema = z.enum(['low', 'medium', 'high'])

export const createTodoSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다').max(255, '제목은 255자를 초과할 수 없습니다'),
  description: z.string().max(1000, '설명은 1000자를 초과할 수 없습니다').optional(),
  priority: todoPrioritySchema.optional(),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  parentId: z.string().uuid().optional(),
})

export const updateTodoSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  completed: z.boolean().optional(),
  status: todoStatusSchema.optional(),
  priority: todoPrioritySchema.optional(),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  order: z.number().int().min(0).optional(),
})

export const todoParamsSchema = z.object({
  id: z.string().uuid('유효하지 않은 ID 형식입니다'),
})
```

## 5. 구현 우선순위

### Phase 1: 기본 데이터 구조
1. ✅ 기본 Todo 인터페이스 정의
2. ✅ 타입 파일 생성
3. ✅ 인메모리 스토리지 구현
4. ✅ Zod 검증 스키마 정의

### Phase 2: 계층 구조 지원
1. 서브태스크 관계 관리
2. 계층 구조 쿼리 최적화
3. 진행률 자동 계산 로직

### Phase 3: 데이터베이스 연동 (선택사항)
1. SQLite/PostgreSQL 연동
2. 마이그레이션 스크립트
3. 데이터 백업/복구 기능

## 6. 다음 단계

1. **API 엔드포인트 설계** (`02-api-design.md`)
2. **서비스 레이어 구현** (`03-backend-services.md`)
3. **프론트엔드 상태 관리** (`04-frontend-state.md`)
