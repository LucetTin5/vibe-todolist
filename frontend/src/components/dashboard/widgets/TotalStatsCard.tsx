import type React from 'react'
import { StatsCard } from './StatsCard'

interface TotalStatsCardProps {
  total: number
  completed: number
  active: number
}

export const TotalStatsCard: React.FC<TotalStatsCardProps> = ({ total, completed, active }) => {
  const icon = (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
      />
    </svg>
  )

  return (
    <StatsCard
      title="전체 할 일"
      value={total}
      subtitle={`활성 ${active}개`}
      icon={icon}
      color="blue"
    >
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-600 dark:text-gray-400">완료:</span>
          <span className="font-medium text-green-600 dark:text-green-400">{completed}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-gray-600 dark:text-gray-400">진행:</span>
          <span className="font-medium text-blue-600 dark:text-blue-400">{active}</span>
        </div>
      </div>
    </StatsCard>
  )
}
