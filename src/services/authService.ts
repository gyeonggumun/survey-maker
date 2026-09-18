import { requireSupabase } from '../lib/supabase'

export function signUp(email: string, password: string) {
  return requireSupabase().auth.signUp({ email, password })
}

export function signIn(email: string, password: string) {
  return requireSupabase().auth.signInWithPassword({ email, password })
}

export function signOut() {
  return requireSupabase().auth.signOut()
}
