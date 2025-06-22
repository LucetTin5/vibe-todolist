import { createClient } from '@supabase/supabase-js'

// 환경 변수 검증
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing env.SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.SUPABASE_ANON_KEY')
}

if (!supabaseServiceKey) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
}

// 관리자 권한 클라이언트 (서버 사이드 전용)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// 사용자 권한 클라이언트 (JWT 토큰 기반)
export const createSupabaseClient = (authToken?: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// 타입 정의 (임시 - 나중에 생성된 타입으로 교체)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
        }
      }
      todos: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          priority: 'urgent' | 'high' | 'medium' | 'low'
          category: 'work' | 'personal' | 'shopping' | 'health' | 'other'
          status: 'pending' | 'completed'
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          priority?: 'urgent' | 'high' | 'medium' | 'low'
          category?: 'work' | 'personal' | 'shopping' | 'health' | 'other'
          status?: 'pending' | 'completed'
          due_date?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          priority?: 'urgent' | 'high' | 'medium' | 'low'
          category?: 'work' | 'personal' | 'shopping' | 'health' | 'other'
          status?: 'pending' | 'completed'
          due_date?: string | null
        }
      }
      notification_events: {
        Row: {
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
        Insert: {
          id?: string
          todo_id?: string | null
          user_id: string
          type: 'due_soon' | 'overdue' | 'reminder'
          message: string
          scheduled_at: string
          sent?: boolean
          metadata?: Record<string, unknown>
        }
        Update: {
          sent?: boolean
          metadata?: Record<string, unknown>
        }
      }
      user_notification_settings: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          browser_notifications?: boolean
          toast_notifications?: boolean
          reminder_times?: string[]
          quiet_hours_start?: string
          quiet_hours_end?: string
          weekdays_only?: boolean
          sound_enabled?: boolean
        }
        Update: {
          browser_notifications?: boolean
          toast_notifications?: boolean
          reminder_times?: string[]
          quiet_hours_start?: string
          quiet_hours_end?: string
          weekdays_only?: boolean
          sound_enabled?: boolean
        }
      }
    }
  }
}
