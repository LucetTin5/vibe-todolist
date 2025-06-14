# 📊 대시보드 UI 구현 계획

## 🎯 목표

기존 완성된 통계 API를 활용하여 직관적이고 정보가 풍부한 대시보드 UI를 구현합니다.

## 📋 현재 상황 분석

### ✅ 이미 완성된 부분
- **통계 API 완료**: `/api/todos/stats` 엔드포인트
- **React Query 훅**: `useTodoStats` 자동 생성
- **반응형 그리드**: 12컬럼 시스템 구축
- **테마 시스템**: 다크/라이트 모드 지원
- **애니메이션**: GSAP 기반 시스템

### 📊 사용 가능한 통계 데이터
```typescript
interface TodoStatsResponse {
  total: number                    // 전체 Todo 개수
  completed: number               // 완료된 Todo 개수  
  active: number                  // 활성 Todo 개수
  completionRate: number          // 완료율 (%)
  byPriority: {                   // 우선순위별 통계
    low: number
    medium: number
    high: number
    urgent: number
  }
  byCategory: {                   // 카테고리별 통계
    work: number
    personal: number
    shopping: number
    health: number
    other: number
  }
  overdue: number                 // 마감 임박
  dueToday: number               // 오늘 마감
  dueThisWeek: number            // 이번 주 마감
}
```

## 🎨 대시보드 디자인 구조

### 레이아웃 (12컬럼 그리드)
```
┌─────────────────────────────────────────────────────────┐
│ Dashboard Header (제목, 날짜, 새로고침)                    │
├─────────────────────────────────────────────────────────┤
│ Quick Stats Row (4개 핵심 메트릭 카드)                    │
│ ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐ │
│ │Total│Done │Rate │Over │     │     │     │     │     │ │
│ │ 3col│3col │3col │3col │     │     │     │     │     │ │
│ └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘ │
├─────────────────────────────────────────────────────────┤
│ Charts Row (2개 차트)                                    │
│ ┌───────────────────────┬───────────────────────────────┐ │
│ │ Priority Distribution │ Category Distribution         │ │
│ │       6col           │        6col                   │ │
│ └───────────────────────┴───────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Timeline Row (마감일 관련)                               │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Due Dates Timeline (전체 12col)                    │   │
│ └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│ Recent Activity Row                                     │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Recent Todos List (전체 12col)                     │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

모바일: 모든 위젯이 1열로 스택
태블릿: 2열 구조
데스크톱: 3-4열 구조
```

## 📦 구현할 컴포넌트

### 1. 메인 대시보드 컴포넌트
```typescript
// frontend/src/components/dashboard/DashboardView.tsx
interface DashboardViewProps {
  // 필터링/날짜 범위 등 추가 기능용
}
```

### 2. 통계 카드 위젯들
```typescript
// frontend/src/components/dashboard/widgets/

// StatsCard.tsx - 기본 통계 카드
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
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray'
}

// CompletionRateCard.tsx - 완료율 원형 진행바
// OverdueCard.tsx - 마감 임박 알림
// TotalStatsCard.tsx - 전체/완료/활성 통계
```

### 3. 차트 컴포넌트들
```typescript
// frontend/src/components/dashboard/charts/

// PriorityChart.tsx - 우선순위별 도넛 차트
// CategoryChart.tsx - 카테고리별 바 차트  
// DueDateTimeline.tsx - 마감일 타임라인
// TrendChart.tsx - 완료 추세 라인 차트 (추후)
```

### 4. 최근 활동 컴포넌트
```typescript
// RecentActivity.tsx - 최근 생성/완료된 Todo 목록
```

## 🛠️ 기술 스택

### 차트 라이브러리: Recharts
```bash
cd frontend
bun add recharts
bun add @types/recharts -D
```

**선택 이유**:
- React Query와 궁합이 좋음
- TailwindCSS와 잘 통합됨
- 반응형 차트 지원
- 다크모드 지원
- 가볍고 성능 좋음

### 아이콘: Lucide React
```bash
bun add lucide-react
```

## 📅 구현 단계별 계획

### 🚀 Phase 1: 기본 위젯 구현 (1일)

#### Step 1.1: 기본 설정
- [ ] Recharts 및 의존성 설치
- [ ] 대시보드 라우팅 설정 (/dashboard)
- [ ] 기본 DashboardView 컴포넌트 구조

#### Step 1.2: 통계 카드 위젯
- [ ] StatsCard 기본 컴포넌트
- [ ] TotalStatsCard (전체/완료/활성)
- [ ] CompletionRateCard (완료율 원형 진행바)
- [ ] OverdueCard (마감 임박 경고)

### ⚡ Phase 2: 차트 구현 (1일)

#### Step 2.1: 기본 차트
- [ ] PriorityChart (우선순위별 도넛 차트)
- [ ] CategoryChart (카테고리별 바 차트)

#### Step 2.2: 고급 차트
- [ ] DueDateTimeline (마감일 타임라인)
- [ ] 반응형 차트 최적화

### 🎯 Phase 3: 마무리 및 최적화 (0.5일)

#### Step 3.1: 레이아웃 완성
- [ ] 반응형 그리드 레이아웃 적용
- [ ] 모바일/태블릿/데스크톱 최적화
- [ ] 로딩 상태 처리

#### Step 3.2: 사용자 경험
- [ ] 애니메이션 적용 (GSAP)
- [ ] 다크모드 테마 지원
- [ ] 에러 핸들링

## 💻 세부 구현 가이드

### 1. 기본 통계 카드
```typescript
// StatsCard.tsx
export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50 dark:bg-blue-900/20',
    green: 'border-green-200 bg-green-50 dark:bg-green-900/20',
    red: 'border-red-200 bg-red-50 dark:bg-red-900/20',
    yellow: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20',
    gray: 'border-gray-200 bg-gray-50 dark:bg-gray-800',
  }

  return (
    <div className={cn(
      'rounded-lg border p-6 transition-all duration-200 hover:shadow-md',
      colorClasses[color]
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={cn(
            'flex items-center',
            trend.direction === 'up' && 'text-green-600',
            trend.direction === 'down' && 'text-red-600',
            trend.direction === 'neutral' && 'text-gray-600'
          )}>
            {trend.direction === 'up' && '↗'}
            {trend.direction === 'down' && '↘'}
            {trend.value}% {trend.label}
          </span>
        </div>
      )}
    </div>
  )
}
```

### 2. 완료율 원형 차트
```typescript
// CompletionRateCard.tsx
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export const CompletionRateCard: React.FC<{
  completionRate: number
  completed: number
  total: number
}> = ({ completionRate, completed, total }) => {
  const data = [
    { name: 'Completed', value: completed, color: '#10b981' },
    { name: 'Remaining', value: total - completed, color: '#e5e7eb' },
  ]

  return (
    <StatsCard
      title="완료율"
      value={`${completionRate.toFixed(1)}%`}
      subtitle={`${completed}/${total} 완료`}
      color="green"
    >
      <div className="mt-4 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={25}
              outerRadius={40}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </StatsCard>
  )
}
```

### 3. 우선순위 차트
```typescript
// PriorityChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export const PriorityChart: React.FC<{
  byPriority: Record<string, number>
}> = ({ byPriority }) => {
  const data = [
    { name: '낮음', value: byPriority.low, color: '#10b981' },
    { name: '보통', value: byPriority.medium, color: '#f59e0b' },
    { name: '높음', value: byPriority.high, color: '#ef4444' },
    { name: '긴급', value: byPriority.urgent, color: '#dc2626' },
  ]

  return (
    <div className="rounded-lg border bg-white dark:bg-gray-800 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        우선순위별 분포
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

### 4. 메인 대시보드 레이아웃
```typescript
// DashboardView.tsx
export const DashboardView: React.FC = () => {
  const { data: stats, isLoading } = useTodoStats()
  const { data: todosData } = useTodos({ limit: 5, sortBy: 'updatedAt' })

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 overflow-auto">
      <div className="container mx-auto p-6 space-y-6">
        {/* 헤더 */}
        <DashboardHeader />

        {/* 핵심 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <TotalStatsCard 
            total={stats.total}
            completed={stats.completed}
            active={stats.active}
          />
          <CompletionRateCard 
            completionRate={stats.completionRate}
            completed={stats.completed}
            total={stats.total}
          />
          <OverdueCard 
            overdue={stats.overdue}
            dueToday={stats.dueToday}
          />
          <WeeklyStatsCard 
            dueThisWeek={stats.dueThisWeek}
          />
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PriorityChart byPriority={stats.byPriority} />
          <CategoryChart byCategory={stats.byCategory} />
        </div>

        {/* 마감일 타임라인 */}
        <DueDateTimeline />

        {/* 최근 활동 */}
        <RecentActivity todos={todosData?.todos || []} />
      </div>
    </div>
  )
}
```

## 🎨 디자인 시스템

### 색상 팔레트
```css
/* 위젯별 색상 */
--stat-total: #3b82f6      /* Blue */
--stat-completed: #10b981   /* Green */
--stat-pending: #f59e0b     /* Yellow */
--stat-overdue: #ef4444     /* Red */

/* 우선순위별 색상 */
--priority-low: #10b981     /* Green */
--priority-medium: #f59e0b  /* Yellow */  
--priority-high: #ef4444    /* Red */
--priority-urgent: #dc2626  /* Dark Red */

/* 카테고리별 색상 */
--category-work: #3b82f6    /* Blue */
--category-personal: #8b5cf6 /* Purple */
--category-shopping: #06b6d4 /* Cyan */
--category-health: #10b981  /* Green */
--category-other: #6b7280   /* Gray */
```

### 반응형 규칙
```typescript
// 브레이크포인트별 그리드
mobile: 1열 (모든 위젯 스택)
tablet: 2열 (차트는 1열로)  
desktop: 3-4열 (최적 레이아웃)

// 카드 크기
small: 높이 120px (기본 스탯)
medium: 높이 200px (차트 포함)
large: 높이 300px+ (복잡한 차트)
```

## ✅ 구현 체크리스트

### Phase 1: 기본 위젯
- [ ] Recharts 설치 및 설정
- [ ] DashboardView 기본 구조
- [ ] StatsCard 컴포넌트
- [ ] TotalStatsCard 구현
- [ ] CompletionRateCard 구현
- [ ] OverdueCard 구현

### Phase 2: 차트 구현  
- [ ] PriorityChart (도넛/바 차트)
- [ ] CategoryChart (바 차트)
- [ ] DueDateTimeline (타임라인)
- [ ] 반응형 차트 최적화

### Phase 3: 마무리
- [ ] 반응형 레이아웃 완성
- [ ] 다크모드 테마 적용
- [ ] 로딩/에러 상태 처리
- [ ] GSAP 애니메이션 적용

## 🔧 다음 단계

1. **Phase 1 구현** (1일)
2. **Phase 2 구현** (1일)  
3. **Phase 3 마무리** (0.5일)

**총 예상 시간**: 2.5일

이후 성능 최적화 및 추가 기능으로 진행합니다.