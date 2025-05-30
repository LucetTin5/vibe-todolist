# 🎨 TailwindCSS v4 설정 및 디자인 시스템

## 1. TailwindCSS v4 설정

### 설치 및 기본 설정
```bash
cd frontend
bun add @tailwindcss/vite@next
```

### Vite 설정 업데이트
```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

### CSS-first 스타일 정의
```css
/* frontend/src/styles/globals.css */
@import "tailwindcss";

/* CSS Variables for Design Tokens */
:root {
  /* Colors */
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --color-primary-light: #60a5fa;
  
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  
  /* Typography */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --color-gray-50: #111827;
    --color-gray-100: #1f2937;
    --color-gray-200: #374151;
    --color-gray-300: #4b5563;
    --color-gray-400: #6b7280;
    --color-gray-500: #9ca3af;
    --color-gray-600: #d1d5db;
    --color-gray-700: #e5e7eb;
    --color-gray-800: #f3f4f6;
    --color-gray-900: #f9fafb;
  }
}

/* Base styles */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: var(--color-gray-50);
  color: var(--color-gray-900);
  line-height: 1.5;
}

/* Component layer styles */
@layer components {
  /* Button variants */
  .btn {
    @apply inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
  }
  
  .btn-primary {
    @apply bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500;
    background-color: var(--color-primary);
  }
  
  .btn-primary:hover {
    background-color: var(--color-primary-dark);
  }
  
  .btn-secondary {
    @apply bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500;
  }
  
  .btn-danger {
    @apply bg-red-600 hover:bg-red-700 text-white focus:ring-red-500;
  }
  
  .btn-sm {
    @apply px-3 py-1.5 text-sm;
  }
  
  .btn-md {
    @apply px-4 py-2 text-base;
  }
  
  .btn-lg {
    @apply px-6 py-3 text-lg;
  }
  
  /* Input styles */
  .input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
  }
  
  .input:disabled {
    @apply bg-gray-100 text-gray-500 cursor-not-allowed;
  }
  
  .input-error {
    @apply border-red-300 focus:ring-red-500 focus:border-red-500;
  }
  
  /* Card styles */
  .card {
    @apply bg-white rounded-lg shadow-sm border border-gray-200;
    box-shadow: var(--shadow-sm);
  }
  
  .card-body {
    @apply p-6;
  }
  
  .card-header {
    @apply px-6 py-4 border-b border-gray-200;
  }
  
  .card-footer {
    @apply px-6 py-4 border-t border-gray-200 bg-gray-50;
  }
  
  /* Todo specific styles */
  .todo-item {
    @apply card hover:shadow-md transition-shadow duration-200 cursor-pointer;
  }
  
  .todo-item:hover {
    box-shadow: var(--shadow-md);
  }
  
  .todo-item-completed {
    @apply opacity-60;
  }
  
  .todo-priority-high {
    @apply border-l-4 border-red-500;
  }
  
  .todo-priority-medium {
    @apply border-l-4 border-yellow-500;
  }
  
  .todo-priority-low {
    @apply border-l-4 border-green-500;
  }
  
  /* Kanban styles */
  .kanban-column {
    @apply bg-gray-100 rounded-lg p-4 min-h-96;
  }
  
  .kanban-card {
    @apply card mb-3 cursor-move hover:shadow-lg transition-all duration-200;
  }
  
  .kanban-card:hover {
    transform: translateY(-2px);
  }
  
  .kanban-card-dragging {
    @apply opacity-50 transform rotate-3;
  }
  
  /* Calendar styles */
  .calendar-day {
    @apply min-h-24 p-2 border border-gray-200 hover:bg-gray-50;
  }
  
  .calendar-day-today {
    @apply bg-blue-50 border-blue-200;
  }
  
  .calendar-day-other-month {
    @apply text-gray-400 bg-gray-50;
  }
  
  .calendar-event {
    @apply text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 mb-1 truncate;
  }
  
  /* Dashboard styles */
  .dashboard-widget {
    @apply card;
  }
  
  .dashboard-stat {
    @apply text-center p-6;
  }
  
  .dashboard-stat-value {
    @apply text-3xl font-bold text-gray-900;
  }
  
  .dashboard-stat-label {
    @apply text-sm font-medium text-gray-500 uppercase tracking-wide;
  }
  
  /* Modal styles */
  .modal-overlay {
    @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
  }
  
  .modal-content {
    @apply bg-white rounded-lg shadow-xl max-w-md w-full mx-4;
    box-shadow: var(--shadow-lg);
  }
  
  .modal-header {
    @apply px-6 py-4 border-b border-gray-200;
  }
  
  .modal-body {
    @apply px-6 py-4;
  }
  
  .modal-footer {
    @apply px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3;
  }
  
  /* Loading styles */
  .spinner {
    @apply animate-spin rounded-full border-2 border-gray-300 border-t-blue-600;
  }
  
  .skeleton {
    @apply animate-pulse bg-gray-300 rounded;
  }
  
  /* Form styles */
  .form-group {
    @apply mb-4;
  }
  
  .form-label {
    @apply block text-sm font-medium text-gray-700 mb-2;
  }
  
  .form-error {
    @apply text-sm text-red-600 mt-1;
  }
  
  .form-help {
    @apply text-sm text-gray-500 mt-1;
  }
  
  /* Status badges */
  .status-badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }
  
  .status-todo {
    @apply bg-gray-100 text-gray-800;
  }
  
  .status-in-progress {
    @apply bg-yellow-100 text-yellow-800;
  }
  
  .status-done {
    @apply bg-green-100 text-green-800;
  }
  
  .priority-high {
    @apply bg-red-100 text-red-800;
  }
  
  .priority-medium {
    @apply bg-yellow-100 text-yellow-800;
  }
  
  .priority-low {
    @apply bg-green-100 text-green-800;
  }
}

/* Utility layer */
@layer utilities {
  .text-shadow {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .glass {
    backdrop-filter: blur(10px);
    background-color: rgba(255, 255, 255, 0.8);
  }
  
  .glass-dark {
    backdrop-filter: blur(10px);
    background-color: rgba(0, 0, 0, 0.3);
  }
}
```

## 2. 컴포넌트별 스타일 가이드

### 버튼 컴포넌트
```typescript
// frontend/src/components/ui/Button.tsx
import React from 'react'
import { cn } from '../../utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}) => {
  const baseClasses = 'btn'
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'hover:bg-gray-100 text-gray-700',
  }
  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  }

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="spinner w-4 h-4 mr-2"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
```

### 입력 컴포넌트
```typescript
// frontend/src/components/ui/Input.tsx
import React from 'react'
import { cn } from '../../utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helpText,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      
      <input
        id={inputId}
        className={cn(
          'input',
          error && 'input-error',
          className
        )}
        {...props}
      />
      
      {error && (
        <p className="form-error">{error}</p>
      )}
      
      {helpText && !error && (
        <p className="form-help">{helpText}</p>
      )}
    </div>
  )
}
```

### 카드 컴포넌트
```typescript
// frontend/src/components/ui/Card.tsx
import React from 'react'
import { cn } from '../../utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

interface CardBodyProps {
  children: React.ReactNode
  className?: string
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  padding = true 
}) => {
  return (
    <div className={cn('card', className)}>
      {padding ? <div className="card-body">{children}</div> : children}
    </div>
  )
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn('card-header', className)}>
      {children}
    </div>
  )
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className }) => {
  return (
    <div className={cn('card-body', className)}>
      {children}
    </div>
  )
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => {
  return (
    <div className={cn('card-footer', className)}>
      {children}
    </div>
  )
}
```

## 3. 반응형 디자인 전략

### 브레이크포인트 정의
```css
/* 모바일 우선 접근 방식 */
/* xs: 0px - 639px (모바일) */
/* sm: 640px - 767px (큰 모바일) */
/* md: 768px - 1023px (태블릿) */
/* lg: 1024px - 1279px (작은 데스크톱) */
/* xl: 1280px - 1535px (데스크톱) */
/* 2xl: 1536px+ (큰 데스크톱) */

/* 반응형 컨테이너 */
.container-responsive {
  @apply mx-auto px-4 sm:px-6 lg:px-8;
  max-width: 1200px;
}

/* 그리드 시스템 */
.grid-responsive {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6;
}

/* 네비게이션 */
.nav-desktop {
  @apply hidden md:flex;
}

.nav-mobile {
  @apply md:hidden;
}
```

### 모바일 최적화 스타일
```css
/* 터치 인터페이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .btn {
    @apply min-h-[44px] min-w-[44px]; /* 최소 터치 영역 */
  }
  
  .todo-item {
    @apply py-4; /* 터치하기 쉬운 높이 */
  }
}

/* 모바일 전용 스타일 */
@media (max-width: 640px) {
  .kanban-column {
    @apply min-w-[280px]; /* 스크롤 가능한 칸반 */
  }
  
  .modal-content {
    @apply mx-2 max-h-[90vh] overflow-y-auto;
  }
  
  .dashboard-grid {
    @apply grid-cols-1 gap-4;
  }
}
```

## 4. 애니메이션 및 전환 효과

### 커스텀 애니메이션
```css
@layer utilities {
  /* 페이드 인/아웃 */
  .fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  .fade-out {
    animation: fadeOut 0.3s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-10px); }
  }
  
  /* 슬라이드 애니메이션 */
  .slide-in-right {
    animation: slideInRight 0.3s ease-out;
  }
  
  @keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  
  /* 바운스 효과 */
  .bounce-in {
    animation: bounceIn 0.5s ease-out;
  }
  
  @keyframes bounceIn {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.05); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); opacity: 1; }
  }
  
  /* 드래그 애니메이션 */
  .drag-preview {
    @apply transform rotate-3 scale-105 shadow-2xl opacity-80;
  }
  
  .drop-zone-active {
    @apply bg-blue-50 border-2 border-blue-300 border-dashed;
  }
}
```

## 5. 테마 시스템

### 라이트/다크 모드 지원
```typescript
// frontend/src/hooks/useTheme.ts
import { useState, useEffect } from 'react'

export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    setTheme(savedTheme || (prefersDark ? 'dark' : 'light'))
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return { theme, toggleTheme }
}
```

### 다크 모드 스타일
```css
/* 다크 모드 변수 */
.dark {
  --color-primary: #60a5fa;
  --color-primary-dark: #3b82f6;
  --color-primary-light: #93c5fd;
}

.dark .card {
  @apply bg-gray-800 border-gray-700;
}

.dark .input {
  @apply bg-gray-800 border-gray-600 text-white placeholder-gray-400;
}

.dark .btn-secondary {
  @apply bg-gray-700 hover:bg-gray-600 text-gray-200;
}

.dark .todo-item {
  @apply bg-gray-800 border-gray-700;
}

.dark .kanban-column {
  @apply bg-gray-800;
}

.dark .modal-content {
  @apply bg-gray-800;
}
```

## 6. 구현 우선순위

### Phase 1: 기본 스타일 시스템
1. ✅ TailwindCSS v4 설정
2. ✅ CSS 변수 및 디자인 토큰 정의
3. ✅ 기본 컴포넌트 스타일 (Button, Input, Card)
4. 반응형 레이아웃 구현

### Phase 2: 고급 UI 컴포넌트
1. Modal 및 오버레이 컴포넌트
2. 드롭다운 및 선택 컴포넌트
3. 토스트 알림 시스템
4. 로딩 및 스켈레톤 컴포넌트

### Phase 3: 테마 및 애니메이션
1. 다크/라이트 모드 구현
2. 애니메이션 및 전환 효과
3. 접근성 개선
4. 성능 최적화

## 7. 다음 단계

1. **칸반 뷰 스타일링** (`02-kanban-view.md`)
2. **캘린더 뷰 구현** (`03-calendar-view.md`)
3. **대시보드 디자인** (`04-dashboard.md`)
4. **모바일 최적화** (`05-mobile-optimization.md`)
