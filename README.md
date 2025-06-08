# To## 📁 워크스페이스 구조

```
todolist/
├── backend/          # Hono API 서버
├── frontend/         # React 웹 애플리케이션
├── docs/            # 프로젝트 문서 📚
├── package.json     # 루트 패키지 설정
└── biome.json       # 코드 스타일 설정
```orepo

Bun Workspaces를 사용한 모노레포 구조의 풀스택 TodoList 애플리케이션입니다.

## 🏗️ 워크스페이스 구조

```
todolist/
├── backend/          # Hono API 서버
├── frontend/         # React 웹 애플리케이션
├── docs/            # 프로젝트 문서
├── package.json     # 루트 패키지 설정
└── biome.json       # 코드 스타일 설정
```

## 🚀 빠른 시작

```bash
# 의존성 설치
bun install

# 최신 버전으로 업그레이드
bun update

# 모든 워크스페이스 개발 서버 실행
bun run dev

# 코드 포맷팅
bun run format

# 린팅
bun run lint
```

## 📦 기술 스택

### Frontend
- **React** + **TypeScript**
- **Vite** - 빌드 도구 (포트 5173, API 프록시 설정)
- **TailwindCSS v4** (CSS-first 설정 예정)
- **React Query** - 서버 상태 관리
- **Orval** - OpenAPI 기반 API 클라이언트 생성

### Backend
- **Hono** + **TypeScript**
- **Bun** 런타임 (포트 3300)
- **OpenAPI** - API 스키마 생성 및 문서화
- **Zod** - 데이터 검증

### 도구
- **Bun Workspaces** - 모노레포 관리
- **Biome** - 린터 & 포맷터
- **TypeScript** - 타입 안정성

## 🎯 개발 포트

- Frontend: http://localhost:5173
- Backend: http://localhost:3300
- Swagger UI: http://localhost:3300/docs

## 📋 다음 단계

1. **기능 기획 및 요구사항 정의** ✅
2. TailwindCSS v4 CSS-first 설정
3. 상태 관리 라이브러리 선택 (React Query, React Hook Form 등)
4. 데이터베이스 설계 및 ORM 설정

## 📚 문서

자세한 정보는 [`docs/`](./docs/) 디렉토리를 참고하세요:
- [프로젝트 개요](./docs/project-overview.md)
- [기능 명세서](./docs/features.md)
- [개발 가이드](./docs/development.md)
