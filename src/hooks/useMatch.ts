import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Match, MatchStatus, MatchStage, Team } from '@/types/app'

interface RawMatch {
  id: string
  match_number: number
  stage: MatchStage
  group_name?: string
  home_team_id: string
  away_team_id: string
  team_a_placeholder?: string
  team_b_placeholder?: string
  scheduled_at: string
  venue: string
  city: string
  status: MatchStatus
  full_time_score_a?: number
  full_time_score_b?: number
  went_to_penalties?: boolean
  penalty_score_a?: number
  penalty_score_b?: number
  winner_team_id?: string
  minute?: number
  home_team: Team
  away_team: Team
  group?: { name: string } | null
}

function toKuwaitDisplayString(utcIso: string): string {
  // Kuwait Time note: UTC+3, no DST
  return new Date(utcIso).toLocaleString('en-KW', {
    timeZone: 'Asia/Kuwait',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function mapMatch(raw: RawMatch): Match {
  return {
    id: raw.id,
    matchNumber: raw.match_number,
    stage: raw.stage,
    groupName: raw.group_name,
    teamA: raw.home_team,
    teamB: raw.away_team,
    teamAPlaceholder: raw.team_a_placeholder,
    teamBPlaceholder: raw.team_b_placeholder,
    kickoffUtc: raw.scheduled_at,
    kickoffKuwait: toKuwaitDisplayString(raw.scheduled_at),
    venue: raw.venue,
    city: raw.city,
    status: raw.status,
    fullTimeScoreA: raw.full_time_score_a,
    fullTimeScoreB: raw.full_time_score_b,
    wentToPenalties: raw.went_to_penalties,
    penaltyScoreA: raw.penalty_score_a,
    penaltyScoreB: raw.penalty_score_b,
    winnerTeamId: raw.winner_team_id,
    minute: raw.minute,
  }
}

export function useMatch(id: string | undefined) {
  return useQuery({
    queryKey: ['match', id],
    enabled: !!id,
    queryFn: async (): Promise<Match> => {
      const { data, error } = await supabase
        .from('matches')
        .select(
          '*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), group:groups(*)',
        )
        .eq('id', id!)
        .single()

      if (error) throw error
      return mapMatch(data as RawMatch)
    },
  })
}
