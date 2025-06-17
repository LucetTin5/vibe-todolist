import type React from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { cn } from '../utils/cn'

interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
  name: string
}

export const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Partial<SignupFormData>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear errors when user starts typing
    if (error) setError(null)
    if (validationErrors[name as keyof SignupFormData]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validateForm = (): boolean => {
    const errors: Partial<SignupFormData> = {}

    // 이름 검증
    if (!formData.name.trim()) {
      errors.name = '이름을 입력해주세요.'
    }

    // 이메일 검증
    if (!formData.email) {
      errors.email = '이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '올바른 이메일 형식이 아닙니다.'
    }

    // 비밀번호 검증
    if (!formData.password) {
      errors.password = '비밀번호를 입력해주세요.'
    } else if (formData.password.length < 8) {
      errors.password = '비밀번호는 8자 이상이어야 합니다.'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.'
    }

    // 비밀번호 확인 검증
    if (!formData.confirmPassword) {
      errors.confirmPassword = '비밀번호 확인을 입력해주세요.'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // TODO: 회원가입 API 호출 구현
      console.log('Signup attempt:', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })

      // 임시 딜레이 (실제 API 호출로 대체)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // TODO: 성공 시 리다이렉트 로직 (로그인 페이지 또는 대시보드)
    } catch (err) {
      setError('회원가입에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid =
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.name &&
    Object.keys(validationErrors).length === 0

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <svg
              className="h-6 w-6 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>회원가입</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            새 계정 만들기
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            이미 계정이 있으신가요?{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              로그인하기
            </Link>
          </p>
        </div>

        {/* 회원가입 폼 */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* 이름 입력 */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                이름
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="이름을 입력하세요"
                value={formData.name}
                onChange={handleInputChange}
                className={cn(
                  'appearance-none rounded-lg relative block w-full',
                  'border border-gray-300 dark:border-gray-600',
                  'placeholder-gray-500 dark:placeholder-gray-400',
                  'text-gray-900 dark:text-white',
                  'bg-white dark:bg-gray-800',
                  'focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10',
                  validationErrors.name && 'border-red-500 dark:border-red-500'
                )}
              />
              {validationErrors.name && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {validationErrors.name}
                </p>
              )}
            </div>

            {/* 이메일 입력 */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                이메일 주소
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="이메일 주소를 입력하세요"
                value={formData.email}
                onChange={handleInputChange}
                className={cn(
                  'appearance-none rounded-lg relative block w-full',
                  'border border-gray-300 dark:border-gray-600',
                  'placeholder-gray-500 dark:placeholder-gray-400',
                  'text-gray-900 dark:text-white',
                  'bg-white dark:bg-gray-800',
                  'focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10',
                  validationErrors.email && 'border-red-500 dark:border-red-500'
                )}
              />
              {validationErrors.email && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                비밀번호
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChange={handleInputChange}
                className={cn(
                  'appearance-none rounded-lg relative block w-full',
                  'border border-gray-300 dark:border-gray-600',
                  'placeholder-gray-500 dark:placeholder-gray-400',
                  'text-gray-900 dark:text-white',
                  'bg-white dark:bg-gray-800',
                  'focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10',
                  validationErrors.password && 'border-red-500 dark:border-red-500'
                )}
              />
              {validationErrors.password && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {validationErrors.password}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                8자 이상, 대문자, 소문자, 숫자 포함
              </p>
            </div>

            {/* 비밀번호 확인 입력 */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                비밀번호 확인
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="비밀번호를 다시 입력하세요"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={cn(
                  'appearance-none rounded-lg relative block w-full',
                  'border border-gray-300 dark:border-gray-600',
                  'placeholder-gray-500 dark:placeholder-gray-400',
                  'text-gray-900 dark:text-white',
                  'bg-white dark:bg-gray-800',
                  'focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10',
                  validationErrors.confirmPassword && 'border-red-500 dark:border-red-500'
                )}
              />
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <title>에러</title>
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 이용약관 동의 */}
          <div className="flex items-center">
            <input
              id="agree-terms"
              name="agree-terms"
              type="checkbox"
              required
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
            />
            <label
              htmlFor="agree-terms"
              className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
            >
              <Link
                to="/terms"
                className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                이용약관
              </Link>{' '}
              및{' '}
              <Link
                to="/privacy"
                className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                개인정보처리방침
              </Link>
              에 동의합니다.
            </label>
          </div>

          {/* 회원가입 버튼 */}
          <div>
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className={cn(
                'group relative w-full flex justify-center py-3 px-4',
                'text-sm font-medium rounded-md text-white',
                'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'dark:bg-green-700 dark:hover:bg-green-600'
              )}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <svg
                    className="h-5 w-5 text-green-500 group-hover:text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <title>회원가입 아이콘</title>
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
              {isLoading ? '계정 생성 중...' : '계정 만들기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
