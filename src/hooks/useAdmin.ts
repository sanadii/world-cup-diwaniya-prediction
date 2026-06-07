import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/useAuthContext'

interface RawProfile {
  id: string
  display_name: string
  flag_code: string
  role: string
  is_approved: boolean
  created_at: string
  avatar_url?: string
}

export interface AdminUser {
  id: string
  displayName: string
  flagCode: string
  role: string
  isApproved: boolean
  createdAt: string
  avatarUrl?: string
}

export interface UpdateMatchScoreInput {
  matchId: string
  homeScore: number
  awayScore: number
  wentToPenalties?: boolean
  homePenalty?: number
  awayPenalty?: number
  winnerTeamId?: string
  status: string
}

function mapProfile(raw: RawProfile): AdminUser {
  return {
    id: raw.id,
    displayName: raw.display_name,
    flagCode: raw.flag_code,
    role: raw.role,
    isApproved: raw.is_approved,
    createdAt: raw.created_at,
    avatarUrl: raw.avatar_url,
  }
}

export function useAdminUsers() {
  const { isAdmin } = useAuthContext()

  return useQuery({
    queryKey: ['admin-users'],
    enabled: isAdmin,
    queryFn: async (): Promise<AdminUser[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data as RawProfile[]).map(mapProfile)
    },
  })
}

export function useApproveUser() {
  const queryClient = useQueryClient()
  const { isAdmin } = useAuthContext()

  return useMutation({
    mutationFn: async (userId: string): Promise<void> => {
      if (!isAdmin) throw new Error('Unauthorized')

      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export function useUpdateMatchScore() {
  const queryClient = useQueryClient()
  const { isAdmin } = useAuthContext()

  return useMutation({
    mutationFn: async (input: UpdateMatchScoreInput): Promise<void> => {
      if (!isAdmin) throw new Error('Unauthorized')

      const { error } = await supabase
        .from('matches')
        .update({
          full_time_score_a: input.homeScore,
          full_time_score_b: input.awayScore,
          went_to_penalties: input.wentToPenalties ?? false,
          penalty_score_a: input.homePenalty ?? null,
          penalty_score_b: input.awayPenalty ?? null,
          winner_team_id: input.winnerTeamId ?? null,
          status: input.status,
        })
        .eq('id', input.matchId)

      if (error) throw error

      // Insert audit log if service key available (skip if not)
      const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY as string | undefined
      if (serviceKey) {
        const { createClient } = await import('@supabase/supabase-js')
        const adminClient = createClient(import.meta.env.VITE_SUPABASE_URL as string, serviceKey)
        const {
          data: { user },
        } = await supabase.auth.getUser()
        await adminClient.from('audit_log').insert({
          action: 'update_match_score',
          match_id: input.matchId,
          performed_by: user?.id ?? null,
          payload: input,
          created_at: new Date().toISOString(),
        })
      }
    },
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: ['matches'] })
      void queryClient.invalidateQueries({ queryKey: ['match', input.matchId] })
    },
  })
}

export function useTriggerScoring(matchId: string) {
  const queryClient = useQueryClient()
  const { isAdmin } = useAuthContext()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!isAdmin) throw new Error('Unauthorized')

      const { error } = await supabase.rpc('calculate_match_points', {
        p_match_id: matchId,
      })

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      void queryClient.invalidateQueries({ queryKey: ['predictions', matchId] })
    },
  })
}
