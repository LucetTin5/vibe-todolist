import { pgTable, text, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core'

// Enums 정의
export const priorityEnum = pgEnum('priority', ['urgent', 'high', 'medium', 'low'])
export const categoryEnum = pgEnum('category', ['work', 'personal', 'shopping', 'health', 'other'])
export const statusEnum = pgEnum('status', ['pending', 'completed'])

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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  priority: priorityEnum('priority').default('medium').notNull(),
  category: categoryEnum('category').default('other').notNull(),
  status: statusEnum('status').default('pending').notNull(),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 타입 추출
export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
export type Todo = typeof todos.$inferSelect  
export type NewTodo = typeof todos.$inferInsert