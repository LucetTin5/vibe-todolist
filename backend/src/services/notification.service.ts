// 알림 서비스 - Supabase와의 데이터베이스 상호작용을 담당

interface NotificationEvent {
  id: string
  todo_id: string | null
  user_id: string
  type: 'due_soon' | 'overdue' | 'reminder'
  message: string
  scheduled_at: string
  created_at: string
  sent: boolean
  metadata: Record<string, unknown>
}

interface UserNotificationSettings {
  id: string
  user_id: string
  browser_notifications: boolean
  toast_notifications: boolean
  reminder_times: string[]
  quiet_hours_start: string
  quiet_hours_end: string
  weekdays_only: boolean
  sound_enabled: boolean
  created_at: string
  updated_at: string
}

class NotificationService {
  // 향후 Supabase 연동 시 사용할 메서드들

  async createNotificationEvent(
    event: Omit<NotificationEvent, 'id' | 'created_at' | 'sent'>
  ): Promise<NotificationEvent> {
    // TODO: Supabase에 notification_events 테이블에 삽입
    console.log('Creating notification event:', event)

    // 임시 반환값
    return {
      id: `notif_${Date.now()}`,
      ...event,
      created_at: new Date().toISOString(),
      sent: false,
    }
  }

  async getPendingNotifications(): Promise<NotificationEvent[]> {
    // TODO: Supabase에서 sent=false이고 scheduled_at이 현재 시간보다 이전인 것들 조회
    console.log('Getting pending notifications...')

    // 임시 반환값
    return []
  }

  async markNotificationAsSent(notificationId: string): Promise<void> {
    // TODO: Supabase에서 해당 notification의 sent=true로 업데이트
    console.log(`Marking notification ${notificationId} as sent`)
  }

  async getUserNotificationSettings(userId: string): Promise<UserNotificationSettings | null> {
    // TODO: Supabase에서 user_notification_settings 조회
    console.log(`Getting notification settings for user ${userId}`)

    // 임시 기본값 반환
    return {
      id: `settings_${userId}`,
      user_id: userId,
      browser_notifications: true,
      toast_notifications: true,
      reminder_times: ['09:00', '18:00'],
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      weekdays_only: false,
      sound_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  async updateUserNotificationSettings(
    userId: string,
    settings: Partial<
      Omit<UserNotificationSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>
    >
  ): Promise<UserNotificationSettings> {
    // TODO: Supabase에서 user_notification_settings 업데이트
    console.log(`Updating notification settings for user ${userId}:`, settings)

    // 임시 반환값
    const existingSettings = await this.getUserNotificationSettings(userId)
    if (!existingSettings) {
      throw new Error('User settings not found')
    }
    return {
      ...existingSettings,
      ...settings,
      updated_at: new Date().toISOString(),
    }
  }

  async scheduleNotificationForTodo(todoId: string, userId: string, dueDate: Date): Promise<void> {
    // Due date 기반으로 알림 이벤트들 생성
    const now = new Date()
    const notifications: Array<Omit<NotificationEvent, 'id' | 'created_at' | 'sent'>> = []

    // 1일 전 알림
    const oneDayBefore = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000)
    if (oneDayBefore > now) {
      notifications.push({
        todo_id: todoId,
        user_id: userId,
        type: 'due_soon',
        message: '할일의 마감일이 하루 남았습니다.',
        scheduled_at: oneDayBefore.toISOString(),
        metadata: { advance_notice: '1day' },
      })
    }

    // 1시간 전 알림
    const oneHourBefore = new Date(dueDate.getTime() - 60 * 60 * 1000)
    if (oneHourBefore > now) {
      notifications.push({
        todo_id: todoId,
        user_id: userId,
        type: 'due_soon',
        message: '할일의 마감일이 1시간 남았습니다.',
        scheduled_at: oneHourBefore.toISOString(),
        metadata: { advance_notice: '1hour' },
      })
    }

    // 마감일 지난 후 알림
    const overdueCheck = new Date(dueDate.getTime() + 60 * 60 * 1000) // 1시간 후
    notifications.push({
      todo_id: todoId,
      user_id: userId,
      type: 'overdue',
      message: '할일의 마감일이 지났습니다.',
      scheduled_at: overdueCheck.toISOString(),
      metadata: { overdue_check: true },
    })

    // 모든 알림 이벤트 생성
    for (const notification of notifications) {
      await this.createNotificationEvent(notification)
    }

    console.log(`Scheduled ${notifications.length} notifications for todo ${todoId}`)
  }

  // 사용자의 조용한 시간인지 확인
  async isQuietHours(userId: string): Promise<boolean> {
    const settings = await this.getUserNotificationSettings(userId)
    if (!settings) return false

    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM 형식

    const startTime = settings.quiet_hours_start
    const endTime = settings.quiet_hours_end

    // 시간 비교 로직 (간단한 구현)
    if (startTime <= endTime) {
      // 같은 날 (예: 22:00 ~ 08:00)
      return currentTime >= startTime && currentTime <= endTime
    }
    // 다음 날로 넘어가는 경우 (예: 22:00 ~ 08:00)
    return currentTime >= startTime || currentTime <= endTime
  }

  // 평일만 알림인지 확인
  async shouldNotifyOnWeekend(userId: string): Promise<boolean> {
    const settings = await this.getUserNotificationSettings(userId)
    if (!settings) return true

    if (!settings.weekdays_only) return true

    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = 일요일, 6 = 토요일

    return dayOfWeek >= 1 && dayOfWeek <= 5 // 월~금
  }
}

export const notificationService = new NotificationService()
