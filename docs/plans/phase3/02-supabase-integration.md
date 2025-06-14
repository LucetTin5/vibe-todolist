# Supabase 통합 계획

## Supabase 선택 이유

### 1. 통합 솔루션
- **인증**: 이메일/소셜 로그인, JWT 토큰 관리
- **데이터베이스**: PostgreSQL 기반 실시간 DB
- **스토리지**: 파일 업로드 지원 (향후 확장)
- **Edge Functions**: 서버리스 함수 (필요시)

### 2. 개발 편의성
- **타입 생성**: 자동 TypeScript 타입 생성
- **실시간 구독**: 실시간 데이터 동기화
- **Dashboard**: 웹 기반 관리 도구
- **SDK**: JavaScript/TypeScript 완벽 지원

### 3. 비용 효율성
- **Free Tier**: 개발 및 소규모 운영 지원
- **Pay-as-you-go**: 사용량 기반 확장
- **No DevOps**: 인프라 관리 불필요

## 아키텍처 설계

### 현재 아키텍처
```
Frontend (React) → Hono Backend → InMemory Storage
```

### Phase 3 목표 아키텍처
```
Frontend (React) → Supabase (Auth + DB)
                 ↘ Hono Backend → Supabase (DB)
```

### 최종 아키텍처 (선택적)
```
Frontend (React) → Supabase (Auth + DB + Edge Functions)
```

## 구현 단계

### 3.1 Supabase 프로젝트 설정

#### 3.1.1 프로젝트 생성
- [ ] Supabase 계정 생성
- [ ] 프로젝트 생성 및 설정
- [ ] API 키 및 URL 확인
- [ ] Database 패스워드 설정

#### 3.1.2 환경 설정
```bash
# 필요한 패키지 설치
cd backend && bun add @supabase/supabase-js
cd frontend && bun add @supabase/supabase-js @supabase/auth-helpers-react
```

#### 3.1.3 환경 변수 설정
```env
# backend/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# frontend/.env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3.2 데이터베이스 설정

#### 3.2.1 테이블 스키마 생성
```sql
-- 사용자 프로필 테이블 (auth.users 확장)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Todos 테이블 (사용자 관계 추가)
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('urgent', 'high', 'medium', 'low')) DEFAULT 'medium',
  category TEXT CHECK (category IN ('work', 'personal', 'shopping', 'health', 'other')) DEFAULT 'other',
  status TEXT CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.2.2 RLS (Row Level Security) 설정
```sql
-- Profiles 테이블 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Todos 테이블 RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own todos" ON todos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own todos" ON todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todos" ON todos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own todos" ON todos
  FOR DELETE USING (auth.uid() = user_id);
```

#### 3.2.3 인덱스 및 최적화
```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_created_at ON todos(created_at);
```

### 3.3 인증 설정

#### 3.3.1 Authentication 정책
```json
{
  "site_url": "http://localhost:5173",
  "redirect_urls": ["http://localhost:5173/auth/callback"],
  "jwt_expiry": 3600,
  "refresh_token_rotation_enabled": true,
  "email_confirm_enabled": true
}
```

#### 3.3.2 소셜 로그인 설정
- [ ] Google OAuth 설정
- [ ] GitHub OAuth 설정 (선택적)
- [ ] 이메일 템플릿 커스터마이징

### 3.4 클라이언트 설정

#### 3.4.1 Backend Supabase Client
```typescript
// backend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 클라이언트용 (미들웨어에서 사용)
export const createSupabaseClient = (authToken?: string) => {
  return createClient<Database>(supabaseUrl, process.env.SUPABASE_ANON_KEY!, {
    global: {
      headers: authToken ? {
        Authorization: `Bearer ${authToken}`
      } : {}
    }
  })
}
```

#### 3.4.2 Frontend Supabase Client
```typescript
// frontend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### 3.5 타입 생성

#### 3.5.1 Database Types 생성
```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인 및 프로젝트 연결
supabase login
supabase link --project-ref your-project-ref

# 타입 생성
supabase gen types typescript --local > backend/src/types/database.types.ts
supabase gen types typescript --local > frontend/src/types/database.types.ts
```

#### 3.5.2 타입 정의 예시
```typescript
// types/database.types.ts
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
          updated_at?: string
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
          updated_at?: string
        }
      }
    }
  }
}
```

## 마이그레이션 전략

### 데이터 마이그레이션
1. **단계적 전환**
   - Phase 1: Supabase 클라이언트 설정
   - Phase 2: 새 API 엔드포인트 생성
   - Phase 3: 기존 데이터 이전
   - Phase 4: 기존 API 제거

2. **백업 및 복구**
   - 기존 인메모리 데이터 JSON 내보내기
   - Supabase 데이터 가져오기 스크립트
   - 롤백 계획 수립

### 호환성 유지
- 기존 API 인터페이스 유지
- 점진적 마이그레이션
- A/B 테스트 지원

## 보안 고려사항

### 1. API 키 관리
- 환경 변수로 안전하게 저장
- 개발/운영 환경 분리
- 키 로테이션 계획

### 2. RLS 정책
- 사용자별 데이터 격리
- 최소 권한 원칙
- 정책 테스트

### 3. CORS 설정
- 허용된 도메인만 접근
- 개발/운영 환경별 설정

## 성능 최적화

### 1. 쿼리 최적화
- 적절한 인덱스 설정
- N+1 쿼리 방지
- 페이지네이션 구현

### 2. 캐싱 전략
- React Query 캐싱
- Supabase 캐시 설정
- CDN 활용 (향후)

### 3. 연결 관리
- 커넥션 풀링
- 재연결 로직
- 타임아웃 설정

이 계획을 통해 안정적이고 확장 가능한 Supabase 통합을 구현할 수 있습니다.