import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import type { ReactNode } from 'react'

export interface AlertProps {
  type?: 'error' | 'success' | 'warning' | 'info'
  title?: string
  message: string
  isOpen: boolean
  onClose: () => void
  autoClose?: boolean
  autoCloseDelay?: number
  actions?: ReactNode
}

export function Alert({
  type = 'error',
  title,
  message,
  isOpen,
  onClose,
  autoClose = false,
  autoCloseDelay = 5000,
  actions,
}: AlertProps) {
  const alertRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && alertRef.current && overlayRef.current) {
      // Show animation
      gsap.set([overlayRef.current, alertRef.current], { opacity: 0 })
      gsap.set(alertRef.current, { scale: 0.9, y: -20 })

      const tl = gsap.timeline()
      tl.to(overlayRef.current, { opacity: 1, duration: 0.2 }).to(
        alertRef.current,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.3,
          ease: 'back.out(1.7)',
        },
        0.1
      )
    }
  }, [isOpen])

  useEffect(() => {
    if (autoClose && isOpen) {
      const timer = setTimeout(() => {
        handleClose()
      }, autoCloseDelay)

      return () => clearTimeout(timer)
    }
  }, [autoClose, autoCloseDelay, isOpen])

  const handleClose = () => {
    if (alertRef.current && overlayRef.current) {
      const tl = gsap.timeline()
      tl.to(alertRef.current, {
        opacity: 0,
        scale: 0.9,
        y: -20,
        duration: 0.2,
      })
        .to(overlayRef.current, { opacity: 0, duration: 0.2 }, 0.1)
        .call(() => onClose())
    } else {
      onClose()
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  if (!isOpen) return null

  const typeStyles = {
    error: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-500 dark:text-red-400',
      title: 'text-red-800 dark:text-red-200',
      message: 'text-red-700 dark:text-red-300',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-950/20',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-500 dark:text-green-400',
      title: 'text-green-800 dark:text-green-200',
      message: 'text-green-700 dark:text-green-300',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-500 dark:text-yellow-400',
      title: 'text-yellow-800 dark:text-yellow-200',
      message: 'text-yellow-700 dark:text-yellow-300',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-500 dark:text-blue-400',
      title: 'text-blue-800 dark:text-blue-200',
      message: 'text-blue-700 dark:text-blue-300',
    },
  }

  const styles = typeStyles[type]

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>에러</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        )
      case 'success':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>성공</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      case 'warning':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>경고</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      case 'info':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>정보</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        ref={alertRef}
        className={`
          w-full max-w-md rounded-lg border p-6 shadow-lg
          ${styles.bg} ${styles.border}
        `}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={title ? 'alert-title' : undefined}
        aria-describedby="alert-message"
      >
        <div className="flex">
          <div className={`flex-shrink-0 ${styles.icon}`}>{getIcon()}</div>
          <div className="ml-3 flex-1">
            {title && (
              <h3 id="alert-title" className={`text-sm font-medium ${styles.title}`}>
                {title}
              </h3>
            )}
            <div id="alert-message" className={`${title ? 'mt-1' : ''} text-sm ${styles.message}`}>
              {message}
            </div>
            {actions && <div className="mt-4 flex space-x-3">{actions}</div>}
          </div>
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={handleClose}
              className={`
                inline-flex rounded-md p-1.5 transition-colors
                ${styles.icon} hover:bg-black/5 dark:hover:bg-white/5
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
              `}
              aria-label="알림 닫기"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        </div>
      </div>
    </div>
  )
}
