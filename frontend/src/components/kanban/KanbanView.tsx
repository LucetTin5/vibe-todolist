import type React from 'react'
import { useState, useMemo, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { TodoForm } from '../todo/TodoForm'
import { cn } from '../../utils/cn'
import { useDelayedLoading } from '../../hooks/useDelayedLoading'
import { useTodos, useBulkUpdateTodos, getTodosQueryKey } from '../../hooks/useTodos'
import type { PostApiTodosBody, GetApiTodosParams } from '../../api/model'

export type TodoStatus = 'todo' | 'in-progress' | 'done'

const COLUMN_CONFIG = {
  todo: {
    title: '할 일',
    color: 'bg-gray-50 dark:bg-gray-800',
    headerColor: 'bg-gray-100 dark:bg-gray-700',
  },
  'in-progress': {
    title: '진행 중',
    color: 'bg-blue-50 dark:bg-blue-900/20',
    headerColor: 'bg-blue-100 dark:bg-blue-800/30',
  },
  done: {
    title: '완료',
    color: 'bg-green-50 dark:bg-green-900/20',
    headerColor: 'bg-green-100 dark:bg-green-800/30',
  },
} as const

interface KanbanViewProps {
  filters: GetApiTodosParams
  onFiltersChange: (
    filters: GetApiTodosParams | ((prev: GetApiTodosParams) => GetApiTodosParams)
  ) => void
  onCreateTodo: (todo: PostApiTodosBody) => void
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  filters,
  onFiltersChange: _onFiltersChange,
  onCreateTodo,
}) => {
  const [expandedSection, setExpandedSection] = useState<TodoStatus | null>('todo') // 모바일용 아코디언
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<TodoStatus>('todo')
  const queryClient = useQueryClient()

  // GSAP 애니메이션을 위한 refs
  const accordionRefs = useRef<{ [key in TodoStatus]?: HTMLDivElement }>({})
  const arrowRefs = useRef<{ [key in TodoStatus]?: SVGSVGElement }>({})

  // 아코디언 애니메이션 함수 (성능 최적화)
  const toggleAccordion = (status: TodoStatus) => {
    const isCurrentlyExpanded = expandedSection === status
    const newExpandedSection = isCurrentlyExpanded ? null : status

    // 현재 열린 섹션 닫기
    if (expandedSection && accordionRefs.current[expandedSection]) {
      const currentElement = accordionRefs.current[expandedSection]
      const currentArrow = arrowRefs.current[expandedSection]

      // 현재 높이를 명시적으로 설정 (auto에서 고정값으로)
      const currentHeight = currentElement.getBoundingClientRect().height
      gsap.set(currentElement, { height: currentHeight, overflow: 'hidden' })

      const timeline = gsap.timeline({
        onComplete: () => {
          setExpandedSection(newExpandedSection)

          // 새로운 섹션 열기
          if (newExpandedSection && accordionRefs.current[newExpandedSection]) {
            requestAnimationFrame(() => {
              const newElement = accordionRefs.current[newExpandedSection]
              const newArrow = arrowRefs.current[newExpandedSection]

              if (newElement) {
                const targetHeight = newElement.scrollHeight

                gsap.fromTo(
                  newElement,
                  {
                    height: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                    opacity: 0,
                    overflow: 'hidden',
                  },
                  {
                    height: targetHeight,
                    paddingTop: '1rem',
                    paddingBottom: '1rem',
                    opacity: 1,
                    duration: 0.3,
                    ease: 'power2.out',
                    onComplete: () => {
                      // 애니메이션 완료 후 원래 상태로 복원
                      gsap.set(newElement, {
                        height: 'auto',
                        overflow: 'visible',
                        paddingTop: '',
                        paddingBottom: '',
                      })
                    },
                  }
                )
              }

              // 새 화살표 회전
              if (newArrow) {
                gsap.to(newArrow, {
                  rotation: 180,
                  duration: 0.3,
                  ease: 'power2.out',
                })
              }
            })
          }
        },
      })

      // 더 부드러운 닫기 애니메이션 (padding 포함)
      timeline.to(currentElement, {
        height: 0,
        paddingTop: 0,
        paddingBottom: 0,
        opacity: 0,
        duration: 0.35,
        ease: 'power2.inOut',
      })

      // 현재 화살표 회전 (동시에)
      if (currentArrow) {
        timeline.to(
          currentArrow,
          {
            rotation: 0,
            duration: 0.35,
            ease: 'power2.inOut',
          },
          0
        )
      }
    } else {
      // 단순히 새 섹션 열기
      setExpandedSection(newExpandedSection)

      if (newExpandedSection && accordionRefs.current[newExpandedSection]) {
        const element = accordionRefs.current[newExpandedSection]
        const arrow = arrowRefs.current[newExpandedSection]

        requestAnimationFrame(() => {
          const targetHeight = element.scrollHeight

          gsap.fromTo(
            element,
            {
              height: 0,
              paddingTop: 0,
              paddingBottom: 0,
              opacity: 0,
              overflow: 'hidden',
            },
            {
              height: targetHeight,
              paddingTop: '1rem',
              paddingBottom: '1rem',
              opacity: 1,
              duration: 0.3,
              ease: 'power2.out',
              onComplete: () => {
                // 애니메이션 완료 후 원래 상태로 복원
                gsap.set(element, {
                  height: 'auto',
                  overflow: 'visible',
                  paddingTop: '',
                  paddingBottom: '',
                })
              },
            }
          )

          // 화살표 회전
          if (arrow) {
            gsap.to(arrow, {
              rotation: 180,
              duration: 0.3,
              ease: 'power2.out',
            })
          }
        })
      }
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

  // Todo 데이터 조회 - Use shared filters with kanban-specific sorting
  const kanbanFilters = {
    ...filters,
    sortBy: 'order' as const,
    sortOrder: 'asc' as const,
  }
  const { data: todosResponse, isLoading } = useTodos(kanbanFilters)

  const todos = todosResponse?.todos || []

  // 빠른 응답에서 스켈레톤 깜빡임 방지
  const showSkeleton = useDelayedLoading(isLoading, 200)

  // Mutations
  const bulkUpdateMutation = useBulkUpdateTodos({
    mutation: {
      onSuccess: () => {
        // 캐시 무효화로 최신 데이터 다시 가져오기
        queryClient.invalidateQueries({ queryKey: getTodosQueryKey() })
      },
      onError: (error) => {
        console.error('Bulk update failed:', error)
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
      // API 호출 먼저 실행 (optimistic update 제거)
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

      // 성공 시 캐시 무효화는 mutation의 onSuccess에서 처리됨
    } catch (error) {
      console.error('Failed to move card:', error)
      // TODO: 사용자에게 에러 알림
    }
  }

  // 컬럼 내 카드 순서 변경 핸들러
  const handleReorderCard = async (
    draggedCardId: string,
    targetCardId: string,
    insertPosition: 'before' | 'after'
  ) => {
    // TODO: 실제 드래그 앤 드롭 리오더링 로직 구현
    console.log('Reorder card:', {
      draggedCardId,
      targetCardId,
      insertPosition,
    })
  }

  // 할 일 생성 모달 열기
  const handleOpenAddTodo = (status: TodoStatus = 'todo') => {
    setSelectedStatus(status)
    setIsFormOpen(true)
  }

  // 할 일 생성 핸들러
  const handleCreateTodo = (todoData: PostApiTodosBody) => {
    const todoWithStatus = {
      ...todoData,
      status: selectedStatus,
    }
    onCreateTodo(todoWithStatus)
    setIsFormOpen(false)
  }

  // 칸반 스켈레톤 컴포넌트
  const KanbanSkeleton = () => {
    const columnKeys = ['kanban-todo', 'kanban-progress', 'kanban-done']
    const cardSkeletonKeys = [
      ['todo-card-1', 'todo-card-2'],
      ['progress-card-1', 'progress-card-2', 'progress-card-3'],
      ['done-card-1', 'done-card-2', 'done-card-3', 'done-card-4'],
    ]

    return (
      <div
        className={cn(
          'hidden md:flex h-full gap-4 lg:gap-6 p-4 lg:p-6 overflow-x-auto justify-center'
        )}
      >
        <div className="w-full xl:container xl:mx-auto flex gap-4 lg:gap-6">
          {/* 3개의 컬럼 스켈레톤 */}
          {columnKeys.map((columnKey, columnIndex) => (
            <div
              key={columnKey}
              className={cn(
                'flex-shrink-0 w-72 sm:w-80 lg:w-96 flex flex-col rounded-lg',
                'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm'
              )}
            >
              {/* 컬럼 헤더 스켈레톤 */}
              <div
                className={cn(
                  'px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-gray-700 rounded-t-lg',
                  columnIndex === 0 && 'bg-gray-100 dark:bg-gray-700',
                  columnIndex === 1 && 'bg-blue-100 dark:bg-blue-800/30',
                  columnIndex === 2 && 'bg-green-100 dark:bg-green-800/30'
                )}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={cn('h-5 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse')}
                  />
                  <div
                    className={cn(
                      'h-6 w-8 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse'
                    )}
                  />
                </div>
              </div>

              {/* 카드 스켈레톤들 */}
              <div
                className={cn('flex-1 p-3 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto min-h-96')}
              >
                {/* QuickAdd 스켈레톤 */}
                <div
                  className={cn(
                    'w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg animate-pulse'
                  )}
                >
                  <div className={cn('h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded mx-auto')} />
                </div>

                {/* 카드 스켈레톤들 */}
                {cardSkeletonKeys[columnIndex]?.map((cardKey, cardIndex) => (
                  <div
                    key={cardKey}
                    className={cn(
                      'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
                      'p-3 sm:p-4 shadow-sm animate-pulse'
                    )}
                  >
                    {/* 우선순위 배지 */}
                    <div className="flex justify-end mb-2">
                      <div className={cn('h-5 w-12 bg-gray-200 dark:bg-gray-600 rounded-full')} />
                    </div>

                    {/* 제목 */}
                    <div
                      className={cn(
                        'h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2',
                        cardIndex % 2 === 0 ? 'w-3/4' : 'w-2/3'
                      )}
                    />

                    {/* 설명 (가끔 없음) */}
                    {cardIndex % 3 !== 0 && (
                      <div className={cn('h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-3')} />
                    )}

                    {/* 메타 정보 */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <div className={cn('h-5 w-12 bg-gray-200 dark:bg-gray-600 rounded')} />
                        <div className={cn('h-4 w-8 bg-gray-200 dark:bg-gray-600 rounded')} />
                      </div>
                      <div className={cn('h-4 w-10 bg-gray-200 dark:bg-gray-600 rounded')} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 모바일 스켈레톤
  const MobileKanbanSkeleton = () => {
    const mobileKeys = ['mobile-todo', 'mobile-progress', 'mobile-done']

    return (
      <div className="block md:hidden overflow-y-auto h-full p-4 space-y-4">
        {mobileKeys.map((key, i) => (
          <div
            key={key}
            className={cn(
              'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm'
            )}
          >
            <div
              className={cn(
                'w-full px-4 py-3 rounded-t-lg animate-pulse',
                i === 0 && 'bg-gray-100 dark:bg-gray-700',
                i === 1 && 'bg-blue-100 dark:bg-blue-800/30',
                i === 2 && 'bg-green-100 dark:bg-green-800/30'
              )}
            >
              <div className="flex items-center justify-between">
                <div className={cn('h-5 w-16 bg-gray-200 dark:bg-gray-600 rounded')} />
                <div className={cn('h-6 w-8 bg-gray-200 dark:bg-gray-600 rounded-full')} />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('h-full flex flex-col bg-gray-50 dark:bg-gray-900')}>
      {/* 툴바 */}
      <div
        className={cn(
          'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 md:p-4'
        )}
      >
        <div className="w-full xl:container xl:mx-auto">
          {/* 모바일: 아이콘 중심 레이아웃 */}
          <div className="block sm:hidden">
            <div className="flex items-center justify-between mb-3">
              {/* 통계 아이콘 */}
              <div
                className={cn(
                  'flex items-center space-x-3 text-xs text-gray-600 dark:text-gray-400'
                )}
              >
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
                <button
                  type="button"
                  className={cn(
                    'p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  )}
                >
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
                <button
                  type="button"
                  className={cn(
                    'p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  )}
                >
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
          </div>

          {/* 태블릿/데스크톱: 기존 레이아웃 */}
          <div className="hidden sm:flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            {/* 왼쪽: 통계 */}
            <div className="flex items-center space-x-6">
              <div
                className={cn(
                  'flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400'
                )}
              >
                <span className="font-medium">전체: {todos.length}</span>
                <span>할 일: {columnTodos.todo.length}</span>
                <span>진행 중: {columnTodos['in-progress'].length}</span>
                <span>완료: {columnTodos.done.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 칸반 보드 */}
      <div className="flex-1 overflow-hidden">
        {showSkeleton ? (
          <>
            <MobileKanbanSkeleton />
            <KanbanSkeleton />
          </>
        ) : (
          <>
            {/* 모바일: 세로 스택 (최대 2개씩 보이도록) */}
            <div className="block md:hidden overflow-y-auto h-full p-4 space-y-4">
              {(Object.keys(COLUMN_CONFIG) as TodoStatus[]).map((status) => {
                const isExpanded = expandedSection === status
                const todoCount = columnTodos[status].length

                return (
                  <div
                    key={status}
                    className={cn(
                      'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm'
                    )}
                  >
                    {/* 모바일 컬럼 헤더 (클릭 가능) */}
                    <button
                      type="button"
                      onClick={() => toggleAccordion(status)}
                      className={cn(
                        'w-full px-4 py-3 rounded-t-lg hover:opacity-90 transition-opacity',
                        COLUMN_CONFIG[status].headerColor
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <h3
                          className={cn('font-semibold text-gray-900 dark:text-gray-100 text-base')}
                        >
                          {COLUMN_CONFIG[status].title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span
                            className={cn(
                              'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300',
                              'text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center'
                            )}
                          >
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
                          {bulkUpdateMutation.isPending && (
                            <div
                              className={cn(
                                'animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400'
                              )}
                            />
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
                        className={cn(
                          'p-4 space-y-3 border-t border-gray-200 dark:border-gray-700',
                          'will-change-[height,opacity] transform-gpu'
                        )}
                      >
                        {/* 할 일 추가 (todo 컬럼에만) */}
                        {status === 'todo' && (
                          <button
                            type="button"
                            onClick={() => handleOpenAddTodo('todo')}
                            className={cn(
                              'w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600',
                              'text-gray-500 dark:text-gray-400 rounded-lg text-sm',
                              'hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400',
                              'transition-colors duration-200 flex items-center justify-center gap-2'
                            )}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <title>새 컬럼 추가</title>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                            할 일 추가
                          </button>
                        )}

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
                          <div
                            className={cn(
                              'text-center text-gray-400 dark:text-gray-500 text-sm py-8'
                            )}
                          >
                            {status === 'todo' && '아직 할 일이 없습니다'}
                            {status === 'in-progress' && '진행 중인 작업이 없습니다'}
                            {status === 'done' && '완료된 작업이 없습니다'}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 축약된 미리보기 (닫혀있을 때) */}
                    {!isExpanded && todoCount > 0 && (
                      <div className={cn('px-4 py-2 text-xs text-gray-500 dark:text-gray-400')}>
                        {todoCount}개의 항목
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 태블릿/데스크톱: 가로 레이아웃 */}
            <div
              className={cn(
                'hidden md:flex h-full gap-4 lg:gap-6 p-4 lg:p-6 overflow-x-auto scroll-smooth',
                'justify-center'
              )}
            >
              <div className="w-full xl:container xl:mx-auto flex gap-4 lg:gap-6">
                {(Object.keys(COLUMN_CONFIG) as TodoStatus[]).map((status) => (
                  <KanbanColumn
                    key={status}
                    status={status}
                    title={COLUMN_CONFIG[status].title}
                    todos={columnTodos[status]}
                    onMoveCard={handleMoveCard}
                    onReorderCards={handleReorderCard}
                    onAddTodo={status === 'todo' ? () => handleOpenAddTodo('todo') : undefined}
                    isUpdating={bulkUpdateMutation.isPending}
                    isCreating={false}
                    className={COLUMN_CONFIG[status].color}
                    headerClassName={COLUMN_CONFIG[status].headerColor}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Todo 생성 모달 */}
      <TodoForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateTodo}
        isLoading={false}
      />
    </div>
  )
}
