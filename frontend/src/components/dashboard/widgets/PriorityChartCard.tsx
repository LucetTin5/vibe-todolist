import type React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useTodoStats } from '../../../hooks/useTodos'

const PRIORITY_COLORS = {
  urgent: '#dc2626', // red-600
  high: '#ea580c', // orange-600
  medium: '#ca8a04', // yellow-600
  low: '#16a34a', // green-600
}

const PRIORITY_LABELS = {
  urgent: '긴급',
  high: '높음',
  medium: '보통',
  low: '낮음',
}

export const PriorityChartCard: React.FC = () => {
  const { data: stats } = useTodoStats()

  const chartData = stats?.byPriority
    ? [
        {
          name: PRIORITY_LABELS.urgent,
          value: stats.byPriority.urgent || 0,
          color: PRIORITY_COLORS.urgent,
        },
        {
          name: PRIORITY_LABELS.high,
          value: stats.byPriority.high || 0,
          color: PRIORITY_COLORS.high,
        },
        {
          name: PRIORITY_LABELS.medium,
          value: stats.byPriority.medium || 0,
          color: PRIORITY_COLORS.medium,
        },
        { name: PRIORITY_LABELS.low, value: stats.byPriority.low || 0, color: PRIORITY_COLORS.low },
      ].filter((item) => item.value > 0)
    : []

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>우선순위 차트</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          우선순위별 분포
        </h3>
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-2">📋</div>
            <div className="text-sm">데이터가 없습니다</div>
          </div>
        </div>
      </div>
    )
  }

  interface TooltipPayload {
    value: number
    payload: {
      name: string
      color: string
    }
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const percentage = ((data.value / total) * 100).toFixed(1)
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.payload.color }} />
            <span className="font-medium text-gray-900 dark:text-white">{data.payload.name}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {data.value}개 ({percentage}%)
          </div>
        </div>
      )
    }
    return null
  }

  interface LegendPayload {
    value: string
    color: string
    payload: {
      value: number
    }
  }

  const CustomLegend = (props: { payload?: LegendPayload[] }) => {
    const { payload } = props
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload?.map((entry) => (
          <div key={entry.value} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {entry.value} ({entry.payload.value})
            </span>
          </div>
        ))}
      </div>
    )
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
          <title>우선순위 차트</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        우선순위별 분포
      </h3>

      <div className="h-48 sm:h-56 lg:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
