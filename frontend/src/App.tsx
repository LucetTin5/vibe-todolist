import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { TodoList } from './components/todo'
import { KanbanView } from './components/kanban'
import { AppHeader } from './components/common'
import {
  useTodos,
  useCreateTodo,
  useUpdateTodo,
  useToggleTodo,
  useDeleteTodo,
  getTodosQueryKey,
} from './hooks/useTodos'
import type { GetApiTodosParams, PostApiTodosBody } from './api/model'

type ViewMode = 'list' | 'kanban'

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filters, setFilters] = useState<GetApiTodosParams>({})
  const queryClient = useQueryClient()

  // Queries and Mutations
  const { data: todosResponse, isLoading } = useTodos(filters)
  const todos = todosResponse?.todos || []

  const createTodoMutation = useCreateTodo({
    mutation: {
      onSuccess: () => {
        // Todo 목록 쿼리 무효화하여 새로고침
        queryClient.invalidateQueries({ queryKey: getTodosQueryKey() })
      },
    },
  })

  const updateTodoMutation = useUpdateTodo({
    mutation: {
      onSuccess: () => {
        // Todo 목록 쿼리 무효화하여 새로고침
        queryClient.invalidateQueries({ queryKey: getTodosQueryKey() })
      },
    },
  })

  const toggleTodoMutation = useToggleTodo({
    mutation: {
      onSuccess: () => {
        // Todo 목록 쿼리 무효화하여 새로고침
        queryClient.invalidateQueries({ queryKey: getTodosQueryKey() })
      },
    },
  })

  const deleteTodoMutation = useDeleteTodo({
    mutation: {
      onSuccess: () => {
        // Todo 목록 쿼리 무효화하여 새로고침
        queryClient.invalidateQueries({ queryKey: getTodosQueryKey() })
      },
    },
  })

  // Event Handlers
  const handleCreateTodo = (todoData: PostApiTodosBody) => {
    createTodoMutation.mutate({ data: todoData })
  }

  const handleUpdateTodo = (todoData: { id: string } & PostApiTodosBody) => {
    const { id, ...data } = todoData
    updateTodoMutation.mutate({ id, data })
  }

  const handleToggleTodo = (id: string) => {
    toggleTodoMutation.mutate({ id })
  }

  const handleDeleteTodo = (id: string) => {
    deleteTodoMutation.mutate({ id })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {viewMode === 'kanban' ? (
        <div className="h-screen flex flex-col">
          {/* 공통 헤더 */}
          <AppHeader viewMode={viewMode} onViewModeChange={setViewMode} title="TodoList" />

          {/* 칸반 뷰 */}
          <KanbanView />
        </div>
      ) : (
        <div className="h-screen flex flex-col">
          {/* 공통 헤더 */}
          <AppHeader viewMode={viewMode} onViewModeChange={setViewMode} title="TodoList" />

          {/* 리스트 뷰 */}
          <div className="flex-1 overflow-hidden">
            <div className="container mx-auto max-w-4xl px-4 py-6 h-full">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">할 일 관리</h2>
                  <p className="text-sm text-gray-600">
                    할 일을 추가, 수정, 삭제하고 진행 상황을 관리하세요
                  </p>
                </div>

                <div className="flex-1 overflow-hidden p-6">
                  <TodoList
                    todos={todos}
                    filters={filters}
                    onFiltersChange={setFilters}
                    onToggleTodo={handleToggleTodo}
                    onCreateTodo={handleCreateTodo}
                    onUpdateTodo={handleUpdateTodo}
                    onDeleteTodo={handleDeleteTodo}
                    isLoading={isLoading}
                    isCreating={createTodoMutation.isPending}
                    isUpdating={updateTodoMutation.isPending}
                    togglingIds={
                      toggleTodoMutation.isPending && toggleTodoMutation.variables
                        ? [toggleTodoMutation.variables.id]
                        : []
                    }
                    deletingIds={
                      deleteTodoMutation.isPending && deleteTodoMutation.variables
                        ? [deleteTodoMutation.variables.id]
                        : []
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
