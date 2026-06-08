import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Match, MatchStage, MatchStatus, Team } from '@/types/app'

const KNOCKOUT_STAGES: MatchStage[] = [
  'round_of_32',
  'round_of_16',
  'quarterfinal',
  'semifinal',
  'third_place',
  'final',
]

interface RawKnockoutMatch {
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

function mapKnockoutMatch(raw: RawKnockoutMatch): Match {
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

export interface KnockoutMatchesResult {
  byStage: Partial<Record<MatchStage, Match[]>>
  allMatches: Match[]
}

export function useKnockoutMatches() {
  return useQuery({
    queryKey: ['knockout-matches'],
    queryFn: async (): Promise<KnockoutMatchesResult> => {
      const { data, error } = await supabase
        .from('matches')
        .select('*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)')
        .in('stage', KNOCKOUT_STAGES)
        .order('kickoff_at_utc', { ascending: true })

      if (error) throw error

      const allMatches = (data as RawKnockoutMatch[]).map(mapKnockoutMatch)

      const byStage: Partial<Record<MatchStage, Match[]>> = {}
      for (const match of allMatches) {
        if (!byStage[match.stage]) {
          byStage[match.stage] = []
        }
        byStage[match.stage]!.push(match)
      }

      return { byStage, allMatches }
    },
  })
}
