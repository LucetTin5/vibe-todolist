import type React from 'react'
import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, subDays, startOfDay, isSameDay, parseISO } from 'date-fns'
import { useTodos } from '../../../hooks/useTodos'

export const WeeklyProgressCard: React.FC = () => {
  // 모든 todos 데이터 가져오기
  const { data: todosResponse } = useTodos({})
  const todos = todosResponse?.todos || []

  // 실제 데이터 기반 주간 완료율 계산
  const weeklyData = useMemo(() => {
    const today = new Date()
    const data = []

    for (let i = 6; i >= 0; i--) {
      const date = subDays(startOfDay(today), i)
      const dayName = format(date, 'E')

      // 해당 날짜에 완료된 todos 계산
      const todosCompletedOnDate = todos.filter((todo) => {
        if (!todo.updatedAt || !todo.completed) return false

        try {
          const todoDate = parseISO(todo.updatedAt)
          return isSameDay(todoDate, date)
        } catch {
          return false
        }
      })

      // 해당 날짜에 생성되거나 업데이트된 모든 todos
      const todosActiveOnDate = todos.filter((todo) => {
        if (!todo.createdAt) return false

        try {
          const createdDate = parseISO(todo.createdAt)
          const updatedDate = todo.updatedAt ? parseISO(todo.updatedAt) : createdDate

          // 생성일이 해당 날짜 이전이고, 업데이트일이 해당 날짜 이후거나 같은 경우
          return createdDate <= date && updatedDate >= startOfDay(date)
        } catch {
          return false
        }
      })

      const completed = todosCompletedOnDate.length
      const total = Math.max(todosActiveOnDate.length, 1) // 0으로 나누기 방지
      const completionRate = Math.round((completed / total) * 100)

      data.push({
        day: dayName,
        date: format(date, 'MM/dd'),
        completed,
        total,
        completionRate,
      })
    }

    return data
  }, [todos])

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: Array<{
      payload: {
        day: string
        date: string
        completed: number
        total: number
        completionRate: number
      }
    }>
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <div className="font-medium text-gray-900 dark:text-white">
            {data.day} ({data.date})
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            완료율: {data.completionRate}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            완료: {data.completed}개 / 전체: {data.total}개
          </div>
        </div>
      )
    }
    return null
  }

  const averageCompletion = Math.round(
    weeklyData.reduce((sum, day) => sum + day.completionRate, 0) / weeklyData.length
  )

  const hasAnyData = todos.length > 0
  const hasWeeklyActivity = weeklyData.some((day) => day.total > 1)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          주간 완료율 추이
        </h3>
        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">평균</div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {averageCompletion}%
          </div>
        </div>
      </div>

      {!hasAnyData ? (
        // 할 일이 전혀 없는 경우
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 text-2xl mb-3">📈</div>
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">
            주간 완료율 데이터가 없습니다
          </div>
          <div className="text-gray-400 dark:text-gray-500 text-xs">
            할 일을 추가하고 완료하면 차트가 표시됩니다
          </div>
        </div>
      ) : !hasWeeklyActivity ? (
        // 할 일은 있지만 주간 활동이 부족한 경우
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 text-2xl mb-3">⏳</div>
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">데이터 수집 중</div>
          <div className="text-gray-400 dark:text-gray-500 text-xs">
            더 많은 활동이 있으면 추이를 확인할 수 있습니다
          </div>
        </div>
      ) : (
        // 정상적인 데이터가 있는 경우
        <>
          <div className="h-40 sm:h-44 lg:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="completionRate"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#1d4ed8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            * 최근 7일간의 할 일 완료율 추이
          </div>
        </>
      )}
    </div>
  )
}
