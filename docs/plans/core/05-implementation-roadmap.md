# 🚀 구현 로드맵 및 실행 계획

## 📅 전체 개발 페이즈

### 🔥 Phase 1: 핵심 기능 구현

**목표**: 기본적인 Todo CRUD 기능과 리스트 뷰 완성

#### 백엔드 기반 구축

- [x] 프로젝트 기본 설정 완료
- [x] TypeScript 타입 정의 완료
- [x] 인메모리 스토리지 구현
- [x] Todo 리포지토리 구현
- [x] Todo 서비스 로직 구현
- [x] REST API 엔드포인트 구현
- [x] CORS 및 미들웨어 설정
- [x] API 테스트 완료

#### 백엔드 OpenAPI 확장

- [ ] @hono/zod-openapi 패키지 설치 및 설정
- [ ] 기존 Zod 스키마를 OpenAPI 호환으로 변환
- [ ] OpenAPI JSON 스키마 자동 생성
- [ ] Swagger UI 엔드포인트 추가 (/docs)
- [ ] API 문서화 완료

#### 프론트엔드 코드젠 설정

- [x] TailwindCSS v4 설정 완료
- [ ] Orval 코드젠 라이브러리 설치 및 설정
- [ ] OpenAPI 스키마 기반 API 클라이언트 자동 생성
- [ ] React Query와 통합된 커스텀 훅 자동 생성
- [ ] TypeScript 타입 및 Zod 스키마 자동 생성

#### 프론트엔드 완성

- [ ] ListView 및 TodoForm 컴포넌트 완성
- [ ] 에러 핸들링 및 로딩 상태 구현
- [ ] 기본 기능 테스트 및 버그 수정

### ⚡ Phase 2: 고급 기능 구현

**목표**: 칸반 뷰, 드래그앤드롭, 서브태스크 기능 추가

#### 칸반 뷰 구현

- [ ] 칸반 보드 레이아웃 및 컴포넌트 구조
- [ ] 드래그앤드롭 기능 구현
- [ ] 상태 간 태스크 이동 로직 완성

#### 계층 구조 및 서브태스크

- [ ] 서브태스크 생성 및 관리 기능
- [ ] 계층 구조 UI 구현
- [ ] 진행률 자동 계산 로직

#### 캘린더 뷰 구현

- [ ] 캘린더 컴포넌트 구현
- [ ] 날짜별 태스크 표시 및 관리
- [ ] 마감일 기반 필터링 및 알림

### 🎯 Phase 3: 대시보드 및 분석

**목표**: 종합 대시보드와 분석 차트 구현

#### 대시보드 구현

- [ ] 대시보드 레이아웃 및 위젯 구조
- [ ] 분석 데이터 API 및 차트 라이브러리 연동
- [ ] 반응형 디자인 및 모바일 최적화

### 🔮 Phase 4: 최적화 및 확장

**목표**: 성능 최적화 및 추가 기능

#### 최적화 및 마무리

- [ ] 성능 최적화 (React.memo, 가상화)
- [ ] PWA 기능 및 오프라인 지원
- [ ] 최종 테스트 및 배포 준비

## 📝 개발 작업 관리 원칙

### 커밋 전략
- **작업 단위 기준**: 각 논리적 작업 단위 (기능, 버그픽스, 마일스톤) 완료 후 즉시 커밋 생성
- **추가 작업 중단**: 일정 단위의 작업 완료 시 추가 작업을 멈추고 커밋을 우선 진행
- **명확한 히스토리 유지**: 프로젝트 진행 상황을 명확하게 추적할 수 있도록 규칙적 커밋 실행

### 작업 흐름
1. 특정 기능이나 작업 완료
2. 즉시 커밋 생성 (추가 작업 중단)
3. 다음 작업 단위로 진행

## 🛠️ 즉시 실행 가능한 단계별 가이드

### 🚀 Step 1: TailwindCSS v4 설정

#### 1-1. TailwindCSS v4 패키지 설치

```bash
cd frontend
bun add @tailwindcss/vite@next
```

#### 1-2. Vite 설정 업데이트

```typescript
// frontend/vite.config.ts에 추가
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ...
});
```

#### 1-3. CSS 파일 생성

```css
/* frontend/src/styles/globals.css */
@import "tailwindcss";

/* 커스텀 컴포넌트 스타일 */
@layer components {
  .btn-primary {
    @apply bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg;
  }

  .todo-card {
    @apply bg-white rounded-lg shadow-sm border border-gray-200 p-4;
  }
}
```

### 🎯 Step 2: 백엔드 기본 구조 구현

#### 2-1. 타입 정의 파일 생성

```bash
mkdir -p backend/src/types backend/src/services backend/src/repositories
```

#### 2-2. 기본 서비스 구현

- `backend/src/types/todo.types.ts` 생성
- `backend/src/utils/in-memory-storage.ts` 구현
- `backend/src/repositories/todo.repository.ts` 구현
- `backend/src/services/todo.service.ts` 구현

#### 2-3. API 라우터 구현

- `backend/src/routes/todos.ts` 구현
- `backend/src/index.ts` 업데이트

### ⚛️ Step 3: 프론트엔드 기본 구조 구현

#### 3-1. 디렉토리 구조 생성

```bash
cd frontend/src
mkdir -p components/{ui,todo,layout,views} hooks utils types styles contexts
```

#### 3-2. 기본 타입 및 API 클라이언트 구현

- `frontend/src/types/todo.types.ts` 생성
- `frontend/src/utils/api.ts` 구현
- `frontend/src/hooks/useTodos.ts` 구현

#### 3-3. 기본 UI 컴포넌트 구현

- `frontend/src/components/ui/Button.tsx`
- `frontend/src/components/ui/Input.tsx`
- `frontend/src/components/ui/Modal.tsx`

### 📝 Step 4: 첫 번째 작동하는 프로토타입

#### 4-1. ListView 컴포넌트 구현

- `frontend/src/components/views/ListView.tsx`
- `frontend/src/components/todo/TodoList.tsx`
- `frontend/src/components/todo/TodoItem.tsx`

#### 4-2. TodoForm 컴포넌트 구현

- `frontend/src/hooks/useTodoForm.ts`
- `frontend/src/components/todo/TodoForm.tsx`

#### 4-3. App.tsx 통합

- 전체 컴포넌트 연결
- React Query 설정
- 기본 라우팅 구현

## 📋 구현 체크리스트

### ✅ Phase 1 체크리스트

#### 백엔드 구현

- [x] 프로젝트 기본 설정 완료
- [x] TypeScript 타입 정의 완료
- [x] 인메모리 스토리지 구현
- [x] Todo 리포지토리 구현
- [x] Todo 서비스 로직 구현
- [x] REST API 엔드포인트 구현
- [x] CORS 및 미들웨어 설정
- [x] API 테스트 (Postman/Thunder Client)

#### 프론트엔드 구현

- [ ] TailwindCSS v4 설정 완료
- [ ] React Query 설정
- [ ] 기본 타입 정의 완료
- [ ] API 클라이언트 구현
- [ ] useTodos 훅 구현
- [ ] useTodoForm 훅 구현
- [ ] 기본 UI 컴포넌트 구현
- [ ] TodoList 컴포넌트 구현
- [ ] TodoForm 컴포넌트 구현
- [ ] ListView 완성
- [ ] 에러 핸들링 구현

#### 기능 테스트

- [ ] Todo 생성 기능
- [ ] Todo 목록 조회
- [ ] Todo 수정 기능
- [ ] Todo 삭제 기능
- [ ] 상태 토글 기능
- [ ] 폼 검증 기능
- [ ] 로딩 상태 표시
- [ ] 에러 상태 처리

### 🔥 Phase 2 체크리스트

#### 칸반 뷰

- [ ] 칸반 보드 레이아웃
- [ ] 상태별 컬럼 구성
- [ ] 드래그앤드롭 구현
- [ ] useDragAndDrop 훅
- [ ] 상태 간 이동 애니메이션
- [ ] 일괄 업데이트 API

#### 서브태스크 기능

- [ ] 계층 구조 데이터 모델
- [ ] 서브태스크 생성 UI
- [ ] 중첩 레벨 표시
- [ ] 진행률 계산 로직
- [ ] 부모-자식 관계 관리

#### 캘린더 뷰

- [ ] 캘린더 라이브러리 선택
- [ ] 월간/주간/일간 뷰
- [ ] 날짜별 태스크 표시
- [ ] 마감일 기반 필터링
- [ ] 날짜 드래그앤드롭

### 🎯 Phase 3 체크리스트

#### 대시보드

- [ ] 대시보드 레이아웃
- [ ] 통계 위젯 구현
- [ ] 차트 라이브러리 연동
- [ ] 완료율 차트
- [ ] 기간별 분석
- [ ] 우선순위별 분포
- [ ] 실시간 업데이트

#### 분석 기능

- [ ] 분석 데이터 API
- [ ] 완료 추세 차트
- [ ] 생산성 메트릭
- [ ] 목표 설정 및 추적
- [ ] 데이터 내보내기

## 🎯 다음 실행할 단계

1. **즉시 시작**: TailwindCSS v4 설정
2. **이어서 진행**: 백엔드 기본 구조 구현
3. **그 다음**: 프론트엔드 기본 구조 및 첫 프로토타입

## 📚 관련 문서

- [데이터 모델 설계](./01-data-models.md)
- [API 엔드포인트 설계](./02-api-design.md)
- [백엔드 서비스 구현](./03-backend-services.md)
- [프론트엔드 아키텍처](./04-frontend-architecture.md)

## 🔗 유용한 리소스

### 개발 도구

- [React Query DevTools](https://tanstack.com/query/v4/docs/devtools)
- [VS Code Thunder Client](https://marketplace.visualstudio.com/items?itemName=rangav.vscode-thunder-client)
- [React Developer Tools](https://react.dev/learn/react-developer-tools)

### 라이브러리 문서

- [TailwindCSS v4 Alpha](https://tailwindcss.com/docs/v4-beta)
- [React Query (TanStack Query)](https://tanstack.com/query/latest)
- [Hono Framework](https://hono.dev/)
- [Zod Validation](https://zod.dev/)

### 참고 예제

- [Hono + React 예제](https://github.com/honojs/examples)
- [React Query 예제](https://github.com/TanStack/query/tree/main/examples/react)
- [TailwindCSS 컴포넌트](https://tailwindui.com/components)
