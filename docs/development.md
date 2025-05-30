# 🚀 개발 가이드

## 🛠️ 개발 환경 설정

### 필수 요구사항
- **Bun** 1.2+ (패키지 매니저 및 런타임)
- **Git** (버전 관리)

### 초기 설정
```bash
# 저장소 클론 후
cd todolist

# 의존성 설치
bun install

# 개발 서버 실행 (모든 워크스페이스)
bun run dev

# 개별 워크스페이스 실행
cd frontend && bun run dev  # 포트 3000
cd backend && bun run dev   # 포트 3001
```

## 📝 코딩 컨벤션

### Biome 설정
- **들여쓰기**: 2칸 공백
- **따옴표**: 싱글 쿼트 (`'`)
- **세미콜론**: 필요한 경우만 (`asNeeded`)
- **줄 길이**: 100자

### 명령어
```bash
# 코드 포맷팅
bun run format

# 린팅 (문제 확인)
bun run lint

# 린팅 (자동 수정)
bun run lint:fix
```

## 📂 파일 구조 가이드

### Frontend (`frontend/`)
```
src/
├── components/       # 재사용 가능한 컴포넌트
├── pages/           # 페이지 컴포넌트
├── hooks/           # 커스텀 훅
├── utils/           # 유틸리티 함수
├── types/           # TypeScript 타입 정의
└── styles/          # CSS 파일
```

### Backend (`backend/`)
```
src/
├── routes/          # API 라우트
├── middleware/      # 미들웨어
├── services/        # 비즈니스 로직
├── types/           # TypeScript 타입 정의
└── utils/           # 유틸리티 함수
```

## 🔄 Git 워크플로우

### 브랜치 전략
- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치

### 커밋 메시지 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 추가/수정
```

## 🧪 테스트 가이드

*향후 테스트 프레임워크 선택 후 업데이트 예정*

## 📦 의존성 관리

```bash
# 새 의존성 추가
cd frontend && bun add [package-name]
cd backend && bun add [package-name]

# 개발 의존성 추가
bun add -d [package-name]

# 의존성 업데이트
bun update
```
