import { useState } from 'react'
import { useNotificationContext } from '../../../contexts/NotificationContext'
import { NotificationSettings } from '../../notifications/NotificationSettings'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { forceNotificationCheck } from '../../../api/notifications'

export const NotificationSettingsCard = () => {
  const { notificationSettings, isConnected, connectionError, showToast } = useNotificationContext()
  const [showModal, setShowModal] = useState(false)
  const [testing, setTesting] = useState(false)

  const getConnectionStatus = () => {
    if (connectionError) return { text: '연결 오류', color: 'text-red-500', icon: '❌' }
    if (isConnected) return { text: '연결됨', color: 'text-green-500', icon: '✅' }
    return { text: '연결 중...', color: 'text-yellow-500', icon: '⏳' }
  }

  const handleTestNotifications = async () => {
    setTesting(true)
    try {
      await forceNotificationCheck()
      showToast('success', '테스트 완료', '알림 체크가 실행되었습니다.')
    } catch (error) {
      console.error('Failed to test notifications:', error)
      showToast('error', '테스트 실패', '알림 테스트에 실패했습니다.')
    } finally {
      setTesting(false)
    }
  }

  const status = getConnectionStatus()

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-xl">🔔</span>
            알림 설정
          </h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleTestNotifications} disabled={testing}>
              {testing ? '테스트 중...' : '테스트'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
              설정
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {/* 연결 상태 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">실시간 알림</span>
            <div className="flex items-center gap-2">
              <span className="text-sm">{status.icon}</span>
              <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
            </div>
          </div>

          {/* 브라우저 알림 상태 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">브라우저 알림</span>
            <span className="text-sm font-medium">
              {notificationSettings?.browser_notifications ? (
                <span className="text-green-600 dark:text-green-400">활성화</span>
              ) : (
                <span className="text-gray-500">비활성화</span>
              )}
            </span>
          </div>

          {/* Toast 알림 상태 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">화면 내 알림</span>
            <span className="text-sm font-medium">
              {notificationSettings?.toast_notifications ? (
                <span className="text-green-600 dark:text-green-400">활성화</span>
              ) : (
                <span className="text-gray-500">비활성화</span>
              )}
            </span>
          </div>

          {/* 조용한 시간 */}
          {notificationSettings && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">조용한 시간</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {notificationSettings.quiet_hours_start.slice(0, 5)} -{' '}
                {notificationSettings.quiet_hours_end.slice(0, 5)}
              </span>
            </div>
          )}

          {/* 알림 시간 개수 */}
          {notificationSettings && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">알림 시간</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {notificationSettings.reminder_times.length}개 설정됨
              </span>
            </div>
          )}
        </div>

        {connectionError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{connectionError}</p>
          </div>
        )}
      </div>

      {/* 알림 설정 모달 */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="알림 설정" size="xl">
        <NotificationSettings />
      </Modal>
    </>
  )
}
