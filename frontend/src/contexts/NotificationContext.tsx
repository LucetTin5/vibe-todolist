import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { useBrowserNotifications } from '../hooks/useBrowserNotifications'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/notifications/ToastContainer'

interface NotificationContextValue {
  // SSE 연결 상태
  isConnected: boolean
  connectionError: string | null
  reconnect: () => void

  // 브라우저 알림
  canShowBrowserNotifications: boolean
  requestBrowserPermission: () => Promise<NotificationPermission>
  showBrowserNotification: (
    title: string,
    message: string,
    type: 'due_soon' | 'overdue' | 'reminder'
  ) => void

  // Toast 알림
  showToast: (
    type: 'success' | 'error' | 'warning' | 'info' | 'due_soon' | 'overdue' | 'reminder',
    title: string,
    message: string,
    options?: { duration?: number; onClick?: () => void }
  ) => void
  clearAllToasts: () => void

  // 알림 설정 (향후 구현)
  notificationSettings: {
    browser_notifications: boolean
    toast_notifications: boolean
    sound_enabled: boolean
  }
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { isConnected, connectionError, lastNotification, reconnect } = useNotifications()

  const { canShowNotifications, requestPermission, showTodoNotification } =
    useBrowserNotifications()

  const {
    toasts,
    removeToast,
    addToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showDueSoon,
    showOverdue,
    showReminder,
  } = useToast()

  // 기본 알림 설정 (향후 사용자 설정으로 교체)
  const notificationSettings = {
    browser_notifications: true,
    toast_notifications: true,
    sound_enabled: true,
  }

  // SSE로부터 받은 알림을 처리
  useEffect(() => {
    if (!lastNotification) return

    const { type, message, todo_id } = lastNotification

    // 시스템 메시지는 무시
    if (type === 'system' && (message === 'ping' || message === 'SSE connection established')) {
      return
    }

    console.log('Processing notification:', lastNotification)

    // Toast 알림 표시 (설정에 따라)
    if (notificationSettings.toast_notifications) {
      const titleMap = {
        due_soon: '마감일 임박',
        overdue: '마감일 초과',
        reminder: '할일 알림',
        system: '시스템 알림',
      }

      const title = titleMap[type] || '알림'

      switch (type) {
        case 'due_soon':
          showDueSoon(title, message, {
            onClick: todo_id
              ? () => {
                  // Todo 상세로 이동하는 로직 (향후 구현)
                  console.log(`Navigate to todo: ${todo_id}`)
                }
              : undefined,
          })
          break
        case 'overdue':
          showOverdue(title, message, {
            onClick: todo_id
              ? () => {
                  console.log(`Navigate to todo: ${todo_id}`)
                }
              : undefined,
          })
          break
        case 'reminder':
          showReminder(title, message, {
            onClick: todo_id
              ? () => {
                  console.log(`Navigate to todo: ${todo_id}`)
                }
              : undefined,
          })
          break
        case 'system':
          showInfo(title, message)
          break
      }
    }

    // 브라우저 알림 표시 (설정에 따라)
    if (notificationSettings.browser_notifications && canShowNotifications()) {
      if (type === 'due_soon' || type === 'overdue' || type === 'reminder') {
        showTodoNotification(type, message, todo_id)
      }
    }
  }, [
    lastNotification,
    canShowNotifications,
    showTodoNotification,
    showDueSoon,
    showOverdue,
    showReminder,
    showInfo,
  ])

  // 편의 함수들
  const showBrowserNotification = (
    _title: string,
    message: string,
    type: 'due_soon' | 'overdue' | 'reminder'
  ) => {
    if (canShowNotifications()) {
      showTodoNotification(type, message)
    }
  }

  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info' | 'due_soon' | 'overdue' | 'reminder',
    title: string,
    message: string,
    options?: { duration?: number; onClick?: () => void }
  ) => {
    switch (type) {
      case 'success':
        return showSuccess(title, message, options)
      case 'error':
        return showError(title, message, options)
      case 'warning':
        return showWarning(title, message, options)
      case 'info':
        return showInfo(title, message, options)
      case 'due_soon':
        return showDueSoon(title, message, options)
      case 'overdue':
        return showOverdue(title, message, options)
      case 'reminder':
        return showReminder(title, message, options)
      default:
        return addToast(type, title, message, options)
    }
  }

  const contextValue: NotificationContextValue = {
    isConnected,
    connectionError,
    reconnect,
    canShowBrowserNotifications: canShowNotifications(),
    requestBrowserPermission: requestPermission,
    showBrowserNotification,
    showToast,
    clearAllToasts,
    notificationSettings,
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} position="top-right" />
    </NotificationContext.Provider>
  )
}

export const useNotificationContext = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}
