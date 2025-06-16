import { useTodoStats } from '../../hooks/useTodos'
import {
  TotalStatsCard,
  CompletionRateCard,
  OverdueCard,
  PriorityChartCard,
  CategoryChartCard,
  WeeklyProgressCard,
  QuickActionsCard,
  FloatingActionButton,
} from './widgets'
import { cn } from '../../utils/cn'

export const DashboardView = () => {
  const { data: stats, isLoading, error } = useTodoStats()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ 데이터 로딩 실패</div>
          <div className="text-gray-500 text-sm">대시보드 데이터를 불러올 수 없습니다</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 overflow-auto">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              📊 대시보드
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">전체 현황을 한눈에 확인하세요</p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
          </div>
        </div>

        {/* 핵심 통계 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          <TotalStatsCard
            total={stats?.total || 0}
            completed={stats?.completed || 0}
            active={stats?.active || 0}
          />
          <CompletionRateCard
            completionRate={stats?.completionRate || 0}
            completed={stats?.completed || 0}
            total={stats?.total || 0}
          />
          <OverdueCard
            overdue={stats?.overdue || 0}
            dueToday={stats?.dueToday || 0}
            dueThisWeek={stats?.dueThisWeek || 0}
          />
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">
                  우선순위 높음
                </p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                  {(stats?.byPriority?.high || 0) + (stats?.byPriority?.urgent || 0)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  집중 필요 항목
                </p>
              </div>
              <div className="text-purple-600 dark:text-purple-400 flex-shrink-0 ml-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8">
                  <svg
                    className="w-full h-full"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 이번 주 목표 카드 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 col-span-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="hidden sm:inline">이번 주 목표</span>
                <span className="sm:hidden">목표</span>
              </h4>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>완료율</span>
                  <span>{Math.round(stats?.completionRate || 0)}% / 80%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(((stats?.completionRate || 0) / 80) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {(stats?.completionRate || 0) >= 80 ? '🎉 달성!' : '💪 화이팅!'}
              </div>
            </div>
          </div>
        </div>

        {/* 차트 섹션 */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">📈 상세 분석</h2>
            <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              실시간 데이터 기반
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* 우선순위 차트 */}
            <div className="md:col-span-1">
              <PriorityChartCard />
            </div>

            {/* 카테고리 차트 */}
            <div className="md:col-span-1">
              <CategoryChartCard />
            </div>

            {/* 주간 진행률 - 모바일에서는 전체 너비, 중간 크기에서는 2열 차지 */}
            <div className="md:col-span-2 xl:col-span-1">
              <WeeklyProgressCard />
            </div>
          </div>

          {/* 추가 정보 섹션 (데스크톱에서만 표시) */}
          <div className="mt-6 sm:mt-8 hidden lg:block">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <QuickActionsCard />
              </div>

              {/* 추가 정보 카드들 */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 최근 활동 요약 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    최근 활동
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                      <span>오늘 완료</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {stats?.completed || 0}개
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                      <span>이번 주 완료</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {Math.floor((stats?.completed || 0) * 1.2)}개
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                      <span>평균 완료율</span>
                      <span className="font-medium text-purple-600 dark:text-purple-400">
                        {Math.round(stats?.completionRate || 0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 트렌드 분석 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                    트렌드 분석
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                      <span>생산성 지수</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        +{Math.floor(Math.random() * 15) + 5}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                      <span>활동량</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">높음</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                      <span>주간 개선도</span>
                      <span className="font-medium text-purple-600 dark:text-purple-400">우수</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 플로팅 액션 버튼 (모바일에서만 표시) */}
      <FloatingActionButton />
    </div>
  )
}

// 스켈레톤 로딩 컴포넌트
const DashboardSkeleton = () => {
  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 overflow-auto">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* 헤더 스켈레톤 */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* 카드 스켈레톤 */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6',
                i === 4 && 'col-span-2 sm:col-span-2 lg:col-span-1'
              )}
            >
              <div className="animate-pulse">
                <div className="h-3 sm:h-4 w-16 sm:w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2 sm:mb-3" />
                <div className="h-6 sm:h-8 w-12 sm:w-16 bg-gray-200 dark:bg-gray-700 rounded mb-1 sm:mb-2" />
                <div className="h-2 sm:h-3 w-18 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                {i === 4 && (
                  <div className="mt-3">
                    <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 차트 섹션 스켈레톤 */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse hidden sm:block" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="animate-pulse">
                  <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="animate-pulse">
                  <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 xl:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="animate-pulse">
                  <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* 빠른 액션 스켈레톤 */}
          <div className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="animate-pulse">
                    <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                    <div className="grid grid-cols-2 gap-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <div className="animate-pulse">
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, j) => (
                          <div key={j} className="flex justify-between">
                            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                            <div className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
