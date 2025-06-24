import type React from 'react'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { useAuth } from '../contexts/AuthContext'
import { getLoginErrorMessage } from '../utils/errorUtils'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAlert, setShowAlert] = useState(false)

  // 이미 로그인된 사용자는 대시보드로 리다이렉트
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    // Clear error when user starts typing
    if (error) {
      setError(null)
      setShowAlert(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password) return

    setIsLoading(true)
    setError(null)

    try {
      await login(formData.email, formData.password, formData.rememberMe)
      // 로그인 성공 시 useEffect에서 리다이렉트 처리
    } catch (err) {
      const errorMessage = getLoginErrorMessage(err)
      setError(errorMessage)
      setShowAlert(true)
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = formData.email.trim() && formData.password.trim()

  const isSubmitting = isLoading || authLoading

  // 인증 로딩 중이면 로딩 화면 표시
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* 헤더 */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
            <svg
              className="h-6 w-6 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>로그인</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div className="mt-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              로그인
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">계정에 로그인하세요</p>
          </div>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            또는{' '}
            <Link
              to="/signup"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              새 계정 만들기
            </Link>
          </p>
        </div>

        {/* 로그인 폼 */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* 이메일 입력 */}
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              label="이메일 주소"
              placeholder="이메일 주소"
              value={formData.email}
              onChange={handleInputChange}
            />

            {/* 비밀번호 입력 */}
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              label="비밀번호"
              placeholder="비밀번호"
              value={formData.password}
              onChange={handleInputChange}
            />
          </div>

          {/* 추가 옵션 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
              >
                로그인 상태 유지
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>
          </div>

          {/* 로그인 버튼 */}
          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            isLoading={isSubmitting}
            size="lg"
            className="w-full"
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        {/* 소셜 로그인 (향후 확장) */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                또는
              </span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              아직 계정이 없으신가요?{' '}
              <Link
                to="/signup"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                지금 가입하기
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Alert 컴포넌트 */}
      <Alert
        type="error"
        title="로그인 실패"
        message={error || ''}
        isOpen={showAlert}
        onClose={() => {
          setShowAlert(false)
          setError(null)
        }}
        autoClose={false}
      />
    </div>
  )
}
