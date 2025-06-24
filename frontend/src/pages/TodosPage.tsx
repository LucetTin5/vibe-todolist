import { useState, useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { debounce } from 'es-toolkit'
import { TodoList } from '../components/todo'
import { KanbanView } from '../components/kanban'
import { CalendarView } from '../components/calendar'
import {
  useTodos,
  useCreateTodo,
  useUpdateTodo,
  useToggleTodo,
  useDeleteTodo,
  getTodosQueryKey,
} from '../hooks/useTodos'
import { scheduleNotificationsForTodo, deleteNotificationsForTodo } from '../api/notifications'
import { useNotificationContext } from '../contexts/NotificationContext'
import type { GetApiTodosParams, PostApiTodosBody } from '../api/model'

export const TodosPage = () => {
  const location = useLocation()
  const [filters, setFilters] = useState<GetApiTodosParams>({})
  const [debouncedFilters, setDebouncedFilters] = useState<GetApiTodosParams>({})
  const queryClient = useQueryClient()
  const { showToast } = useNotificationContext()

  // 현재 경로에 따른 뷰 모드 결정
  const getViewMode = () => {
    if (location.pathname.startsWith('/kanban')) return 'kanban'
    if (location.pathname.startsWith('/calendar')) return 'calendar'
    return 'list'
  }

  const viewMode = getViewMode()

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
      onSuccess: async (response, variables) => {
        // 모든 todos 관련 쿼리 무효화 (필터와 무관하게)
        queryClient.invalidateQueries({ queryKey: getTodosQueryKey() })
        queryClient.invalidateQueries({ queryKey: ['/api/todos/stats'] })

        // 마감일이 있는 경우 알림 스케줄링
        if (variables.data.dueDate && response?.id) {
          try {
            await scheduleNotificationsForTodo(response.id, variables.data.dueDate)
            console.log('Notifications scheduled for todo:', response.id)
          } catch (error) {
            console.error('Failed to schedule notifications:', error)
            showToast('warning', '알림 설정', '할 일은 생성되었지만 알림 설정에 실패했습니다.')
          }
        }
      },
    },
  })

  const updateTodoMutation = useUpdateTodo({
    mutation: {
      onSuccess: async (_response, variables) => {
        // 모든 todos 관련 쿼리 무효화 (필터와 무관하게)
        queryClient.invalidateQueries({ queryKey: getTodosQueryKey() })
        queryClient.invalidateQueries({ queryKey: ['/api/todos/stats'] })

        // 마감일이 변경된 경우 알림 재스케줄링
        if (variables.data.dueDate) {
          try {
            await scheduleNotificationsForTodo(variables.id, variables.data.dueDate)
            console.log('Notifications rescheduled for todo:', variables.id)
          } catch (error) {
            console.error('Failed to reschedule notifications:', error)
            showToast('warning', '알림 설정', '할 일은 수정되었지만 알림 설정에 실패했습니다.')
          }
        } else {
          // 마감일이 제거된 경우 알림 삭제
          try {
            await deleteNotificationsForTodo(variables.id)
            console.log('Notifications deleted for todo:', variables.id)
          } catch (error) {
            console.error('Failed to delete notifications:', error)
          }
        }
      },
    },
  })

  const toggleTodoMutation = useToggleTodo({
    mutation: {
      onMutate: async (variables) => {
        // 현재 필터에 해당하는 쿼리 키 생성
        const queryKey = getTodosQueryKey(debouncedFilters)

        // 진행 중인 쿼리 취소
        await queryClient.cancelQueries({ queryKey })

        // 이전 데이터 백업
        const previousTodos = queryClient.getQueryData(queryKey)

        // Optimistic Update
        queryClient.setQueryData(queryKey, (old: unknown) => {
          if (!old) return old
          const data = old as {
            todos: Array<{ id: string; completed: boolean; status: string }>
          }
          return {
            ...data,
            todos: data.todos.map((todo) =>
              todo.id === variables.id
                ? {
                    ...todo,
                    completed: !todo.completed,
                    status: todo.status === 'completed' ? 'pending' : 'completed',
                  }
                : todo
            ),
          }
        })

        return { previousTodos, queryKey }
      },
      onError: (_err, _variables, context) => {
        // 실패 시 이전 데이터로 롤백
        if (context?.previousTodos && context?.queryKey) {
          queryClient.setQueryData(context.queryKey, context.previousTodos)
        }
      },
      onSettled: () => {
        // 성공/실패 관계없이 데이터 동기화
        queryClient.invalidateQueries({ queryKey: getTodosQueryKey() })
        queryClient.invalidateQueries({ queryKey: ['/api/todos/stats'] })
      },
    },
  })

  const deleteTodoMutation = useDeleteTodo({
    mutation: {
      onMutate: async (variables) => {
        // 현재 필터에 해당하는 쿼리 키 생성
        const queryKey = getTodosQueryKey(debouncedFilters)

        // 진행 중인 쿼리 취소
        await queryClient.cancelQueries({ queryKey })

        // 이전 데이터 백업
        const previousTodos = queryClient.getQueryData(queryKey)

        // Optimistic Update
        queryClient.setQueryData(queryKey, (old: unknown) => {
          if (!old) return old
          const data = old as { todos: Array<{ id: string }> }
          return {
            ...data,
            todos: data.todos.filter((todo) => todo.id !== variables.id),
          }
        })

        return { previousTodos, queryKey }
      },
      onSuccess: async (_response, variables) => {
        // 알림 삭제
        try {
          await deleteNotificationsForTodo(variables.id)
          console.log('Notifications deleted for todo:', variables.id)
        } catch (error) {
          console.error('Failed to delete notifications:', error)
        }
      },
      onError: (_err, _variables, context) => {
        // 실패 시 이전 데이터로 롤백
        if (context?.previousTodos && context?.queryKey) {
          queryClient.setQueryData(context.queryKey, context.previousTodos)
        }
      },
      onSettled: () => {
        // 성공/실패 관계없이 데이터 동기화
        queryClient.invalidateQueries({ queryKey: getTodosQueryKey() })
        queryClient.invalidateQueries({ queryKey: ['/api/todos/stats'] })
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

  // 칸반 또는 캘린더 뷰는 전체 화면 사용
  if (viewMode === 'kanban') {
    return (
      <KanbanView
        filters={debouncedFilters}
        onFiltersChange={handleFiltersChange}
        onCreateTodo={handleCreateTodo}
      />
    )
  }

  if (viewMode === 'calendar') {
    return (
      <CalendarView
        filters={debouncedFilters}
        todos={todos}
        onFiltersChange={handleFiltersChange}
        onCreateTodo={handleCreateTodo}
        onUpdateTodo={handleUpdateTodo}
        onToggleTodo={handleToggleTodo}
        onDeleteTodo={handleDeleteTodo}
        isCreating={createTodoMutation.isPending}
        isUpdating={updateTodoMutation.isPending}
      />
    )
  }

  // 기본 리스트 뷰
  return (
    <div className="w-full xl:container xl:mx-auto px-4 py-6 h-full">
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
