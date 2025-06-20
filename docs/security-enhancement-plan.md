# 보안 강화 계획

## 현재 보안 상태 분석

### 취약점
1. **Refresh Token 평문 저장**: localStorage/sessionStorage에 평문으로 저장
2. **토큰 만료 검증 부족**: 클라이언트 사이드에서만 토큰 만료 체크
3. **XSS 공격 위험**: localStorage/sessionStorage는 XSS에 취약
4. **CSRF 공격 위험**: SameSite 쿠키 설정 부재
5. **사용자별 데이터 격리 부족**: 백엔드에서 사용자 권한 검증 미흡

## 단계별 보안 강화 방안

### Phase 1: 즉시 적용 가능한 개선사항

#### 1.1 토큰 저장 방식 개선
- **현재**: localStorage/sessionStorage에 평문 저장
- **개선**: HttpOnly 쿠키 + Secure 플래그 + SameSite 설정
- **구현**:
  ```typescript
  // 백엔드에서 쿠키 설정
  response.headers.set('Set-Cookie', [
    `access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900`, // 15분
    `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh; Max-Age=604800` // 7일
  ])
  ```

#### 1.2 토큰 암호화
- **현재**: 평문 저장
- **개선**: AES-256-GCM 암호화 적용
- **구현**:
  ```typescript
  const encryptToken = (token: string, key: string): string => {
    // Web Crypto API 사용한 토큰 암호화
  }
  ```

#### 1.3 CSRF 보호
- **추가**: CSRF 토큰 생성 및 검증
- **구현**: Double Submit Cookie 패턴 적용

### Phase 2: 중기 보안 강화

#### 2.1 JWT 토큰 보안 강화
- **Access Token 수명 단축**: 15분 → 5분
- **Refresh Token 로테이션**: 사용 시마다 새 토큰 발급
- **토큰 무효화 리스트**: Redis를 통한 블랙리스트 관리

#### 2.2 Rate Limiting
- **로그인 시도 제한**: IP당 5회/5분
- **API 호출 제한**: 사용자당 100회/분
- **Refresh Token 사용 제한**: 1회/분

#### 2.3 사용자별 데이터 격리
- **백엔드 권한 검증 강화**
- **Row Level Security (RLS) 적용**
- **API 응답에서 민감 정보 제거**

### Phase 3: 고급 보안 기능

#### 3.1 다중 인증 (MFA)
- **TOTP 기반 2FA 구현**
- **SMS/이메일 인증 백업**

#### 3.2 세션 관리 고도화
- **동시 로그인 제한**
- **의심스러운 활동 감지**
- **강제 로그아웃 기능**

#### 3.3 보안 헤더
```typescript
// 보안 헤더 설정
app.use((c, next) => {
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('X-XSS-Protection', '1; mode=block')
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  c.header('Content-Security-Policy', "default-src 'self'")
  return next()
})
```

## 구현 우선순위

### 높음 (즉시 구현)
1. Refresh Token 암호화
2. HttpOnly 쿠키 적용
3. 사용자별 데이터 격리

### 중간 (2주 내)
1. CSRF 보호
2. Rate Limiting
3. 토큰 로테이션

### 낮음 (1개월 내)
1. MFA 구현
2. 고급 세션 관리
3. 보안 모니터링

## 성과 측정 지표

1. **보안 테스트 통과율**: 90% 이상
2. **토큰 탈취 위험도**: High → Low
3. **OWASP Top 10 준수율**: 100%
4. **보안 감사 점수**: B+ 이상

## 참고 자료

- [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [RFC 6749 - OAuth 2.0](https://tools.ietf.org/html/rfc6749)
- [NIST SP 800-63B - Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)