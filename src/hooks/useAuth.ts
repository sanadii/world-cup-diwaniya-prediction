import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, UserRole, ApprovalStatus } from '@/types/app'
import { applyDirection, DEFAULT_LANGUAGE, type Language } from '@/i18n'
import i18n from '@/i18n'

export type { Profile }

export interface AuthState {
  user: User | null
  profile: Profile | null
  isAdmin: boolean
  isApproved: boolean
  isLoading: boolean
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, email, full_name, display_name, avatar_url, flag_code, role, approval_status, is_active, favorite_team_id, preferred_language, created_at, updated_at',
    )
    .eq('id', userId)
    .single()

  if (error || !data) return null

  // Sync language preference from DB on login
  const dbLang = (data.preferred_language as Language) ?? DEFAULT_LANGUAGE
  const currentLocal = (localStorage.getItem('preferred_language') as Language) ?? DEFAULT_LANGUAGE
  // DB takes precedence when user logs in
  if (dbLang !== currentLocal) {
    localStorage.setItem('preferred_language', dbLang)
    void i18n.changeLanguage(dbLang)
    applyDirection(dbLang)
  }

  return {
    id: data.id,
    email: data.email ?? null,
    fullName: data.full_name ?? null,
    displayName: data.display_name ?? '',
    avatarUrl: data.avatar_url ?? null,
    flagCode: data.flag_code ?? '',
    favoriteTeamId: data.favorite_team_id ?? null,
    role: (data.role as UserRole) ?? 'user',
    approvalStatus: (data.approval_status as ApprovalStatus) ?? 'pending',
    isActive: data.is_active ?? true,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export function useAuth(): AuthState & {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string, flagCode: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          flag_code: flagCode,
        },
      },
    })
    if (error) throw error
  }

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const refreshProfile = async (): Promise<void> => {
    if (!user) return
    const p = await fetchProfile(user.id)
    setProfile(p)
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const isApproved = profile?.approvalStatus === 'approved'

  return {
    user,
    profile,
    isAdmin,
    isApproved,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }
}
