import { useState, useCallback } from 'react'
import type { Toast, ToastType } from '../components/notifications/ToastContainer'

let toastId = 0

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback(
    (
      type: ToastType,
      title: string,
      message: string,
      options?: {
        duration?: number
        onClick?: () => void
      }
    ) => {
      const id = `toast-${++toastId}`
      const newToast: Toast = {
        id,
        type,
        title,
        message,
        duration: options?.duration,
        onClick: options?.onClick,
      }

      setToasts((prev) => [...prev, newToast])
      return id
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  // 편의 함수들
  const showSuccess = useCallback(
    (title: string, message: string, options?: { duration?: number; onClick?: () => void }) => {
      return addToast('success', title, message, options)
    },
    [addToast]
  )

  const showError = useCallback(
    (title: string, message: string, options?: { duration?: number; onClick?: () => void }) => {
      return addToast('error', title, message, { duration: 7000, ...options })
    },
    [addToast]
  )

  const showWarning = useCallback(
    (title: string, message: string, options?: { duration?: number; onClick?: () => void }) => {
      return addToast('warning', title, message, options)
    },
    [addToast]
  )

  const showInfo = useCallback(
    (title: string, message: string, options?: { duration?: number; onClick?: () => void }) => {
      return addToast('info', title, message, options)
    },
    [addToast]
  )

  // Todo 관련 알림들
  const showDueSoon = useCallback(
    (title: string, message: string, options?: { duration?: number; onClick?: () => void }) => {
      return addToast('due_soon', title, message, { duration: 8000, ...options })
    },
    [addToast]
  )

  const showOverdue = useCallback(
    (title: string, message: string, options?: { duration?: number; onClick?: () => void }) => {
      return addToast('overdue', title, message, { duration: 10000, ...options })
    },
    [addToast]
  )

  const showReminder = useCallback(
    (title: string, message: string, options?: { duration?: number; onClick?: () => void }) => {
      return addToast('reminder', title, message, { duration: 6000, ...options })
    },
    [addToast]
  )

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showDueSoon,
    showOverdue,
    showReminder,
  }
}
