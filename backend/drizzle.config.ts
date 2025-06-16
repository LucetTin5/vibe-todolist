import { defineConfig } from 'drizzle-kit'

// 환경변수 가드
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL 환경변수가 설정되지 않았습니다.')
  console.error('   .env 파일에 DATABASE_URL을 추가해주세요.')
  process.exit(1)
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
})
