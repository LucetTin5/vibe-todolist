import axios, { AxiosRequestConfig } from 'axios'

// Axios instance for API calls
export const axiosInstance = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth and debugging
axiosInstance.interceptors.request.use(
  (config) => {
    // 인증 토큰 자동 추가
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

// Response interceptor for auth and debugging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`)
    
    // 인증 관련 API 응답 상세 로깅
    if (response.config.url?.includes('/auth/')) {
      console.log(`[API Response Data] ${response.config.url}:`, response.data)
    }
    
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // 401 에러 시 토큰 갱신 시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshToken = localStorage.getItem('auth_refresh_token')
      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/refresh', {
            refresh_token: refreshToken
          })
          
          const { access_token, refresh_token: newRefreshToken } = response.data.data
          
          // 새 토큰 저장
          localStorage.setItem('auth_token', access_token)
          if (newRefreshToken) {
            localStorage.setItem('auth_refresh_token', newRefreshToken)
          }
          
          // 원본 요청에 새 토큰 적용하여 재시도
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return axiosInstance(originalRequest)
        } catch (refreshError) {
          // 토큰 갱신 실패 시 로그아웃 처리
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_refresh_token')
          localStorage.removeItem('auth_user')
          
          // 로그인 페이지로 리다이렉트 (optional)
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
        }
      } else {
        // refresh token이 없으면 바로 로그아웃
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_refresh_token')
        localStorage.removeItem('auth_user')
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    
    console.error('[API Response Error]', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// Custom instance for Orval-generated API client
export const customInstance = <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> => {
  const source = axios.CancelToken.source()
  const promise = axiosInstance({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data)

  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query was cancelled')
  }

  return promise
}

export default customInstance