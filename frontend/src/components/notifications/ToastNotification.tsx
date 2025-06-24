import { useEffect, useState, useRef } from 'react'
import { gsap } from 'gsap'
import { cn } from '../../utils/cn'

import type { ToastType } from './ToastContainer'

interface ToastNotificationProps {
  id: string
  type: ToastType
  title: string
  message: string
  duration?: number
  onClose?: (id: string) => void
  onClick?: () => void
}

const toastStyles = {
  success:
    'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
  error:
    'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
  warning:
    'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
  due_soon:
    'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200',
  overdue:
    'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
  reminder:
    'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-200',
}

const toastIcons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  due_soon: '⏰',
  overdue: '❗',
  reminder: '📅',
}

export const ToastNotification = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  onClick,
}: ToastNotificationProps) => {
  const toastRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (!toastRef.current) return

    // GSAP 입장 애니메이션
    gsap.fromTo(
      toastRef.current,
      {
        x: 400,
        opacity: 0,
        scale: 0.8,
        rotationY: 45,
      },
      {
        x: 0,
        opacity: 1,
        scale: 1,
        rotationY: 0,
        duration: 0.6,
        ease: 'back.out(1.7)',
        transformPerspective: 1000,
        transformOrigin: 'right center',
      }
    )
  }, [])

  useEffect(() => {
    if (duration > 0 && progressRef.current) {
      // 진행률 바 애니메이션
      gsap.fromTo(
        progressRef.current,
        { width: '100%' },
        {
          width: '0%',
          duration: duration / 1000,
          ease: 'none',
          onComplete: handleClose,
        }
      )
    }
  }, [duration])

  const handleClose = () => {
    if (isClosing || !toastRef.current) return

    setIsClosing(true)

    // GSAP 퇴장 애니메이션
    gsap.to(toastRef.current, {
      x: 400,
      opacity: 0,
      scale: 0.8,
      rotationY: -45,
      duration: 0.4,
      ease: 'back.in(1.7)',
      transformPerspective: 1000,
      transformOrigin: 'right center',
      onComplete: () => onClose?.(id),
    })
  }

  const handleClick = () => {
    onClick?.()
    if (onClick) {
      handleClose()
    }
  }

  return (
    <div
      ref={toastRef}
      className={cn(
        'pointer-events-auto transform-gpu will-change-transform',
        'border rounded-xl shadow-xl backdrop-blur-md',
        'max-w-sm w-full cursor-pointer overflow-hidden',
        'hover:scale-105 hover:shadow-2xl transition-all duration-200',
        toastStyles[type]
      )}
      onClick={handleClick}
      role="alert"
      aria-live="polite"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-lg">{toastIcons[type]}</div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm mb-1">{title}</div>
            <div className="text-sm opacity-90 break-words">{message}</div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleClose()
            }}
            className="flex-shrink-0 ml-2 text-current opacity-50 hover:opacity-75 transition-opacity"
            aria-label="닫기"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* GSAP 진행률 표시바 (duration이 있는 경우) */}
      {duration > 0 && (
        <div className="h-1 w-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <div ref={progressRef} className="h-full bg-current opacity-30 will-change-transform" />
        </div>
      )}
    </div>
  )
}
