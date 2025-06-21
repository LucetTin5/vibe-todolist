# TodoList - 현대적인 풀스택 태스크 관리 플랫폼

**Bun 모노레포 기반의 완전한 TodoList 애플리케이션**

다중 뷰 모드(리스트/칸반/캘린더/대시보드), 인증, 실시간 동기화를 지원하는 현대적인 웹 애플리케이션입니다.

## ✨ 주요 기능

### 🎯 핵심 기능

- **4가지 뷰 모드**: 리스트, 칸반 보드, 캘린더, 대시보드
- **완전한 CRUD**: Todo 생성, 조회, 수정, 삭제
- **고급 상태 관리**: 우선순위, 카테고리, 상태, 태그 시스템
- **드래그 앤 드롭**: 직관적인 태스크 관리
- **실시간 동기화**: React Query 기반 서버 상태 관리

### 🔐 인증 & 보안

- **Supabase Auth**: 이메일/비밀번호 인증
- **세션 기반 인증**: JWT 토큰 관리
- **보호된 라우트**: 인증된 사용자만 접근 가능

### 📊 대시보드 & 분석

- **8개 위젯**: 통계 카드, 차트, 빠른 액션 등
- **인터랙티브 차트**: Recharts 기반 데이터 시각화
- **실시간 통계**: 완료율, 우선순위별 분석, 트렌드 분석

### 🎨 사용자 경험

- **반응형 디자인**: 모바일/태블릿/데스크톱 최적화
- **다크/라이트 모드**: 시스템 설정 연동
- **부드러운 애니메이션**: GSAP 기반 인터랙션
- **스켈레톤 로딩**: 향상된 로딩 경험

## 🏗️ 기술 스택

### Backend

- **[Hono](https://hono.dev/)** 4.7.11 - 고성능 웹 프레임워크
- **[Bun](https://bun.sh/)** - 빠른 JavaScript 런타임
- **[Drizzle ORM](https://orm.drizzle.team/)** 0.44.2 - 타입 안전 ORM
- **[Supabase](https://supabase.com/)** 2.50.0 - 백엔드 서비스
- **[OpenAPI](https://swagger.io/specification/)** - API 문서화 및 타입 생성
- **[Zod](https://zod.dev/)** - 스키마 검증

### Frontend

- **[React](https://react.dev/)** 19.1.0 + **TypeScript** 5.8.3
- **[Vite](https://vite.dev/)** 6.3.5 - 빌드 도구
- **[TailwindCSS v4](https://tailwindcss.com/)** 4.1.8 - 유틸리티 CSS
- **[React Query](https://tanstack.com/query)** 5.80.2 - 서버 상태 관리
- **[React Router](https://reactrouter.com/)** 7.6.2 - 클라이언트 라우팅
- **[Recharts](https://recharts.org/)** 2.15.3 - 차트 라이브러리
- **[GSAP](https://gsap.com/)** 3.13.0 - 애니메이션
- **[Orval](https://orval.dev/)** 7.9.0 - OpenAPI 코드 생성

### 개발 도구

- **[Bun Workspaces](https://bun.sh/docs/install/workspaces)** - 모노레포 관리
- **[Biome](https://biomejs.dev/)** 1.9.4 - 린터 & 포맷터
- **[Playwright](https://playwright.dev/)** 1.53.0 - E2E 테스트

## 📁 프로젝트 구조

```
todolist/
├── backend/              # Hono API 서버 (포트: 3300)
│   ├── src/
│   │   ├── routes/       # API 라우트 (todos, auth)
│   │   ├── services/     # 비즈니스 로직
│   │   ├── db/          # Drizzle ORM 설정
│   │   ├── schemas/     # Zod 스키마
│   │   └── middleware/  # 인증 미들웨어
│   └── package.json
├── frontend/             # React 웹 애플리케이션 (포트: 5173)
│   ├── src/
│   │   ├── components/   # 재사용 가능한 컴포넌트
│   │   ├── pages/       # 페이지 컴포넌트
│   │   ├── hooks/       # 커스텀 훅
│   │   ├── contexts/    # React 컨텍스트
│   │   └── api/         # Orval 생성 API 클라이언트
│   └── package.json
├── docs/                # 프로젝트 문서 (⚠️ 일부 내용이 실제와 다를 수 있음)
├── package.json         # 루트 워크스페이스 설정
└── biome.json          # 코드 스타일 설정
```

## 🚀 빠른 시작

### 전제 조건

- **Bun** 1.0+ 설치 필요
- **Node.js** 18+ (Bun 백엔드)
- **PostgreSQL** 데이터베이스 (Supabase 권장)

### 설치 및 실행

```bash
# 저장소 클론
git clone <repository-url>
cd todolist

# 모든 의존성 설치
bun install

# 환경 변수 설정
cp backend/.env.example backend/.env
# backend/.env 파일을 실제 값으로 수정

# 데이터베이스 마이그레이션
cd backend
bun run db:push

# 개발 서버 실행 (모든 워크스페이스)
bun run dev
```

### 개별 워크스페이스 실행

```bash
# 백엔드만 실행
cd backend
bun run dev

# 프론트엔드만 실행
cd frontend
bun run dev
```

## 🎯 접속 포트

- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:3300
- **API 문서 (Swagger)**: http://localhost:3300/docs
- **OpenAPI 스키마**: http://localhost:3300/openapi.json

## 🛠️ 개발 스크립트

### 루트 워크스페이스

```bash
bun run dev          # 모든 워크스페이스 개발 서버 실행
bun run build        # 모든 워크스페이스 빌드
bun run test         # 모든 테스트 실행
bun run format       # 코드 포맷팅
bun run lint         # 린팅 검사
bun run lint:fix     # 린팅 자동 수정
bun run type-check   # 타입 검사
```

### 백엔드 전용

```bash
cd backend
bun run dev          # 핫 리로드 개발 서버
bun run build        # 프로덕션 빌드
bun run start        # 프로덕션 서버 실행
bun run db:generate  # Drizzle 마이그레이션 생성
bun run db:push      # 데이터베이스 스키마 적용
bun run db:studio    # Drizzle Studio 실행
```

### 프론트엔드 전용

```bash
cd frontend
bun run dev          # Vite 개발 서버
bun run build        # 프로덕션 빌드
bun run preview      # 빌드 미리보기
bun run orval        # OpenAPI 클라이언트 재생성
bun run test:e2e     # Playwright E2E 테스트
```

## 🎨 뷰 모드

### 📋 리스트 뷰

- 클래식한 Todo 리스트 형태
- 필터링, 정렬, 검색 기능
- 인라인 편집 지원

### 🎯 칸반 뷰

- 3단계 칸반 보드 (Todo / In Progress / Done)
- 드래그 앤 드롭으로 상태 변경
- 카드 기반 태스크 관리

### 📅 캘린더 뷰

- 월간/주간/일간 캘린더
- 마감일 기반 태스크 표시
- 일정 관리 기능

### 📊 대시보드 뷰

- 8개 위젯으로 구성된 종합 대시보드
- 실시간 통계 및 차트
- 빠른 액션 버튼

## 🔐 인증 플로우

1. **회원가입/로그인**: Supabase Auth 사용
2. **세션 관리**: JWT 토큰 기반
3. **보호된 라우트**: 인증 상태 확인
4. **자동 리프레시**: 토큰 갱신 자동화

## 🧪 테스트

```bash
# E2E 테스트 실행
cd frontend
bun run test:e2e

# 헤드리스 모드로 테스트
bun run test:e2e:ui

# 브라우저 모드로 테스트
bun run test:e2e:headed
```

## 📚 문서 및 참고사항

### ⚠️ 중요 주의사항

`docs/` 폴더의 문서들은 개발 과정에서 작성된 초기 계획과 설계 문서입니다. 실제 구현 과정에서 우선순위와 방향이 변경되어 **일부 내용이 현재 구현 상태와 다를 수 있습니다**. 최신 정보는 실제 코드와 이 README.md를 참고하시기 바랍니다.

### 문서 목록

- [프로젝트 개요](./docs/project-overview.md) - 초기 기획 문서
- [기능 명세서](./docs/features.md) - 계획된 기능 목록
- [구현 상태](./docs/IMPLEMENTATION-STATUS.md) - 최신 구현 진행 상황
- [개발 가이드](./docs/development.md) - 개발 환경 설정

## 🎯 다음 단계

현재 핵심 기능들이 완성된 상태이며, 다음과 같은 개선 작업을 고려중입니다:

1. **성능 최적화**: React.memo, 가상화, 코드 스플리팅
2. **사용자 경험 개선**: 키보드 단축키, 접근성 향상
3. **추가 기능**: 서브태스크, 파일 첨부, 댓글 시스템
4. **외부 연동**: Google Calendar, 데이터 내보내기

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](./LICENSE) 파일을 참고하세요.
