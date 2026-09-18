import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase 환경 변수가 없습니다. .env.local을 설정한 뒤 개발 서버를 다시 시작하세요.',
    )
  }

  return supabase
}
