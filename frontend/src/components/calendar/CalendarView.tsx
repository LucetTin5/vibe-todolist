import type React from 'react'
import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Button } from '../ui/Button'
import { TodoForm } from '../todo/TodoForm'
import { cn } from '../../utils/cn'
import { useTodos } from '../../hooks/useTodos'
import { useDelayedLoading } from '../../hooks/useDelayedLoading'
import type { PostApiTodosBody, GetApiTodosParams } from '../../api/model'

interface CalendarViewProps {
  filters: GetApiTodosParams
  onFiltersChange: (filters: GetApiTodosParams | ((prev: GetApiTodosParams) => GetApiTodosParams)) => void
  onCreateTodo: (todo: PostApiTodosBody) => void
  onUpdateTodo: (todo: { id: string } & PostApiTodosBody) => void
  onToggleTodo: (id: string) => void
  onDeleteTodo: (id: string) => void
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  filters,
  onFiltersChange: _onFiltersChange,
  onCreateTodo,
  onUpdateTodo,
  onToggleTodo,
  onDeleteTodo,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedFormDate, setSelectedFormDate] = useState<Date | null>(null)
  const [editingTodo, setEditingTodo] = useState<any>(null)

  // Todo 데이터 조회
  const { data: todosResponse, isLoading } = useTodos(filters)
  const todos = todosResponse?.todos || []
  
  // 스켈레톤 깜빡임 방지
  const showSkeleton = useDelayedLoading(isLoading, 200)

  // 현재 월의 날짜들 계산
  const monthDays = useMemo(() => {
    const start = startOfMonth(selectedDate)
    const end = endOfMonth(selectedDate)
    return eachDayOfInterval({ start, end })
  }, [selectedDate])

  // 날짜별 todo 그룹화
  const todosByDate = useMemo(() => {
    const grouped: Record<string, typeof todos> = {}
    
    todos.forEach((todo) => {
      if (todo.dueDate) {
        const dateKey = format(new Date(todo.dueDate), 'yyyy-MM-dd')
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(todo)
      }
    })
    
    return grouped
  }, [todos])

  // 특정 날짜의 todo들 가져오기
  const getTodosForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return todosByDate[dateKey] || []
  }

  // 날짜 클릭 핸들러 - Todo 생성
  const handleDateClick = (date: Date) => {
    setSelectedFormDate(date)
    setEditingTodo(null)
    setIsFormOpen(true)
  }

  // Todo 아이템 클릭 핸들러 - Todo 수정
  const handleTodoClick = (todo: any, event: React.MouseEvent) => {
    event.stopPropagation() // 날짜 클릭 이벤트 방지
    setEditingTodo(todo)
    setSelectedFormDate(null)
    setIsFormOpen(true)
  }

  // Todo 체크박스 클릭 핸들러 - 상태 토글
  const handleTodoToggle = (todoId: string, event: React.MouseEvent) => {
    event.stopPropagation() // 다른 클릭 이벤트 방지
    onToggleTodo(todoId)
  }

  // Todo 생성/수정 핸들러
  const handleSubmitTodo = (todoData: PostApiTodosBody) => {
    if (editingTodo) {
      // 수정 모드
      onUpdateTodo({ id: editingTodo.id, ...todoData })
    } else {
      // 생성 모드
      const todoWithDate = {
        ...todoData,
        dueDate: selectedFormDate ? selectedFormDate.toISOString() : undefined,
      }
      onCreateTodo(todoWithDate)
    }
    
    setIsFormOpen(false)
    setSelectedFormDate(null)
    setEditingTodo(null)
  }


  // 상태별 색상 매핑
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'border-l-gray-400'
      case 'in-progress':
        return 'border-l-blue-400'
      case 'done':
        return 'border-l-green-400'
      default:
        return 'border-l-gray-400'
    }
  }

  if (showSkeleton) {
    return <CalendarSkeleton />
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 툴바 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* 월 네비게이션 */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 min-w-[120px] text-center">
              {format(selectedDate, 'yyyy년 M월', { locale: ko })}
            </h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>

          {/* 오늘 버튼 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
          >
            오늘
          </Button>
        </div>
      </div>

      {/* 캘린더 그리드 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* 요일 헤더 */}
          {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
            <div
              key={day}
              className={cn(
                'p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400',
                index === 0 && 'text-red-500 dark:text-red-400', // 일요일
                index === 6 && 'text-blue-500 dark:text-blue-400' // 토요일
              )}
            >
              {day}
            </div>
          ))}

          {/* 날짜 셀들 */}
          {monthDays.map((date) => {
            const dayTodos = getTodosForDate(date)
            const isCurrentDay = isToday(date)
            const dayOfWeek = date.getDay()

            return (
              <div
                key={date.toISOString()}
                className={cn(
                  'min-h-[100px] sm:min-h-[120px] p-1 sm:p-2 border border-gray-200 dark:border-gray-700',
                  'bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700',
                  'transition-colors duration-150'
                )}
                onClick={() => handleDateClick(date)}
              >
                {/* 날짜 숫자 */}
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isCurrentDay && 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs',
                      !isCurrentDay && dayOfWeek === 0 && 'text-red-500 dark:text-red-400', // 일요일
                      !isCurrentDay && dayOfWeek === 6 && 'text-blue-500 dark:text-blue-400', // 토요일
                      !isCurrentDay && dayOfWeek !== 0 && dayOfWeek !== 6 && 'text-gray-900 dark:text-gray-100'
                    )}
                  >
                    {format(date, 'd')}
                  </span>
                  
                  {dayTodos.length > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {dayTodos.length}
                    </span>
                  )}
                </div>

                {/* Todo 목록 */}
                <div className="space-y-1">
                  {dayTodos.slice(0, 3).map((todo) => (
                    <div
                      key={todo.id}
                      className={cn(
                        'text-xs p-1 rounded border-l-2 bg-gray-50 dark:bg-gray-700',
                        getStatusColor(todo.status || 'todo'),
                        'line-clamp-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600',
                        'transition-colors duration-150 group'
                      )}
                      title={`${todo.title} - 클릭하여 수정`}
                      onClick={(e) => handleTodoClick(todo, e)}
                    >
                      <div className="flex items-center gap-1">
                        {/* 체크박스 */}
                        <button
                          onClick={(e) => handleTodoToggle(todo.id, e)}
                          className={cn(
                            'w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center',
                            'hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors',
                            todo.completed 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300 dark:border-gray-500'
                          )}
                        >
                          {todo.completed && (
                            <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        
                        {/* 우선순위 표시 */}
                        {todo.priority && (
                          <span className={cn(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            todo.priority === 'high' && 'bg-red-400',
                            todo.priority === 'medium' && 'bg-yellow-400',
                            todo.priority === 'low' && 'bg-green-400'
                          )} />
                        )}
                        
                        {/* 제목 */}
                        <span className={cn(
                          'truncate flex-1',
                          todo.completed && 'line-through opacity-60'
                        )}>
                          {todo.title}
                        </span>
                        
                        {/* 수정 아이콘 (호버시 표시) */}
                        <svg 
                          className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                    </div>
                  ))}
                  
                  {dayTodos.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{dayTodos.length - 3}개 더
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Todo 생성/수정 모달 */}
      <TodoForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setSelectedFormDate(null)
          setEditingTodo(null)
        }}
        onSubmit={handleSubmitTodo}
        onDelete={onDeleteTodo}
        isLoading={false}
        initialData={editingTodo}
        defaultValues={
          !editingTodo && selectedFormDate
            ? {
                dueDate: format(selectedFormDate, 'yyyy-MM-dd'),
              }
            : undefined
        }
      />
    </div>
  )
}

// 캘린더 스켈레톤 컴포넌트
const CalendarSkeleton = () => {
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 툴바 스켈레톤 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
            <div className="w-24 h-6 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
          </div>
          <div className="w-12 h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
        </div>
      </div>

      {/* 캘린더 스켈레톤 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-7 gap-2">
          {/* 요일 헤더 */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="p-2 text-center">
              <div className="w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mx-auto" />
            </div>
          ))}

          {/* 날짜 셀들 */}
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[120px] p-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg"
            >
              <div className="w-6 h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-2" />
              <div className="space-y-1">
                {Array.from({ length: Math.floor(Math.random() * 3) }).map((_, j) => (
                  <div
                    key={j}
                    className="h-3 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}