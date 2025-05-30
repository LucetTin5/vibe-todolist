# VS Code Copilot Instructions 가이드

## 📋 문서 분석 결과

VS Code Copilot Customization 문서를 분석한 결과, instructions 파일 작성 방법과 활성화 방법을 정리했습니다.

## 🎯 Instructions 파일 유형

### 1. `.github/copilot-instructions.md` (전역 instructions)

- **위치**: 워크스페이스 루트의 `.github/copilot-instructions.md`
- **범위**: 해당 워크스페이스의 모든 chat 요청에 자동 적용
- **용도**: 프로젝트 전반의 코딩 관례, 기술 스택, 요구사항 정의
- **활성화**: `github.copilot.chat.codeGeneration.useInstructionFiles` 설정을 `true`로 설정

### 2. `.instructions.md` 파일들 (특정 작업용)

- **위치**:
  - 워크스페이스: `.github/instructions/` 폴더
  - 사용자 프로필: VS Code profile 폴더
- **범위**: 특정 파일, 폴더, 또는 작업에 적용
- **용도**: 특정 언어, 프레임워크, 프로젝트 타입별 세부 지침
- **활성화**: `chat.promptFiles` 설정을 `true`로 설정

## 🔧 활성화 방법

### 필수 설정

```json
{
  // .github/copilot-instructions.md 파일 사용
  "github.copilot.chat.codeGeneration.useInstructionFiles": true,

  // .instructions.md 파일들 사용 (실험적 기능)
  "chat.promptFiles": true,

  // instructions 파일 위치 지정 (선택사항)
  "chat.instructionsFilesLocations": [".github/instructions"]
}
```

## 📝 Instructions 파일 구조

### `.github/copilot-instructions.md` 구조

```markdown
# TodoList 프로젝트 개발 지침

## 기술 스택

- Frontend: React + TypeScript + Vite + TailwindCSS v4
- Backend: Hono + TypeScript + Bun 런타임

## 코딩 규칙

1. TypeScript 엄격 모드 사용, any 타입 금지
2. 함수형 컴포넌트와 React Hooks 사용
3. Biome 설정 준수 (2칸 들여쓰기, 싱글 쿼트)

## 네이밍 컨벤션

- 컴포넌트: PascalCase
- 훅: camelCase + use 접두사
- 타입/인터페이스: PascalCase
```

### `.instructions.md` 파일 구조

```markdown
---
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript 및 React 특별 지침

React 컴포넌트는 반드시 함수형으로 작성하고,
useState, useEffect 등의 훅을 적절히 활용하세요.

[일반 코딩 가이드라인](./general.instructions.md) 참조
```

## 📋 Front Matter 메타데이터

### applyTo 속성

- `"**"`: 모든 파일에 적용
- `"**/*.ts,**/*.tsx"`: TypeScript 파일에만 적용
- `"src/components/**"`: 특정 폴더에만 적용

## 🎯 현재 프로젝트 적용 계획

### 1. 기존 파일 활용

- `.github/copilot-instructions.md` (이미 존재) ✅
- 전역 instructions로 프로젝트 기본 규칙 포함

### 2. 새로 생성할 파일

- `plan.instructions.md`: 개발 계획 및 구현 가이드
- 위치: `.github/instructions/plan.instructions.md`
- 범위: 모든 파일에 적용 (`applyTo: "**"`)

### 3. VSCode 설정 업데이트

현재 설정에 추가 필요:

```json
{
  "github.copilot.chat.codeGeneration.useInstructionFiles": true,
  "chat.promptFiles": true,
  "chat.instructionsFilesLocations": [".github/instructions"]
}
```

## 💡 베스트 프랙티스

### Instructions 작성 팁

1. **간결하고 명확**: 각 instruction은 단일하고 명확한 지시사항
2. **외부 참조 금지**: 외부 문서나 표준 참조하지 말고 직접 명시
3. **파일별 분리**: 주제나 작업 유형별로 파일 분리
4. **상대 경로 참조**: 다른 instruction 파일 참조 시 상대 경로 사용
5. **Markdown 링크 활용**: `[링크 텍스트](./other-file.instructions.md)` 형식

### 구성 예시

```
.github/
├── copilot-instructions.md          # 전역 규칙
└── instructions/
    ├── plan.instructions.md          # 개발 계획 (모든 파일)
    ├── frontend.instructions.md      # 프론트엔드 (*.tsx, *.ts)
    ├── backend.instructions.md       # 백엔드 (backend/**/*.ts)
    └── styling.instructions.md       # 스타일링 (*.css, *.tsx)
```

## 🔄 현재 상태 및 다음 단계

### 현재 상태

- `.github/copilot-instructions.md` ✅ (프로젝트 기본 규칙)
- VSCode 설정에 기본 instructions 파일 경로 설정됨 ✅

### 다음 단계

1. VSCode 설정에 추가 설정 필요
2. `plan.instructions.md` 파일 생성
3. 개발 계획 및 구현 가이드 작성
4. 테스트 및 검증

## 📚 참고 링크

- [VS Code Copilot Customization](https://code.visualstudio.com/docs/copilot/copilot-customization)
- [Instruction Files 가이드](https://code.visualstudio.com/docs/copilot/copilot-customization#_instruction-files)
- [Front Matter 문법](https://jekyllrb.com/docs/front-matter/)
