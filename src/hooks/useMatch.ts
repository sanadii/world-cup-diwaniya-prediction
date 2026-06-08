import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Match, MatchStatus, MatchStage, Team } from '@/types/app'

interface RawMatch {
  id: string
  match_number: number | null
  stage: MatchStage
  group_name: string | null
  team_a_id: string
  team_b_id: string
  team_a_placeholder: string | null
  team_b_placeholder: string | null
  kickoff_at_utc: string
  venue: string | null
  city: string | null
  country: string | null
  status: MatchStatus
  full_time_score_a: number | null
  full_time_score_b: number | null
  went_to_penalties: boolean
  penalty_score_a: number | null
  penalty_score_b: number | null
  winner_team_id: string | null
  external_match_id: string | null
  last_synced_at: string | null
  created_at: string
  updated_at: string
  team_a: Team | null
  team_b: Team | null
}

function mapMatch(raw: RawMatch): Match {
  return {
    id: raw.id,
    matchNumber: raw.match_number,
    stage: raw.stage,
    groupName: raw.group_name,
    teamA: raw.team_a,
    teamB: raw.team_b,
    teamAPlaceholder: raw.team_a_placeholder,
    teamBPlaceholder: raw.team_b_placeholder,
    kickoffUtc: raw.kickoff_at_utc,
    venue: raw.venue,
    city: raw.city,
    country: raw.country,
    status: raw.status,
    fullTimeScoreA: raw.full_time_score_a,
    fullTimeScoreB: raw.full_time_score_b,
    wentToPenalties: raw.went_to_penalties ?? false,
    penaltyScoreA: raw.penalty_score_a,
    penaltyScoreB: raw.penalty_score_b,
    winnerTeamId: raw.winner_team_id,
    externalMatchId: raw.external_match_id,
    lastSyncedAt: raw.last_synced_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export function useMatch(id: string | undefined) {
  return useQuery({
    queryKey: ['match', id],
    enabled: !!id,
    queryFn: async (): Promise<Match> => {
      const { data, error } = await supabase
        .from('matches')
        .select('*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)')
        .eq('id', id!)
        .single()

      if (error) throw error
      return mapMatch(data as RawMatch)
    },
  })
}
