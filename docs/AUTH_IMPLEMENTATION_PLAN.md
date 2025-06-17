# Auth 프론트엔드 구현 계획

## 📋 현재 진행 상황

### ✅ 완료된 작업
1. **인증 API 분석**: `useGetAuthTodos`, `usePostAuthTodos` 등 모든 인증 API hooks 생성 완료
2. **로그인/회원가입 페이지**: 완전한 UI 컴포넌트 및 폼 검증 로직 구현
3. **AuthContext**: JWT 토큰 관리, 자동 갱신, 로컬 스토리지 연동 완료
4. **Protected Routes**: 인증 체크, 게스트 전용, 역할 기반 라우트 구현

### 🔄 다음 세션에서 할 작업

#### 1. 로그인/회원가입 폼 API 연동 (High Priority)
- **파일**: `LoginPage.tsx`, `SignupPage.tsx`
- **작업**: 
  - AuthContext의 `login`, `signup` 함수 연동
  - 실제 API 엔드포인트 구현 필요 확인
  - 에러 처리 및 성공 시 리다이렉트 로직
  - React Hook Form 도입 검토

#### 2. JWT 토큰 관리 유틸리티 (Medium Priority)  
- **파일**: `src/utils/auth.ts` (생성 예정)
- **작업**:
  - JWT 디코딩 및 만료 체크 함수
  - Axios/fetch interceptor 설정
  - 토큰 자동 갱신 로직 강화

#### 3. 기존 Todo API를 인증 API로 전환 (Medium Priority)
- **파일**: `hooks/useTodos.ts` 등
- **작업**:
  - `useGetApiTodos` → `useGetAuthTodos` 전환
  - 모든 Todo 관련 컴포넌트 업데이트
  - Authorization 헤더 자동 추가

#### 4. 라우팅 구조 업데이트 (Low Priority)
- **파일**: `routes/index.tsx`, `App.tsx`
- **작업**:
  - AuthProvider 연동
  - Protected Routes 적용
  - 로그인/회원가입 라우트 추가
  - 리다이렉트 로직 개선

#### 5. 인증 에러 처리 및 UX 개선 (Low Priority)
- **작업**:
  - Toast 알림 시스템 구현
  - 네트워크 오류 처리
  - 로딩 상태 개선
  - 접근성 강화

## 🗂️ 파일 구조 현황

```
frontend/src/
├── components/
│   └── auth/
│       ├── ProtectedRoute.tsx ✅
│       └── index.ts ✅
├── contexts/
│   └── AuthContext.tsx ✅
├── pages/
│   ├── LoginPage.tsx ✅
│   └── SignupPage.tsx ✅
└── utils/
    └── auth.ts (생성 예정)
```

## 🔧 기술 스택 고려사항

1. **Form Validation**: React Hook Form + Zod 도입 검토
2. **State Management**: React Query와 AuthContext 연동 최적화
3. **Token Storage**: Secure cookie vs localStorage 보안 검토
4. **Error Handling**: React Error Boundary 구현
5. **Testing**: Auth 관련 컴포넌트 테스트 계획

## 📝 구현 우선순위

1. **High**: API 연동 및 실제 로그인/회원가입 기능
2. **Medium**: 기존 Todo 기능을 인증 API로 전환
3. **Low**: UX 개선 및 에러 처리 강화

## 🚨 주의사항

- 백엔드 인증 API 엔드포인트 확인 필요 (`/api/auth/login`, `/api/auth/signup` 등)
- Refresh token 메커니즘 백엔드 연동 확인
- CORS 설정 및 프록시 구성 점검
- 보안 헤더 및 CSRF 보호 고려

다음 세션에서는 API 연동부터 시작하여 실제 인증 기능을 완성하겠습니다.