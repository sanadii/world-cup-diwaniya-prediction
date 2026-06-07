import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { UserStats } from '@/types/app'

interface RawLeaderboardEntry {
  user_id: string
  total_points: number
  rank: number
  exact_scores: number
  correct_outcomes: number
  today_points: number
}

export function useUserStats(userId?: string) {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: async (): Promise<UserStats> => {
      // Resolve userId — fall back to current auth user
      let targetUserId = userId
      if (!targetUserId) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        targetUserId = user.id
      }

      const [leaderboardResult, predictionsResult, totalUsersResult] = await Promise.all([
        supabase.from('leaderboard_entries').select('*').eq('user_id', targetUserId).maybeSingle(),
        supabase
          .from('predictions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', targetUserId),
        supabase.from('leaderboard_entries').select('user_id', { count: 'exact', head: true }),
      ])

      if (leaderboardResult.error) throw leaderboardResult.error
      if (predictionsResult.error) throw predictionsResult.error
      if (totalUsersResult.error) throw totalUsersResult.error

      const entry = leaderboardResult.data as RawLeaderboardEntry | null
      const predictionsSubmitted = predictionsResult.count ?? 0
      const totalParticipants = totalUsersResult.count ?? 0

      return {
        totalPoints: entry?.total_points ?? 0,
        currentRank: entry?.rank ?? 0,
        totalParticipants,
        exactScores: entry?.exact_scores ?? 0,
        correctOutcomes: entry?.correct_outcomes ?? 0,
        predictionsSubmitted,
        predictionsAvailable: 0, // computed elsewhere based on open matches
        todayPoints: entry?.today_points ?? 0,
      }
    },
  })
}
