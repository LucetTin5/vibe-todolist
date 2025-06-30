import type React from 'react'
import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { cn } from '../../utils/cn'
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

export const KanbanCard: React.FC<KanbanCardProps> = ({
  todo,
  status: _status,
  onReorder: _onReorder,
  isUpdating,
}) => {
  const cardRef = useRef<HTMLDivElement>(null)

  // 카드 등장 애니메이션
  useEffect(() => {
    let animation: gsap.core.Tween | null = null

    if (cardRef.current) {
      animation = gsap.fromTo(
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

    return () => {
      animation?.kill()
    }
  }, [])

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', todo.id)
    e.dataTransfer.setData('application/status', _status)
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
      className={cn(
        'relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        'h-40 flex flex-col p-3 sm:p-4 cursor-move shadow-sm hover:shadow-md transition-all duration-200',
        isUpdating && 'cursor-not-allowed opacity-75'
      )}
    >
      {/* 상단: 우선순위 배지 (고정) */}
      <div className="flex justify-end mb-2 flex-shrink-0">
        {todo.priority && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full border ${getPriorityColor(
              todo.priority
            )}`}
          >
            {getPriorityLabel(todo.priority)}
          </span>
        )}
      </div>

      {/* 중간: 제목 (고정) */}
      <h4
        className={cn(
          'font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 text-sm sm:text-base flex-shrink-0'
        )}
      >
        {todo.title}
      </h4>

      {/* 중간: 설명 (유연한 크기) */}
      <div className="flex-1 min-h-0 mb-3">
        {todo.description && (
          <p
            className={cn('text-xs sm:text-sm text-gray-600 dark:text-gray-400 overflow-hidden')}
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {todo.description}
          </p>
        )}
      </div>

      {/* 하단: 메타 정보 (고정) */}
      <div className="flex-shrink-0">
        {/* 첫 번째 줄: 카테고리와 마감일 */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {/* 카테고리 */}
            {todo.category && (
              <span
                className={cn(
                  'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs flex-shrink-0'
                )}
              >
                {todo.category}
              </span>
            )}
          </div>

          {/* 마감일 */}
          {todo.dueDate && (
            <div className="flex items-center space-x-1 flex-shrink-0">
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
              <span
                className={cn(
                  'text-xs',
                  new Date(todo.dueDate) < new Date() &&
                    'text-red-500 dark:text-red-400 font-medium'
                )}
              >
                {formatDate(todo.dueDate)}
              </span>
            </div>
          )}
        </div>

        {/* 두 번째 줄: 태그들 */}
        {todo.tags && todo.tags.length > 0 && (
          <div className="flex items-center space-x-1 min-w-0">
            {todo.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className={cn(
                  'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded text-xs flex-shrink-0'
                )}
              >
                #{tag}
              </span>
            ))}
            {todo.tags.length > 2 && (
              <span className={cn('text-gray-400 dark:text-gray-500 text-xs flex-shrink-0')}>
                +{todo.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 드래그 인디케이터 */}
      <div
        className={cn(
          'absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'
        )}
      >
        <svg
          className={cn('w-4 h-4 text-gray-400 dark:text-gray-500')}
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
