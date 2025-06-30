import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

interface KeyboardNavigationOptions {
  onSearch?: () => void
  onEscape?: () => void
}

/**
 * 키보드 접근성 및 단축키 지원 훅
 * WCAG 2.1 기준을 준수하여 키보드 사용자 경험을 개선합니다.
 */
export const useKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
  const navigate = useNavigate()
  const { onSearch, onEscape } = options

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key, ctrlKey, metaKey } = event
      const isModifierPressed = ctrlKey || metaKey
      const activeElement = document.activeElement as HTMLElement

      // 입력 필드에서는 단축키를 비활성화
      if (
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.contentEditable === 'true'
      ) {
        // ESC는 항상 활성화
        if (key === 'Escape' && onEscape) {
          event.preventDefault()
          onEscape()
        }
        return
      }

      // 전역 단축키
      switch (key) {
        case 'f':
        case 'F':
          // F: 검색 포커스 (Ctrl+F는 브라우저 검색이므로 제외)
          if (!isModifierPressed && onSearch) {
            event.preventDefault()
            onSearch()
          }
          break

        case 'Escape':
          // ESC: 모달/오버레이 닫기
          if (onEscape) {
            event.preventDefault()
            onEscape()
          }
          break

        // 뷰 전환 단축키
        case '1':
          if (isModifierPressed) {
            event.preventDefault()
            navigate('/dashboard')
          }
          break

        case '2':
          if (isModifierPressed) {
            event.preventDefault()
            navigate('/todos')
          }
          break

        case '3':
          if (isModifierPressed) {
            event.preventDefault()
            navigate('/kanban')
          }
          break

        case '4':
          if (isModifierPressed) {
            event.preventDefault()
            navigate('/calendar')
          }
          break

        // 접근성 향상을 위한 Tab 트래핑
        case 'Tab':
          // Tab 키는 브라우저가 자동으로 처리하도록 둠
          break

        // 도움말 표시
        case '?':
          if (!isModifierPressed) {
            event.preventDefault()
            showKeyboardShortcuts()
          }
          break
      }
    },
    [navigate, onSearch, onEscape]
  )

  const showKeyboardShortcuts = () => {
    // 키보드 단축키 도움말 모달 표시
    const shortcuts = [
      { key: 'F', description: '검색 포커스' },
      { key: 'Ctrl/Cmd + 1-4', description: '뷰 전환 (대시보드/목록/칸반/캘린더)' },
      { key: 'ESC', description: '모달 닫기' },
      { key: '?', description: '단축키 도움말' },
      { key: 'Space/Enter', description: '할 일 완료/미완료 토글' },
      { key: 'E', description: '할 일 편집' },
      { key: 'Delete', description: '할 일 삭제' },
    ]

    // 임시로 alert 사용, 나중에 모달로 대체 예정
    const shortcutText = shortcuts
      .map(({ key, description }) => `${key}: ${description}`)
      .join('\n')

    alert(`키보드 단축키:\n\n${shortcutText}`)
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  /**
   * 특정 요소에 포커스를 설정하는 유틸리티 함수
   */
  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.focus()
    }
  }, [])

  /**
   * Tab 순서를 관리하는 유틸리티 함수
   */
  const manageFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    return () => container.removeEventListener('keydown', handleTabKey)
  }, [])

  return {
    focusElement,
    manageFocus,
    showKeyboardShortcuts,
  }
}
