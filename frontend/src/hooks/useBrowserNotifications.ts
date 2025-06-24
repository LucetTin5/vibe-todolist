import { useState, useEffect, useCallback } from 'react'

type NotificationPermission = 'default' | 'granted' | 'denied'

interface BrowserNotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
}

interface BrowserNotificationState {
  permission: NotificationPermission
  isSupported: boolean
  isRequesting: boolean
}

export const useBrowserNotifications = () => {
  const [state, setState] = useState<BrowserNotificationState>({
    permission: 'default',
    isSupported: false,
    isRequesting: false,
  })

  // 브라우저 알림 지원 여부 및 권한 상태 확인
  useEffect(() => {
    const isSupported = 'Notification' in window
    const permission = isSupported ? Notification.permission : 'denied'

    setState({
      permission: permission as NotificationPermission,
      isSupported,
      isRequesting: false,
    })
  }, [])

  // 알림 권한 요청
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!state.isSupported) {
      console.warn('Browser notifications are not supported')
      return 'denied'
    }

    if (state.permission === 'granted') {
      return 'granted'
    }

    setState((prev) => ({ ...prev, isRequesting: true }))

    try {
      const permission = await Notification.requestPermission()
      setState((prev) => ({
        ...prev,
        permission: permission as NotificationPermission,
        isRequesting: false,
      }))

      return permission as NotificationPermission
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      setState((prev) => ({ ...prev, isRequesting: false }))
      return 'denied'
    }
  }, [state.isSupported, state.permission])

  // 알림 표시
  const showNotification = useCallback(
    async (options: BrowserNotificationOptions): Promise<Notification | null> => {
      if (!state.isSupported) {
        console.warn('Browser notifications are not supported')
        return null
      }

      // 권한이 없으면 자동으로 요청
      let permission = state.permission
      if (permission !== 'granted') {
        permission = await requestPermission()
      }

      if (permission !== 'granted') {
        console.warn('Notification permission not granted')
        return null
      }

      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/favicon.ico',
          badge: options.badge,
          tag: options.tag,
          requireInteraction: options.requireInteraction ?? false,
          silent: options.silent ?? false,
        })

        // 자동 닫기 (requireInteraction이 false인 경우)
        if (!options.requireInteraction) {
          setTimeout(() => {
            notification.close()
          }, 5000) // 5초 후 자동 닫기
        }

        return notification
      } catch (error) {
        console.error('Failed to show notification:', error)
        return null
      }
    },
    [state.isSupported, state.permission, requestPermission]
  )

  // Todo 관련 알림을 위한 편의 함수들
  const showTodoNotification = useCallback(
    async (type: 'due_soon' | 'overdue' | 'reminder', message: string, todoId?: string) => {
      const titleMap = {
        due_soon: '마감일 임박',
        overdue: '마감일 초과',
        reminder: '할일 알림',
      }

      return showNotification({
        title: titleMap[type],
        body: message,
        tag: todoId ? `todo-${todoId}` : `notification-${type}`,
        requireInteraction: type === 'overdue', // 마감일 초과는 사용자 확인 필요
      })
    },
    [showNotification]
  )

  // 시스템 알림
  const showSystemNotification = useCallback(
    async (message: string) => {
      return showNotification({
        title: 'TodoList',
        body: message,
        tag: 'system',
        requireInteraction: false,
      })
    },
    [showNotification]
  )

  // 권한 상태별 메시지
  const getPermissionMessage = useCallback(() => {
    switch (state.permission) {
      case 'granted':
        return '브라우저 알림이 허용되었습니다.'
      case 'denied':
        return '브라우저 알림이 차단되었습니다. 브라우저 설정에서 권한을 변경할 수 있습니다.'
      case 'default':
        return '브라우저 알림 권한을 요청할 수 있습니다.'
      default:
        return '브라우저 알림 상태를 확인할 수 없습니다.'
    }
  }, [state.permission])

  // 알림이 가능한지 확인
  const canShowNotifications = useCallback(() => {
    return state.isSupported && state.permission === 'granted'
  }, [state.isSupported, state.permission])

  return {
    ...state,
    requestPermission,
    showNotification,
    showTodoNotification,
    showSystemNotification,
    getPermissionMessage,
    canShowNotifications,
  }
}
