import { useState, useId } from 'react'
import { useBrowserNotifications } from '../../hooks/useBrowserNotifications'

interface NotificationSettingsData {
  browser_notifications: boolean
  toast_notifications: boolean
  reminder_times: string[]
  quiet_hours_start: string
  quiet_hours_end: string
  weekdays_only: boolean
  sound_enabled: boolean
}

interface NotificationSettingsProps {
  onSettingsChange?: (settings: Partial<NotificationSettingsData>) => void
}

export const NotificationSettings = ({ onSettingsChange }: NotificationSettingsProps) => {
  const [settings, setSettings] = useState<NotificationSettingsData>({
    browser_notifications: true,
    toast_notifications: true,
    reminder_times: ['09:00', '18:00'],
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    weekdays_only: false,
    sound_enabled: true,
  })

  const { isSupported, requestPermission, getPermissionMessage, canShowNotifications } =
    useBrowserNotifications()

  // useId로 고유 ID 생성
  const browserNotificationId = useId()
  const toastNotificationId = useId()
  const reminderTimesId = useId()
  const quietHoursId = useId()
  const quietHoursStartId = useId()
  const quietHoursEndId = useId()
  const weekdaysOnlyId = useId()
  const soundEnabledId = useId()

  // 설정 변경 핸들러
  const handleSettingChange = <K extends keyof NotificationSettingsData>(
    key: K,
    value: NotificationSettingsData[K]
  ) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    onSettingsChange?.({ [key]: value })
  }

  // 브라우저 알림 토글 (권한 요청 포함)
  const handleBrowserNotificationToggle = async () => {
    if (!settings.browser_notifications) {
      // 켜려고 할 때 권한 확인/요청
      if (!canShowNotifications()) {
        const result = await requestPermission()
        if (result !== 'granted') {
          return // 권한이 거부되면 설정 변경하지 않음
        }
      }
    }

    handleSettingChange('browser_notifications', !settings.browser_notifications)
  }

  // 알림 시간 추가
  const addReminderTime = () => {
    const newTime = '12:00' // 기본값
    if (!settings.reminder_times.includes(newTime)) {
      handleSettingChange('reminder_times', [...settings.reminder_times, newTime])
    }
  }

  // 알림 시간 제거
  const removeReminderTime = (timeToRemove: string) => {
    handleSettingChange(
      'reminder_times',
      settings.reminder_times.filter((time) => time !== timeToRemove)
    )
  }

  // 알림 시간 변경
  const updateReminderTime = (index: number, newTime: string) => {
    const newTimes = [...settings.reminder_times]
    newTimes[index] = newTime
    handleSettingChange('reminder_times', newTimes)
  }

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">알림 설정</h3>
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
              settings.browser_notifications && canShowNotifications()
                ? 'bg-blue-600'
                : 'bg-gray-200 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.browser_notifications && canShowNotifications()
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
          onClick={() => handleSettingChange('toast_notifications', !settings.toast_notifications)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            settings.toast_notifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.toast_notifications ? 'translate-x-6' : 'translate-x-1'
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
          알림 시간
        </label>
        <div id={reminderTimesId} className="space-y-2">
          {settings.reminder_times.map((time, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="time"
                value={time}
                onChange={(e) => updateReminderTime(index, e.target.value)}
                aria-label={`알림 시간 ${index + 1}`}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              {settings.reminder_times.length > 1 && (
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
            value={settings.quiet_hours_start}
            onChange={(e) => handleSettingChange('quiet_hours_start', e.target.value)}
            aria-label="조용한 시간 시작"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">부터</span>
          <input
            id={quietHoursEndId}
            type="time"
            value={settings.quiet_hours_end}
            onChange={(e) => handleSettingChange('quiet_hours_end', e.target.value)}
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
          onClick={() => handleSettingChange('weekdays_only', !settings.weekdays_only)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            settings.weekdays_only ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.weekdays_only ? 'translate-x-6' : 'translate-x-1'
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
          onClick={() => handleSettingChange('sound_enabled', !settings.sound_enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            settings.sound_enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.sound_enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
