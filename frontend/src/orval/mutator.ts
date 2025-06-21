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
    // 세션 ID 자동 추가
    let sessionId = localStorage.getItem('session_id')
    if (!sessionId) {
      sessionId = sessionStorage.getItem('session_id')
    }
    if (sessionId) {
      config.headers.Authorization = `Bearer ${sessionId}`
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
    
    // 401 에러 시 세션 만료 처리 - React Query 전역 에러 핸들러에서 처리됨
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      console.log('[401 Error] Session expired - handled by React Query global error handler')
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