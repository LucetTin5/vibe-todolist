import { createPortal } from 'react-dom'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ToastNotification } from './ToastNotification'

export type ToastType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'due_soon'
  | 'overdue'
  | 'reminder'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message: string
  duration?: number
  onClick?: () => void
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center'
}

const positionStyles = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
}

export const ToastContainer = ({
  toasts,
  onRemove,
  position = 'top-right',
}: ToastContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevToastCount = useRef(toasts.length)

  useEffect(() => {
    if (!containerRef.current) return

    // 새로운 토스트가 추가될 때마다 컨테이너를 살짝 흔들어주는 효과
    if (toasts.length > prevToastCount.current && toasts.length > 0) {
      gsap.fromTo(
        containerRef.current,
        { x: 0 },
        {
          x: 4,
          duration: 0.1,
          yoyo: true,
          repeat: 3,
          ease: 'power2.inOut',
        }
      )
    }

    prevToastCount.current = toasts.length
  }, [toasts.length])

  if (toasts.length === 0) return null

  return createPortal(
    <div
      ref={containerRef}
      className={`fixed z-50 pointer-events-none ${positionStyles[position]}`}
      aria-live="polite"
      aria-label="알림"
    >
      <div className="flex flex-col gap-3 max-h-screen overflow-hidden will-change-transform">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              // 각 토스트를 약간씩 겹쳐보이게 하는 효과
              zIndex: toasts.length - index,
              transform: `translateY(${index * -2}px) scale(${1 - index * 0.02})`,
            }}
          >
            <ToastNotification
              id={toast.id}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              duration={toast.duration}
              onClose={onRemove}
              onClick={toast.onClick}
            />
          </div>
        ))}
      </div>
    </div>,
    document.body
  )
}
