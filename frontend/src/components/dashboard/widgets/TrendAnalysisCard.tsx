import type React from 'react'
import { useMemo } from 'react'
import { useTodos } from '../../../hooks/useTodos'
import { subDays, isAfter, parseISO } from 'date-fns'

interface TrendAnalysisCardProps {
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

export const TrendAnalysisCard: React.FC<TrendAnalysisCardProps> = ({ stats }) => {
  // 모든 todos 데이터 가져오기
  const { data: todosResponse } = useTodos({})
  const todos = todosResponse?.todos || []

  // 실제 데이터 기반 트렌드 분석
  const trendData = useMemo(() => {
    const now = new Date()
    const lastWeek = subDays(now, 7)
    const lastMonth = subDays(now, 30)

    // 최근 7일간 생성된 todos
    const recentTodos = todos.filter((todo) => {
      if (!todo.createdAt) return false
      try {
        const createdDate = parseISO(todo.createdAt)
        return isAfter(createdDate, lastWeek)
      } catch {
        return false
      }
    })

    // 최근 30일간 생성된 todos
    const monthlyTodos = todos.filter((todo) => {
      if (!todo.createdAt) return false
      try {
        const createdDate = parseISO(todo.createdAt)
        return isAfter(createdDate, lastMonth)
      } catch {
        return false
      }
    })

    // 생산성 지수 계산 (최근 완료율 vs 전체 완료율)
    const recentCompletionRate =
      recentTodos.length > 0
        ? (recentTodos.filter((todo) => todo.completed).length / recentTodos.length) * 100
        : 0
    const overallCompletionRate = stats?.completionRate || 0
    const productivityIndex = Math.round(recentCompletionRate - overallCompletionRate)

    // 활동량 계산 (최근 7일 vs 이전 7일)
    const previousWeek = subDays(lastWeek, 7)
    const previousWeekTodos = todos.filter((todo) => {
      if (!todo.createdAt) return false
      try {
        const createdDate = parseISO(todo.createdAt)
        return isAfter(createdDate, previousWeek) && !isAfter(createdDate, lastWeek)
      } catch {
        return false
      }
    })

    const activityTrend = recentTodos.length >= previousWeekTodos.length ? '증가' : '감소'
    const activityLevel =
      recentTodos.length > monthlyTodos.length / 4
        ? '높음'
        : recentTodos.length > monthlyTodos.length / 8
          ? '보통'
          : '낮음'

    // 주간 개선도 (우선순위 높은 작업 완료율)
    const highPriorityTodos = recentTodos.filter((todo) => todo.priority === 'high')
    const highPriorityCompleted = highPriorityTodos.filter((todo) => todo.completed).length
    const improvementRate =
      highPriorityTodos.length > 0 ? (highPriorityCompleted / highPriorityTodos.length) * 100 : 0

    const improvementLevel =
      improvementRate >= 80 ? '우수' : improvementRate >= 60 ? '양호' : '개선필요'

    return {
      productivityIndex,
      activityLevel,
      activityTrend,
      improvementLevel,
      recentCount: recentTodos.length,
      previousCount: previousWeekTodos.length,
      hasData: recentTodos.length > 0 || previousWeekTodos.length > 0,
      hasEnoughData: recentTodos.length >= 3 && monthlyTodos.length >= 5,
    }
  }, [todos, stats])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <title>트렌드 분석</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
        트렌드 분석
      </h4>
      {!trendData.hasData ? (
        // 데이터가 없는 경우
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 text-sm mb-2">📊</div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            아직 충분한 데이터가 없습니다
          </div>
          <div className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            할 일을 추가하고 완료해보세요
          </div>
        </div>
      ) : !trendData.hasEnoughData ? (
        // 데이터가 부족한 경우
        <div>
          <div className="text-center py-4 mb-4">
            <div className="text-gray-400 dark:text-gray-500 text-sm mb-1">📈</div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">데이터 수집 중...</div>
            <div className="text-gray-400 dark:text-gray-500 text-xs">
              더 정확한 분석을 위해 더 많은 데이터가 필요합니다
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              최근 7일: {trendData.recentCount}개 (이전 주: {trendData.previousCount}개)
            </div>
          </div>
        </div>
      ) : (
        // 충분한 데이터가 있는 경우
        <>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
              <span>생산성 지수</span>
              <span
                className={`font-medium ${
                  trendData.productivityIndex >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {trendData.productivityIndex >= 0 ? '+' : ''}
                {trendData.productivityIndex}%
              </span>
            </div>
            <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
              <span>활동량</span>
              <span
                className={`font-medium ${
                  trendData.activityLevel === '높음'
                    ? 'text-blue-600 dark:text-blue-400'
                    : trendData.activityLevel === '보통'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {trendData.activityLevel} ({trendData.activityTrend})
              </span>
            </div>
            <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
              <span>주간 개선도</span>
              <span
                className={`font-medium ${
                  trendData.improvementLevel === '우수'
                    ? 'text-purple-600 dark:text-purple-400'
                    : trendData.improvementLevel === '양호'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-orange-600 dark:text-orange-400'
                }`}
              >
                {trendData.improvementLevel}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              최근 7일: {trendData.recentCount}개 (이전 주: {trendData.previousCount}개)
            </div>
          </div>
        </>
      )}
    </div>
  )
}
