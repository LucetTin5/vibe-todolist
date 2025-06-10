import type React from 'react'
import { useState } from 'react'
import type { PostApiTodosBody } from '../../api/model'
import type { TodoStatus } from '../kanban/KanbanView'

interface QuickAddTodoProps {
  onAdd: (todo: PostApiTodosBody) => void
  status?: TodoStatus
  placeholder?: string
  isLoading?: boolean
}

export const QuickAddTodo: React.FC<QuickAddTodoProps> = ({
  onAdd,
  status = 'todo',
  placeholder = '할 일을 입력하세요...',
  isLoading = false,
}) => {
  const [title, setTitle] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const todo: PostApiTodosBody = {
      title: title.trim(),
      status,
      priority: 'medium',
      category: 'other',
    }

    onAdd(todo)
    setTitle('')
    setIsExpanded(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setTitle('')
      setIsExpanded(false)
    }
  }

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <title>Add</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        <span>할 일 추가</span>
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
    >
      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={3}
        disabled={isLoading}
      />
      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-gray-500">Enter로 저장, Esc로 취소</div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              setTitle('')
              setIsExpanded(false)
            }}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            disabled={isLoading}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!title.trim() || isLoading}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '추가 중...' : '추가'}
          </button>
        </div>
      </div>
    </form>
  )
}
