# 📋 칸반 뷰 구현 가이드

## 1. 칸반 보드 아키텍처

### 컴포넌트 구조
```
KanbanView
├── KanbanBoard
│   ├── KanbanColumn (todo, in-progress, done)
│   │   ├── KanbanHeader
│   │   ├── KanbanCardList
│   │   │   └── KanbanCard[]
│   │   └── AddCardButton
│   └── ColumnDropZone
└── KanbanToolbar (필터, 정렬, 검색)
```

### 상태 관리 전략
```typescript
interface KanbanState {
  columns: {
    todo: Todo[]
    'in-progress': Todo[]
    done: Todo[]
  }
  dragState: {
    isDragging: boolean
    draggedCard: Todo | null
    draggedFrom: TodoStatus | null
    draggedOver: TodoStatus | null
  }
  filters: KanbanFilters
}
```

## 2. 드래그 앤 드롭 구현

### HTML5 Drag & Drop API 활용
```typescript
// frontend/src/hooks/useKanbanDragDrop.ts
import { useState, useCallback } from 'react'
import { Todo, TodoStatus } from '../types/todo.types'

interface DragState {
  isDragging: boolean
  draggedCard: Todo | null
  draggedFrom: TodoStatus | null
  draggedOver: TodoStatus | null
  draggedOverCard: string | null
}

export const useKanbanDragDrop = (
  onMoveCard: (cardId: string, fromStatus: TodoStatus, toStatus: TodoStatus, newIndex?: number) => void
) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedCard: null,
    draggedFrom: null,
    draggedOver: null,
    draggedOverCard: null,
  })

  const handleDragStart = useCallback((todo: Todo, e: React.DragEvent) => {
    setDragState({
      isDragging: true,
      draggedCard: todo,
      draggedFrom: todo.status,
      draggedOver: null,
      draggedOverCard: null,
    })

    // 드래그 이미지 설정
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
    dragImage.style.transform = 'rotate(5deg)'
    dragImage.style.opacity = '0.8'
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    
    // 드래그 데이터 설정
    e.dataTransfer.setData('application/json', JSON.stringify(todo))
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((columnStatus: TodoStatus, e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    setDragState(prev => ({
      ...prev,
      draggedOver: columnStatus,
    }))
  }, [])

  const handleDragEnterCard = useCallback((cardId: string, e: React.DragEvent) => {
    e.preventDefault()
    setDragState(prev => ({
      ...prev,
      draggedOverCard: cardId,
    }))
  }, [])

  const handleDragLeaveCard = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      draggedOverCard: null,
    }))
  }, [])

  const handleDrop = useCallback((columnStatus: TodoStatus, e: React.DragEvent) => {
    e.preventDefault()
    
    const { draggedCard, draggedFrom } = dragState
    if (!draggedCard || !draggedFrom) return

    if (draggedFrom !== columnStatus) {
      onMoveCard(draggedCard.id, draggedFrom, columnStatus)
    }

    // 상태 초기화
    setDragState({
      isDragging: false,
      draggedCard: null,
      draggedFrom: null,
      draggedOver: null,
      draggedOverCard: null,
    })
  }, [dragState, onMoveCard])

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedCard: null,
      draggedFrom: null,
      draggedOver: null,
      draggedOverCard: null,
    })
  }, [])

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnterCard,
    handleDragLeaveCard,
    handleDrop,
    handleDragEnd,
  }
}
```

### 터치 지원 드래그 앤 드롭
```typescript
// frontend/src/hooks/useTouchDragDrop.ts
import { useState, useCallback, useRef } from 'react'

export const useTouchDragDrop = (onMove: (from: string, to: string) => void) => {
  const [isDragging, setIsDragging] = useState(false)
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null)
  const dragPreview = useRef<HTMLElement | null>(null)

  const handleTouchStart = useCallback((element: HTMLElement, e: React.TouchEvent) => {
    setIsDragging(true)
    setDraggedElement(element)
    
    // 드래그 프리뷰 생성
    const preview = element.cloneNode(true) as HTMLElement
    preview.style.position = 'fixed'
    preview.style.pointerEvents = 'none'
    preview.style.zIndex = '1000'
    preview.style.opacity = '0.8'
    preview.style.transform = 'rotate(5deg) scale(1.05)'
    
    document.body.appendChild(preview)
    dragPreview.current = preview

    // 터치 위치에 따라 프리뷰 위치 설정
    const touch = e.touches[0]
    preview.style.left = `${touch.clientX - preview.offsetWidth / 2}px`
    preview.style.top = `${touch.clientY - preview.offsetHeight / 2}px`
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !dragPreview.current) return

    e.preventDefault()
    const touch = e.touches[0]
    const preview = dragPreview.current

    preview.style.left = `${touch.clientX - preview.offsetWidth / 2}px`
    preview.style.top = `${touch.clientY - preview.offsetHeight / 2}px`

    // 드롭 대상 찾기
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
    const dropZone = elementBelow?.closest('[data-drop-zone]')
    
    if (dropZone) {
      dropZone.classList.add('drop-zone-active')
    }
  }, [isDragging])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return

    const touch = e.changedTouches[0]
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
    const dropZone = elementBelow?.closest('[data-drop-zone]')

    if (dropZone && draggedElement) {
      const fromZone = draggedElement.closest('[data-drop-zone]')
      if (fromZone !== dropZone) {
        onMove(
          fromZone?.getAttribute('data-drop-zone') || '',
          dropZone.getAttribute('data-drop-zone') || ''
        )
      }
    }

    // 정리
    if (dragPreview.current) {
      document.body.removeChild(dragPreview.current)
      dragPreview.current = null
    }

    document.querySelectorAll('.drop-zone-active').forEach(el => {
      el.classList.remove('drop-zone-active')
    })

    setIsDragging(false)
    setDraggedElement(null)
  }, [isDragging, draggedElement, onMove])

  return {
    isDragging,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
```

## 3. 칸반 컴포넌트 구현

### 메인 칸반 뷰
```typescript
// frontend/src/components/views/KanbanView.tsx
import React, { useState, useMemo } from 'react'
import { useTodos } from '../../hooks/useTodos'
import { useKanbanDragDrop } from '../../hooks/useKanbanDragDrop'
import { KanbanColumn } from '../kanban/KanbanColumn'
import { KanbanToolbar } from '../kanban/KanbanToolbar'
import { Todo, TodoStatus } from '../../types/todo.types'

const COLUMN_CONFIG = {
  todo: {
    title: '할 일',
    color: 'bg-gray-100',
    headerColor: 'bg-gray-200',
    count: 0,
  },
  'in-progress': {
    title: '진행 중',
    color: 'bg-blue-50',
    headerColor: 'bg-blue-100',
    count: 0,
  },
  done: {
    title: '완료',
    color: 'bg-green-50',
    headerColor: 'bg-green-100',
    count: 0,
  },
} as const

export const KanbanView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  
  const { todos, updateTodo, bulkUpdate, isLoading } = useTodos()

  // 칸반 컬럼별 할일 그룹화
  const columnTodos = useMemo(() => {
    const filtered = todos.filter(todo => {
      const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPriority = priorityFilter === 'all' || todo.priority === priorityFilter
      return matchesSearch && matchesPriority
    })

    const grouped = {
      todo: filtered.filter(t => t.status === 'todo'),
      'in-progress': filtered.filter(t => t.status === 'in-progress'),
      done: filtered.filter(t => t.status === 'done'),
    }

    return grouped
  }, [todos, searchTerm, priorityFilter])

  const handleMoveCard = (cardId: string, fromStatus: TodoStatus, toStatus: TodoStatus) => {
    if (fromStatus === toStatus) return

    updateTodo({
      id: cardId,
      data: { status: toStatus }
    })
  }

  const handleReorderCards = (columnStatus: TodoStatus, reorderedTodos: Todo[]) => {
    const updates = reorderedTodos.map((todo, index) => ({
      id: todo.id,
      order: index,
    }))

    bulkUpdate(updates)
  }

  const { dragState, ...dragHandlers } = useKanbanDragDrop(handleMoveCard)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 툴바 */}
      <KanbanToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        totalTodos={todos.length}
        columnCounts={{
          todo: columnTodos.todo.length,
          'in-progress': columnTodos['in-progress'].length,
          done: columnTodos.done.length,
        }}
      />

      {/* 칸반 보드 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex gap-6 p-6 overflow-x-auto">
          {(Object.keys(COLUMN_CONFIG) as TodoStatus[]).map(status => (
            <KanbanColumn
              key={status}
              status={status}
              title={COLUMN_CONFIG[status].title}
              todos={columnTodos[status]}
              onMoveCard={handleMoveCard}
              onReorderCards={(reorderedTodos) => handleReorderCards(status, reorderedTodos)}
              dragState={dragState}
              dragHandlers={dragHandlers}
              className={COLUMN_CONFIG[status].color}
              headerClassName={COLUMN_CONFIG[status].headerColor}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 칸반 컬럼 컴포넌트
```typescript
// frontend/src/components/kanban/KanbanColumn.tsx
import React from 'react'
import { KanbanCard } from './KanbanCard'
import { AddCardButton } from './AddCardButton'
import { Todo, TodoStatus } from '../../types/todo.types'
import { cn } from '../../utils/cn'

interface KanbanColumnProps {
  status: TodoStatus
  title: string
  todos: Todo[]
  onMoveCard: (cardId: string, fromStatus: TodoStatus, toStatus: TodoStatus) => void
  onReorderCards: (reorderedTodos: Todo[]) => void
  dragState: any
  dragHandlers: any
  className?: string
  headerClassName?: string
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  todos,
  onMoveCard,
  onReorderCards,
  dragState,
  dragHandlers,
  className,
  headerClassName,
}) => {
  const { handleDragOver, handleDrop } = dragHandlers
  const isDropTarget = dragState.draggedOver === status
  const isDraggingFromThis = dragState.draggedFrom === status

  const handleDragOverColumn = (e: React.DragEvent) => {
    e.preventDefault()
    handleDragOver(status, e)
  }

  const handleDropOnColumn = (e: React.DragEvent) => {
    handleDrop(status, e)
  }

  const handleCardReorder = (draggedIndex: number, targetIndex: number) => {
    const newTodos = [...todos]
    const [draggedTodo] = newTodos.splice(draggedIndex, 1)
    newTodos.splice(targetIndex, 0, draggedTodo)
    onReorderCards(newTodos)
  }

  return (
    <div
      className={cn(
        'kanban-column flex-shrink-0 w-80 h-full flex flex-col',
        className,
        isDropTarget && 'drop-zone-active',
        isDraggingFromThis && 'opacity-75'
      )}
      data-drop-zone={status}
      onDragOver={handleDragOverColumn}
      onDrop={handleDropOnColumn}
    >
      {/* 컬럼 헤더 */}
      <div className={cn('kanban-column-header p-4 rounded-t-lg', headerClassName)}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-600">
            {todos.length}
          </span>
        </div>
      </div>

      {/* 카드 리스트 */}
      <div className="flex-1 p-4 pt-0 overflow-y-auto space-y-3">
        {todos.map((todo, index) => (
          <KanbanCard
            key={todo.id}
            todo={todo}
            index={index}
            onMove={onMoveCard}
            onReorder={handleCardReorder}
            dragState={dragState}
            dragHandlers={dragHandlers}
            isDragging={dragState.draggedCard?.id === todo.id}
          />
        ))}

        {/* 빈 상태 */}
        {todos.length === 0 && !dragState.isDragging && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">할 일이 없습니다</p>
          </div>
        )}

        {/* 드롭 존 플레이스홀더 */}
        {isDropTarget && dragState.draggedFrom !== status && (
          <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-4 text-center text-blue-600">
            여기에 놓으세요
          </div>
        )}
      </div>

      {/* 새 카드 추가 버튼 */}
      <div className="p-4 pt-0">
        <AddCardButton status={status} />
      </div>
    </div>
  )
}
```

### 칸반 카드 컴포넌트
```typescript
// frontend/src/components/kanban/KanbanCard.tsx
import React, { useState } from 'react'
import { Todo, TodoStatus } from '../../types/todo.types'
import { formatDate } from '../../utils/date'
import { cn } from '../../utils/cn'

interface KanbanCardProps {
  todo: Todo
  index: number
  onMove: (cardId: string, fromStatus: TodoStatus, toStatus: TodoStatus) => void
  onReorder: (draggedIndex: number, targetIndex: number) => void
  dragState: any
  dragHandlers: any
  isDragging: boolean
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  todo,
  index,
  onMove,
  onReorder,
  dragState,
  dragHandlers,
  isDragging,
}) => {
  const [isEditMode, setIsEditMode] = useState(false)
  const { handleDragStart, handleDragEnd } = dragHandlers

  const handleDragStartCard = (e: React.DragEvent) => {
    handleDragStart(todo, e)
  }

  const handleCardClick = () => {
    setIsEditMode(true)
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'
      case 'low': return 'border-l-green-500 bg-green-50'
      default: return 'border-l-gray-300'
    }
  }

  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed

  return (
    <div
      className={cn(
        'kanban-card cursor-move select-none',
        getPriorityColor(todo.priority),
        isDragging && 'kanban-card-dragging',
        isOverdue && 'ring-2 ring-red-200'
      )}
      draggable
      onDragStart={handleDragStartCard}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
    >
      {/* 카드 헤더 */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 flex-1 line-clamp-2">
          {todo.title}
        </h4>
        
        {/* 우선순위 표시 */}
        {todo.priority && (
          <span className={cn(
            'priority-badge ml-2 flex-shrink-0',
            `priority-${todo.priority}`
          )}>
            {todo.priority}
          </span>
        )}
      </div>

      {/* 카드 내용 */}
      {todo.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
          {todo.description}
        </p>
      )}

      {/* 카드 푸터 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        {/* 마감일 */}
        {todo.dueDate && (
          <span className={cn(
            'flex items-center',
            isOverdue && 'text-red-600 font-medium'
          )}>
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            {formatDate(todo.dueDate, 'MM/dd')}
          </span>
        )}

        {/* 서브태스크 개수 */}
        {todo.subtasks && todo.subtasks.length > 0 && (
          <span className="flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {todo.subtasks.filter(s => s.completed).length}/{todo.subtasks.length}
          </span>
        )}
      </div>

      {/* 진행률 바 (서브태스크가 있는 경우) */}
      {todo.subtasks && todo.subtasks.length > 0 && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{
                width: `${(todo.subtasks.filter(s => s.completed).length / todo.subtasks.length) * 100}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

### 칸반 툴바
```typescript
// frontend/src/components/kanban/KanbanToolbar.tsx
import React from 'react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface KanbanToolbarProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  priorityFilter: string
  onPriorityFilterChange: (priority: string) => void
  totalTodos: number
  columnCounts: {
    todo: number
    'in-progress': number
    done: number
  }
}

export const KanbanToolbar: React.FC<KanbanToolbarProps> = ({
  searchTerm,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  totalTodos,
  columnCounts,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        {/* 왼쪽: 제목과 통계 */}
        <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-bold text-gray-900">칸반 보드</h1>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>전체: {totalTodos}</span>
            <span>할 일: {columnCounts.todo}</span>
            <span>진행 중: {columnCounts['in-progress']}</span>
            <span>완료: {columnCounts.done}</span>
          </div>
        </div>

        {/* 오른쪽: 검색과 필터 */}
        <div className="flex items-center space-x-4">
          {/* 검색 */}
          <div className="w-64">
            <Input
              type="search"
              placeholder="할 일 검색..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* 우선순위 필터 */}
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
            className="input text-sm w-32"
          >
            <option value="all">모든 우선순위</option>
            <option value="high">높음</option>
            <option value="medium">보통</option>
            <option value="low">낮음</option>
          </select>

          {/* 새 카드 추가 */}
          <Button size="sm">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            새 할 일
          </Button>
        </div>
      </div>
    </div>
  )
}
```

## 4. 고급 기능 구현

### 자동 저장 및 실시간 동기화
```typescript
// frontend/src/hooks/useAutoSave.ts
import { useEffect, useRef } from 'react'
import { useDebouncedCallback } from 'use-debounce'

export const useAutoSave = <T>(
  data: T,
  onSave: (data: T) => Promise<void>,
  delay: number = 1000
) => {
  const lastSavedData = useRef<T>(data)

  const debouncedSave = useDebouncedCallback(
    async (dataToSave: T) => {
      try {
        await onSave(dataToSave)
        lastSavedData.current = dataToSave
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    },
    delay
  )

  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(lastSavedData.current)) {
      debouncedSave(data)
    }
  }, [data, debouncedSave])
}
```

### 키보드 단축키 지원
```typescript
// frontend/src/hooks/useKanbanShortcuts.ts
import { useEffect } from 'react'

export const useKanbanShortcuts = (
  selectedCard: string | null,
  onMoveCard: (direction: 'left' | 'right') => void,
  onDeleteCard: () => void,
  onEditCard: () => void
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCard) return

      switch (e.key) {
        case 'ArrowLeft':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            onMoveCard('left')
          }
          break
        case 'ArrowRight':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            onMoveCard('right')
          }
          break
        case 'Delete':
        case 'Backspace':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            onDeleteCard()
          }
          break
        case 'Enter':
          e.preventDefault()
          onEditCard()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedCard, onMoveCard, onDeleteCard, onEditCard])
}
```

## 5. 모바일 최적화

### 터치 제스처 지원
```css
/* 모바일 칸반 스타일 */
@media (max-width: 768px) {
  .kanban-column {
    @apply min-w-[280px] max-w-[280px];
  }
  
  .kanban-card {
    @apply touch-manipulation;
    min-height: 80px;
  }
  
  /* 모바일에서 드래그 힌트 */
  .kanban-card::after {
    content: '⋮⋮';
    @apply absolute top-2 right-2 text-gray-400 text-lg;
  }
  
  /* 햅틱 피드백 시뮬레이션 */
  .kanban-card:active {
    @apply transform scale-105 shadow-lg;
    transition: transform 0.1s ease-out;
  }
}
```

### 스와이프 제스처
```typescript
// frontend/src/hooks/useSwipeGesture.ts
import { useState, useCallback } from 'react'

export const useSwipeGesture = (
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold: number = 50
) => {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > threshold
    const isRightSwipe = distance < -threshold

    if (isLeftSwipe) {
      onSwipeLeft()
    } else if (isRightSwipe) {
      onSwipeRight()
    }
  }, [touchStart, touchEnd, threshold, onSwipeLeft, onSwipeRight])

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}
```

## 6. 구현 우선순위

### Phase 1: 기본 칸반 구조
1. ✅ KanbanView 컴포넌트 구조 설계
2. ✅ KanbanColumn 컴포넌트 구현
3. ✅ KanbanCard 컴포넌트 구현
4. 기본 드래그앤드롭 기능

### Phase 2: 고급 드래그앤드롭
1. HTML5 Drag & Drop API 구현
2. 터치 디바이스 지원
3. 드래그 프리뷰 및 애니메이션
4. 키보드 단축키 지원

### Phase 3: 사용자 경험 개선
1. 자동 저장 기능
2. 실시간 동기화
3. 모바일 최적화
4. 접근성 개선

## 7. 다음 단계

1. **캘린더 뷰 구현** (`03-calendar-view.md`)
2. **대시보드 구현** (`04-dashboard.md`)
3. **모바일 최적화** (`05-mobile-optimization.md`)
4. **성능 최적화** (`06-performance-optimization.md`)
