import { useState } from 'react'
import { Button } from '../ui'
import type { GetApiTodos200TodosItem } from '../../api/model'

export interface TodoItemProps {
  todo: GetApiTodos200TodosItem
  onToggle: (id: string) => void
  onEdit: (todo: GetApiTodos200TodosItem) => void
  onDelete: (id: string) => void
  isToggling?: boolean
  isDeleting?: boolean
}

export function TodoItem({
  todo,
  onToggle,
  onEdit,
  onDelete,
  isToggling = false,
  isDeleting = false,
}: TodoItemProps) {
  const [showActions, setShowActions] = useState(false)

  // 키보드 이벤트 핸들러
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const { key, ctrlKey, metaKey } = event
    const isModifierPressed = ctrlKey || metaKey

    switch (key) {
      case 'Enter':
      case ' ':
        // 스페이스바나 엔터로 완료/미완료 토글
        event.preventDefault()
        onToggle(todo.id)
        break
      case 'e':
      case 'E':
        // E키로 편집
        if (!isModifierPressed) {
          event.preventDefault()
          onEdit(todo)
        }
        break
      case 'Delete':
      case 'Backspace':
        // Delete나 Backspace로 삭제
        if (key === 'Delete' || isModifierPressed) {
          event.preventDefault()
          onDelete(todo.id)
        }
        break
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      className={[
        'group relative bg-white rounded-lg border shadow-sm transition-shadow hover:shadow-md p-4',
        'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
        todo.completed ? 'border-green-200 bg-green-50' : 'border-gray-200',
        isDeleting ? 'opacity-50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onKeyDown={handleKeyDown}
      role="listitem"
      aria-label={`할 일: ${todo.title}${todo.completed ? ' (완료됨)' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onToggle(todo.id)}
          disabled={isToggling}
          className={[
            'flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
            todo.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-green-500',
            isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          ]
            .filter(Boolean)
            .join(' ')}
          title={todo.completed ? '미완료로 표시' : '완료로 표시'}
          aria-label={`${todo.title} ${todo.completed ? '미완료로 변경' : '완료로 변경'}`}
        >
          {isToggling ? (
            <svg
              className="h-3 w-3 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : todo.completed ? (
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : null}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Level 1: 핵심 정보 - 제목 */}
          <h3
            className={[
              'text-base font-semibold text-gray-900 dark:text-gray-100',
              todo.completed ? 'line-through opacity-75' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {todo.title}
          </h3>

          {/* Level 3: 부가 정보 - 설명 */}
          {todo.description && (
            <p
              className={[
                'mt-1 text-sm text-gray-600 dark:text-gray-400 opacity-70',
                todo.completed ? 'line-through opacity-50' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {todo.description}
            </p>
          )}

          {/* Level 2: 중요 메타데이터 */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* 우선순위 - 색상 + 아이콘으로 강화 */}
            <span
              className={[
                'inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border',
                todo.priority === 'urgent'
                  ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                  : todo.priority === 'high'
                    ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
                    : todo.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
                      : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
              ].join(' ')}
            >
              {todo.priority === 'urgent' && '🔥'}
              {todo.priority === 'high' && '⚡'}
              {todo.priority === 'medium' && '📝'}
              {todo.priority === 'low' && '📋'}
              {!todo.priority && '📝'}
              <span className="ml-1">
                {(todo.priority || 'medium').charAt(0).toUpperCase() +
                  (todo.priority || 'medium').slice(1)}
              </span>
            </span>

            {/* 마감일 - 긴급한 경우 강조 */}
            {todo.dueDate && (
              <span
                className={[
                  'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full',
                  new Date(todo.dueDate) < new Date() && !todo.completed
                    ? 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 animate-pulse'
                    : 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
                ].join(' ')}
              >
                📅 {formatDate(todo.dueDate)}
              </span>
            )}
          </div>

          {/* Level 3: 부가 정보 */}
          <div className="mt-2 flex flex-wrap gap-2 opacity-80">
            {/* 카테고리 */}
            <span
              className="inline-flex items-center px-2 py-0.5 text-xs font-medium 
                             bg-blue-100 text-blue-800 rounded-md border border-blue-200
                             dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
            >
              {(todo.category || 'other').charAt(0).toUpperCase() +
                (todo.category || 'other').slice(1)}
            </span>

            {/* 예상 소요시간 */}
            {todo.estimatedMinutes && (
              <span
                className="inline-flex items-center px-2 py-0.5 text-xs font-medium 
                               bg-purple-100 text-purple-800 rounded-md border border-purple-200
                               dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"
              >
                ⏱️ {todo.estimatedMinutes}m
              </span>
            )}
          </div>

          {/* Tags - Level 3 부가 정보 */}
          {todo.tags && todo.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1 opacity-60">
              {todo.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium 
                             bg-gray-100 text-gray-700 rounded-md
                             dark:bg-gray-800 dark:text-gray-300"
                >
                  #{tag}
                </span>
              ))}
              {todo.tags.length > 3 && (
                <span
                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium 
                                 bg-gray-100 text-gray-500 rounded-md
                                 dark:bg-gray-800 dark:text-gray-400"
                >
                  +{todo.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Timestamps - 최하위 정보 */}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 opacity-60">
            <span>Created: {formatDate(todo.createdAt)}</span>
            {todo.updatedAt !== todo.createdAt && (
              <span>Updated: {formatDate(todo.updatedAt)}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div
          className={[
            'flex items-center gap-2 transition-opacity duration-200',
            showActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(todo)}
            className="text-gray-600 hover:text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-label={`${todo.title} 편집`}
            title="편집 (E)"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(todo.id)}
            disabled={isDeleting}
            className="text-gray-600 hover:text-red-600 focus:ring-2 focus:ring-red-500 focus:outline-none"
            aria-label={`${todo.title} 삭제`}
            title="삭제 (Delete)"
          >
            {isDeleting ? (
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
