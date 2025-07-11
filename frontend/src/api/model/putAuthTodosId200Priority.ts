/**
 * Generated by orval v7.9.0 🍺
 * Do not edit manually.
 * TodoList API
 * TodoList 애플리케이션의 REST API입니다.

## 주요 기능
- Todo CRUD 작업
- 페이징 및 필터링
- 검색 기능
- 통계 조회

## 인증
Bearer 토큰을 사용한 세션 기반 인증이 필요합니다. Authorization 헤더에 'Bearer {sessionId}' 형식으로 전달하세요.

## 에러 처리
모든 에러 응답은 다음 형식을 따릅니다:
```json
{
  "success": false,
  "error": "에러 메시지",
  "details": "상세 정보 (선택사항)"
}
```
 * OpenAPI spec version: 1.0.0
 */

/**
 * 우선순위 (기본값: medium)
 */
export type PutAuthTodosId200Priority =
  (typeof PutAuthTodosId200Priority)[keyof typeof PutAuthTodosId200Priority]

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const PutAuthTodosId200Priority = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  urgent: 'urgent',
} as const
