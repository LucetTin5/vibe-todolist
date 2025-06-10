import type React from 'react'
import { useState, useMemo, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { QuickAddTodo } from '../common'
import { useTodos, useBulkUpdateTodos, useCreateTodo, getTodosQueryKey } from '../../hooks/useTodos'
import type { PostApiTodosBody } from '../../api/model'

export type TodoStatus = 'todo' | 'in-progress' | 'done'

const COLUMN_CONFIG = {
  todo: {
    title: '할 일',
    color: 'bg-gray-50',
    headerColor: 'bg-gray-100',
  },
  'in-progress': {
    title: '진행 중',
    color: 'bg-blue-50',
    headerColor: 'bg-blue-100',
  },
  done: {
    title: '완료',
    color: 'bg-green-50',
    headerColor: 'bg-green-100',
  },
} as const

export const KanbanView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [expandedSection, setExpandedSection] = useState<TodoStatus | null>('todo') // 모바일용 아코디언
  const queryClient = useQueryClient()

  // GSAP 애니메이션을 위한 refs
  const accordionRefs = useRef<{ [key in TodoStatus]?: HTMLDivElement }>({})
  const arrowRefs = useRef<{ [key in TodoStatus]?: SVGSVGElement }>({})

  // 아코디언 애니메이션 함수
  const toggleAccordion = (status: TodoStatus) => {
    const isCurrentlyExpanded = expandedSection === status
    const newExpandedSection = isCurrentlyExpanded ? null : status

    // 현재 열린 섹션이 있다면 닫기
    if (expandedSection && accordionRefs.current[expandedSection]) {
      gsap.to(accordionRefs.current[expandedSection], {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.inOut',
      })

      // 화살표 회전
      if (arrowRefs.current[expandedSection]) {
        gsap.to(arrowRefs.current[expandedSection], {
          rotation: 0,
          duration: 0.3,
          ease: 'power2.inOut',
        })
      }
    }

    setExpandedSection(newExpandedSection)

    // 새로 선택된 섹션 열기
    if (newExpandedSection && !isCurrentlyExpanded) {
      // 다음 프레임에서 실행하여 DOM 업데이트 후 애니메이션
      requestAnimationFrame(() => {
        const element = accordionRefs.current[newExpandedSection]
        if (element) {
          gsap.fromTo(
            element,
            { height: 0, opacity: 0 },
            {
              height: 'auto',
              opacity: 1,
              duration: 0.4,
              ease: 'power2.out',
            }
          )
        }

        // 화살표 회전
        if (arrowRefs.current[newExpandedSection]) {
          gsap.to(arrowRefs.current[newExpandedSection], {
            rotation: 180,
            duration: 0.4,
            ease: 'power2.out',
          })
        }
      })
    }
  }

  // 초기 화살표 상태 설정
  useEffect(() => {
    for (const status of Object.keys(COLUMN_CONFIG)) {
      const statusKey = status as TodoStatus
      if (arrowRefs.current[statusKey]) {
        gsap.set(arrowRefs.current[statusKey], {
          rotation: expandedSection === statusKey ? 180 : 0,
        })
      }
    }
  }, [expandedSection])

  // Todo 데이터 조회
  const { data: todosResponse, isLoading } = useTodos({
    search: searchTerm || undefined,
    priority:
      priorityFilter !== 'all'
        ? (priorityFilter as 'low' | 'medium' | 'high' | 'urgent')
        : undefined,
    sortBy: 'order',
    sortOrder: 'asc',
  })

  const todos = todosResponse?.todos || []

  // Mutations
  const bulkUpdateMutation = useBulkUpdateTodos({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getTodosQueryKey() })
      },
      onError: (error) => {
        console.error('Bulk update failed:', error)
        // TODO: 에러 토스트 표시
      },
    },
  })

  const createTodoMutation = useCreateTodo({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getTodosQueryKey() })
      },
      onError: (error) => {
        console.error('Create todo failed:', error)
        // TODO: 에러 토스트 표시
      },
    },
  })

  // 컬럼별로 Todo 그룹화
  const columnTodos = useMemo(() => {
    const grouped = {
      todo: todos.filter((todo) => todo.status === 'todo'),
      'in-progress': todos.filter((todo) => todo.status === 'in-progress'),
      done: todos.filter((todo) => todo.status === 'done'),
    }

    // 각 컬럼 내에서 order 순으로 정렬
    for (const status of Object.keys(grouped)) {
      grouped[status as TodoStatus].sort((a, b) => (a.order || 0) - (b.order || 0))
    }

    return grouped
  }, [todos])

  // 카드 이동 핸들러
  const handleMoveCard = async (
    cardId: string,
    fromStatus: TodoStatus,
    toStatus: TodoStatus,
    newOrder?: number
  ) => {
    if (fromStatus === toStatus && newOrder === undefined) return

    try {
      await bulkUpdateMutation.mutateAsync({
        data: {
          data: [
            {
              id: cardId,
              status: toStatus,
              order: newOrder,
            },
          ],
        },
      })
    } catch (error) {
      console.error('Failed to move card:', error)
    }
  }

  // 컬럼 내 카드 순서 변경 핸들러
  const handleReorderCard = async (
    draggedCardId: string,
    targetCardId: string,
    insertPosition: 'before' | 'after'
  ) => {
    // TODO: 실제 드래그 앤 드롭 리오더링 로직 구현
    console.log('Reorder card:', { draggedCardId, targetCardId, insertPosition })
  }

  // 할 일 생성 핸들러
  const handleAddTodo = async (todoData: PostApiTodosBody) => {
    try {
      await createTodoMutation.mutateAsync({ data: todoData })
    } catch (error) {
      console.error('Failed to create todo:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 툴바 */}
      <div className="bg-white border-b border-gray-200 p-3 md:p-4">
        {/* 모바일: 아이콘 중심 레이아웃 */}
        <div className="block sm:hidden">
          <div className="flex items-center justify-between mb-3">
            {/* 통계 아이콘 */}
            <div className="flex items-center space-x-3 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                <span>{todos.length}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full" />
                <span>{columnTodos.todo.length}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                <span>{columnTodos['in-progress'].length}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                <span>{columnTodos.done.length}</span>
              </div>
            </div>

            {/* 필터 버튼 */}
            <div className="flex items-center space-x-2">
              <button type="button" className="p-2 text-gray-500 hover:text-gray-700">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>Search</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
              <button type="button" className="p-2 text-gray-500 hover:text-gray-700">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>Filter</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* 간단한 검색 */}
          <input
            type="search"
            placeholder="검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 태블릿/데스크톱: 기존 레이아웃 */}
        <div className="hidden sm:flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          {/* 왼쪽: 통계 */}
          <div className="flex items-center space-x-6">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600">
              <span className="font-medium">전체: {todos.length}</span>
              <span>할 일: {columnTodos.todo.length}</span>
              <span>진행 중: {columnTodos['in-progress'].length}</span>
              <span>완료: {columnTodos.done.length}</span>
            </div>
          </div>

          {/* 오른쪽: 검색과 필터 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            {/* 검색 */}
            <div className="w-full sm:w-64">
              <input
                type="search"
                placeholder="할 일 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 우선순위 필터 */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 우선순위</option>
              <option value="low">낮음</option>
              <option value="medium">보통</option>
              <option value="high">높음</option>
              <option value="urgent">긴급</option>
            </select>
          </div>
        </div>
      </div>

      {/* 칸반 보드 */}
      <div className="flex-1 overflow-hidden">
        {/* 모바일: 세로 스택 (최대 2개씩 보이도록) */}
        <div className="block md:hidden overflow-y-auto h-full p-4 space-y-4">
          {(Object.keys(COLUMN_CONFIG) as TodoStatus[]).map((status) => {
            const isExpanded = expandedSection === status
            const todoCount = columnTodos[status].length

            return (
              <div key={status} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                {/* 모바일 컬럼 헤더 (클릭 가능) */}
                <button
                  type="button"
                  onClick={() => toggleAccordion(status)}
                  className={`w-full px-4 py-3 rounded-t-lg ${COLUMN_CONFIG[status].headerColor} hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-base">
                      {COLUMN_CONFIG[status].title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center">
                        {todoCount}
                      </span>
                      <svg
                        ref={(el) => {
                          if (el) arrowRefs.current[status] = el
                        }}
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <title>Expand</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      {(bulkUpdateMutation.isPending || createTodoMutation.isPending) && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      )}
                    </div>
                  </div>
                </button>

                {/* 확장 가능한 카드 컨테이너 */}
                {isExpanded && (
                  <div
                    ref={(el) => {
                      if (el) accordionRefs.current[status] = el
                    }}
                    className="p-4 space-y-3 border-t border-gray-200"
                  >
                    {/* 할 일 추가 */}
                    <QuickAddTodo
                      onAdd={handleAddTodo}
                      status={status}
                      placeholder={`${COLUMN_CONFIG[status].title}에 추가...`}
                      isLoading={createTodoMutation.isPending}
                    />

                    {/* 카드들 */}
                    {columnTodos[status].map((todo) => (
                      <KanbanCard
                        key={todo.id}
                        todo={todo}
                        status={status}
                        onReorder={handleReorderCard}
                        isUpdating={bulkUpdateMutation.isPending}
                      />
                    ))}

                    {/* 빈 상태 */}
                    {todoCount === 0 && (
                      <div className="text-center text-gray-400 text-sm py-8">
                        {status === 'todo' && '아직 할 일이 없습니다'}
                        {status === 'in-progress' && '진행 중인 작업이 없습니다'}
                        {status === 'done' && '완료된 작업이 없습니다'}
                      </div>
                    )}
                  </div>
                )}

                {/* 축약된 미리보기 (닫혀있을 때) */}
                {!isExpanded && todoCount > 0 && (
                  <div className="px-4 py-2 text-xs text-gray-500">{todoCount}개의 항목</div>
                )}
              </div>
            )
          })}
        </div>

        {/* 태블릿/데스크톱: 가로 레이아웃 */}
        <div className="hidden md:flex h-full gap-4 lg:gap-6 p-4 lg:p-6 overflow-x-auto scroll-smooth">
          {(Object.keys(COLUMN_CONFIG) as TodoStatus[]).map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              title={COLUMN_CONFIG[status].title}
              todos={columnTodos[status]}
              onMoveCard={handleMoveCard}
              onReorderCards={() => {}}
              onAddTodo={handleAddTodo}
              isUpdating={bulkUpdateMutation.isPending}
              isCreating={createTodoMutation.isPending}
              className={COLUMN_CONFIG[status].color}
              headerClassName={COLUMN_CONFIG[status].headerColor}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
