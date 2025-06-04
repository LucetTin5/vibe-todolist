---
applyTo: "**"
---

# TodoList 프로젝트 개발 계획 Instructions

AI 어시스턴트가 이 프로젝트를 개발할 때 반드시 준수해야 할 계획서 및 구현 가이드입니다.

## 📋 프로젝트 개요

**기술 스택:**

- Frontend: React 19 + TypeScript + Vite 6 + TailwindCSS v4
- Backend: Hono + TypeScript + Bun 런타임
- 모노레포: Bun Workspaces
- 코드 품질: Biome (ESLint + Prettier 대체)

**프로젝트 범위:**

- 기본 Todo CRUD 기능
- Kanban 보드 뷰 (드래그앤드롭)
- 서브태스크 및 계층 구조
- 캘린더 뷰
- 대시보드 및 분석 차트
- PWA 기능

## 🎯 개발 페이즈 계획

### Phase 1: 핵심 기능 구현

**목표**: 기본적인 Todo CRUD 기능과 리스트 뷰 완성

**백엔드 구현:**

- [x] TypeScript 타입 정의 (`backend/src/types/todo.types.ts`)
- [x] 인메모리 스토리지 구현 (`backend/src/utils/in-memory-storage.ts`)
- [x] Todo 리포지토리 구현 (`backend/src/repositories/todo.repository.ts`)
- [x] Todo 서비스 로직 구현 (`backend/src/services/todo.service.ts`)
- [x] REST API 엔드포인트 구현 (`backend/src/routes/todos.ts`)
- [x] CORS 및 미들웨어 설정

**백엔드 확장:**

- [x] OpenAPI 스키마 생성 (`@hono/zod-openapi` 도입)
- [x] Swagger UI 설정 (`@hono/swagger-ui`)
- [x] API 문서화 및 스키마 검증

**프론트엔드 구현:**

- [x] TailwindCSS v4 설정
- [x] OpenAPI 코드젠 설정 (Orval + React Query)
- [x] API 클라이언트 자동 생성 (`frontend/src/api/`)
- [x] Todo 관련 훅 자동 생성 (`useTodos`, `useCreateTodo` 등)
- [x] 기본 UI 컴포넌트 (Button, Input, Modal)
- [x] TodoList 컴포넌트 구현
- [x] TodoForm 컴포넌트 구현
- [x] ListView 완성

**✅ Phase 1 완료** - 기본적인 Todo CRUD 기능과 리스트 뷰 구현 완료

### Phase 2: 고급 기능 구현

**목표**: 칸반 뷰, 드래그앤드롭, 서브태스크 기능 추가

**칸반 뷰:**

- [ ] 칸반 보드 레이아웃
- [ ] 드래그앤드롭 구현 (useDragAndDrop 훅)
- [ ] 상태 간 태스크 이동 로직

**서브태스크 기능:**

- [ ] 계층 구조 데이터 모델
- [ ] 서브태스크 생성 UI
- [ ] 진행률 계산 로직

**캘린더 뷰:**

- [ ] 캘린더 컴포넌트 구현
- [ ] 날짜별 태스크 표시
- [ ] 마감일 기반 필터링

### Phase 3: 대시보드 및 분석

**목표**: 종합 대시보드와 분석 차트 구현

- [ ] 대시보드 레이아웃
- [ ] 차트 라이브러리 연동
- [ ] 분석 데이터 API

### Phase 4: 최적화 및 확장

**목표**: 성능 최적화 및 추가 기능

- [ ] 성능 최적화 (React.memo, 가상화)
- [ ] 에러 핸들링 구현 (Toast, Error Boundary)
- [ ] PWA 기능
- [ ] 오프라인 지원

## 🎨 디자인 시스템 규칙

### 반응형 브레이크포인트

```css
sm: 480px   /* 모바일 가로 */
md: 768px   /* 태블릿 */
lg: 1024px  /* 데스크톱 */
xl: 1280px  /* 큰 데스크톱 */
```

### 12컬럼 그리드 시스템

- **모바일**: 4컬럼 기본
- **sm(480px+)**: 6컬럼
- **md(768px+)**: 8컬럼
- **lg(1024px+)**: 10컬럼
- **xl(1280px+)**: 12컬럼

### 필수 그리드 패턴

```tsx
// 대시보드 레이아웃
<div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-6">
  <aside className="col-span-4 md:col-span-2 lg:col-span-2 xl:col-span-3">
    {/* 사이드바 */}
  </aside>
  <main className="col-span-4 md:col-span-6 lg:col-span-6 xl:col-span-6">
    {/* 메인 컨텐츠 */}
  </main>
  <aside className="hidden xl:block xl:col-span-3">
    {/* 디테일 패널 (데스크톱만) */}
  </aside>
</div>

// 카드 그리드
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* 카드 컴포넌트들 */}
</div>
```

### 다크모드 패턴

모든 컴포넌트는 다크모드를 지원해야 합니다:

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700">
  {/* 컨텐츠 */}
</div>
```

### 접근성 요구사항

- 모든 버튼에 `focus:ring-2 focus:ring-blue-500` 추가
- 최소 44px 터치 영역 확보
- 시맨틱 HTML 사용
- ARIA 레이블 필수
- 4.5:1 색상 대비 유지

## 📂 파일 구조 규칙

### 백엔드 구조

```
backend/src/
├── types/           # TypeScript 타입 정의
├── utils/           # 유틸리티 함수
├── repositories/    # 데이터 접근 계층
├── services/        # 비즈니스 로직
├── routes/          # API 라우터
├── middleware/      # 미들웨어
└── index.ts         # 서버 엔트리포인트
```

### 프론트엔드 구조

```
frontend/src/
├── components/
│   ├── ui/          # 재사용 UI 컴포넌트
│   ├── todo/        # Todo 관련 컴포넌트
│   ├── layout/      # 레이아웃 컴포넌트
│   └── views/       # 페이지 뷰 컴포넌트
├── hooks/           # 커스텀 훅
├── utils/           # 유틸리티 함수
├── types/           # TypeScript 타입
├── styles/          # 스타일 파일
└── contexts/        # React 컨텍스트
```

## 💻 코딩 표준

### TypeScript 규칙

- 엄격 모드 사용, `any` 타입 금지
- 명시적 타입 정의 필수
- 인터페이스명은 PascalCase

### React 규칙

- 함수형 컴포넌트만 사용
- React Hooks 활용
- Props는 destructuring 사용

### 네이밍 컨벤션

- 컴포넌트: PascalCase (`TodoItem.tsx`)
- 훅: camelCase + use 접두사 (`useTodo.ts`)
- 유틸함수: camelCase
- 상수: UPPER_SNAKE_CASE
- 타입/인터페이스: PascalCase

### Biome 설정 준수

- 2칸 들여쓰기
- 싱글 쿼트 사용
- 줄길이 100자 제한

## 🚀 우선 실행 단계

**지금 즉시 시작해야 할 작업:**

1. **TailwindCSS v4 설정**

   ```bash
   cd frontend
   bun add @tailwindcss/vite@next
   ```

2. **Vite 설정 업데이트**

   ```typescript
   // frontend/vite.config.ts
   import tailwindcss from "@tailwindcss/vite";

   export default defineConfig({
     plugins: [react(), tailwindcss()],
   });
   ```

3. **글로벌 CSS 생성**

   ```css
   /* frontend/src/styles/globals.css */
   @import "tailwindcss";
   ```

4. **백엔드 기본 구조 생성**
   ```bash
   mkdir -p backend/src/{types,services,repositories,routes,utils}
   ```

## 📚 참조 문서

모든 구현은 다음 문서들을 참조해야 합니다:

- **데이터 모델**: `/docs/plans/core/01-data-models.md`
- **API 설계**: `/docs/plans/core/02-api-design.md`
- **백엔드 서비스**: `/docs/plans/core/03-backend-services.md`
- **프론트엔드 아키텍처**: `/docs/plans/core/04-frontend-architecture.md`
- **구현 로드맵**: `/docs/plans/core/05-implementation-roadmap.md`
- **디자인 가이드라인**: `/docs/plans/advanced/03-design-guidelines.md`

## ⚠️ 중요한 제약사항

1. **계획 준수**: 모든 구현은 위 계획을 엄격히 따라야 함
2. **페이즈 순서**: 반드시 Phase 1 → 2 → 3 → 4 순서로 진행
3. **품질 우선**: 기능보다 코드 품질과 사용자 경험 우선
4. **반응형 필수**: 모든 UI는 모바일부터 데스크톱까지 지원
5. **접근성 필수**: WCAG 2.1 AA 기준 준수
6. **다크모드 필수**: 모든 컴포넌트 다크모드 지원

## 🔄 다음 단계

**현재 우선순위:**

1. TailwindCSS v4 설정 완료
2. 백엔드 타입 정의 및 기본 구조 구현
3. 프론트엔드 기본 컴포넌트 구현
4. 첫 번째 작동하는 프로토타입 완성

**체크리스트 확인:**
각 단계 완료 후 해당 계획 문서의 체크리스트를 반드시 확인하고 업데이트하세요.
