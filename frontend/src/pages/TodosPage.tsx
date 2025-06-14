import { useState, useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { debounce } from 'es-toolkit'
import { TodoList } from '../components/todo'
import {
  useTodos,
  useCreateTodo,
  useUpdateTodo,
  useToggleTodo,
  useDeleteTodo,
} from '../hooks/useTodos'
import type { GetApiTodosParams, PostApiTodosBody } from '../api/model'

export const TodosPage = () => {
  const [filters, setFilters] = useState<GetApiTodosParams>({})
  const [debouncedFilters, setDebouncedFilters] = useState<GetApiTodosParams>({})
  const queryClient = useQueryClient()

  // Debounced filter update function
  const debouncedSetFilters = useMemo(
    () =>
      debounce((newFilters: GetApiTodosParams) => {
        setDebouncedFilters(newFilters)
      }, 300),
    []
  )

  const handleFiltersChange = useCallback(
    (newFilters: GetApiTodosParams | ((prev: GetApiTodosParams) => GetApiTodosParams)) => {
      const resolvedFilters = typeof newFilters === 'function' ? newFilters(filters) : newFilters
      setFilters(resolvedFilters)

      // Debounce API calls for search, but apply other filters immediately
      if ('search' in resolvedFilters && resolvedFilters.search !== debouncedFilters.search) {
        debouncedSetFilters(resolvedFilters)
      } else {
        setDebouncedFilters(resolvedFilters)
      }
    },
    [filters, debouncedFilters.search, debouncedSetFilters]
  )

  // Queries and Mutations - Use debounced filters for API calls
  const { data: todosResponse, isLoading } = useTodos(debouncedFilters)
  const todos = todosResponse?.todos || []

  const createTodoMutation = useCreateTodo({
    mutation: {
      onSuccess: () => {
        // 모든 todos 관련 쿼리 무효화 (필터와 무관하게)
        queryClient.invalidateQueries({ queryKey: ['getGetApiTodos'] })
        queryClient.invalidateQueries({ queryKey: ['getGetApiTodosStats'] })
      },
    },
  })

  const updateTodoMutation = useUpdateTodo({
    mutation: {
      onSuccess: () => {
        // 모든 todos 관련 쿼리 무효화 (필터와 무관하게)
        queryClient.invalidateQueries({ queryKey: ['getGetApiTodos'] })
        queryClient.invalidateQueries({ queryKey: ['getGetApiTodosStats'] })
      },
    },
  })

  const toggleTodoMutation = useToggleTodo({
    mutation: {
      onSuccess: () => {
        // 모든 todos 관련 쿼리 무효화 (필터와 무관하게)
        queryClient.invalidateQueries({ queryKey: ['getGetApiTodos'] })
        queryClient.invalidateQueries({ queryKey: ['getGetApiTodosStats'] })
      },
    },
  })

  const deleteTodoMutation = useDeleteTodo({
    mutation: {
      onSuccess: () => {
        // 모든 todos 관련 쿼리 무효화 (필터와 무관하게)
        queryClient.invalidateQueries({ queryKey: ['getGetApiTodos'] })
        queryClient.invalidateQueries({ queryKey: ['getGetApiTodosStats'] })
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
    <div className="container mx-auto max-w-4xl px-4 py-6 h-full">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">할 일 관리</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            할 일을 추가, 수정, 삭제하고 진행 상황을 관리하세요
          </p>
        </div>

        <div className="flex-1 overflow-hidden p-6">
          <TodoList
            todos={todos}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onToggleTodo={handleToggleTodo}
            onCreateTodo={handleCreateTodo}
            onUpdateTodo={handleUpdateTodo}
            onDeleteTodo={handleDeleteTodo}
            isLoading={isLoading}
            isCreating={createTodoMutation.isPending}
            isUpdating={updateTodoMutation.isPending}
            togglingIds={
              toggleTodoMutation.isPending && toggleTodoMutation.variables?.id
                ? [toggleTodoMutation.variables.id]
                : []
            }
            deletingIds={
              deleteTodoMutation.isPending && deleteTodoMutation.variables?.id
                ? [deleteTodoMutation.variables.id]
                : []
            }
          />
        </div>
      </div>
    </div>
  )
}
