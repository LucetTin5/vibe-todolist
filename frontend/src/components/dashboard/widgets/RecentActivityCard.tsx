import type React from 'react'
import { useMemo } from 'react'
import { useTodos } from '../../../hooks/useTodos'
import { subDays, isAfter, parseISO, startOfDay, endOfDay } from 'date-fns'

interface RecentActivityCardProps {
  stats?: {
    total: number
    completed: number
    active: number
    completionRate: number
    overdue: number
    dueToday: number
    dueThisWeek: number
    byPriority?: {
      high?: number
      medium?: number
      low?: number
      urgent?: number
    }
    byStatus?: {
      todo?: number
      'in-progress'?: number
      done?: number
    }
  }
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ stats: _stats }) => {
  // 모든 todos 데이터 가져오기
  const { data: todosResponse } = useTodos({})
  const todos = todosResponse?.todos || []

  // 실제 데이터 기반 최근 활동 계산
  const activityData = useMemo(() => {
    const now = new Date()
    const today = startOfDay(now)
    const endToday = endOfDay(now)
    const lastWeek = subDays(now, 7)

    // 오늘 완료된 todos
    const todayCompleted = todos.filter((todo) => {
      if (!todo.updatedAt || !todo.completed) return false
      try {
        const updatedDate = parseISO(todo.updatedAt)
        return updatedDate >= today && updatedDate <= endToday
      } catch {
        return false
      }
    })

    // 이번 주 완료된 todos
    const thisWeekCompleted = todos.filter((todo) => {
      if (!todo.updatedAt || !todo.completed) return false
      try {
        const updatedDate = parseISO(todo.updatedAt)
        return isAfter(updatedDate, lastWeek)
      } catch {
        return false
      }
    })

    // 최근 7일간의 평균 완료율 계산
    let totalDailyRates = 0
    let validDays = 0

    for (let i = 0; i < 7; i++) {
      const date = subDays(startOfDay(now), i)
      const nextDate = subDays(startOfDay(now), i - 1)

      const dayCompleted = todos.filter((todo) => {
        if (!todo.updatedAt || !todo.completed) return false
        try {
          const updatedDate = parseISO(todo.updatedAt)
          return updatedDate >= date && updatedDate < nextDate
        } catch {
          return false
        }
      })

      const dayActive = todos.filter((todo) => {
        if (!todo.createdAt) return false
        try {
          const createdDate = parseISO(todo.createdAt)
          // 해당 날짜 이전에 생성된 모든 활성 todos
          return createdDate <= date
        } catch {
          return false
        }
      })

      if (dayActive.length > 0) {
        const dayRate = (dayCompleted.length / dayActive.length) * 100
        totalDailyRates += dayRate
        validDays++
      }
    }

    const averageCompletionRate = validDays > 0 ? Math.round(totalDailyRates / validDays) : 0

    return {
      todayCompleted: todayCompleted.length,
      thisWeekCompleted: thisWeekCompleted.length,
      averageCompletionRate,
      hasRecentActivity: todayCompleted.length > 0 || thisWeekCompleted.length > 0,
      hasAnyTodos: todos.length > 0,
    }
  }, [todos])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <title>최근 활동</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        최근 활동
      </h4>
      {!activityData.hasAnyTodos ? (
        // 할 일이 전혀 없는 경우
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 text-sm mb-2">📝</div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">아직 할 일이 없습니다</div>
          <div className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            첫 번째 할 일을 추가해보세요
          </div>
        </div>
      ) : !activityData.hasRecentActivity ? (
        // 할 일은 있지만 최근 활동이 없는 경우
        <div className="text-center py-6">
          <div className="text-gray-400 dark:text-gray-500 text-sm mb-2">💤</div>
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">최근 활동이 없습니다</div>
          <div className="text-gray-400 dark:text-gray-500 text-xs">할 일을 완료해보세요</div>
        </div>
      ) : (
        // 정상적인 활동 데이터가 있는 경우
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
            <span>오늘 완료</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {activityData.todayCompleted}개
            </span>
          </div>
          <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
            <span>이번 주 완료</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {activityData.thisWeekCompleted}개
            </span>
          </div>
          {activityData.averageCompletionRate > 0 && (
            <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
              <span>주간 평균 완료율</span>
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {activityData.averageCompletionRate}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
