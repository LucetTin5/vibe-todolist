import { useEffect, useState } from 'react'

/**
 * 빠른 응답에서 로딩 상태 깜빡임을 방지하는 훅
 * 지정된 지연 시간 후에만 로딩 상태를 true로 변경
 * 
 * @param isLoading - 실제 로딩 상태
 * @param delay - 로딩 상태를 보여주기까지의 지연 시간 (ms)
 * @returns 지연된 로딩 상태
 * 
 * @example
 * const { isLoading } = useTodos()
 * const showSkeleton = useDelayedLoading(isLoading, 200)
 * 
 * // 100ms 응답: showSkeleton = false (깜빡이지 않음)
 * // 300ms 응답: 200ms 후 showSkeleton = true, 300ms에 false
 */
export function useDelayedLoading(isLoading: boolean, delay = 200): boolean {
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    if (isLoading) {
      // 지연 후 로딩 상태 표시
      const timer = setTimeout(() => {
        setShowLoading(true)
      }, delay)

      return () => clearTimeout(timer)
    } else {
      // 로딩이 완료되면 즉시 숨김
      setShowLoading(false)
    }
  }, [isLoading, delay])

  return showLoading
}