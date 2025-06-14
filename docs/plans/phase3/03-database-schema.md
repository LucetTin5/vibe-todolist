# 데이터베이스 스키마 설계

## 현재 데이터 모델 분석

### 기존 Todo 인터페이스
```typescript
interface Todo {
  id: string
  title: string
  description?: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  category: 'work' | 'personal' | 'shopping' | 'health' | 'other'
  status: 'pending' | 'completed'
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}
```

### 현재 통계 모델
```typescript
interface TodoStats {
  total: number
  completed: number
  active: number
  overdue: number
  dueToday: number
  dueThisWeek: number
  completionRate: number
  byPriority: Record<string, number>
  byCategory: Record<string, number>
}
```

## 새로운 데이터베이스 스키마

### 1. 사용자 인증 (Supabase Auth 기본)
```sql
-- auth.users 테이블 (Supabase 기본 제공)
-- id: UUID (Primary Key)
-- email: TEXT
-- encrypted_password: TEXT
-- email_confirmed_at: TIMESTAMP
-- created_at: TIMESTAMP
-- updated_at: TIMESTAMP
-- etc...
```

### 2. 사용자 프로필 테이블
```sql
CREATE TABLE profiles (
  -- 기본 정보
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  
  -- 설정
  timezone TEXT DEFAULT 'Asia/Seoul',
  language TEXT DEFAULT 'ko',
  theme TEXT CHECK (theme IN ('light', 'dark', 'system')) DEFAULT 'system',
  
  -- 사용자 설정
  default_priority TEXT CHECK (default_priority IN ('urgent', 'high', 'medium', 'low')) DEFAULT 'medium',
  default_category TEXT CHECK (default_category IN ('work', 'personal', 'shopping', 'health', 'other')) DEFAULT 'other',
  
  -- 알림 설정
  email_notifications BOOLEAN DEFAULT true,
  due_date_reminders BOOLEAN DEFAULT true,
  daily_summary BOOLEAN DEFAULT false,
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Todos 테이블 (확장)
```sql
CREATE TABLE todos (
  -- 기본 식별자
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- 기본 정보
  title TEXT NOT NULL,
  description TEXT,
  
  -- 분류 및 우선순위
  priority TEXT CHECK (priority IN ('urgent', 'high', 'medium', 'low')) DEFAULT 'medium',
  category TEXT CHECK (category IN ('work', 'personal', 'shopping', 'health', 'other')) DEFAULT 'other',
  
  -- 상태 관리
  status TEXT CHECK (status IN ('pending', 'completed', 'archived')) DEFAULT 'pending',
  
  -- 시간 관리
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- 확장 기능 (향후)
  parent_id UUID REFERENCES todos(id) ON DELETE CASCADE, -- 하위 작업
  estimated_minutes INTEGER, -- 예상 소요 시간
  actual_minutes INTEGER, -- 실제 소요 시간
  
  -- 태그 (JSON 배열로 저장)
  tags JSONB DEFAULT '[]'::jsonb,
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 검색 최적화
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('korean', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('korean', coalesce(description, '')), 'B')
  ) STORED
);
```

### 4. 사용자 통계 캐시 테이블 (선택적)
```sql
CREATE TABLE user_stats_cache (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- 기본 통계
  total_todos INTEGER DEFAULT 0,
  completed_todos INTEGER DEFAULT 0,
  active_todos INTEGER DEFAULT 0,
  overdue_todos INTEGER DEFAULT 0,
  
  -- 우선순위별 통계
  urgent_todos INTEGER DEFAULT 0,
  high_todos INTEGER DEFAULT 0,
  medium_todos INTEGER DEFAULT 0,
  low_todos INTEGER DEFAULT 0,
  
  -- 카테고리별 통계
  work_todos INTEGER DEFAULT 0,
  personal_todos INTEGER DEFAULT 0,
  shopping_todos INTEGER DEFAULT 0,
  health_todos INTEGER DEFAULT 0,
  other_todos INTEGER DEFAULT 0,
  
  -- 시간 통계
  completed_today INTEGER DEFAULT 0,
  completed_this_week INTEGER DEFAULT 0,
  completed_this_month INTEGER DEFAULT 0,
  
  -- 캐시 메타데이터
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. 활동 로그 테이블 (선택적)
```sql
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  
  -- 활동 유형
  action TEXT CHECK (action IN ('created', 'updated', 'completed', 'deleted', 'archived')) NOT NULL,
  
  -- 변경 사항 (JSON)
  changes JSONB,
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);
```

## 인덱스 설계

### 성능 최적화 인덱스
```sql
-- Todos 테이블 인덱스
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_category ON todos(category);
CREATE INDEX idx_todos_due_date ON todos(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_todos_created_at ON todos(created_at);
CREATE INDEX idx_todos_updated_at ON todos(updated_at);

-- 복합 인덱스 (자주 사용되는 쿼리 조합)
CREATE INDEX idx_todos_user_status ON todos(user_id, status);
CREATE INDEX idx_todos_user_priority ON todos(user_id, priority);
CREATE INDEX idx_todos_user_category ON todos(user_id, category);
CREATE INDEX idx_todos_user_due_date ON todos(user_id, due_date) WHERE due_date IS NOT NULL;

-- 검색 인덱스
CREATE INDEX idx_todos_search ON todos USING GIN(search_vector);

-- 하위 작업 인덱스
CREATE INDEX idx_todos_parent_id ON todos(parent_id) WHERE parent_id IS NOT NULL;

-- 태그 검색 인덱스
CREATE INDEX idx_todos_tags ON todos USING GIN(tags);

-- 프로필 인덱스
CREATE INDEX idx_profiles_email ON profiles(email);

-- 활동 로그 인덱스
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_todo_id ON activity_logs(todo_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
```

## Row Level Security (RLS) 정책

### Profiles 테이블 RLS
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 조회 가능
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 업데이트 가능
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 프로필 삽입 (회원가입 시)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Todos 테이블 RLS
```sql
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 Todo만 조회 가능
CREATE POLICY "Users can view own todos" ON todos
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 Todo만 삽입 가능
CREATE POLICY "Users can insert own todos" ON todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 Todo만 업데이트 가능
CREATE POLICY "Users can update own todos" ON todos
  FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 Todo만 삭제 가능
CREATE POLICY "Users can delete own todos" ON todos
  FOR DELETE USING (auth.uid() = user_id);
```

### 사용자 통계 캐시 RLS
```sql
ALTER TABLE user_stats_cache ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 통계만 조회 가능
CREATE POLICY "Users can view own stats" ON user_stats_cache
  FOR SELECT USING (auth.uid() = user_id);

-- 시스템에서만 통계 업데이트 가능 (Service Role)
CREATE POLICY "Service can update stats" ON user_stats_cache
  FOR ALL USING (auth.role() = 'service_role');
```

### 활동 로그 RLS
```sql
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 활동 로그만 조회 가능
CREATE POLICY "Users can view own activity logs" ON activity_logs
  FOR SELECT USING (auth.uid() = user_id);

-- 시스템에서만 로그 삽입 가능
CREATE POLICY "Service can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

## 트리거 및 함수

### 1. 프로필 자동 생성
```sql
-- 새 사용자 가입 시 자동으로 프로필 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### 2. Updated_at 자동 업데이트
```sql
-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

### 3. 통계 캐시 업데이트
```sql
-- Todo 변경 시 통계 캐시 업데이트
CREATE OR REPLACE FUNCTION update_user_stats_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- 통계 재계산 및 캐시 업데이트 로직
  INSERT INTO user_stats_cache (user_id, last_updated)
  VALUES (COALESCE(NEW.user_id, OLD.user_id), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    total_todos = (
      SELECT COUNT(*) FROM todos 
      WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND status != 'archived'
    ),
    completed_todos = (
      SELECT COUNT(*) FROM todos 
      WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND status = 'completed'
    ),
    last_updated = NOW();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_stats_on_todo_change
  AFTER INSERT OR UPDATE OR DELETE ON todos
  FOR EACH ROW EXECUTE PROCEDURE update_user_stats_cache();
```

## 뷰(View) 정의

### 1. 사용자 대시보드 뷰
```sql
CREATE VIEW user_dashboard_stats AS
SELECT 
  t.user_id,
  COUNT(*) as total_todos,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_todos,
  COUNT(*) FILTER (WHERE status = 'pending') as active_todos,
  COUNT(*) FILTER (WHERE due_date < NOW() AND status = 'pending') as overdue_todos,
  COUNT(*) FILTER (WHERE DATE(due_date) = CURRENT_DATE AND status = 'pending') as due_today,
  COUNT(*) FILTER (WHERE due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days' AND status = 'pending') as due_this_week,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'completed')::numeric / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as completion_rate
FROM todos t
WHERE t.status != 'archived'
GROUP BY t.user_id;
```

### 2. 사용자 활동 요약 뷰
```sql
CREATE VIEW user_activity_summary AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as todos_created_today,
  COUNT(*) FILTER (WHERE DATE(completed_at) = CURRENT_DATE) as todos_completed_today,
  COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', NOW())) as todos_created_this_week,
  COUNT(*) FILTER (WHERE completed_at >= DATE_TRUNC('week', NOW())) as todos_completed_this_week
FROM todos
WHERE status != 'archived'
GROUP BY user_id;
```

## 데이터 검증 및 제약 조건

### 1. 체크 제약 조건
```sql
-- 마감일은 미래 또는 현재여야 함 (선택적)
ALTER TABLE todos ADD CONSTRAINT check_due_date_future 
  CHECK (due_date IS NULL OR due_date >= created_at);

-- 완료 시간은 생성 시간 이후여야 함
ALTER TABLE todos ADD CONSTRAINT check_completed_after_created
  CHECK (completed_at IS NULL OR completed_at >= created_at);

-- 예상 시간은 양수여야 함
ALTER TABLE todos ADD CONSTRAINT check_positive_estimated_minutes
  CHECK (estimated_minutes IS NULL OR estimated_minutes > 0);

-- 실제 시간은 양수여야 함
ALTER TABLE todos ADD CONSTRAINT check_positive_actual_minutes
  CHECK (actual_minutes IS NULL OR actual_minutes > 0);
```

### 2. 커스텀 검증 함수
```sql
-- 태그 형식 검증
CREATE OR REPLACE FUNCTION validate_tags(tags JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- 태그는 문자열 배열이어야 함
  RETURN jsonb_typeof(tags) = 'array' AND 
         (SELECT bool_and(jsonb_typeof(value) = 'string') 
          FROM jsonb_array_elements(tags));
END;
$$ LANGUAGE plpgsql;

ALTER TABLE todos ADD CONSTRAINT check_valid_tags
  CHECK (validate_tags(tags));
```

이 스키마 설계를 통해 확장 가능하고 성능이 우수한 다중 사용자 Todo 시스템을 구축할 수 있습니다.