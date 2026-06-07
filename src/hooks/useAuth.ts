import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  displayName: string
  flagCode: string
  role: string
  isApproved: boolean
  createdAt: string
}

export interface AuthState {
  user: User | null
  profile: Profile | null
  isAdmin: boolean
  isApproved: boolean
  isLoading: boolean
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

  if (error || !data) return null

  return {
    id: data.id,
    displayName: data.display_name,
    flagCode: data.flag_code,
    role: data.role,
    isApproved: data.is_approved,
    createdAt: data.created_at,
  }
}

export function useAuth(): AuthState & {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string, flagCode: string) => Promise<void>
  signOut: () => Promise<void>
} {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        const p = await fetchProfile(currentUser.id)
        setProfile(p)
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        const p = await fetchProfile(currentUser.id)
        setProfile(p)
      } else {
        setProfile(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    flagCode: string,
  ): Promise<void> => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        display_name: displayName,
        flag_code: flagCode,
        role: 'user',
        is_approved: false,
      })
      if (profileError) throw profileError
    }
  }

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const isApproved = profile?.isApproved ?? false

  return {
    user,
    profile,
    isAdmin,
    isApproved,
    isLoading,
    signIn,
    signUp,
    signOut,
  }
}
