import type React from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '../../contexts/AuthContext'
import { useNotificationContext } from '../../contexts/NotificationContext'
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation'
import { cn } from '../../utils/cn'

interface AppHeaderProps {
  currentView: 'dashboard' | 'todos' | 'kanban' | 'calendar'
  title?: string
  showViewToggle?: boolean
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentView,
  title = 'TodoList',
  showViewToggle = true,
}) => {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const { isConnected, connectionError } = useNotificationContext()

  // 키보드 접근성 설정
  const { focusElement } = useKeyboardNavigation({
    onSearch: () => {
      // 검색 입력 필드에 포커스
      focusElement('input[type="search"], input[placeholder*="검색"]')
    },
    onEscape: () => {
      // 현재 포커스된 요소의 blur 처리
      const activeElement = document.activeElement as HTMLElement
      if (activeElement?.blur) {
        activeElement.blur()
      }
    },
  })

  const handleNavigate = (path: string) => {
    navigate(path)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header
      className={cn(
        'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
        'px-3 sm:px-4 py-3 sm:py-4'
      )}
    >
      <div className="w-full xl:container xl:mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
            {title}
          </h2>
          {currentView === 'dashboard' && (
            <div className="hidden xl:block text-sm text-gray-600 dark:text-gray-400">
              전체 현황을 한눈에 확인하세요
            </div>
          )}
          {currentView === 'kanban' && (
            <div className="hidden xl:block text-sm text-gray-600 dark:text-gray-400">
              칸반 보드로 작업을 시각적으로 관리하세요
            </div>
          )}
          {currentView === 'calendar' && (
            <div className="hidden xl:block text-sm text-gray-600 dark:text-gray-400">
              캘린더로 일정을 한눈에 확인하세요
            </div>
          )}
          {currentView === 'todos' && (
            <div className="hidden xl:block text-sm text-gray-600 dark:text-gray-400">
              할 일을 목록으로 관리하세요
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* 알림 연결 상태 표시 */}
          {isAuthenticated && (
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs',
                isConnected
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                  : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
              )}
              title={isConnected ? '알림 연결됨' : connectionError || '알림 연결 안됨'}
            >
              <div
                className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-green-500' : 'bg-red-500')}
              />
              <span className="hidden sm:inline">{isConnected ? '알림' : '연결 끊김'}</span>
            </div>
          )}

          <ThemeToggle />

          {/* 사용자 정보 및 로그아웃 */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-300">
                안녕하세요, {user.name || user.email.split('@')[0]}님
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100',
                  'hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                title="로그아웃"
              >
                <span className="hidden sm:inline">로그아웃</span>
                <svg
                  className="w-4 h-4 sm:hidden"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>로그아웃</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          )}

          {showViewToggle && isAuthenticated && (
            <div className={cn('flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex-shrink-0')}>
              <button
                type="button"
                onClick={() => handleNavigate('/dashboard')}
                className={cn(
                  'px-2 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  'flex items-center space-x-1 sm:space-x-2',
                  'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
                  currentView === 'dashboard'
                    ? 'bg-blue-500 text-white shadow-lg transform scale-105 ring-2 ring-blue-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-100'
                )}
                title="대시보드 (Ctrl+1)"
                aria-label="대시보드로 이동, 단축키: Ctrl+1"
                aria-current={currentView === 'dashboard' ? 'page' : undefined}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>Dashboard</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span className="hidden sm:inline">대시보드</span>
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('/todos')}
                className={cn(
                  'px-2 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  'flex items-center space-x-1 sm:space-x-2',
                  'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
                  currentView === 'todos'
                    ? 'bg-blue-500 text-white shadow-lg transform scale-105 ring-2 ring-blue-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-100'
                )}
                title="목록 보기 (Ctrl+2)"
                aria-label="할 일 목록으로 이동, 단축키: Ctrl+2"
                aria-current={currentView === 'todos' ? 'page' : undefined}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>List view</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                <span className="hidden sm:inline">목록</span>
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('/kanban')}
                className={cn(
                  'px-2 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  'flex items-center space-x-1 sm:space-x-2',
                  'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
                  currentView === 'kanban'
                    ? 'bg-blue-500 text-white shadow-lg transform scale-105 ring-2 ring-blue-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-100'
                )}
                title="칸반 보드 (Ctrl+3)"
                aria-label="칸반 보드로 이동, 단축키: Ctrl+3"
                aria-current={currentView === 'kanban' ? 'page' : undefined}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>Kanban board</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 002 2m0 0v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
                </svg>
                <span className="hidden sm:inline">칸반</span>
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('/calendar')}
                className={cn(
                  'px-2 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  'flex items-center space-x-1 sm:space-x-2',
                  'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
                  currentView === 'calendar'
                    ? 'bg-blue-500 text-white shadow-lg transform scale-105 ring-2 ring-blue-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-100'
                )}
                title="캘린더 (Ctrl+4)"
                aria-label="캘린더로 이동, 단축키: Ctrl+4"
                aria-current={currentView === 'calendar' ? 'page' : undefined}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>Calendar view</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="hidden sm:inline">캘린더</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
