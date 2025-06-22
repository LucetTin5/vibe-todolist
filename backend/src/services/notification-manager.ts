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
      // 향후 Supabase에서 due date가 임박한 todos 조회
      // 현재는 로그만 출력
      console.log('Checking for due notifications...', new Date().toISOString())

      // 예시: 알림이 필요한 경우 SSE로 전송
      // const notifications = await notificationService.getPendingNotifications()
      // for (const notification of notifications) {
      //   await sseManager.sendToUser(notification.user_id, {
      //     type: notification.type,
      //     message: notification.message,
      //     todo_id: notification.todo_id,
      //     timestamp: new Date().toISOString()
      //   })
      // }
    } catch (error) {
      console.error('Error checking due notifications:', error)
    }
  }

  async getSystemStats(): Promise<SystemStats> {
    return {
      active_connections: sseManager.getActiveConnectionCount(),
      pending_notifications: 0, // 향후 Supabase에서 조회
      system_status: this.isInitialized ? 'running' : 'stopped',
      last_check: new Date().toISOString(),
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
      type: 'due_soon' | 'overdue' | 'reminder'
      message: string
      todo_id?: string
    }
  ): Promise<void> {
    try {
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
}

export const notificationManager = new NotificationManager()
