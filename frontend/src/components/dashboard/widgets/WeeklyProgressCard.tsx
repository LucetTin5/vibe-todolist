import type React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays, startOfDay } from 'date-fns'

// 임시 데이터 생성 함수 (실제로는 API에서 가져와야 함)
const generateWeeklyData = () => {
  const today = new Date()
  const data = []
  
  for (let i = 6; i >= 0; i--) {
    const date = subDays(startOfDay(today), i)
    const dayName = format(date, 'E')
    
    // 임시 데이터 (실제로는 해당 날짜의 완료률을 계산)
    const completed = Math.floor(Math.random() * 8) + 2
    const total = completed + Math.floor(Math.random() * 5) + 1
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
}

export const WeeklyProgressCard: React.FC = () => {
  const weeklyData = generateWeeklyData()

  const CustomTooltip = ({ active, payload, label }: any) => {
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
    </div>
  )
}