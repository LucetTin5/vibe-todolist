# ⚛️ 프론트엔드 아키텍처 설계

## 1. 컴포넌트 아키텍처

### 컴포넌트 디렉토리 구조
```
frontend/src/
├── components/
│   ├── ui/              # 재사용 가능한 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Spinner.tsx
│   │   └── DropdownMenu.tsx
│   ├── todo/            # Todo 관련 컴포넌트
│   │   ├── TodoForm.tsx
│   │   ├── TodoItem.tsx
│   │   ├── TodoList.tsx
│   │   ├── TodoCard.tsx
│   │   └── SubtaskList.tsx
│   ├── layout/          # 레이아웃 컴포넌트
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Navigation.tsx
│   │   └── Layout.tsx
│   └── views/           # 뷰 레벨 컴포넌트
│       ├── ListView.tsx
│       ├── KanbanView.tsx
│       ├── CalendarView.tsx
│       └── DashboardView.tsx
├── hooks/               # 커스텀 훅
│   ├── useTodos.ts
│   ├── useTodoForm.ts
│   ├── useDragAndDrop.ts
│   └── useLocalStorage.ts
├── utils/               # 유틸리티 함수
│   ├── api.ts
│   ├── date.ts
│   ├── validation.ts
│   └── constants.ts
├── types/               # 타입 정의
│   ├── todo.types.ts
│   ├── api.types.ts
│   └── common.types.ts
└── styles/              # 스타일 파일
    ├── globals.css
    ├── components.css
    └── utilities.css
```

### 상태 관리 전략
```
Local State (useState/useReducer)
├── 폼 입력값
├── UI 상태 (모달 열림/닫힘)
└── 일시적 상태

Server State (React Query)
├── Todo 데이터
├── 분석 데이터
└── API 캐싱

Global State (Context API)
├── 현재 뷰 모드
├── 필터/정렬 설정
└── 사용자 설정
```

## 2. 핵심 커스텀 훅 설계

### useTodos 훅
```typescript
// frontend/src/hooks/useTodos.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { todoApi } from '../utils/api'
import { Todo, CreateTodoRequest, UpdateTodoRequest, TodoFilters } from '../types/todo.types'

export const useTodos = (filters?: TodoFilters) => {
  const queryClient = useQueryClient()

  // Todo 목록 조회
  const {
    data: todos,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['todos', filters],
    queryFn: () => todoApi.getTodos(filters),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000,   // 10분
  })

  // Todo 생성
  const createMutation = useMutation({
    mutationFn: (data: CreateTodoRequest) => todoApi.createTodo(data),
    onSuccess: (newTodo) => {
      // 캐시 업데이트
      queryClient.setQueryData(['todos', filters], (old: Todo[] = []) => {
        return [...old, newTodo]
      })
      
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })

  // Todo 수정
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTodoRequest }) => 
      todoApi.updateTodo(id, data),
    onSuccess: (updatedTodo) => {
      // 낙관적 업데이트
      queryClient.setQueryData(['todos', filters], (old: Todo[] = []) => {
        return old.map(todo => 
          todo.id === updatedTodo.id ? updatedTodo : todo
        )
      })
      
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })

  // Todo 삭제
  const deleteMutation = useMutation({
    mutationFn: (id: string) => todoApi.deleteTodo(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['todos', filters], (old: Todo[] = []) => {
        return old.filter(todo => todo.id !== deletedId)
      })
      
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })

  // 일괄 업데이트 (드래그앤드롭용)
  const bulkUpdateMutation = useMutation({
    mutationFn: (updates: Array<{ id: string; order?: number; status?: string }>) =>
      todoApi.bulkUpdateTodos(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  return {
    // 데이터
    todos: todos?.data || [],
    total: todos?.total || 0,
    pagination: todos?.pagination,
    
    // 상태
    isLoading,
    error,
    
    // 액션
    createTodo: createMutation.mutate,
    updateTodo: updateMutation.mutate,
    deleteTodo: deleteMutation.mutate,
    bulkUpdate: bulkUpdateMutation.mutate,
    refetch,
    
    // 로딩 상태
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkUpdating: bulkUpdateMutation.isPending,
  }
}
```

### useTodoForm 훅
```typescript
// frontend/src/hooks/useTodoForm.ts
import { useState, useCallback } from 'react'
import { z } from 'zod'
import { TodoFormData } from '../types/todo.types'

const todoFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(255, '제목이 너무 깁니다'),
  description: z.string().max(1000, '설명이 너무 깁니다').optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  parentId: z.string().optional(),
})

export const useTodoForm = (initialData?: Partial<TodoFormData>) => {
  const [formData, setFormData] = useState<TodoFormData>({
    title: '',
    description: '',
    priority: undefined,
    dueDate: '',
    startDate: '',
    parentId: undefined,
    ...initialData,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = useCallback(<K extends keyof TodoFormData>(
    field: K,
    value: TodoFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // 필드별 실시간 검증
    if (errors[field]) {
      try {
        todoFormSchema.shape[field]?.parse(value)
        setErrors(prev => {
          const { [field]: _, ...rest } = prev
          return rest
        })
      } catch (error) {
        // 검증 실패시 에러 유지
      }
    }
  }, [errors])

  const validate = useCallback(() => {
    try {
      todoFormSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(fieldErrors)
      }
      return false
    }
  }, [formData])

  const reset = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      priority: undefined,
      dueDate: '',
      startDate: '',
      parentId: undefined,
    })
    setErrors({})
    setIsSubmitting(false)
  }, [])

  const submit = useCallback(async (
    onSubmit: (data: TodoFormData) => Promise<void>
  ) => {
    if (!validate()) return false

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      reset()
      return true
    } catch (error) {
      console.error('Form submission failed:', error)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validate, reset])

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    validate,
    reset,
    submit,
    isValid: Object.keys(errors).length === 0 && formData.title.length > 0,
  }
}
```

### useDragAndDrop 훅
```typescript
// frontend/src/hooks/useDragAndDrop.ts
import { useState, useCallback } from 'react'
import { Todo } from '../types/todo.types'

interface DragState {
  isDragging: boolean
  draggedItem: Todo | null
  dropTarget: string | null
}

export const useDragAndDrop = (
  todos: Todo[],
  onReorder: (updates: Array<{ id: string; order?: number; status?: string }>) => void
) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    dropTarget: null,
  })

  const handleDragStart = useCallback((todo: Todo) => {
    setDragState({
      isDragging: true,
      draggedItem: todo,
      dropTarget: null,
    })
  }, [])

  const handleDragOver = useCallback((targetId: string) => {
    setDragState(prev => ({
      ...prev,
      dropTarget: targetId,
    }))
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      dropTarget: null,
    })
  }, [])

  const handleDrop = useCallback((targetStatus?: string, targetIndex?: number) => {
    if (!dragState.draggedItem) return

    const draggedItem = dragState.draggedItem
    const updates: Array<{ id: string; order?: number; status?: string }> = []

    // 상태 변경
    if (targetStatus && targetStatus !== draggedItem.status) {
      updates.push({
        id: draggedItem.id,
        status: targetStatus,
      })
    }

    // 순서 변경
    if (targetIndex !== undefined) {
      const reorderedTodos = [...todos]
      const draggedIndex = reorderedTodos.findIndex(t => t.id === draggedItem.id)
      
      if (draggedIndex !== -1) {
        reorderedTodos.splice(draggedIndex, 1)
        reorderedTodos.splice(targetIndex, 0, draggedItem)
        
        // 순서 번호 재계산
        reorderedTodos.forEach((todo, index) => {
          if (todo.order !== index) {
            updates.push({
              id: todo.id,
              order: index,
            })
          }
        })
      }
    }

    if (updates.length > 0) {
      onReorder(updates)
    }

    handleDragEnd()
  }, [dragState.draggedItem, todos, onReorder, handleDragEnd])

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
  }
}
```

## 3. 뷰 컴포넌트 구조

### 메인 앱 컴포넌트
```typescript
// frontend/src/App.tsx
import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Layout } from './components/layout/Layout'
import { ListView } from './components/views/ListView'
import { KanbanView } from './components/views/KanbanView'
import { CalendarView } from './components/views/CalendarView'
import { DashboardView } from './components/views/DashboardView'
import { ViewModeProvider } from './contexts/ViewModeContext'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

export type ViewMode = 'list' | 'kanban' | 'calendar' | 'dashboard'

function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('list')

  const renderView = () => {
    switch (currentView) {
      case 'list':
        return <ListView />
      case 'kanban':
        return <KanbanView />
      case 'calendar':
        return <CalendarView />
      case 'dashboard':
        return <DashboardView />
      default:
        return <ListView />
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ViewModeProvider value={{ currentView, setCurrentView }}>
        <Layout>
          {renderView()}
        </Layout>
      </ViewModeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
```

### 뷰 모드 컨텍스트
```typescript
// frontend/src/contexts/ViewModeContext.tsx
import React, { createContext, useContext } from 'react'
import { ViewMode } from '../App'

interface ViewModeContextType {
  currentView: ViewMode
  setCurrentView: (view: ViewMode) => void
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined)

export const ViewModeProvider: React.FC<{
  value: ViewModeContextType
  children: React.ReactNode
}> = ({ value, children }) => {
  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  )
}

export const useViewMode = () => {
  const context = useContext(ViewModeContext)
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider')
  }
  return context
}
```

### 리스트 뷰 컴포넌트
```typescript
// frontend/src/components/views/ListView.tsx
import React, { useState } from 'react'
import { useTodos } from '../../hooks/useTodos'
import { TodoList } from '../todo/TodoList'
import { TodoForm } from '../todo/TodoForm'
import { FilterBar } from '../ui/FilterBar'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { TodoFilters } from '../../types/todo.types'

export const ListView: React.FC = () => {
  const [filters, setFilters] = useState<TodoFilters>({})
  const [isFormOpen, setIsFormOpen] = useState(false)
  
  const {
    todos,
    total,
    isLoading,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
    isCreating,
  } = useTodos(filters)

  const handleCreateTodo = async (data: CreateTodoRequest) => {
    await createTodo(data)
    setIsFormOpen(false)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">
          에러가 발생했습니다: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          할 일 목록 ({total})
        </h1>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          새 할 일 추가
        </Button>
      </div>

      {/* 필터 바 */}
      <FilterBar filters={filters} onFiltersChange={setFilters} />

      {/* 할 일 목록 */}
      <TodoList
        todos={todos}
        onUpdate={updateTodo}
        onDelete={deleteTodo}
        isLoading={isLoading}
      />

      {/* 할 일 생성 모달 */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="새 할 일 추가"
      >
        <TodoForm
          onSubmit={handleCreateTodo}
          onCancel={() => setIsFormOpen(false)}
          isSubmitting={isCreating}
        />
      </Modal>
    </div>
  )
}
```

## 4. API 클라이언트 구현

### API 유틸리티
```typescript
// frontend/src/utils/api.ts
import { Todo, CreateTodoRequest, UpdateTodoRequest, TodoFilters } from '../types/todo.types'

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class TodoApi {
  private baseUrl = 'http://localhost:3001/api'

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new ApiError(
          data.message || '요청 처리 중 오류가 발생했습니다',
          response.status,
          data
        )
      }

      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError('네트워크 오류가 발생했습니다', 0)
    }
  }

  // Todo CRUD
  async getTodos(filters?: TodoFilters) {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }

    const query = params.toString()
    return this.request<{ data: Todo[]; total: number; pagination: any }>(
      `/todos${query ? `?${query}` : ''}`
    )
  }

  async getTodo(id: string) {
    return this.request<{ data: Todo }>(`/todos/${id}`)
  }

  async createTodo(data: CreateTodoRequest) {
    return this.request<Todo>('/todos', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTodo(id: string, data: UpdateTodoRequest) {
    return this.request<Todo>(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteTodo(id: string) {
    return this.request<{ message: string; deletedCount: number }>(`/todos/${id}`, {
      method: 'DELETE',
    })
  }

  async bulkUpdateTodos(updates: Array<{ id: string; order?: number; status?: string }>) {
    return this.request<{ data: Todo[]; updated: number }>('/todos/bulk-update', {
      method: 'PATCH',
      body: JSON.stringify({ updates }),
    })
  }

  // 고급 기능
  async getTodoTree() {
    return this.request<{ data: any[] }>('/todos/tree')
  }

  async getAnalytics(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return this.request<{ data: any }>(`/todos/analytics${query}`)
  }
}

export const todoApi = new TodoApi()
```

## 5. 구현 우선순위

### Phase 1: 기본 컴포넌트 구조
1. ✅ 앱 구조 및 라우팅 설계
2. ✅ 기본 훅 구현 (useTodos, useTodoForm)
3. ListView 컴포넌트 구현
4. 기본 UI 컴포넌트 구현

### Phase 2: 폼 & 상호작용
1. TodoForm 컴포넌트 구현
2. 폼 검증 및 에러 처리
3. 모달 및 UI 상호작용
4. 로딩 상태 및 에러 처리

### Phase 3: 고급 뷰 구현
1. KanbanView 컴포넌트
2. 드래그앤드롭 기능
3. CalendarView 컴포넌트
4. DashboardView 컴포넌트

### Phase 4: 최적화 & 확장
1. 성능 최적화 (React.memo, useMemo)
2. 무한 스크롤 구현
3. 오프라인 지원
4. PWA 기능 추가

## 6. 다음 단계

1. **TailwindCSS v4 설정** (`advanced/01-styling-setup.md`)
2. **칸반 뷰 구현** (`advanced/02-kanban-view.md`)
3. **캘린더 뷰 구현** (`advanced/03-calendar-view.md`)
4. **대시보드 구현** (`advanced/04-dashboard.md`)
