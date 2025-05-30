# 🏗️ 프로젝트 개요

## 📋 프로젝트 정보

- **프로젝트명**: TodoList Monorepo
- **개발 시작일**: 2025년 5월 30일
- **아키텍처**: 풀스택 모노레포
- **패키지 매니저**: Bun
- **코드 스타일**: Biome

## 🛠️ 기술 스택

### Frontend
- **React** 19.1.0 + **TypeScript** 5.8.3
- **Vite** 6.3.5 (개발 서버 & 빌드 도구)
- **TailwindCSS v4** (CSS-first 설정)

### Backend  
- **Hono** 4.7.10 + **TypeScript** 5.8.3
- **Bun** 런타임 (고성능 JavaScript 런타임)

### 개발 도구
- **Bun Workspaces** - 모노레포 관리
- **Biome** 1.9.4 - 린터 & 포맷터 (ESLint + Prettier 대체)
- **Git** - 버전 관리

## 📁 프로젝트 구조

```
todolist/
├── backend/          # Hono API 서버 (포트: 3001)
├── frontend/         # React 웹 앱 (포트: 3000)  
├── docs/            # 프로젝트 문서 (워크스페이스 아님)
├── package.json     # 루트 워크스페이스 설정
├── biome.json       # 코드 스타일 설정
└── README.md        # 프로젝트 메인 문서
```

## 🎯 개발 원칙

1. **타입 안정성**: TypeScript 엄격 모드 사용
2. **코드 품질**: Biome를 통한 일관된 코드 스타일
3. **성능 최적화**: Bun과 Vite의 빠른 개발 환경
4. **모던 웹**: 최신 웹 표준과 베스트 프랙티스 적용

## 🚀 개발 환경

- **Node.js**: Bun 런타임 사용
- **IDE**: VS Code (권장)
- **OS**: Linux/macOS/Windows 호환
