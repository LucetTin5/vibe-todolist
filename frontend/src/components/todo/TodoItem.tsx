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
        'group relative bg-white dark:bg-gray-800 rounded-lg border shadow-sm transition-shadow hover:shadow-md p-4',
        todo.completed
          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
          : 'border-gray-200 dark:border-gray-700',
        isDeleting ? 'opacity-50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onToggle(todo.id)}
          disabled={isToggling}
          className={[
            'flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            todo.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 dark:border-gray-600 hover:border-green-500',
            isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          ]
            .filter(Boolean)
            .join(' ')}
          title={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
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
          {/* Title */}
          <h3
            className={[
              'text-sm font-medium text-gray-900 dark:text-white',
              todo.completed ? 'line-through opacity-75' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {todo.title}
          </h3>

          {/* Description */}
          {todo.description && (
            <p
              className={[
                'mt-1 text-sm text-gray-600 dark:text-gray-400',
                todo.completed ? 'line-through opacity-75' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {todo.description}
            </p>
          )}

          {/* Enhanced Fields */}
          <div className="mt-3 flex flex-wrap gap-2">
            {/* Priority Badge */}
            <span
              className={[
                'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full',
                todo.priority === 'urgent'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : todo.priority === 'high'
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                    : todo.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
              ].join(' ')}
            >
              {(todo.priority || 'medium').charAt(0).toUpperCase() +
                (todo.priority || 'medium').slice(1)}
            </span>

            {/* Category Badge */}
            <span
              className="inline-flex items-center px-2 py-1 text-xs font-medium 
                             bg-blue-100 text-blue-800 rounded-full 
                             dark:bg-blue-900 dark:text-blue-200"
            >
              {(todo.category || 'other').charAt(0).toUpperCase() +
                (todo.category || 'other').slice(1)}
            </span>

            {/* Due Date */}
            {todo.dueDate && (
              <span
                className={[
                  'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full',
                  new Date(todo.dueDate) < new Date() && !todo.completed
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                ].join(' ')}
              >
                📅 {formatDate(todo.dueDate)}
              </span>
            )}

            {/* Estimated Time */}
            {todo.estimatedMinutes && (
              <span
                className="inline-flex items-center px-2 py-1 text-xs font-medium 
                               bg-purple-100 text-purple-800 rounded-full 
                               dark:bg-purple-900 dark:text-purple-200"
              >
                ⏱️ {todo.estimatedMinutes}m
              </span>
            )}
          </div>

          {/* Tags */}
          {todo.tags && todo.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {todo.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium 
                             bg-gray-100 text-gray-700 rounded-md
                             dark:bg-gray-700 dark:text-gray-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Timestamps */}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
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
            className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
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
            className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
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
