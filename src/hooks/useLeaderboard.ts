import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LeaderboardEntry, Profile } from '@/types/app'

interface RawLeaderboardSnapshot {
  user_id: string
  total_points: number
  exact_scores_count: number
  correct_outcomes_count: number
  submissions_count: number
  today_points: number
  rank: number | null
  snapshot_at: string
  profile:
    | Pick<Profile, 'displayName' | 'flagCode' | 'avatarUrl'>
    | {
        display_name: string
        flag_code: string
        avatar_url: string | null
      }
    | null
}

function mapEntry(raw: RawLeaderboardSnapshot): LeaderboardEntry {
  const profile = raw.profile as {
    display_name: string
    flag_code: string
    avatar_url: string | null
  } | null
  return {
    userId: raw.user_id,
    profile: {
      displayName: profile?.display_name ?? 'Unknown',
      flagCode: profile?.flag_code ?? '',
      avatarUrl: profile?.avatar_url ?? null,
    },
    totalPoints: raw.total_points,
    exactScoresCount: raw.exact_scores_count,
    correctOutcomesCount: raw.correct_outcomes_count,
    submissionsCount: raw.submissions_count,
    todayPoints: raw.today_points,
    rank: raw.rank,
    snapshotAt: raw.snapshot_at,
  }
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data, error } = await supabase
        .from('leaderboard_snapshots')
        .select('*, profile:profiles(display_name, flag_code, avatar_url)')
        .order('total_points', { ascending: false })
        .order('exact_scores_count', { ascending: false })
        .order('correct_outcomes_count', { ascending: false })

      if (error) throw error
      return (data as RawLeaderboardSnapshot[]).map(mapEntry)
    },
  })
}
