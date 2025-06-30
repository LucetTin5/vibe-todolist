import type React from 'react'
import { useState, useEffect } from 'react'
import { cn } from '../../utils/cn'

interface TourStep {
  target: string
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

interface OnboardingTourProps {
  steps: TourStep[]
  isVisible: boolean
  onComplete: () => void
  onSkip: () => void
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  steps,
  isVisible,
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!isVisible || currentStep >= steps.length) return

    const target = document.querySelector(steps[currentStep].target) as HTMLElement
    if (target) {
      setTargetElement(target)
      // 대상 요소로 스크롤
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      })
      // 하이라이트 효과
      target.style.position = 'relative'
      target.style.zIndex = '1001'
      target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 2px white'
      target.style.borderRadius = '8px'
    }

    return () => {
      if (target) {
        target.style.position = ''
        target.style.zIndex = ''
        target.style.boxShadow = ''
        target.style.borderRadius = ''
      }
    }
  }, [currentStep, steps, isVisible])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    // 하이라이트 제거
    if (targetElement) {
      targetElement.style.position = ''
      targetElement.style.zIndex = ''
      targetElement.style.boxShadow = ''
      targetElement.style.borderRadius = ''
    }
    onSkip()
  }

  if (!isVisible || currentStep >= steps.length) return null

  const step = steps[currentStep]

  return (
    <>
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black/50 z-[1000]" />

      {/* 투어 카드 */}
      <div className="fixed top-4 right-4 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[1002] p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{step.title}</h3>
          <button
            type="button"
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="투어 건너뛰기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>닫기</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{step.content}</p>

        {/* 진행 표시 */}
        <div className="flex items-center space-x-2 mb-4">
          {steps.map((step, index) => (
            <div
              key={`step-${index}-${step.target}`}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                index === currentStep
                  ? 'bg-blue-500'
                  : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
              )}
              aria-label={`단계 ${index + 1}${index === currentStep ? ' (현재)' : index < currentStep ? ' (완료)' : ''}`}
            />
          ))}
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                이전
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSkip}
              className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              건너뛰기
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              {currentStep < steps.length - 1 ? '다음' : '완료'}
            </button>
          </div>
        </div>

        {/* 단계 표시 */}
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
          {currentStep + 1} / {steps.length}
        </div>
      </div>
    </>
  )
}

// 기본 투어 스텝 정의
export const defaultTourSteps: TourStep[] = [
  {
    target: '.quick-add-todo',
    title: '빠른 할 일 추가',
    content:
      '상단의 입력 필드를 사용해 빠르게 새로운 할 일을 추가할 수 있습니다. Enter를 누르거나 + 버튼을 클릭하세요.',
  },
  {
    target: '[role="tablist"]',
    title: '뷰 전환',
    content:
      '4가지 보기 방식을 제공합니다. 대시보드, 목록, 칸반, 캘린더 뷰를 자유롭게 전환하며 사용하세요. 키보드 단축키 Ctrl+1~4를 사용할 수 있습니다.',
  },
  {
    target: '.kanban-board',
    title: '칸반 보드',
    content:
      '할 일을 드래그앤드롭으로 쉽게 상태를 변경할 수 있습니다. 할 일, 진행 중, 완료 상태로 관리하세요.',
  },
  {
    target: '[data-todo-item]',
    title: '할 일 관리',
    content:
      '각 할 일을 클릭하거나 키보드로 조작할 수 있습니다. 스페이스바로 완료/미완료, E키로 편집, Delete키로 삭제가 가능합니다.',
  },
  {
    target: '.theme-toggle',
    title: '테마 설정',
    content:
      '라이트/다크/시스템 테마를 지원합니다. 우상단의 테마 버튼을 클릭해서 변경할 수 있습니다.',
  },
]
