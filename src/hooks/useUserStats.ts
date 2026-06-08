import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { UserStats } from '@/types/app'

interface RawLeaderboardSnapshot {
  user_id: string
  total_points: number
  rank: number | null
  exact_scores_count: number
  correct_outcomes_count: number
  submissions_count: number
  today_points: number
}

export function useUserStats(userId?: string) {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: async (): Promise<UserStats> => {
      let targetUserId = userId
      if (!targetUserId) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        targetUserId = user.id
      }

      const { data, error } = await supabase
        .from('leaderboard_snapshots')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle()

      if (error) throw error

      const entry = data as RawLeaderboardSnapshot | null

      return {
        totalPoints: entry?.total_points ?? 0,
        rank: entry?.rank ?? null,
        matchesPredicted: entry?.submissions_count ?? 0,
        exactScores: entry?.exact_scores_count ?? 0,
        correctOutcomes: entry?.correct_outcomes_count ?? 0,
        todayPoints: entry?.today_points ?? 0,
      }
    },
  })
}
