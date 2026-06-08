import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/useAuthContext'
import type { ApprovalStatus, UserRole } from '@/types/app'

interface RawProfile {
  id: string
  email: string | null
  full_name: string | null
  display_name: string
  flag_code: string
  role: string
  approval_status: string
  is_active: boolean
  created_at: string
  updated_at: string
  avatar_url: string | null
  favorite_team_id: string | null
}

export interface AdminUser {
  id: string
  email: string | null
  fullName: string | null
  displayName: string
  flagCode: string
  role: UserRole
  approvalStatus: ApprovalStatus
  isActive: boolean
  createdAt: string
  updatedAt: string
  avatarUrl: string | null
  favoriteTeamId: string | null
}

export interface UpdateMatchScoreInput {
  matchId: string
  fullTimeScoreA: number
  fullTimeScoreB: number
  wentToPenalties?: boolean
  penaltyScoreA?: number | null
  penaltyScoreB?: number | null
  winnerTeamId?: string | null
  status: string
}

function mapProfile(raw: RawProfile): AdminUser {
  return {
    id: raw.id,
    email: raw.email,
    fullName: raw.full_name,
    displayName: raw.display_name ?? '',
    flagCode: raw.flag_code ?? '',
    role: (raw.role as UserRole) ?? 'user',
    approvalStatus: (raw.approval_status as ApprovalStatus) ?? 'pending',
    isActive: raw.is_active ?? true,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    avatarUrl: raw.avatar_url,
    favoriteTeamId: raw.favorite_team_id,
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
        .update({ approval_status: 'approved' })
        .eq('id', userId)

      if (error) throw error

      // Log admin action
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('admin_actions').insert({
          admin_user_id: user.id,
          action_type: 'approve_user',
          entity_type: 'profile',
          entity_id: userId,
          old_value: { approval_status: 'pending' },
          new_value: { approval_status: 'approved' },
        })
      }
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
          full_time_score_a: input.fullTimeScoreA,
          full_time_score_b: input.fullTimeScoreB,
          went_to_penalties: input.wentToPenalties ?? false,
          penalty_score_a: input.penaltyScoreA ?? null,
          penalty_score_b: input.penaltyScoreB ?? null,
          winner_team_id: input.winnerTeamId ?? null,
          status: input.status,
        })
        .eq('id', input.matchId)

      if (error) throw error

      // Log admin action
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('admin_actions').insert({
          admin_user_id: user.id,
          action_type: 'update_match_score',
          entity_type: 'match',
          entity_id: input.matchId,
          old_value: null,
          new_value: {
            full_time_score_a: input.fullTimeScoreA,
            full_time_score_b: input.fullTimeScoreB,
            status: input.status,
          },
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
