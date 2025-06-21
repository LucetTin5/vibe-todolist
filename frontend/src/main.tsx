import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import './styles/globals.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      onError: (error: unknown) => {
        // 401 에러 시 전역 로그아웃 처리
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response: { status: number } }
          if (axiosError.response?.status === 401) {
            // 캐시 초기화
            queryClient.clear()
            // 스토리지 정리
            localStorage.removeItem('session_id')
            localStorage.removeItem('auth_user')
            localStorage.removeItem('expires_at')
            sessionStorage.removeItem('session_id')
            sessionStorage.removeItem('auth_user')
            sessionStorage.removeItem('expires_at')
            // 로그인 페이지로 리다이렉트
            if (window.location.pathname !== '/login') {
              window.location.href = '/login'
            }
          }
        }
      },
    },
  },
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Failed to find the root element')
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
            <ReactQueryDevtools initialIsOpen={false} />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)
