import type React from 'react'
import { cn } from '../../../utils/cn'

interface StatsCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    label: string
  }
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
  className?: string
  children?: React.ReactNode
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  className,
  children,
}) => {
  const colorClasses = {
    blue: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20',
    green: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
    red: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
    yellow: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
    purple: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20',
    gray: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800',
  }

  const textColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    purple: 'text-purple-600 dark:text-purple-400',
    gray: 'text-gray-600 dark:text-gray-400',
  }

  const valueColorClasses = {
    blue: 'text-blue-900 dark:text-blue-100',
    green: 'text-green-900 dark:text-green-100',
    red: 'text-red-900 dark:text-red-100',
    yellow: 'text-yellow-900 dark:text-yellow-100',
    purple: 'text-purple-900 dark:text-purple-100',
    gray: 'text-gray-900 dark:text-white',
  }

  return (
    <div className={cn(
      'rounded-lg border p-3 sm:p-4 lg:p-6 transition-all duration-200 hover:shadow-md',
      colorClasses[color],
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-xs sm:text-sm font-medium truncate',
            textColorClasses[color]
          )}>
            {title}
          </p>
          <p className={cn(
            'text-lg sm:text-2xl lg:text-3xl font-bold mt-1',
            valueColorClasses[color]
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            'text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2',
            textColorClasses[color]
          )}>
            <div className="w-6 h-6 sm:w-8 sm:h-8">
              {icon}
            </div>
          </div>
        )}
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={cn(
            'flex items-center gap-1',
            trend.direction === 'up' && 'text-green-600 dark:text-green-400',
            trend.direction === 'down' && 'text-red-600 dark:text-red-400',
            trend.direction === 'neutral' && 'text-gray-600 dark:text-gray-400'
          )}>
            {trend.direction === 'up' && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {trend.direction === 'down' && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 15.586l5.293-5.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {trend.value}% {trend.label}
          </span>
        </div>
      )}

      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  )
}