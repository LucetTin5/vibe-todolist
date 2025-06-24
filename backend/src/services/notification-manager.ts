import { notificationService } from './notification.service'
import { sseManager } from '../utils/sse-manager'

interface SystemStats {
  active_connections: number
  pending_notifications: number
  system_status: 'running' | 'stopped' | 'error'
  last_check: string
}

class NotificationManager {
  private isInitialized = false
  private checkInterval: Timer | null = null
  private readonly CHECK_INTERVAL_MS = 60000 // 1분마다 체크
  private lastCheckTime = new Date()

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Notification manager already initialized')
      return
    }

    try {
      console.log('Initializing notification manager...')

      // SSE Manager 초기화
      sseManager.initialize()

      // 주기적인 알림 체크 시작
      this.startPeriodicCheck()

      this.isInitialized = true
      console.log('Notification manager initialized successfully')
    } catch (error) {
      console.error('Failed to initialize notification manager:', error)
      throw error
    }
  }

  private startPeriodicCheck(): void {
    this.checkInterval = setInterval(async () => {
      try {
        await this.checkAndSendDueNotifications()
      } catch (error) {
        console.error('Error during periodic notification check:', error)
      }
    }, this.CHECK_INTERVAL_MS)
  }

  private async checkAndSendDueNotifications(): Promise<void> {
    try {
      this.lastCheckTime = new Date()
      console.log('Checking for due notifications...', this.lastCheckTime.toISOString())

      // 실제 pending notifications 조회
      const notifications = await notificationService.getPendingNotifications()

      for (const notification of notifications) {
        // userId가 null인 경우 스킵
        if (!notification.userId) {
          console.log('Skipping notification with null userId')
          continue
        }

        // 사용자 설정 확인
        const userSettings = await notificationService.getUserNotificationSettings(
          notification.userId
        )

        // 조용한 시간 체크
        if (userSettings && (await notificationService.isQuietHours(notification.userId))) {
          console.log(`Skipping notification for user ${notification.userId} - quiet hours`)
          continue
        }

        // 주말 알림 설정 체크
        if (
          userSettings &&
          !(await notificationService.shouldNotifyOnWeekend(notification.userId))
        ) {
          console.log(`Skipping notification for user ${notification.userId} - weekdays only`)
          continue
        }

        // 브라우저 알림이 활성화된 경우에만 SSE로 전송
        if (userSettings?.browserNotifications) {
          await sseManager.sendToUser(notification.userId, {
            type: notification.type as 'due_soon' | 'overdue' | 'reminder' | 'system',
            message: notification.message,
            todo_id: notification.todoId || undefined,
            timestamp: new Date().toISOString(),
            metadata: notification.metadata,
          })
        }

        // 알림을 전송됨으로 표시
        await notificationService.markNotificationAsSent(notification.id)

        console.log(`Notification sent to user ${notification.userId}: ${notification.message}`)
      }

      if (notifications.length > 0) {
        console.log(`Processed ${notifications.length} pending notifications`)
      }
    } catch (error) {
      console.error('Error checking due notifications:', error)
    }
  }

  async getSystemStats(): Promise<SystemStats> {
    try {
      const stats = await notificationService.getNotificationStats()

      return {
        active_connections: sseManager.getActiveConnectionCount(),
        pending_notifications: stats.pending_notifications,
        system_status: this.isInitialized ? 'running' : 'stopped',
        last_check: this.lastCheckTime.toISOString(),
      }
    } catch (error) {
      console.error('Error getting system stats:', error)
      return {
        active_connections: sseManager.getActiveConnectionCount(),
        pending_notifications: 0,
        system_status: 'error',
        last_check: this.lastCheckTime.toISOString(),
      }
    }
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down notification manager...')

    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    sseManager.closeAllConnections()
    this.isInitialized = false

    console.log('Notification manager shut down successfully')
  }

  // 수동으로 특정 사용자에게 알림 전송
  async sendNotificationToUser(
    userId: string,
    notification: {
      type: 'due_soon' | 'overdue' | 'reminder' | 'system'
      message: string
      todo_id?: string
    }
  ): Promise<void> {
    try {
      // 사용자 설정 확인
      const userSettings = await notificationService.getUserNotificationSettings(userId)

      if (!userSettings?.browserNotifications) {
        console.log(`User ${userId} has browser notifications disabled`)
        return
      }

      await sseManager.sendToUser(userId, {
        ...notification,
        timestamp: new Date().toISOString(),
      })
      console.log(`Notification sent to user ${userId}:`, notification)
    } catch (error) {
      console.error(`Failed to send notification to user ${userId}:`, error)
    }
  }

  // 모든 활성 사용자에게 브로드캐스트
  async broadcastNotification(notification: {
    type: 'system'
    message: string
  }): Promise<void> {
    try {
      sseManager.broadcast({
        ...notification,
        timestamp: new Date().toISOString(),
      })
      console.log('Broadcast notification sent:', notification)
    } catch (error) {
      console.error('Failed to broadcast notification:', error)
    }
  }

  // 특정 할일에 대한 알림 스케줄링
  async scheduleNotificationsForTodo(todoId: string, userId: string, dueDate: Date): Promise<void> {
    try {
      await notificationService.scheduleNotificationForTodo(todoId, userId, dueDate)
      console.log(`Scheduled notifications for todo ${todoId}`)
    } catch (error) {
      console.error(`Failed to schedule notifications for todo ${todoId}:`, error)
    }
  }

  // 할일 삭제 시 관련 알림들 삭제
  async deleteNotificationsForTodo(todoId: string): Promise<void> {
    try {
      await notificationService.deleteNotificationsForTodo(todoId)
      console.log(`Deleted notifications for todo ${todoId}`)
    } catch (error) {
      console.error(`Failed to delete notifications for todo ${todoId}:`, error)
    }
  }

  // 강제로 알림 체크 실행 (테스트용)
  async forceNotificationCheck(): Promise<void> {
    console.log('Forcing notification check...')
    await this.checkAndSendDueNotifications()
  }
}

export const notificationManager = new NotificationManager()
