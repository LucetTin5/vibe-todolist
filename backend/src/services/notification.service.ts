// 알림 서비스 - Supabase와의 데이터베이스 상호작용을 담당

import { db } from "../db/connection";
import {
  notificationEvents,
  userNotificationSettings,
  type NotificationEvent,
  type NewNotificationEvent,
  type UserNotificationSettings,
  type NewUserNotificationSettings,
} from "../db/schema";
import { eq, and, lte, sql } from "drizzle-orm";

class NotificationService {
  // 향후 Supabase 연동 시 사용할 메서드들

  async createNotificationEvent(
    event: Omit<NewNotificationEvent, "id" | "createdAt" | "sent">
  ): Promise<NotificationEvent> {
    console.log("Creating notification event:", event);

    const [createdEvent] = await db
      .insert(notificationEvents)
      .values({
        ...event,
        sent: false,
      })
      .returning();

    return createdEvent;
  }

  async getPendingNotifications(): Promise<NotificationEvent[]> {
    console.log("Getting pending notifications...");

    const pendingNotifications = await db
      .select()
      .from(notificationEvents)
      .where(
        and(
          eq(notificationEvents.sent, false),
          lte(notificationEvents.scheduledAt, new Date())
        )
      )
      .orderBy(notificationEvents.scheduledAt);

    return pendingNotifications;
  }

  async markNotificationAsSent(notificationId: string): Promise<void> {
    console.log(`Marking notification ${notificationId} as sent`);

    await db
      .update(notificationEvents)
      .set({ sent: true })
      .where(eq(notificationEvents.id, notificationId));
  }

  async getUserNotificationSettings(
    userId: string
  ): Promise<UserNotificationSettings | null> {
    console.log(`Getting notification settings for user ${userId}`);

    const [settings] = await db
      .select()
      .from(userNotificationSettings)
      .where(eq(userNotificationSettings.userId, userId))
      .limit(1);

    return settings || null;
  }

  async createDefaultUserNotificationSettings(
    userId: string
  ): Promise<UserNotificationSettings> {
    console.log(`Creating default notification settings for user ${userId}`);

    const [settings] = await db
      .insert(userNotificationSettings)
      .values({
        userId,
        browserNotifications: true,
        toastNotifications: true,
        reminderTimes: ["1h", "30m"],
        quietHoursStart: "22:00:00",
        quietHoursEnd: "08:00:00",
        weekdaysOnly: false,
        soundEnabled: true,
      })
      .returning();

    return settings;
  }

  async updateUserNotificationSettings(
    userId: string,
    settings: Partial<
      Omit<
        UserNotificationSettings,
        "id" | "userId" | "createdAt" | "updatedAt"
      >
    >
  ): Promise<UserNotificationSettings> {
    console.log(`Updating notification settings for user ${userId}:`, settings);

    // 기존 설정이 있는지 확인
    const existingSettings = await this.getUserNotificationSettings(userId);

    if (!existingSettings) {
      // 기존 설정이 없으면 새로 생성
      const newSettings = await this.createDefaultUserNotificationSettings(
        userId
      );
      if (Object.keys(settings).length > 0) {
        // 업데이트할 설정이 있으면 다시 업데이트
        return this.updateUserNotificationSettings(userId, settings);
      }
      return newSettings;
    }

    // 기존 설정 업데이트
    const [updatedSettings] = await db
      .update(userNotificationSettings)
      .set({
        ...settings,
        updatedAt: new Date(),
      })
      .where(eq(userNotificationSettings.userId, userId))
      .returning();

    return updatedSettings;
  }

  async scheduleNotificationForTodo(
    todoId: string,
    userId: string,
    dueDate: Date
  ): Promise<void> {
    console.log(`Scheduling notifications for todo ${todoId}, due: ${dueDate}`);

    // 사용자 설정 확인
    const userSettings = await this.getUserNotificationSettings(userId);
    if (!userSettings) {
      console.log(
        `No notification settings found for user ${userId}, creating defaults`
      );
      await this.createDefaultUserNotificationSettings(userId);
    }

    const now = new Date();
    const notifications: Array<
      Omit<NewNotificationEvent, "id" | "createdAt" | "sent">
    > = [];

    // 사용자의 reminder_times 설정에 따라 알림 생성
    const reminderTimes = userSettings?.reminderTimes || ["1h", "30m"];

    for (const reminderTime of reminderTimes) {
      let minutesBefore = 0;

      // reminder_time 파싱 (예: '1h', '30m', '1d')
      if (reminderTime.endsWith("m")) {
        minutesBefore = Number.parseInt(reminderTime.slice(0, -1));
      } else if (reminderTime.endsWith("h")) {
        minutesBefore = Number.parseInt(reminderTime.slice(0, -1)) * 60;
      } else if (reminderTime.endsWith("d")) {
        minutesBefore = Number.parseInt(reminderTime.slice(0, -1)) * 24 * 60;
      }

      const reminderTime_date = new Date(
        dueDate.getTime() - minutesBefore * 60 * 1000
      );

      if (reminderTime_date > now) {
        notifications.push({
          todoId,
          userId,
          type: "reminder",
          message: `할일의 마감일이 ${reminderTime} 남았습니다.`,
          scheduledAt: reminderTime_date,
          metadata: { advance_notice: reminderTime },
        });
      }
    }

    // 마감일 지난 후 알림 (1시간 후)
    const overdueCheck = new Date(dueDate.getTime() + 60 * 60 * 1000);
    notifications.push({
      todoId,
      userId,
      type: "overdue",
      message: "할일의 마감일이 지났습니다.",
      scheduledAt: overdueCheck,
      metadata: { overdue_check: true },
    });

    // 기존 알림들 삭제 (중복 방지)
    await db
      .delete(notificationEvents)
      .where(
        and(
          eq(notificationEvents.todoId, todoId),
          eq(notificationEvents.sent, false)
        )
      );

    // 새 알림 이벤트들 생성
    if (notifications.length > 0) {
      await db.insert(notificationEvents).values(notifications);
    }

    console.log(
      `Scheduled ${notifications.length} notifications for todo ${todoId}`
    );
  }

  async deleteNotificationsForTodo(todoId: string): Promise<void> {
    console.log(`Deleting notifications for todo ${todoId}`);

    await db
      .delete(notificationEvents)
      .where(eq(notificationEvents.todoId, todoId));
  }

  // 사용자의 조용한 시간인지 확인
  async isQuietHours(userId: string): Promise<boolean> {
    const settings = await this.getUserNotificationSettings(userId);
    if (!settings) return false;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS 형식

    const startTime = settings.quietHoursStart || "22:00:00";
    const endTime = settings.quietHoursEnd || "08:00:00";

    // 시간 비교 로직
    if (startTime <= endTime) {
      // 같은 날 (예: 08:00 ~ 22:00)
      return currentTime >= startTime && currentTime <= endTime;
    }
    // 다음 날로 넘어가는 경우 (예: 22:00 ~ 08:00)
    return currentTime >= startTime || currentTime <= endTime;
  }

  // 평일만 알림인지 확인
  async shouldNotifyOnWeekend(userId: string): Promise<boolean> {
    const settings = await this.getUserNotificationSettings(userId);
    if (!settings) return true;

    if (!settings.weekdaysOnly) return true;

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = 일요일, 6 = 토요일

    return dayOfWeek >= 1 && dayOfWeek <= 5; // 월~금
  }

  // 통계 조회
  async getNotificationStats(): Promise<{
    pending_notifications: number;
    sent_today: number;
    total_settings: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificationEvents)
      .where(eq(notificationEvents.sent, false));

    const [sentTodayCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificationEvents)
      .where(
        and(
          eq(notificationEvents.sent, true),
          sql`${notificationEvents.createdAt} >= ${today}`,
          sql`${notificationEvents.createdAt} < ${tomorrow}`
        )
      );

    const [settingsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userNotificationSettings);

    return {
      pending_notifications: pendingCount.count,
      sent_today: sentTodayCount.count,
      total_settings: settingsCount.count,
    };
  }
}

export const notificationService = new NotificationService();
