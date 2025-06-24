import type React from 'react'
import { useState } from 'react'
import { KanbanCard } from './KanbanCard'
import { cn } from '../../utils/cn'
import type { GetApiTodos200TodosItem } from '../../api/model'
import type { TodoStatus } from './KanbanView'

interface KanbanColumnProps {
  status: TodoStatus
  title: string
  todos: GetApiTodos200TodosItem[]
  onMoveCard: (
    cardId: string,
    fromStatus: TodoStatus,
    toStatus: TodoStatus,
    newOrder?: number
  ) => void
  onReorderCards: (
    draggedCardId: string,
    targetCardId: string,
    insertPosition: 'before' | 'after'
  ) => void
  onAddTodo?: () => void
  isUpdating: boolean
  isCreating: boolean
  className?: string
  headerClassName?: string
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  todos,
  onMoveCard,
  onReorderCards,
  onAddTodo,
  isUpdating,
  isCreating,
  className = '',
  headerClassName = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    const cardId = e.dataTransfer.getData('text/plain')
    const fromStatus = e.dataTransfer.getData('application/status') as TodoStatus

    if (fromStatus !== status) {
      // 새로운 컬럼의 마지막 순서로 이동
      const newOrder = todos.length
      onMoveCard(cardId, fromStatus, status, newOrder)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // 컬럼 영역을 완전히 벗어났을 때만 isDragOver를 false로 설정
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleCardReorder = (
    draggedCardId: string,
    targetCardId: string,
    insertPosition: 'before' | 'after'
  ) => {
    onReorderCards(draggedCardId, targetCardId, insertPosition)
  }

  return (
    <div
      className={cn(
        'flex-1 min-w-72 sm:min-w-80 lg:min-w-96 flex flex-col rounded-lg',
        'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm',
        'transition-all duration-200',
        isDragOver && 'border-blue-500 dark:border-blue-400 shadow-lg scale-[1.02]',
        className
      )}
    >
      {/* 컬럼 헤더 */}
      <div
        className={cn(
          'px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-gray-700 rounded-t-lg',
          headerClassName
        )}
      >
        <div className="flex items-center justify-between">
          <h3
            className={cn(
              'font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate'
            )}
          >
            {title}
          </h3>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span
              className={cn(
                'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300',
                'text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center'
              )}
            >
              {todos.length}
            </span>
            {(isUpdating || isCreating) && (
              <div
                className={cn(
                  'animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600 dark:border-blue-400'
                )}
              />
            )}
          </div>
        </div>
      </div>

      {/* 카드 드롭 영역 */}
      <div
        className={cn(
          'flex-1 p-3 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto min-h-96',
          isDragOver && 'bg-blue-50 dark:bg-blue-900/20'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* 할 일 추가 영역 (todo 컬럼에만) */}
        {status === 'todo' && onAddTodo && (
          <button
            type="button"
            onClick={onAddTodo}
            className={cn(
              'w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600',
              'text-gray-500 dark:text-gray-400 rounded-lg text-sm',
              'hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400',
              'transition-colors duration-200 flex items-center justify-center gap-2',
              'mb-3'
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>할 일 추가</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            할 일 추가
          </button>
        )}

        {/* 기존 카드들 */}
        {todos.map((todo) => (
          <KanbanCard
            key={todo.id}
            todo={todo}
            status={status}
            onReorder={handleCardReorder}
            isUpdating={isUpdating}
          />
        ))}

        {/* 빈 상태 메시지 (할 일이 없을 때만) */}
        {todos.length === 0 && (
          <div className={cn('text-center text-gray-400 dark:text-gray-500 text-sm py-8')}>
            {status === 'todo' && '아직 할 일이 없습니다'}
            {status === 'in-progress' && '진행 중인 작업이 없습니다'}
            {status === 'done' && '완료된 작업이 없습니다'}
          </div>
        )}
      </div>
    </div>
  )
}
