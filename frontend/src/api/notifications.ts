import mutator from '../orval/mutator'

export interface NotificationSettings {
  browser_notifications: boolean
  toast_notifications: boolean
  reminder_times: string[]
  quiet_hours_start: string
  quiet_hours_end: string
  weekdays_only: boolean
  sound_enabled: boolean
}

export interface NotificationSettingsResponse {
  success: true
  data: NotificationSettings
}

export interface NotificationUpdateResponse {
  success: true
  message: string
}

export interface ErrorResponse {
  success: false
  error: string
  message: string
  details?: string
}

// 알림 설정 조회
export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  const response = await mutator<NotificationSettingsResponse>({
    url: '/api/notifications/settings',
    method: 'GET',
  })

  return response.data
}

// 알림 설정 업데이트
export const updateNotificationSettings = async (
  settings: Partial<NotificationSettings>
): Promise<string> => {
  const response = await mutator<NotificationUpdateResponse>({
    url: '/api/notifications/settings',
    method: 'PUT',
    data: settings,
  })

  return response.message
}

// Todo 알림 스케줄링
export const scheduleNotificationsForTodo = async (
  todoId: string,
  dueDate: string
): Promise<void> => {
  await mutator({
    url: '/api/notifications/schedule',
    method: 'POST',
    data: {
      todoId,
      dueDate,
    },
  })
}

// Todo 알림 삭제
export const deleteNotificationsForTodo = async (todoId: string): Promise<void> => {
  await mutator({
    url: `/api/notifications/todo/${todoId}`,
    method: 'DELETE',
  })
}

// 강제 알림 체크 (테스트용)
export const forceNotificationCheck = async (): Promise<void> => {
  await mutator({
    url: '/api/notifications/force-check',
    method: 'POST',
  })
}

// 시스템 통계 조회 (관리자용)
export const getNotificationStats = async () => {
  const response = await mutator({
    url: '/api/notifications/stats',
    method: 'GET',
  })

  return response
}
