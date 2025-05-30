# 🔧 백엔드 서비스 레이어 구현

## 1. 서비스 아키텍처

### 레이어 구조
```
backend/src/
├── controllers/     # 요청/응답 처리
├── services/        # 비즈니스 로직
├── repositories/    # 데이터 액세스
├── utils/          # 유틸리티 함수
└── types/          # 타입 정의
```

### 의존성 주입 패턴
```typescript
// 서비스 -> 리포지토리 -> 스토리지
Controller -> Service -> Repository -> Storage
```

## 2. Todo 서비스 구현

### 서비스 인터페이스
```typescript
// backend/src/services/interfaces/todo.service.interface.ts
export interface ITodoService {
  findAll(params: TodoQueryParams): Promise<PaginatedResult<Todo>>
  findById(id: string): Promise<TodoWithRelations | null>
  findByParentId(parentId: string): Promise<Todo[]>
  create(data: CreateTodoRequest): Promise<Todo>
  update(id: string, data: UpdateTodoRequest): Promise<Todo | null>
  delete(id: string): Promise<number>
  bulkUpdate(updates: BulkUpdateRequest): Promise<Todo[]>
  getTree(): Promise<TodoTreeNode[]>
  getAnalytics(params: AnalyticsParams): Promise<TodoAnalytics>
}

interface PaginatedResult<T> {
  data: T[]
  total: number
  pagination: {
    page: number
    limit: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface TodoWithRelations extends Todo {
  subtasks?: Todo[]
  parent?: Partial<Todo>
}

interface TodoTreeNode extends Todo {
  children: TodoTreeNode[]
  depth: number
  hasChildren: boolean
}
```

### 구체적인 서비스 구현
```typescript
// backend/src/services/todo.service.ts
import { ITodoService } from './interfaces/todo.service.interface'
import { ITodoRepository } from '../repositories/interfaces/todo.repository.interface'
import { CreateTodoRequest, UpdateTodoRequest, TodoQueryParams } from '../types/todo.types'

export class TodoService implements ITodoService {
  constructor(private todoRepository: ITodoRepository) {}

  async findAll(params: TodoQueryParams): Promise<PaginatedResult<Todo>> {
    const {
      status,
      priority,
      completed,
      parentId,
      sort = 'order',
      order = 'asc',
      limit = 20,
      offset = 0
    } = params

    // 필터링 조건 구성
    const filters: Record<string, any> = {}
    if (status) filters.status = status
    if (priority) filters.priority = priority
    if (completed !== undefined) filters.completed = completed
    if (parentId !== undefined) {
      filters.parentId = parentId === 'root' ? null : parentId
    }

    const result = await this.todoRepository.findMany({
      filters,
      sort: { field: sort, direction: order },
      pagination: { limit, offset }
    })

    const total = await this.todoRepository.count(filters)
    const page = Math.floor(offset / limit) + 1

    return {
      data: result,
      total,
      pagination: {
        page,
        limit,
        hasNext: offset + limit < total,
        hasPrev: offset > 0
      }
    }
  }

  async findById(id: string): Promise<TodoWithRelations | null> {
    const todo = await this.todoRepository.findById(id)
    if (!todo) return null

    // 서브태스크 조회
    const subtasks = await this.todoRepository.findMany({
      filters: { parentId: id },
      sort: { field: 'order', direction: 'asc' }
    })

    // 부모 태스크 조회 (있는 경우)
    let parent: Partial<Todo> | undefined
    if (todo.parentId) {
      const parentTodo = await this.todoRepository.findById(todo.parentId)
      if (parentTodo) {
        parent = {
          id: parentTodo.id,
          title: parentTodo.title,
          status: parentTodo.status
        }
      }
    }

    return {
      ...todo,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      parent
    }
  }

  async findByParentId(parentId: string): Promise<Todo[]> {
    return this.todoRepository.findMany({
      filters: { parentId },
      sort: { field: 'order', direction: 'asc' }
    })
  }

  async create(data: CreateTodoRequest): Promise<Todo> {
    // 서브태스크인 경우 부모 존재 확인
    if (data.parentId) {
      const parent = await this.todoRepository.findById(data.parentId)
      if (!parent) {
        throw new Error('Parent todo not found')
      }
    }

    // 새 순서 번호 생성
    const maxOrder = await this.todoRepository.getMaxOrder(data.parentId)

    const todoData = {
      ...data,
      completed: false,
      status: 'todo' as const,
      order: maxOrder + 1,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
    }

    const todo = await this.todoRepository.create(todoData)

    // 부모의 상태 업데이트 (서브태스크가 추가된 경우)
    if (todo.parentId) {
      await this.updateParentProgress(todo.parentId)
    }

    return todo
  }

  async update(id: string, data: UpdateTodoRequest): Promise<Todo | null> {
    const existing = await this.todoRepository.findById(id)
    if (!existing) return null

    // 상태 변경 시 완료 여부 자동 설정
    let updateData = { ...data }
    if (data.status) {
      updateData.completed = data.status === 'done'
    }
    if (data.completed !== undefined) {
      updateData.status = data.completed ? 'done' : 'todo'
    }

    // 날짜 변환
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate)
    if (data.startDate) updateData.startDate = new Date(data.startDate)

    const updated = await this.todoRepository.update(id, updateData)
    if (!updated) return null

    // 부모의 진행률 업데이트
    if (updated.parentId) {
      await this.updateParentProgress(updated.parentId)
    }

    // 서브태스크들의 상태도 업데이트 (부모가 완료된 경우)
    if (updated.completed) {
      await this.updateSubtasksStatus(id, 'done')
    }

    return updated
  }

  async delete(id: string): Promise<number> {
    const todo = await this.todoRepository.findById(id)
    if (!todo) return 0

    // 서브태스크 먼저 삭제
    const subtasks = await this.findByParentId(id)
    let deletedCount = 0

    for (const subtask of subtasks) {
      deletedCount += await this.delete(subtask.id)
    }

    // 자신 삭제
    const deleted = await this.todoRepository.delete(id)
    if (deleted) {
      deletedCount += 1

      // 부모의 진행률 업데이트
      if (todo.parentId) {
        await this.updateParentProgress(todo.parentId)
      }
    }

    return deletedCount
  }

  async bulkUpdate(updates: BulkUpdateRequest): Promise<Todo[]> {
    const results: Todo[] = []
    const parentIds = new Set<string>()

    for (const update of updates.updates) {
      const updated = await this.todoRepository.update(update.id, update)
      if (updated) {
        results.push(updated)
        if (updated.parentId) {
          parentIds.add(updated.parentId)
        }
      }
    }

    // 영향받은 부모들의 진행률 업데이트
    for (const parentId of parentIds) {
      await this.updateParentProgress(parentId)
    }

    return results
  }

  async getTree(): Promise<TodoTreeNode[]> {
    const allTodos = await this.todoRepository.findMany({
      sort: { field: 'order', direction: 'asc' }
    })

    const todoMap = new Map<string, TodoTreeNode>()
    const rootTodos: TodoTreeNode[] = []

    // 모든 todo를 TreeNode로 변환
    for (const todo of allTodos) {
      const node: TodoTreeNode = {
        ...todo,
        children: [],
        depth: 0,
        hasChildren: false
      }
      todoMap.set(todo.id, node)
    }

    // 트리 구조 구성
    for (const todo of allTodos) {
      const node = todoMap.get(todo.id)!

      if (todo.parentId) {
        const parent = todoMap.get(todo.parentId)
        if (parent) {
          parent.children.push(node)
          parent.hasChildren = true
          node.depth = parent.depth + 1
        }
      } else {
        rootTodos.push(node)
      }
    }

    return rootTodos
  }

  async getAnalytics(params: AnalyticsParams): Promise<TodoAnalytics> {
    const { period = 'month', startDate, endDate } = params

    const now = new Date()
    let start: Date
    let end: Date = endDate ? new Date(endDate) : now

    if (startDate) {
      start = new Date(startDate)
    } else {
      switch (period) {
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'quarter':
          start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
          break
        case 'year':
          start = new Date(now.getFullYear(), 0, 1)
          break
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1)
      }
    }

    return this.todoRepository.getAnalytics(start, end)
  }

  // 헬퍼 메서드들
  private async updateParentProgress(parentId: string): Promise<void> {
    const subtasks = await this.findByParentId(parentId)
    if (subtasks.length === 0) return

    const completedCount = subtasks.filter(task => task.completed).length
    const allCompleted = completedCount === subtasks.length
    const hasInProgress = subtasks.some(task => task.status === 'in-progress')

    let newStatus: TodoStatus
    if (allCompleted) {
      newStatus = 'done'
    } else if (hasInProgress || completedCount > 0) {
      newStatus = 'in-progress'
    } else {
      newStatus = 'todo'
    }

    await this.todoRepository.update(parentId, {
      status: newStatus,
      completed: allCompleted
    })
  }

  private async updateSubtasksStatus(parentId: string, status: TodoStatus): Promise<void> {
    const subtasks = await this.findByParentId(parentId)
    
    for (const subtask of subtasks) {
      await this.todoRepository.update(subtask.id, {
        status,
        completed: status === 'done'
      })
      
      // 재귀적으로 하위 서브태스크도 업데이트
      await this.updateSubtasksStatus(subtask.id, status)
    }
  }
}
```

## 3. 리포지토리 패턴 구현

### 리포지토리 인터페이스
```typescript
// backend/src/repositories/interfaces/todo.repository.interface.ts
export interface ITodoRepository {
  findById(id: string): Promise<Todo | null>
  findMany(options: FindManyOptions): Promise<Todo[]>
  create(data: CreateTodoData): Promise<Todo>
  update(id: string, data: Partial<Todo>): Promise<Todo | null>
  delete(id: string): Promise<boolean>
  count(filters: Record<string, any>): Promise<number>
  getMaxOrder(parentId?: string): Promise<number>
  getAnalytics(startDate: Date, endDate: Date): Promise<TodoAnalytics>
}

interface FindManyOptions {
  filters?: Record<string, any>
  sort?: {
    field: string
    direction: 'asc' | 'desc'
  }
  pagination?: {
    limit: number
    offset: number
  }
}
```

### 인메모리 리포지토리 구현
```typescript
// backend/src/repositories/todo.repository.ts
import { ITodoRepository } from './interfaces/todo.repository.interface'
import { todoStorage } from '../utils/in-memory-storage'

export class TodoRepository implements ITodoRepository {
  async findById(id: string): Promise<Todo | null> {
    return todoStorage.findById(id)
  }

  async findMany(options: FindManyOptions): Promise<Todo[]> {
    let todos = await todoStorage.findAll()

    // 필터링
    if (options.filters) {
      todos = todos.filter(todo => {
        return Object.entries(options.filters!).every(([key, value]) => {
          if (value === null) return todo[key] === null
          if (value === undefined) return true
          return todo[key] === value
        })
      })
    }

    // 정렬
    if (options.sort) {
      const { field, direction } = options.sort
      todos.sort((a, b) => {
        let aVal = a[field]
        let bVal = b[field]

        if (aVal < bVal) return direction === 'asc' ? -1 : 1
        if (aVal > bVal) return direction === 'asc' ? 1 : -1
        return 0
      })
    }

    // 페이지네이션
    if (options.pagination) {
      const { limit, offset } = options.pagination
      todos = todos.slice(offset, offset + limit)
    }

    return todos
  }

  async create(data: CreateTodoData): Promise<Todo> {
    return todoStorage.create(data)
  }

  async update(id: string, data: Partial<Todo>): Promise<Todo | null> {
    return todoStorage.update(id, data)
  }

  async delete(id: string): Promise<boolean> {
    return todoStorage.delete(id)
  }

  async count(filters: Record<string, any>): Promise<number> {
    const todos = await this.findMany({ filters })
    return todos.length
  }

  async getMaxOrder(parentId?: string): Promise<number> {
    const todos = await this.findMany({
      filters: { parentId: parentId || null }
    })
    
    if (todos.length === 0) return 0
    return Math.max(...todos.map(t => t.order))
  }

  async getAnalytics(startDate: Date, endDate: Date): Promise<TodoAnalytics> {
    const todos = await todoStorage.findAll()
    
    const filtered = todos.filter(todo => 
      todo.createdAt >= startDate && todo.createdAt <= endDate
    )

    const totalTasks = filtered.length
    const completedTasks = filtered.filter(t => t.completed).length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    const tasksByStatus = filtered.reduce((acc, todo) => {
      acc[todo.status] = (acc[todo.status] || 0) + 1
      return acc
    }, {} as Record<TodoStatus, number>)

    const tasksByPriority = filtered.reduce((acc, todo) => {
      if (todo.priority) {
        acc[todo.priority] = (acc[todo.priority] || 0) + 1
      }
      return acc
    }, {} as Record<TodoPriority, number>)

    const now = new Date()
    const overdueCount = todos.filter(todo => 
      !todo.completed && todo.dueDate && todo.dueDate < now
    ).length

    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const dueTodayCount = todos.filter(todo =>
      !todo.completed && todo.dueDate && 
      todo.dueDate >= new Date(today.getTime() - 24 * 60 * 60 * 1000) &&
      todo.dueDate <= today
    ).length

    return {
      totalTasks,
      completedTasks,
      completionRate: Math.round(completionRate * 100) / 100,
      tasksByStatus,
      tasksByPriority,
      completionTrend: [], // 추후 구현
      overdueCount,
      dueTodayCount
    }
  }
}
```

## 4. 의존성 주입 컨테이너

### 서비스 팩토리
```typescript
// backend/src/services/service-factory.ts
import { TodoService } from './todo.service'
import { TodoRepository } from '../repositories/todo.repository'

class ServiceFactory {
  private static todoService: TodoService | null = null

  static getTodoService(): TodoService {
    if (!this.todoService) {
      const todoRepository = new TodoRepository()
      this.todoService = new TodoService(todoRepository)
    }
    return this.todoService
  }
}

export { ServiceFactory }
```

## 5. 구현 우선순위

### Phase 1: 기본 서비스 구현
1. ✅ 서비스 인터페이스 설계
2. ✅ 기본 CRUD 서비스 구현
3. ✅ 인메모리 리포지토리 구현
4. 서비스 팩토리 패턴 적용

### Phase 2: 고급 기능 서비스
1. 계층 구조 관리 로직
2. 일괄 업데이트 서비스
3. 분석 데이터 서비스
4. 진행률 자동 계산

### Phase 3: 최적화 & 확장
1. 캐싱 레이어 추가
2. 데이터베이스 리포지토리 구현
3. 백그라운드 작업 처리
4. 성능 모니터링

## 6. 다음 단계

1. **컨트롤러 레이어 구현** (`04-controllers.md`)
2. **프론트엔드 상태 관리** (`05-frontend-state.md`)
3. **테스트 전략** (`06-testing-strategy.md`)
