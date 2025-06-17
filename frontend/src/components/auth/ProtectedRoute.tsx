import type React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // 로딩 중일 때 보여줄 컴포넌트
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">인증 정보를 확인하는 중...</p>
          </div>
        </div>
      )
    )
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 인증된 경우 자식 컴포넌트 렌더링
  return <>{children}</>
}

// 익명 사용자만 접근 가능한 라우트 (이미 로그인한 사용자는 리다이렉트)
interface GuestOnlyRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export const GuestOnlyRoute: React.FC<GuestOnlyRouteProps> = ({
  children,
  redirectTo = '/dashboard',
}) => {
  const { isAuthenticated, isLoading } = useAuth()

  // 로딩 중일 때 보여줄 컴포넌트
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">인증 정보를 확인하는 중...</p>
        </div>
      </div>
    )
  }

  // 이미 인증된 경우 지정된 페이지로 리다이렉트
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  // 인증되지 않은 경우 자식 컴포넌트 렌더링
  return <>{children}</>
}

// 역할 기반 접근 제어 (향후 확장용)
interface RoleBasedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallback?: React.ReactNode
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  fallback,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth()

  // 로딩 중일 때 보여줄 컴포넌트
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">권한을 확인하는 중...</p>
          </div>
        </div>
      )
    )
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 역할 확인 (user 객체에 role 속성이 있다고 가정)
  const userRole = (user as { role?: string })?.role || 'user'
  const hasPermission = allowedRoles.includes(userRole)

  if (!hasPermission) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>접근 거부</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              접근 권한이 없습니다
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              이 페이지에 접근할 권한이 없습니다.
            </p>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              이전 페이지로 돌아가기
            </button>
          </div>
        </div>
      )
    )
  }

  // 권한이 있는 경우 자식 컴포넌트 렌더링
  return <>{children}</>
}
