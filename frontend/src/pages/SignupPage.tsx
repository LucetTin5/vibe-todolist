import type React from 'react'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { useAuth } from '../contexts/AuthContext'
import { getSignupErrorMessage } from '../utils/errorUtils'

interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
  name: string
}

export const SignupPage: React.FC = () => {
  const navigate = useNavigate()
  const { signup, isAuthenticated, isLoading: authLoading } = useAuth()

  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Partial<SignupFormData>>({})
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [showAlert, setShowAlert] = useState(false)

  // 이미 로그인된 사용자는 대시보드로 리다이렉트
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear errors when user starts typing
    if (error) {
      setError(null)
      setShowAlert(false)
    }

    // Clear specific field validation error
    if (validationErrors[name as keyof SignupFormData]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Validate field on blur
    const errors: Partial<SignupFormData> = { ...validationErrors }

    switch (name) {
      case 'name':
        if (!value.trim()) {
          errors.name = '이름을 입력해주세요.'
        } else {
          errors.name = undefined
        }
        break
      case 'email':
        if (!value) {
          errors.email = '이메일을 입력해주세요.'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = '올바른 이메일 형식이 아닙니다.'
        } else {
          errors.email = undefined
        }
        break
      case 'password':
        if (!value) {
          errors.password = '비밀번호를 입력해주세요.'
        } else if (value.length < 10) {
          errors.password = '비밀번호는 10자 이상이어야 합니다.'
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          errors.password = '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.'
        } else {
          errors.password = undefined
        }
        // Check password confirmation if it exists
        if (formData.confirmPassword) {
          if (value !== formData.confirmPassword) {
            errors.confirmPassword = '비밀번호가 일치하지 않습니다.'
          } else {
            errors.confirmPassword = undefined
          }
        }
        break
      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = '비밀번호 확인을 입력해주세요.'
        } else if (formData.password !== value) {
          errors.confirmPassword = '비밀번호가 일치하지 않습니다.'
        } else {
          errors.confirmPassword = undefined
        }
        break
    }

    setValidationErrors(errors)
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
    } else if (formData.password.length < 10) {
      errors.password = '비밀번호는 10자 이상이어야 합니다.'
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
      await signup(formData.email, formData.password, formData.name)
      // 회원가입 성공 시 useEffect에서 리다이렉트 처리
    } catch (err) {
      const errorMessage = getSignupErrorMessage(err)
      setError(errorMessage)
      setShowAlert(true)
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = (): boolean => {
    const errors: Partial<SignupFormData> = {}

    // 필수 필드 검증
    if (!formData.name.trim()) errors.name = '이름을 입력해주세요.'
    if (!formData.email) errors.email = '이메일을 입력해주세요.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = '올바른 이메일 형식이 아닙니다.'
    if (!formData.password) errors.password = '비밀번호를 입력해주세요.'
    else if (formData.password.length < 10) errors.password = '비밀번호는 10자 이상이어야 합니다.'
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password))
      errors.password = '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.'
    if (!formData.confirmPassword) errors.confirmPassword = '비밀번호 확인을 입력해주세요.'
    else if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.'

    // 약관 동의 확인
    return Object.keys(errors).length === 0 && agreeTerms
  }

  const isSubmitting = isLoading || authLoading

  // 인증 로딩 중이면 로딩 화면 표시
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
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
          <div className="mt-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              회원가입
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">새 계정을 만들어보세요</p>
          </div>
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
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              label="이름"
              placeholder="이름을 입력하세요"
              value={formData.name}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              error={validationErrors.name}
            />

            {/* 이메일 입력 */}
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              label="이메일 주소"
              placeholder="이메일 주소를 입력하세요"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              error={validationErrors.email}
            />

            {/* 비밀번호 입력 */}
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              label="비밀번호"
              placeholder="비밀번호를 입력하세요"
              value={formData.password}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              error={validationErrors.password}
              helperText="10자 이상, 대문자, 소문자, 숫자 포함"
            />

            {/* 비밀번호 확인 입력 */}
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              label="비밀번호 확인"
              placeholder="비밀번호를 다시 입력하세요"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              error={validationErrors.confirmPassword}
            />
          </div>

          {/* 이용약관 동의 */}
          <div className="flex items-center">
            <input
              id="agree-terms"
              name="agree-terms"
              type="checkbox"
              required
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
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
          <Button
            type="submit"
            disabled={!isFormValid() || isSubmitting}
            isLoading={isSubmitting}
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
          >
            {isSubmitting ? '계정 생성 중...' : '계정 만들기'}
          </Button>
        </form>
      </div>

      {/* Alert 컴포넌트 */}
      <Alert
        type="error"
        title="회원가입 실패"
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
