import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import type { GetApiTodos200TodosItem } from '../../api/model'
import type { TodoStatus } from './KanbanView'

interface KanbanCardProps {
  todo: GetApiTodos200TodosItem
  status: TodoStatus
  onReorder: (
    draggedCardId: string,
    targetCardId: string,
    insertPosition: 'before' | 'after'
  ) => void
  isUpdating: boolean
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ todo, status, onReorder, isUpdating }) => {
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // 카드 등장 애니메이션
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        {
          opacity: 0,
          y: 20,
          scale: 0.9,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          ease: 'power2.out',
        }
      )
    }
  }, [])

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', todo.id)
    e.dataTransfer.setData('application/status', status)
    e.dataTransfer.effectAllowed = 'move'

    // 드래그 시작 애니메이션
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 1.05,
        rotation: 3,
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        zIndex: 1000,
        duration: 0.2,
        ease: 'power2.out',
      })
    }
  }

  const handleDragEnd = () => {
    setDragOverPosition(null)

    // 드래그 종료 애니메이션
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 1,
        rotation: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        zIndex: 'auto',
        duration: 0.3,
        ease: 'power2.out',
      })
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()

    const rect = e.currentTarget.getBoundingClientRect()
    const middleY = rect.top + rect.height / 2
    const position = e.clientY < middleY ? 'before' : 'after'

    setDragOverPosition(position)
  }

  const handleDragLeave = () => {
    setDragOverPosition(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const draggedCardId = e.dataTransfer.getData('text/plain')
    const draggedStatus = e.dataTransfer.getData('application/status') as TodoStatus

    if (draggedCardId !== todo.id && draggedStatus === status && dragOverPosition) {
      onReorder(draggedCardId, todo.id, dragOverPosition)
    }

    setDragOverPosition(null)
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return '긴급'
      case 'high':
        return '높음'
      case 'medium':
        return '보통'
      case 'low':
        return '낮음'
      default:
        return '없음'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return null
    }
  }

  return (
    <div
      ref={cardRef}
      draggable={!isUpdating}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative bg-white rounded-lg border border-gray-200 p-3 sm:p-4 cursor-move shadow-sm hover:shadow-md transition-all duration-200
        ${isUpdating ? 'cursor-not-allowed opacity-75' : ''}
        ${dragOverPosition === 'before' ? 'border-t-2 border-t-blue-500' : ''}
        ${dragOverPosition === 'after' ? 'border-b-2 border-b-blue-500' : ''}
      `}
    >
      {/* 우선순위 배지 */}
      {todo.priority && (
        <div className="flex justify-end mb-2">
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full border ${getPriorityColor(todo.priority)}`}
          >
            {getPriorityLabel(todo.priority)}
          </span>
        </div>
      )}

      {/* 제목 */}
      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2 text-sm sm:text-base">
        {todo.title}
      </h4>

      {/* 설명 */}
      {todo.description && (
        <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{todo.description}</p>
      )}

      {/* 메타 정보 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          {/* 카테고리 */}
          {todo.category && (
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{todo.category}</span>
          )}

          {/* 태그들 */}
          {todo.tags && todo.tags.length > 0 && (
            <div className="flex items-center space-x-1">
              {todo.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                  #{tag}
                </span>
              ))}
              {todo.tags.length > 2 && (
                <span className="text-gray-400">+{todo.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>

        {/* 마감일 */}
        {todo.dueDate && (
          <div className="flex items-center space-x-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <title>Calendar</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className={`${new Date(todo.dueDate) < new Date() ? 'text-red-500' : ''}`}>
              {formatDate(todo.dueDate)}
            </span>
          </div>
        )}
      </div>

      {/* 드래그 인디케이터 */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <title>Drag handle</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </div>
    </div>
  )
}
