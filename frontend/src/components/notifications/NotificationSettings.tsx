import { useState, useId, useEffect } from 'react'
import { useBrowserNotifications } from '../../hooks/useBrowserNotifications'
import { useNotificationContext } from '../../contexts/NotificationContext'
import { Button } from '../ui/Button'
import type { NotificationSettings as INotificationSettings } from '../../api/notifications'

export const NotificationSettings = () => {
  const {
    notificationSettings,
    updateNotificationSettings,
    settingsLoading,
    settingsError,
    showToast,
  } = useNotificationContext()

  const { isSupported, requestPermission, getPermissionMessage, canShowNotifications } =
    useBrowserNotifications()

  const [localSettings, setLocalSettings] = useState(notificationSettings)
  const [saving, setSaving] = useState(false)

  // useId로 고유 ID 생성
  const browserNotificationId = useId()
  const toastNotificationId = useId()
  const reminderTimesId = useId()
  const quietHoursId = useId()
  const quietHoursStartId = useId()
  const quietHoursEndId = useId()
  const weekdaysOnlyId = useId()
  const soundEnabledId = useId()

  // 서버 설정이 로드되면 로컬 상태 업데이트
  useEffect(() => {
    if (notificationSettings) {
      setLocalSettings(notificationSettings)
    }
  }, [notificationSettings])

  // 로컬 설정 변경 핸들러
  const handleLocalSettingChange = <K extends keyof NonNullable<typeof notificationSettings>>(
    key: K,
    value: NonNullable<typeof notificationSettings>[K]
  ) => {
    if (!localSettings) return
    setLocalSettings((prev) => (prev ? { ...prev, [key]: value } : null))
  }

  // 설정 저장
  const handleSaveSettings = async () => {
    if (!localSettings || !notificationSettings) return

    setSaving(true)
    try {
      // 변경된 설정만 추출
      const changes: Partial<INotificationSettings> = {}
      for (const key of Object.keys(localSettings)) {
        const k = key as keyof INotificationSettings
        if (JSON.stringify(localSettings[k]) !== JSON.stringify(notificationSettings[k])) {
          ;(changes as Record<string, unknown>)[k] = localSettings[k]
        }
      }

      if (Object.keys(changes).length === 0) {
        showToast('info', '설정', '변경된 설정이 없습니다.')
        return
      }

      await updateNotificationSettings(changes)
      showToast('success', '설정 저장', '알림 설정이 성공적으로 저장되었습니다.')
    } catch (error) {
      console.error('Failed to save notification settings:', error)
      showToast('error', '설정 저장 실패', '알림 설정 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 변경사항 취소
  const handleCancelChanges = () => {
    setLocalSettings(notificationSettings)
  }

  // 브라우저 알림 토글 (권한 요청 포함)
  const handleBrowserNotificationToggle = async () => {
    if (!localSettings) return

    if (!localSettings.browser_notifications) {
      // 켜려고 할 때 권한 확인/요청
      if (!canShowNotifications()) {
        const result = await requestPermission()
        if (result !== 'granted') {
          showToast('warning', '권한 필요', '브라우저 알림을 사용하려면 권한이 필요합니다.')
          return // 권한이 거부되면 설정 변경하지 않음
        }
      }
    }

    handleLocalSettingChange('browser_notifications', !localSettings.browser_notifications)
  }

  // 알림 시간 추가
  const addReminderTime = () => {
    if (!localSettings) return
    const newTime = '1h' // 기본값: 1시간 전
    if (!localSettings.reminder_times.includes(newTime)) {
      handleLocalSettingChange('reminder_times', [...localSettings.reminder_times, newTime])
    }
  }

  // 알림 시간 제거
  const removeReminderTime = (timeToRemove: string) => {
    if (!localSettings) return
    handleLocalSettingChange(
      'reminder_times',
      localSettings.reminder_times.filter((time) => time !== timeToRemove)
    )
  }

  // 알림 시간 변경
  const updateReminderTime = (index: number, newTime: string) => {
    if (!localSettings) return
    const newTimes = [...localSettings.reminder_times]
    newTimes[index] = newTime
    handleLocalSettingChange('reminder_times', newTimes)
  }

  // 시간 형식 변환 (HH:MM:SS -> HH:MM)
  const formatTimeForInput = (timeString: string) => {
    return timeString.slice(0, 5) // "HH:MM:SS" -> "HH:MM"
  }

  // 시간 형식 변환 (HH:MM -> HH:MM:SS)
  const formatTimeForServer = (timeString: string) => {
    return `${timeString}:00` // "HH:MM" -> "HH:MM:SS"
  }

  const hasChanges =
    localSettings &&
    notificationSettings &&
    JSON.stringify(localSettings) !== JSON.stringify(notificationSettings)

  if (settingsLoading) {
    return (
      <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (settingsError) {
    return (
      <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-red-600 dark:text-red-400">
          <h3 className="text-lg font-semibold mb-2">설정 로드 실패</h3>
          <p>{settingsError}</p>
        </div>
      </div>
    )
  }

  if (!localSettings) {
    return null
  }

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">알림 설정</h3>
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancelChanges} disabled={saving}>
              취소
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveSettings} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        )}
      </div>

      {/* 브라우저 알림 설정 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label
              htmlFor={browserNotificationId}
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              브라우저 알림
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getPermissionMessage()}
            </p>
          </div>
          <button
            id={browserNotificationId}
            type="button"
            onClick={handleBrowserNotificationToggle}
            disabled={!isSupported}
            aria-describedby={`${browserNotificationId}-desc`}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              localSettings.browser_notifications && canShowNotifications()
                ? 'bg-blue-600'
                : 'bg-gray-200 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localSettings.browser_notifications && canShowNotifications()
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {!isSupported && (
          <p
            id={`${browserNotificationId}-desc`}
            className="text-sm text-amber-600 dark:text-amber-400"
          >
            이 브라우저는 알림을 지원하지 않습니다.
          </p>
        )}
      </div>

      {/* Toast 알림 설정 */}
      <div className="flex items-center justify-between">
        <div>
          <label
            htmlFor={toastNotificationId}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            화면 내 알림 (Toast)
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            화면 우상단에 알림 메시지 표시
          </p>
        </div>
        <button
          id={toastNotificationId}
          type="button"
          onClick={() =>
            handleLocalSettingChange('toast_notifications', !localSettings.toast_notifications)
          }
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            localSettings.toast_notifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              localSettings.toast_notifications ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* 알림 시간 설정 */}
      <div className="space-y-3">
        <label
          htmlFor={reminderTimesId}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          마감일 알림 시간
        </label>
        <div id={reminderTimesId} className="space-y-2">
          {localSettings.reminder_times.map((time, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={time}
                onChange={(e) => updateReminderTime(index, e.target.value)}
                aria-label={`알림 시간 ${index + 1}`}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="1h">1시간 전</option>
                <option value="2h">2시간 전</option>
                <option value="6h">6시간 전</option>
                <option value="1d">1일 전</option>
                <option value="3d">3일 전</option>
                <option value="1w">1주일 전</option>
              </select>
              {localSettings.reminder_times.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeReminderTime(time)}
                  aria-label={`${time} 알림 시간 제거`}
                  className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <title>제거</title>
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addReminderTime}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            + 알림 시간 추가
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          마감일 전에 알림을 받을 시간을 설정하세요.
        </p>
      </div>

      {/* 조용한 시간 설정 */}
      <div className="space-y-3">
        <label
          htmlFor={quietHoursId}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          조용한 시간
        </label>
        <div id={quietHoursId} className="flex items-center gap-2">
          <input
            id={quietHoursStartId}
            type="time"
            value={formatTimeForInput(localSettings.quiet_hours_start)}
            onChange={(e) =>
              handleLocalSettingChange('quiet_hours_start', formatTimeForServer(e.target.value))
            }
            aria-label="조용한 시간 시작"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">부터</span>
          <input
            id={quietHoursEndId}
            type="time"
            value={formatTimeForInput(localSettings.quiet_hours_end)}
            onChange={(e) =>
              handleLocalSettingChange('quiet_hours_end', formatTimeForServer(e.target.value))
            }
            aria-label="조용한 시간 종료"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">까지</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          이 시간 동안에는 알림을 받지 않습니다.
        </p>
      </div>

      {/* 평일만 알림 */}
      <div className="flex items-center justify-between">
        <div>
          <label
            htmlFor={weekdaysOnlyId}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            평일만 알림
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            주말에는 알림을 받지 않습니다.
          </p>
        </div>
        <button
          id={weekdaysOnlyId}
          type="button"
          onClick={() => handleLocalSettingChange('weekdays_only', !localSettings.weekdays_only)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            localSettings.weekdays_only ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              localSettings.weekdays_only ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* 소리 설정 */}
      <div className="flex items-center justify-between">
        <div>
          <label
            htmlFor={soundEnabledId}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            알림 소리
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            브라우저 알림 시 소리를 재생합니다.
          </p>
        </div>
        <button
          id={soundEnabledId}
          type="button"
          onClick={() => handleLocalSettingChange('sound_enabled', !localSettings.sound_enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            localSettings.sound_enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              localSettings.sound_enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
