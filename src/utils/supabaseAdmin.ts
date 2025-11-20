import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

// Service Role Key가 없으면 Anon Key 사용 (개발 환경용)
// 프로덕션에서는 반드시 Service Role Key를 사용해야 합니다
const keyToUse = supabaseServiceRoleKey || supabaseAnonKey

if (!keyToUse) {
  throw new Error(
    'Missing Supabase keys. Please set either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

// 서버 사이드에서만 사용하는 관리자 클라이언트
export const supabaseAdmin = createClient(supabaseUrl, keyToUse, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

