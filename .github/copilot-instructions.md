TodoList 프로젝트 개발 지침:

## 기술 스택
- Frontend: React + TypeScript + Vite + TailwindCSS v4 (CSS-first)
- Backend: Hono + TypeScript + Bun 런타임
- 모노레포: Bun Workspaces
- 코드 품질: Biome (ESLint + Prettier 대체)

## 코딩 규칙
1. TypeScript 엄격 모드 사용, any 타입 금지
2. 함수형 컴포넌트와 React Hooks 사용
3. Biome 설정 준수 (2칸 들여쓰기, 싱글 쿼트, 줄길이 100자)
4. 명시적 타입 정의 필수

## 네이밍 컨벤션
- 컴포넌트: PascalCase (TodoItem.tsx)
- 훅: camelCase + use 접두사 (useTodo.ts)
- 유틸함수: camelCase
- 상수: UPPER_SNAKE_CASE
- 타입/인터페이스: PascalCase

## 파일 구조
- Frontend: components/(ui/todo/layout), hooks/, utils/, types/
- Backend: routes/, services/, middleware/, types/, utils/

## 커밋 메시지
type: 간단한 설명 (feat/fix/docs/style/refactor/test/chore)

모든 코드는 이 지침을 따라 생성해주세요.
