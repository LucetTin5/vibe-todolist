# 🎨 디자인 가이드라인 및 UI/UX 지침

## 📱 반응형 디자인 원칙

### 브레이크포인트 정의
```css
/* 모바일 우선 커스텀 브레이크포인트 */
sm: 480px   /* 모바일 가로 */
md: 768px   /* 태블릿 */
lg: 1024px  /* 데스크톱 */
xl: 1280px  /* 큰 데스크톱 */
```

### 모바일 우선 설계
- **Mobile First**: 320px부터 시작하는 설계
- **Touch-Friendly**: 최소 44px 터치 영역 확보
- **Single Column**: 모바일에서는 단일 컬럼 레이아웃
- **Simplified UI**: 모바일에서는 핵심 기능에 집중

### 반응형 컴포넌트 패턴
```tsx
// 반응형 그리드 레이아웃 예시 (12컬럼 기반)
const ResponsiveLayout = () => (
  <div className="
    grid 
    grid-cols-4      /* 모바일: 4컬럼 기본 */
    sm:grid-cols-6   /* 모바일 가로: 6컬럼 */
    md:grid-cols-8   /* 태블릿: 8컬럼 */
    lg:grid-cols-10  /* 데스크톱: 10컬럼 */
    xl:grid-cols-12  /* 큰 데스크톱: 12컬럼 */
    gap-4 
    p-4
  ">
    {/* 각 아이템은 그리드 스팬 활용 */}
    <div className="col-span-4 md:col-span-4 lg:col-span-3">
      {/* 메인 컨텐츠 */}
    </div>
    <div className="col-span-4 md:col-span-4 lg:col-span-2">
      {/* 사이드 컨텐츠 */}
    </div>
  </div>
)

// 카드 그리드 레이아웃 예시
const CardGrid = () => (
  <div className="
    grid 
    grid-cols-1      /* 모바일: 1열 */
    sm:grid-cols-2   /* 모바일 가로: 2열 */
    md:grid-cols-3   /* 태블릿: 3열 */
    lg:grid-cols-4   /* 데스크톱: 4열 */
    xl:grid-cols-6   /* 큰 데스크톱: 6열 */
    gap-4
  ">
    {/* 카드 컴포넌트들 */}
  </div>
)
```

## 🖥️ PC 대시보드 풍부한 정보 표시

### 데스크톱 특화 기능
- **멀티 패널 레이아웃**: 사이드바 + 메인 + 디테일 패널
- **정보 밀도 최적화**: 더 많은 데이터를 한 화면에 표시
- **고급 인터랙션**: 드래그앤드롭, 키보드 단축키
- **상세 차트 및 분석**: 복잡한 데이터 시각화

### 대시보드 레이아웃 구조
```
┌─────────────────────────────────────────────────────────┐
│ Header (네비게이션, 사용자 정보, 테마 토글)                │
├─────────────────────────────────────────────────────────┤
│ Main Grid Layout (12 Column System)                    │
│ ┌─────┬───────────────────────────┬─────────────────┐   │
│ │Side │ Dashboard Main Area       │ Detail Panel    │   │
│ │bar  │ (차트, 위젯, 리스트)        │ (상세정보)       │   │
│ │     │                           │                 │   │
│ │3col │ 6col                      │ 3col            │   │
│ └─────┴───────────────────────────┴─────────────────┘   │
└─────────────────────────────────────────────────────────┘

/* 반응형 그리드 적용 */
모바일(4col):   [4col 메인]
태블릿(8col):   [2col 사이드] [6col 메인]  
데스크톱(12col): [3col 사이드] [6col 메인] [3col 디테일]
```

### 정보 표시 우선순위
- **Critical**: 진행 중인 태스크, 마감임박 항목
- **Important**: 완료율, 오늘의 목표, 주요 메트릭
- **Secondary**: 히스토리, 상세 분석, 설정
- **Tertiary**: 도움말, 추가 기능

## 🌙 다크모드 지원

### 테마 전략
- **시스템 테마 감지**: `prefers-color-scheme` 미디어 쿼리 활용
- **사용자 선택 우선**: 로컬스토리지에 테마 설정 저장
- **부드러운 전환**: CSS transition으로 테마 변경 애니메이션

### 컬러 팔레트 정의
```css
/* Light Mode */
:root {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-text-primary: #1a202c;
  --color-text-secondary: #4a5568;
  --color-border: #e2e8f0;
  --color-accent: #3b82f6;
}

/* Dark Mode */
:root.dark {
  --color-bg-primary: #1a202c;
  --color-bg-secondary: #2d3748;
  --color-text-primary: #f7fafc;
  --color-text-secondary: #cbd5e0;
  --color-border: #4a5568;
  --color-accent: #60a5fa;
}
```

### 다크모드 컴포넌트 패턴
```tsx
// TailwindCSS 다크모드 클래스 활용
const ThemeAwareComponent = () => (
  <div className="
    bg-white dark:bg-gray-800
    text-gray-900 dark:text-gray-100
    border-gray-200 dark:border-gray-700
  ">
    컨텐츠
  </div>
)
```

### 테마 컨텍스트 구현
```tsx
// 테마 관리 훅
const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }
  
  return { theme, setTheme, toggleTheme }
}
```

## ♿ 웹 접근성 (WCAG 2.1 AA 준수)

### 키보드 네비게이션
- **Tab 순서**: 논리적인 포커스 순서 보장
- **키보드 단축키**: 주요 기능에 대한 단축키 제공
- **포커스 표시**: 명확한 포커스 인디케이터
- **Skip Links**: 메인 컨텐츠로 바로 이동

### 스크린 리더 지원
- **시맨틱 HTML**: 적절한 HTML 태그 사용
- **ARIA 레이블**: 복잡한 UI 요소에 aria-label 추가
- **alt 텍스트**: 이미지 및 아이콘에 대한 설명
- **Live Regions**: 동적 컨텐츠 변경 알림

### 색상 및 대비
- **색상 대비**: 4.5:1 이상의 명도 대비 유지
- **색상만으로 정보 전달 금지**: 아이콘, 텍스트 병행 사용
- **다크모드 대비**: 다크모드에서도 충분한 대비 확보

### 접근성 컴포넌트 예시
```tsx
// 접근성을 고려한 버튼 컴포넌트
const AccessibleButton = ({ 
  children, 
  onClick, 
  disabled, 
  ariaLabel,
  ...props 
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    className="
      focus:outline-none 
      focus:ring-2 
      focus:ring-blue-500 
      focus:ring-offset-2
      disabled:opacity-50 
      disabled:cursor-not-allowed
    "
    {...props}
  >
    {children}
  </button>
)
```

## 📐 12컬럼 그리드 시스템

### 그리드 구조
- **최대 컬럼**: 12컬럼 (xl 브레이크포인트)
- **최소 컬럼**: 4컬럼 (모바일 기본)
- **반응형 확장**: 모바일 → 태블릿 → 데스크톱 순으로 컬럼 증가

### 브레이크포인트별 그리드 컬럼
```css
/* 반응형 그리드 컬럼 정의 */
기본(모바일): 4컬럼
sm(480px+): 6컬럼
md(768px+): 8컬럼  
lg(1024px+): 10컬럼
xl(1280px+): 12컬럼
```

### 그리드 레이아웃 패턴
```tsx
// 대시보드 메인 레이아웃
const DashboardLayout = () => (
  <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-6">
    {/* 사이드바 */}
    <aside className="
      col-span-4 
      md:col-span-2 
      lg:col-span-2 
      xl:col-span-3
    ">
      <Navigation />
    </aside>
    
    {/* 메인 컨텐츠 */}
    <main className="
      col-span-4 
      md:col-span-6 
      lg:col-span-6 
      xl:col-span-6
    ">
      <MainContent />
    </main>
    
    {/* 디테일 패널 (데스크톱만) */}
    <aside className="
      hidden 
      xl:block 
      xl:col-span-3
    ">
      <DetailPanel />
    </aside>
  </div>
)

// 카드 그리드 (컨텐츠 영역 내)
const TodoGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {todos.map(todo => (
      <TodoCard key={todo.id} todo={todo} />
    ))}
  </div>
)

// 위젯 그리드 (대시보드)
const WidgetGrid = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-4">
    <Widget className="col-span-2" title="완료율" />
    <Widget className="col-span-2" title="진행 중" />
    <Widget className="col-span-2 md:col-span-4 lg:col-span-4 xl:col-span-6" title="최근 활동" />
  </div>
)
```

### 그리드 스팬 가이드라인
```css
/* 컴포넌트별 권장 그리드 스팬 */

/* 위젯 카드 */
.widget-small { @apply col-span-2; }        /* 작은 위젯 */
.widget-medium { @apply col-span-4; }       /* 중간 위젯 */
.widget-large { @apply col-span-6; }        /* 큰 위젯 */
.widget-full { @apply col-span-full; }      /* 전체 너비 */

/* 레이아웃 섹션 */
.sidebar { @apply col-span-4 md:col-span-2 lg:col-span-2 xl:col-span-3; }
.main-content { @apply col-span-4 md:col-span-6 lg:col-span-6 xl:col-span-6; }
.detail-panel { @apply hidden xl:block xl:col-span-3; }

/* 폼 레이아웃 */
.form-field-half { @apply col-span-2 md:col-span-4; }
.form-field-full { @apply col-span-4 md:col-span-8; }
```

## 📐 레이아웃 및 간격 시스템

### 일관된 간격 체계
```css
/* TailwindCSS 간격 스케일 활용 */
xs: 4px   (p-1)
sm: 8px   (p-2)
md: 16px  (p-4)
lg: 24px  (p-6)
xl: 32px  (p-8)
2xl: 48px (p-12)
```

### 컴포넌트 간격 규칙
- **카드 내부**: padding 16px (p-4)
- **카드 간격**: margin 16px (gap-4)
- **섹션 간격**: margin 32px (space-y-8)
- **페이지 패딩**: 24px (p-6)

## 🎯 컴포넌트 디자인 패턴

### 카드 컴포넌트
```tsx
const TodoCard = ({ todo, className }) => (
  <div className={cn(
    "bg-white dark:bg-gray-800",
    "rounded-lg shadow-sm",
    "border border-gray-200 dark:border-gray-700",
    "p-4 hover:shadow-md",
    "transition-shadow duration-200",
    className
  )}>
    {/* 카드 내용 */}
  </div>
)
```

### 버튼 시스템
```tsx
// Primary Button
const PrimaryButton = "bg-blue-600 hover:bg-blue-700 text-white"

// Secondary Button  
const SecondaryButton = "bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"

// Danger Button
const DangerButton = "bg-red-600 hover:bg-red-700 text-white"
```

### 상태 표시 색상
```css
/* 태스크 상태별 색상 */
.status-todo { @apply bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200; }
.status-in-progress { @apply bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200; }
.status-done { @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200; }

/* 우선순위별 색상 */
.priority-low { @apply border-l-4 border-green-400; }
.priority-medium { @apply border-l-4 border-yellow-400; }
.priority-high { @apply border-l-4 border-red-400; }
```

## 📱 모바일 UX 특화 고려사항

### 터치 인터페이스
- **스와이프 제스처**: 삭제, 완료 표시 등
- **풀 투 리프레시**: 목록 새로고침
- **바텀 네비게이션**: 주요 기능 접근성
- **FAB (Floating Action Button)**: 새 태스크 추가

### 모바일 전용 기능
- **햅틱 피드백**: 중요한 액션에 진동 피드백
- **단축 동작**: 길게 누르기, 더블 탭 등
- **오프라인 지원**: PWA 기능 활용

## 🎨 애니메이션 및 인터랙션

### 마이크로 인터랙션
- **버튼 호버**: 부드러운 색상/크기 변화
- **카드 호버**: 미묘한 그림자 증가
- **체크박스**: 체크 애니메이션
- **로딩**: 스켈레톤 UI 또는 스피너

### 페이지 전환
- **부드러운 전환**: 200-300ms duration
- **Fade/Slide**: 자연스러운 전환 효과
- **Stagger**: 리스트 항목 순차 표시

## 📊 데이터 시각화 가이드라인

### 차트 색상 팔레트
- **Primary**: Blue (#3b82f6)
- **Secondary**: Green (#10b981)  
- **Warning**: Yellow (#f59e0b)
- **Danger**: Red (#ef4444)
- **Info**: Indigo (#6366f1)

### 반응형 차트
- **모바일**: 단순한 바/도넛 차트
- **태블릿**: 기본 차트 + 범례
- **데스크톱**: 복잡한 차트 + 인터랙션

## 🔧 구현 체크리스트

### 반응형 구현
- [ ] 브레이크포인트별 레이아웃 테스트 (480px, 768px, 1024px, 1280px)
- [ ] 12컬럼 그리드 시스템 구현
- [ ] 모바일 4컬럼 → 데스크톱 12컬럼 확장 테스트
- [ ] 모바일 터치 영역 확인 (최소 44px)
- [ ] 태블릿 레이아웃 최적화
- [ ] 데스크톱 멀티 패널 구현

### 다크모드 구현
- [ ] 테마 컨텍스트 설정
- [ ] 컬러 팔레트 정의
- [ ] 모든 컴포넌트 다크모드 지원
- [ ] 테마 전환 애니메이션

### 접근성 구현
- [ ] 시맨틱 HTML 구조
- [ ] ARIA 레이블 추가
- [ ] 키보드 네비게이션 테스트
- [ ] 스크린 리더 테스트
- [ ] 색상 대비 검증

### PC 대시보드 구현
- [ ] 멀티 패널 레이아웃
- [ ] 상세 정보 패널
- [ ] 고급 차트 및 위젯
- [ ] 키보드 단축키

## 📚 참고 리소스

### 디자인 시스템
- [TailwindCSS 컴포넌트](https://tailwindui.com/components)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)

### 접근성 가이드
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### 반응형 디자인
- [CSS Grid 가이드](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Flexbox 가이드](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)

### 다크모드 구현
- [TailwindCSS 다크모드](https://tailwindcss.com/docs/dark-mode)
- [CSS 다크모드 베스트 프랙티스](https://web.dev/prefers-color-scheme/)
