import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  integer,
  boolean,
  jsonb,
  time,
} from 'drizzle-orm/pg-core'

// Enums 정의
export const priorityEnum = pgEnum('priority', ['urgent', 'high', 'medium', 'low'])
export const categoryEnum = pgEnum('category', ['work', 'personal', 'shopping', 'health', 'other'])
export const statusEnum = pgEnum('status', ['pending', 'in_progress', 'completed'])

// Profiles 테이블 (Supabase Auth Users 확장)
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // auth.users.id와 일치
  email: text('email'),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Todos 테이블
export const todos = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  priority: priorityEnum('priority').default('medium').notNull(),
  category: categoryEnum('category').default('other').notNull(),
  status: statusEnum('status').default('pending').notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// User Notification Settings 테이블
export const userNotificationSettings = pgTable('user_notification_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').unique(),
  browserNotifications: boolean('browser_notifications').default(true),
  toastNotifications: boolean('toast_notifications').default(true),
  reminderTimes: text('reminder_times').array().default(['1h', '30m']),
  quietHoursStart: time('quiet_hours_start').default('22:00:00'),
  quietHoursEnd: time('quiet_hours_end').default('08:00:00'),
  weekdaysOnly: boolean('weekdays_only').default(false),
  soundEnabled: boolean('sound_enabled').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Notification Events 테이블
export const notificationEvents = pgTable('notification_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  todoId: uuid('todo_id').references(() => todos.id, { onDelete: 'cascade' }),
  userId: uuid('user_id'),
  type: text('type').notNull(), // 'due_soon', 'overdue', 'reminder', 'system'
  message: text('message').notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  sent: boolean('sent').default(false),
  metadata: jsonb('metadata').default({}),
})

// 타입 추출
export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
export type Todo = typeof todos.$inferSelect
export type NewTodo = typeof todos.$inferInsert
export type UserNotificationSettings = typeof userNotificationSettings.$inferSelect
export type NewUserNotificationSettings = typeof userNotificationSettings.$inferInsert
export type NotificationEvent = typeof notificationEvents.$inferSelect
export type NewNotificationEvent = typeof notificationEvents.$inferInsert
