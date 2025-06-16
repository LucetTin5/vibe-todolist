import type React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { StatsCard } from './StatsCard'

interface CompletionRateCardProps {
  completionRate: number
  completed: number
  total: number
}

export const CompletionRateCard: React.FC<CompletionRateCardProps> = ({
  completionRate,
  completed,
  total,
}) => {
  const data = [
    { name: 'Completed', value: completed, color: '#10b981' },
    { name: 'Remaining', value: total - completed, color: '#e5e7eb' },
  ]

  const icon = (
    <svg
      className="w-8 h-8"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-label="완료율 아이콘"
    >
      <title>완료율</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )

  return (
    <StatsCard
      title="완료율"
      value={`${completionRate.toFixed(1)}%`}
      subtitle={`${completed}/${total} 완료`}
      icon={icon}
      color="green"
    >
      <div className="h-20 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={20}
              outerRadius={35}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </StatsCard>
  )
}
