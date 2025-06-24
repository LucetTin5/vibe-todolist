import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  getNotificationSettings,
  updateNotificationSettings,
  type NotificationSettings,
} from '../api/notifications'

interface UseNotificationSettingsReturn {
  settings: NotificationSettings | null
  loading: boolean
  error: string | null
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>
  refreshSettings: () => Promise<void>
}

const defaultSettings: NotificationSettings = {
  browser_notifications: true,
  toast_notifications: true,
  reminder_times: ['1h', '30m'],
  quiet_hours_start: '22:00:00',
  quiet_hours_end: '08:00:00',
  weekdays_only: false,
  sound_enabled: true,
}

export const useNotificationSettings = (): UseNotificationSettingsReturn => {
  const { user } = useAuth()
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    if (!user) {
      setSettings(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const userSettings = await getNotificationSettings()
      setSettings(userSettings)
    } catch (err) {
      console.error('Failed to load notification settings:', err)
      setError('알림 설정을 불러오는데 실패했습니다.')
      // 기본 설정으로 폴백
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  }, [user])

  const updateSettingsHandler = useCallback(
    async (newSettings: Partial<NotificationSettings>) => {
      if (!user || !settings) return

      setLoading(true)
      setError(null)

      try {
        await updateNotificationSettings(newSettings)

        // 로컬 상태 업데이트
        setSettings((prev) => (prev ? { ...prev, ...newSettings } : null))

        console.log('Notification settings updated successfully')
      } catch (err) {
        console.error('Failed to update notification settings:', err)
        setError('알림 설정 업데이트에 실패했습니다.')
        throw err // 컴포넌트에서 에러 처리할 수 있도록
      } finally {
        setLoading(false)
      }
    },
    [user, settings]
  )

  const refreshSettings = useCallback(async () => {
    await loadSettings()
  }, [loadSettings])

  // 사용자 로그인 시 설정 로드
  useEffect(() => {
    if (user) {
      loadSettings()
    } else {
      setSettings(null)
      setError(null)
    }
  }, [user, loadSettings])

  return {
    settings,
    loading,
    error,
    updateSettings: updateSettingsHandler,
    refreshSettings,
  }
}
