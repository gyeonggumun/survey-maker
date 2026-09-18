import { useEffect } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const { user, isLoading, setLoading, setUser } = useAuthStore()

  useEffect(() => {
    const client = supabase

    if (!isSupabaseConfigured || !client) {
      setLoading(false)
      return
    }

    const initialize = async () => {
      const { data } = await client.auth.getUser()
      setUser(data.user)
      setLoading(false)
    }

    void initialize()

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => data.subscription.unsubscribe()
  }, [setLoading, setUser])

  return { user, isLoading }
}
