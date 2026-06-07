import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LeaderboardEntry } from '@/types/app'

interface RawLeaderboardEntry {
  rank: number
  user_id: string
  total_points: number
  exact_scores: number
  correct_outcomes: number
  submissions_count: number
  today_points: number
  badges: string[]
  tournament_id?: string
  profile: {
    display_name: string
    flag_code: string
    avatar_url?: string
    favorite_team_code?: string
  } | null
}

function mapEntry(raw: RawLeaderboardEntry): LeaderboardEntry {
  return {
    rank: raw.rank,
    userId: raw.user_id,
    displayName: raw.profile?.display_name ?? 'Unknown',
    avatarUrl: raw.profile?.avatar_url,
    favoriteTeamCode: raw.profile?.favorite_team_code,
    totalPoints: raw.total_points,
    exactScoresCount: raw.exact_scores,
    correctOutcomesCount: raw.correct_outcomes,
    submissionsCount: raw.submissions_count,
    todayPoints: raw.today_points,
    badges: (raw.badges ?? []) as LeaderboardEntry['badges'],
  }
}

export function useLeaderboard(tournamentId?: string) {
  return useQuery({
    queryKey: ['leaderboard', tournamentId],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      let query = supabase
        .from('leaderboard_entries')
        .select('*, profile:profiles(display_name, flag_code, avatar_url, favorite_team_code)')
        .order('total_points', { ascending: false })
        .order('exact_scores', { ascending: false })

      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId)
      }

      const { data, error } = await query

      if (error) throw error
      return (data as RawLeaderboardEntry[]).map(mapEntry)
    },
  })
}
