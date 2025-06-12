import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // 모달 애니메이션
  useEffect(() => {
    if (isOpen) {
      // 모달 열기 애니메이션
      if (backdropRef.current && modalRef.current) {
        gsap.fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.2, ease: 'power2.out' }
        )

        gsap.fromTo(
          modalRef.current,
          {
            opacity: 0,
            scale: 0.9,
            y: -20,
          },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: 'back.out(1.7)',
          }
        )
      }
    }
  }, [isOpen])

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'w-full max-w-md min-w-80',
    md: 'w-full max-w-lg min-w-96',
    lg: 'w-full max-w-2xl min-w-[32rem]',
    xl: 'w-full max-w-4xl min-w-[40rem]',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClose()
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'relative mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl',
          'border border-gray-200 dark:border-gray-700',
          sizeClasses[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {title && (
          <div className={cn(
            'flex items-center justify-between p-6',
            'border-b border-gray-200 dark:border-gray-700'
          )}>
            <h2 id="modal-title" className={cn(
              'text-lg font-semibold text-gray-900 dark:text-white'
            )}>
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                'transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
                'rounded-md p-1'
              )}
              aria-label="Close modal"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <title>Close modal</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className={title ? 'p-6' : 'p-6'}>{children}</div>
      </div>
    </div>
  )
}
