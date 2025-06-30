import { useState, useEffect } from 'react'
import type { GetApiTodos200TodosItem } from '../api/model'

// 샘플 할 일 데이터
export const sampleTodos: Omit<GetApiTodos200TodosItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'TodoList 앱 둘러보기',
    description: '이 할 일을 완료해보세요! 체크박스를 클릭하거나 스페이스바를 눌러보세요.',
    completed: false,
    priority: 'high',
    category: 'work',
    tags: ['시작하기', '가이드'],
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 내일
    estimatedMinutes: 5,
    userId: 'sample-user',
  },
  {
    title: '칸반 보드 확인하기',
    description: '칸반 뷰로 이동해서 이 할 일을 드래그해서 "진행 중"으로 옮겨보세요.',
    completed: false,
    priority: 'medium',
    category: 'work',
    tags: ['칸반', '드래그앤드롭'],
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 모레
    estimatedMinutes: 3,
    userId: 'sample-user',
  },
  {
    title: '새로운 할 일 만들기',
    description: 'Ctrl+N을 누르거나 상단의 + 버튼을 사용해서 새로운 할 일을 만들어보세요.',
    completed: false,
    priority: 'medium',
    category: 'work',
    tags: ['생성', '단축키'],
    estimatedMinutes: 2,
    userId: 'sample-user',
  },
  {
    title: '완료된 첫 번째 할 일',
    description: '축하합니다! 이미 완료된 할 일의 예시입니다.',
    completed: true,
    priority: 'low',
    category: 'personal',
    tags: ['완료', '예시'],
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 어제
    estimatedMinutes: 1,
    userId: 'sample-user',
  },
  {
    title: '프로젝트 기획서 작성',
    description: '새 프로젝트의 기획서를 작성하고 팀원들과 공유하기',
    completed: false,
    priority: 'urgent',
    category: 'work',
    tags: ['기획', '문서', '협업'],
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedMinutes: 120,
    userId: 'sample-user',
  },
  {
    title: '운동하기',
    description: '헬스장에서 1시간 운동하기. 등과 어깨 위주로.',
    completed: false,
    priority: 'medium',
    category: 'personal',
    tags: ['건강', '운동', '헬스'],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedMinutes: 60,
    userId: 'sample-user',
  },
]

export interface OnboardingState {
  isFirstVisit: boolean
  showTour: boolean
  hasSampleData: boolean
  tourCompleted: boolean
}

/**
 * 신규 사용자 온보딩을 관리하는 훅
 */
export const useOnboarding = () => {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    isFirstVisit: false,
    showTour: false,
    hasSampleData: false,
    tourCompleted: false,
  })

  useEffect(() => {
    // 로컬 스토리지에서 온보딩 상태 확인
    const isFirstVisit = !localStorage.getItem('todolist_visited')
    const tourCompleted = localStorage.getItem('todolist_tour_completed') === 'true'
    const hasSampleData = localStorage.getItem('todolist_sample_data') === 'true'

    setOnboardingState({
      isFirstVisit,
      showTour: isFirstVisit && !tourCompleted,
      hasSampleData,
      tourCompleted,
    })

    // 첫 방문 표시
    if (isFirstVisit) {
      localStorage.setItem('todolist_visited', 'true')
    }
  }, [])

  const completeTour = () => {
    localStorage.setItem('todolist_tour_completed', 'true')
    setOnboardingState((prev) => ({
      ...prev,
      showTour: false,
      tourCompleted: true,
    }))
  }

  const skipTour = () => {
    localStorage.setItem('todolist_tour_completed', 'true')
    setOnboardingState((prev) => ({
      ...prev,
      showTour: false,
      tourCompleted: true,
    }))
  }

  const startTour = () => {
    setOnboardingState((prev) => ({
      ...prev,
      showTour: true,
    }))
  }

  const markSampleDataAdded = () => {
    localStorage.setItem('todolist_sample_data', 'true')
    setOnboardingState((prev) => ({
      ...prev,
      hasSampleData: true,
    }))
  }

  const resetOnboarding = () => {
    localStorage.removeItem('todolist_visited')
    localStorage.removeItem('todolist_tour_completed')
    localStorage.removeItem('todolist_sample_data')
    setOnboardingState({
      isFirstVisit: true,
      showTour: true,
      hasSampleData: false,
      tourCompleted: false,
    })
  }

  return {
    onboardingState,
    completeTour,
    skipTour,
    startTour,
    markSampleDataAdded,
    resetOnboarding,
    sampleTodos,
  }
}
