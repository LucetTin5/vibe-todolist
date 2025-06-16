import { useState, useCallback } from 'react'
import { Button } from '../ui'
import { TodoItem } from './TodoItem'
import { TodoForm } from './TodoForm'
import { cn } from '../../utils/cn'
import { useDelayedLoading } from '../../hooks/useDelayedLoading'
import type { GetApiTodos200TodosItem, PostApiTodosBody, GetApiTodosParams } from '../../api/model'

export interface TodoListProps {
  todos: GetApiTodos200TodosItem[]
  filters: GetApiTodosParams
  onFiltersChange: (
    filters: GetApiTodosParams | ((prev: GetApiTodosParams) => GetApiTodosParams)
  ) => void
  onToggleTodo: (id: string) => void
  onCreateTodo: (todo: PostApiTodosBody) => void
  onUpdateTodo: (todo: { id: string } & PostApiTodosBody) => void
  onDeleteTodo: (id: string) => void
  isLoading?: boolean
  isCreating?: boolean
  isUpdating?: boolean
  togglingIds?: string[]
  deletingIds?: string[]
}

export function TodoList({
  todos,
  filters,
  onFiltersChange,
  onToggleTodo,
  onCreateTodo,
  onUpdateTodo,
  onDeleteTodo,
  isLoading = false,
  isCreating = false,
  isUpdating = false,
  togglingIds = [],
  deletingIds = [],
}: TodoListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<GetApiTodos200TodosItem | null>(null)

  // 빠른 응답에서 스켈레톤 깜빡임 방지
  const showSkeleton = useDelayedLoading(isLoading, 200)

  const handleCreateTodo = useCallback(
    (todoData: PostApiTodosBody) => {
      onCreateTodo(todoData)
      setIsFormOpen(false)
    },
    [onCreateTodo]
  )

  const handleUpdateTodo = useCallback(
    (todoData: PostApiTodosBody) => {
      if (editingTodo) {
        onUpdateTodo({ id: editingTodo.id, ...todoData })
        setEditingTodo(null)
      }
    },
    [editingTodo, onUpdateTodo]
  )

  const handleEditTodo = useCallback((todo: GetApiTodos200TodosItem) => {
    setEditingTodo(todo)
  }, [])

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false)
    setEditingTodo(null)
  }, [])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const searchValue = e.target.value
      onFiltersChange((prev: GetApiTodosParams) => ({ ...prev, search: searchValue }))
    },
    [onFiltersChange]
  )

  const handleClearFilters = useCallback(() => {
    onFiltersChange({})
  }, [onFiltersChange])

  const filteredTodos = todos.filter((todo) => {
    if (
      filters.search &&
      !todo.title.toLowerCase().includes(filters.search.toLowerCase()) &&
      !todo.description?.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false
    return true
  })

  const completedTodos = filteredTodos.filter((todo) => todo.completed)
  const pendingTodos = filteredTodos.filter((todo) => !todo.completed)

  // 스켈레톤 컴포넌트를 별도로 정의
  const TodoSkeleton = () => {
    const skeletonKeys = [
      'todo-skeleton-1',
      'todo-skeleton-2',
      'todo-skeleton-3',
      'todo-skeleton-4',
      'todo-skeleton-5',
    ]

    return (
      <div className="space-y-3">
        {skeletonKeys.map((key, i) => (
          <div
            key={key}
            className={cn(
              'bg-white dark:bg-gray-800 rounded-lg',
              'border border-gray-200 dark:border-gray-700 p-4'
            )}
          >
            <div className="animate-pulse">
              <div className="flex items-start gap-3">
                {/* 체크박스 */}
                <div className={cn('h-5 w-5 bg-gray-200 dark:bg-gray-600 rounded border')} />

                <div className="flex-1 space-y-3">
                  {/* 제목 */}
                  <div
                    className={cn(
                      'h-4 bg-gray-200 dark:bg-gray-600 rounded',
                      i % 2 === 0 ? 'w-3/4' : 'w-2/3'
                    )}
                  />

                  {/* 설명 (가끔 없음) */}
                  {i % 3 !== 0 && (
                    <div className={cn('h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2')} />
                  )}

                  {/* 태그와 메타 정보 */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <div className={cn('h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded-full')} />
                      <div className={cn('h-6 w-20 bg-gray-200 dark:bg-gray-600 rounded-full')} />
                    </div>
                    <div className={cn('h-4 w-12 bg-gray-200 dark:bg-gray-600 rounded')} />
                  </div>
                </div>

                {/* 액션 버튼들 */}
                <div className="flex gap-1">
                  <div className={cn('h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded')} />
                  <div className={cn('h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded')} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-lg font-semibold text-gray-900 dark:text-white')}>
            Todos ({filteredTodos.length})
          </h2>
          <p className={cn('text-sm text-gray-600 dark:text-gray-400')}>
            {pendingTodos.length} pending, {completedTodos.length} completed
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>Add Todo</Button>
      </div>

      {/* Filters */}
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg',
          'border border-gray-200 dark:border-gray-700 p-4'
        )}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search todos..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className={cn(
                'w-full rounded-md border border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-700 px-3 py-2 text-sm',
                'text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              )}
            />
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Todo List - 스크롤 가능한 컨테이너 */}
      <div className="flex-1 overflow-y-auto">
        {showSkeleton ? (
          <TodoSkeleton />
        ) : filteredTodos.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className={cn('mt-2 text-sm font-medium text-gray-900 dark:text-white')}>
              No todos
            </h3>
            <p className={cn('mt-1 text-sm text-gray-500 dark:text-gray-400')}>
              {todos.length === 0
                ? 'Get started by creating your first todo.'
                : 'No todos match your current filters.'}
            </p>
            {todos.length === 0 && (
              <div className="mt-6">
                <Button onClick={() => setIsFormOpen(true)}>Create Todo</Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {/* Pending Todos */}
            {pendingTodos.length > 0 && (
              <div className="space-y-3">
                {pendingTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={onToggleTodo}
                    onEdit={handleEditTodo}
                    onDelete={onDeleteTodo}
                    isToggling={togglingIds.includes(todo.id)}
                    isDeleting={deletingIds.includes(todo.id)}
                  />
                ))}
              </div>
            )}

            {/* Completed Todos */}
            {completedTodos.length > 0 && (
              <div className="space-y-3">
                {pendingTodos.length > 0 && (
                  <div className="flex items-center gap-2 pt-6">
                    <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                    <span className="text-sm text-gray-500 dark:text-gray-400 px-3">
                      Completed ({completedTodos.length})
                    </span>
                    <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                  </div>
                )}
                {completedTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={onToggleTodo}
                    onEdit={handleEditTodo}
                    onDelete={onDeleteTodo}
                    isToggling={togglingIds.includes(todo.id)}
                    isDeleting={deletingIds.includes(todo.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Todo Form Modal */}
      <TodoForm
        isOpen={isFormOpen || !!editingTodo}
        onClose={handleCloseForm}
        onSubmit={editingTodo ? handleUpdateTodo : handleCreateTodo}
        initialData={editingTodo || undefined}
        isLoading={isCreating || isUpdating}
      />
    </div>
  )
}
