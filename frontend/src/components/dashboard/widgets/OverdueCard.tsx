import type React from 'react'
import { StatsCard } from './StatsCard'

interface OverdueCardProps {
  overdue: number
  dueToday: number
  dueThisWeek: number
}

export const OverdueCard: React.FC<OverdueCardProps> = ({ overdue, dueToday, dueThisWeek }) => {
  const hasUrgentItems = overdue > 0 || dueToday > 0

  const icon = (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )

  return (
    <StatsCard
      title="마감 관리"
      value={hasUrgentItems ? overdue + dueToday : dueThisWeek}
      subtitle={hasUrgentItems ? '긴급 처리 필요' : '이번 주 마감'}
      icon={icon}
      color={hasUrgentItems ? 'red' : 'yellow'}
    >
      <div className="space-y-2 text-sm">
        {overdue > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-red-600 dark:text-red-400 font-medium">마감 임박:</span>
            <span className="font-bold text-red-700 dark:text-red-300">{overdue}</span>
          </div>
        )}
        {dueToday > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-orange-600 dark:text-orange-400 font-medium">오늘 마감:</span>
            <span className="font-bold text-orange-700 dark:text-orange-300">{dueToday}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">이번 주:</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{dueThisWeek}</span>
        </div>
      </div>
    </StatsCard>
  )
}
