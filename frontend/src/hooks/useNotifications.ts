import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface NotificationPayload {
  type: 'due_soon' | 'overdue' | 'reminder' | 'system'
  message: string
  todo_id?: string
  timestamp: string
  [key: string]: unknown
}

interface NotificationHookState {
  isConnected: boolean
  connectionError: string | null
  lastNotification: NotificationPayload | null
}

export const useNotifications = () => {
  const { user, sessionId } = useAuth()
  const [state, setState] = useState<NotificationHookState>({
    isConnected: false,
    connectionError: null,
    lastNotification: null,
  })

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const baseReconnectDelay = 1000 // 1초

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    setState((prev) => ({ ...prev, isConnected: false }))
  }, [])

  const connect = useCallback(() => {
    if (!user || !sessionId) {
      setState((prev) => ({
        ...prev,
        connectionError: 'Authentication required',
      }))
      return
    }

    if (eventSourceRef.current) {
      cleanup()
    }

    try {
      // EventSource는 Authorization 헤더를 설정할 수 없으므로 sessionId를 query parameter로 전달
      const url = new URL('/api/notifications/stream', window.location.origin)
      url.searchParams.set('sessionId', sessionId)

      const eventSource = new EventSource(url.toString(), {
        withCredentials: false,
      })

      eventSource.onopen = () => {
        console.log('SSE connection opened')
        setState((prev) => ({
          ...prev,
          isConnected: true,
          connectionError: null,
        }))
        reconnectAttempts.current = 0
      }

      eventSource.onmessage = (event) => {
        try {
          const notification: NotificationPayload = JSON.parse(event.data)
          console.log('Received notification:', notification)

          setState((prev) => ({
            ...prev,
            lastNotification: notification,
          }))

          // 시스템 메시지가 아닌 경우에만 사용자에게 표시
          if (notification.type !== 'system' || notification.message !== 'ping') {
            // 여기서 Toast 알림이나 브라우저 알림을 트리거할 수 있음
            console.log('New notification for user:', notification.message)
          }
        } catch (error) {
          console.error('Failed to parse notification:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error)
        setState((prev) => ({
          ...prev,
          isConnected: false,
          connectionError: 'Connection failed',
        }))

        // 자동 재연결 시도
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * 2 ** reconnectAttempts.current
          console.log(
            `Attempting to reconnect in ${delay}ms (attempt ${
              reconnectAttempts.current + 1
            }/${maxReconnectAttempts})`
          )

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        } else {
          setState((prev) => ({
            ...prev,
            connectionError: 'Max reconnection attempts exceeded',
          }))
        }
      }

      eventSourceRef.current = eventSource
    } catch (error) {
      console.error('Failed to create SSE connection:', error)
      setState((prev) => ({
        ...prev,
        connectionError: 'Failed to create connection',
      }))
    }
  }, [user, sessionId, cleanup])

  const disconnect = useCallback(() => {
    cleanup()
  }, [cleanup])

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0
    setState((prev) => ({ ...prev, connectionError: null }))
    connect()
  }, [connect])

  // 사용자 로그인/로그아웃 시 연결 관리
  useEffect(() => {
    if (user && sessionId) {
      connect()
    } else {
      cleanup()
    }

    return cleanup
  }, [user, sessionId, connect, cleanup])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // 페이지 가시성 변경 시 연결 관리 (선택적)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 페이지가 숨겨지면 연결 유지 (백그라운드 알림을 위해)
        console.log('Page hidden, keeping SSE connection active')
      } else {
        // 페이지가 다시 보이면 연결 상태 확인
        console.log('Page visible, checking SSE connection')
        if (!state.isConnected && user && sessionId) {
          reconnect()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [state.isConnected, user, sessionId, reconnect])

  return {
    ...state,
    connect,
    disconnect,
    reconnect,
  }
}
