import type React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../../utils/cn'

// 툴팁 컴포넌트
const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {text}
      </div>
    </div>
  )
}

export const FloatingActionButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const actions = [
    {
      id: 'add-todo',
      title: '할 일 추가',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          aria-label="할 일 추가"
        >
          <title>할 일 추가</title>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => {
        navigate('/todos')
        setIsOpen(false)
      },
    },
    {
      id: 'kanban-view',
      title: '칸반 보드',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          aria-label="칸반 보드"
        >
          <title>칸반 보드</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2"
          />
        </svg>
      ),
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => {
        navigate('/kanban')
        setIsOpen(false)
      },
    },
    {
      id: 'calendar-view',
      title: '캘린더',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <title>캘린더</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      color: 'bg-green-500 hover:bg-green-600',
      action: () => {
        navigate('/calendar')
        setIsOpen(false)
      },
    },
    {
      id: 'todo-list',
      title: '목록 보기',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <title>목록 보기</title>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => {
        navigate('/todos')
        setIsOpen(false)
      },
    },
  ]

  return (
    <>
      {/* 오버레이 (메뉴가 열렸을 때) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="메뉴 닫기"
        />
      )}

      {/* 플로팅 액션 메뉴 */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        {/* 액션 버튼들 */}
        {isOpen && (
          <div className="absolute bottom-14 right-0 flex flex-col-reverse items-end gap-3 animate-fade-in">
            {actions.map((action, index) => (
              <div
                key={action.id}
                className="animate-slide-up"
                style={{
                  animationDelay: `${index * 75}ms`,
                  animationFillMode: 'both',
                }}
              >
                <Tooltip text={action.title}>
                  <button
                    type="button"
                    onClick={action.action}
                    className={cn(
                      'w-12 h-12 rounded-full text-white shadow-lg transition-all duration-200',
                      'hover:scale-110 hover:shadow-xl active:scale-95 transform',
                      'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2',
                      'flex items-center justify-center',
                      action.color
                    )}
                  >
                    {action.icon}
                  </button>
                </Tooltip>
              </div>
            ))}
          </div>
        )}

        {/* 메인 FAB */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg',
            'transition-all duration-300 transform hover:scale-110 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'flex items-center justify-center',
            isOpen && 'rotate-45 bg-red-500 hover:bg-red-600'
          )}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <title>메뉴 열기/닫기</title>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
    </>
  )
}
