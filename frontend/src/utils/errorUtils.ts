import axios from 'axios'

/**
 * API 에러에서 사용자 친화적인 에러 메시지를 추출합니다.
 *
 * @param error - 발생한 에러 객체
 * @param fallback - 기본 fallback 메시지
 * @returns 추출된 에러 메시지
 */
export const extractErrorMessage = (error: unknown, fallback: string): string => {
  // axios 에러인 경우
  if (axios.isAxiosError(error)) {
    // 백엔드 응답에서 메시지 추출 시도
    const responseData = error.response?.data

    if (responseData) {
      // 백엔드 에러 응답 구조: { success: false, message: string, error: string }
      return responseData.message || responseData.error || fallback
    }

    // axios 자체 에러 메시지
    return error.message || fallback
  }

  // 일반 Error 객체인 경우
  if (error instanceof Error) {
    return error.message
  }

  // 그 외의 경우
  return fallback
}

/**
 * 인증 관련 에러 메시지를 추출합니다.
 *
 * @param error - 발생한 에러 객체
 * @param defaultMessage - 기본 메시지
 * @returns 추출된 에러 메시지
 */
export const extractAuthErrorMessage = (error: unknown, defaultMessage: string): string => {
  const message = extractErrorMessage(error, defaultMessage)

  // 일반적인 axios 에러 메시지를 더 친화적인 메시지로 변환
  if (message.includes('Request failed with status code')) {
    return defaultMessage
  }

  return message
}
