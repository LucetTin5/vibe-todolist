import type React from 'react'

interface AppHeaderProps {
  viewMode: 'list' | 'kanban'
  onViewModeChange: (mode: 'list' | 'kanban') => void
  title?: string
  showViewToggle?: boolean
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  viewMode,
  onViewModeChange,
  title = 'TodoList',
  showViewToggle = true,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
          {viewMode === 'kanban' && (
            <div className="hidden md:block text-sm text-gray-600">칸반 보드로 작업을 시각적으로 관리하세요</div>
          )}
        </div>

        {showViewToggle && (
          <div className="flex bg-gray-100 rounded-lg p-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`px-2 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 sm:space-x-2 ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="목록 보기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <title>List view</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              <span className="hidden sm:inline">목록 보기</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('kanban')}
              className={`px-2 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 sm:space-x-2 ${
                viewMode === 'kanban'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="칸반 보드"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <title>Kanban board</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 002 2m0 0v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
              <span className="hidden sm:inline">칸반 보드</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
