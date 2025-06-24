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

/**
 * 회원가입 에러 메시지를 처리합니다.
 *
 * @param error - 발생한 에러 객체
 * @returns 사용자 친화적인 에러 메시지
 */
export const getSignupErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const responseData = error.response?.data

    switch (status) {
      case 409:
        return '이미 존재하는 이메일입니다. 다른 이메일을 사용해주세요.'
      case 400:
        return responseData?.message || '입력한 정보를 확인해주세요.'
      case 422:
        return '입력 형식이 올바르지 않습니다. 다시 확인해주세요.'
      case 500:
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      default:
        return extractAuthErrorMessage(error, '회원가입에 실패했습니다. 다시 시도해주세요.')
    }
  }

  return '회원가입에 실패했습니다. 다시 시도해주세요.'
}

/**
 * 로그인 에러 메시지를 처리합니다.
 *
 * @param error - 발생한 에러 객체
 * @returns 사용자 친화적인 에러 메시지
 */
export const getLoginErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const responseData = error.response?.data

    switch (status) {
      case 401:
        return '이메일 또는 비밀번호가 올바르지 않습니다.'
      case 400:
        return responseData?.message || '입력한 정보를 확인해주세요.'
      case 403:
        return '계정이 비활성화되었습니다. 관리자에게 문의해주세요.'
      case 429:
        return '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
      case 500:
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      default:
        return extractAuthErrorMessage(
          error,
          '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.'
        )
    }
  }

  return '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.'
}
