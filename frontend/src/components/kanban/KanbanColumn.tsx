import type React from 'react'
import { KanbanCard } from './KanbanCard'
import { QuickAddTodo } from '../common'
import type { GetApiTodos200TodosItem, PostApiTodosBody } from '../../api/model'
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
  onReorderCards: (reorderedTodos: GetApiTodos200TodosItem[]) => void
  onAddTodo: (todo: PostApiTodosBody) => void
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
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
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
  }

  const handleCardReorder = (
    draggedCardId: string,
    targetCardId: string,
    insertPosition: 'before' | 'after'
  ) => {
    const draggedIndex = todos.findIndex((todo) => todo.id === draggedCardId)
    const targetIndex = todos.findIndex((todo) => todo.id === targetCardId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newTodos = [...todos]
    const [draggedTodo] = newTodos.splice(draggedIndex, 1)

    const insertIndex = insertPosition === 'before' ? targetIndex : targetIndex + 1
    newTodos.splice(insertIndex, 0, draggedTodo)

    onReorderCards(newTodos)
  }

  return (
    <div
      className={`flex-shrink-0 w-72 sm:w-80 lg:w-96 flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {/* 컬럼 헤더 */}
      <div className={`px-3 sm:px-4 py-3 border-b border-gray-200 rounded-t-lg ${headerClassName}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{title}</h3>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center">
              {todos.length}
            </span>
            {(isUpdating || isCreating) && (
              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600" />
            )}
          </div>
        </div>
      </div>

      {/* 카드 드롭 영역 */}
      <div
        className="flex-1 p-3 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto min-h-96"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* 할 일 추가 영역 */}
        <QuickAddTodo
          onAdd={onAddTodo}
          status={status}
          placeholder={`${title}에 추가할 할 일을 입력하세요...`}
          isLoading={isCreating}
        />

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
          <div className="text-center text-gray-400 text-sm py-8">
            {status === 'todo' && '아직 할 일이 없습니다'}
            {status === 'in-progress' && '진행 중인 작업이 없습니다'}
            {status === 'done' && '완료된 작업이 없습니다'}
          </div>
        )}
      </div>
    </div>
  )
}
