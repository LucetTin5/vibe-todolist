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

## 🚨 프리커밋 검증 (필수)

**모든 커밋 전에 반드시 실행해야 하는 검증:**

```bash
# 루트 디렉토리에서 실행
bun run pre-commit
```

이 명령은 다음을 순차적으로 실행합니다:

1. **타입 체크**: TypeScript 타입 오류 검증
2. **린트 검사**: Biome 코드 품질 검증
3. **테스트 실행**: 전체 테스트 스위트 실행

**⚠️ 모든 검증이 통과해야만 커밋 가능**

- 타입 오류, 린트 오류, 테스트 실패 시 커밋 금지
- 오류 발생 시 해당 문제를 먼저 해결한 후 다시 검증 실행

모든 코드는 이 지침을 따라 생성해주세요.

## 코드 수정 시

- 기존 파일을 삭제하지 말고, 새로운 파일을 생성하여 변경사항을 적용해주세요.
- 변경 사항 적용이 완료되었다면, 그 다음에 기존 파일을 삭제하세요.
