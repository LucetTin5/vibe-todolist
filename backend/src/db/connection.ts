import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// 환경 변수에서 DATABASE_URL 읽기
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.')
}

// PostgreSQL 연결 생성
const client = postgres(databaseUrl, {
  prepare: false, // Supabase 호환성을 위해 비활성화
})

// Drizzle 인스턴스 생성
export const db = drizzle(client, { schema })

// 연결 테스트 함수
export async function testConnection() {
  try {
    await client`SELECT 1`
    console.log('✅ Drizzle-PostgreSQL 연결 성공')
    return true
  } catch (error) {
    console.error('❌ Drizzle-PostgreSQL 연결 실패:', error)
    return false
  }
}

// 스키마 export
export { schema }
