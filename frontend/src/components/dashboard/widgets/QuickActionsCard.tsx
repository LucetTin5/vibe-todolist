import type React from 'react'
import { useNavigate } from 'react-router-dom'

export const QuickActionsCard: React.FC = () => {
  const navigate = useNavigate()

  const actions = [
    {
      id: 'add-todo',
      title: '할 일 추가',
      description: '새로운 할 일을 빠르게 추가',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      ),
      color: 'blue',
      action: () => navigate('/todos'),
    },
    {
      id: 'kanban-view',
      title: '칸반 보드',
      description: '드래그 앤 드롭으로 관리',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2"
          />
        </svg>
      ),
      color: 'purple',
      action: () => navigate('/kanban'),
    },
    {
      id: 'calendar-view',
      title: '캘린더',
      description: '날짜별 일정 확인',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      color: 'green',
      action: () => navigate('/calendar'),
    },
    {
      id: 'todo-list',
      title: '목록 보기',
      description: '전체 할 일 목록',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
      ),
      color: 'orange',
      action: () => navigate('/todos'),
    },
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30',
      purple:
        'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30',
      green:
        'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30',
      orange:
        'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30',
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        빠른 액션
      </h3>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={`
              p-2 sm:p-3 rounded-lg border border-transparent transition-all duration-200
              ${getColorClasses(action.color)}
              hover:shadow-sm hover:scale-105 transform
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              dark:focus:ring-offset-gray-800
            `}
          >
            <div className="flex flex-col items-center text-center space-y-1 sm:space-y-2">
              <div className="p-1.5 sm:p-2 rounded-full bg-white/50 dark:bg-gray-700/50">
                <div className="w-4 h-4 sm:w-5 sm:h-5">{action.icon}</div>
              </div>
              <div>
                <div className="font-medium text-xs sm:text-sm">{action.title}</div>
                <div className="text-xs opacity-75 mt-0.5 sm:mt-1 hidden sm:block">
                  {action.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
