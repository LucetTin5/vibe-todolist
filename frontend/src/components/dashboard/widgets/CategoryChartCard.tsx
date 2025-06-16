import type React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTodoStats } from '../../../hooks/useTodos'

const CATEGORY_COLORS = {
  work: '#3b82f6', // blue-500
  personal: '#8b5cf6', // violet-500
  shopping: '#ec4899', // pink-500
  health: '#10b981', // emerald-500
  other: '#6b7280', // gray-500
}

const CATEGORY_LABELS = {
  work: '업무',
  personal: '개인',
  shopping: '쇼핑',
  health: '건강',
  other: '기타',
}

export const CategoryChartCard: React.FC = () => {
  const { data: stats } = useTodoStats()

  const chartData = stats?.byCategory
    ? [
        {
          name: CATEGORY_LABELS.work,
          value: stats.byCategory.work || 0,
          color: CATEGORY_COLORS.work,
        },
        {
          name: CATEGORY_LABELS.personal,
          value: stats.byCategory.personal || 0,
          color: CATEGORY_COLORS.personal,
        },
        {
          name: CATEGORY_LABELS.shopping,
          value: stats.byCategory.shopping || 0,
          color: CATEGORY_COLORS.shopping,
        },
        {
          name: CATEGORY_LABELS.health,
          value: stats.byCategory.health || 0,
          color: CATEGORY_COLORS.health,
        },
        {
          name: CATEGORY_LABELS.other,
          value: stats.byCategory.other || 0,
          color: CATEGORY_COLORS.other,
        },
      ].filter((item) => item.value > 0)
    : []

  const maxValue = Math.max(...chartData.map((item) => item.value), 1)

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>카테고리 차트</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          카테고리별 분포
        </h3>
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-sm">데이터가 없습니다</div>
          </div>
        </div>
      </div>
    )
  }

  interface TooltipPayload {
    value: number
    payload: { color: string }
  }

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <div className="font-medium text-gray-900 dark:text-white">{label}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {data.value}개의 할 일
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <title>카테고리 차트</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        카테고리별 분포
      </h3>

      <div className="h-48 sm:h-56 lg:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
              domain={[0, maxValue + Math.ceil(maxValue * 0.1)]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" maxBarSize={60} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
