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
}

function toKuwaitDisplayString(utcIso: string): string {
  return new Date(utcIso).toLocaleString('en-KW', {
    timeZone: 'Asia/Kuwait',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function mapKnockoutMatch(raw: RawKnockoutMatch): Match {
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

export interface KnockoutMatchesResult {
  byStage: Partial<Record<MatchStage, Match[]>>
  allMatches: Match[]
}

export function useKnockoutMatches(tournamentId?: string) {
  return useQuery({
    queryKey: ['knockout-matches', tournamentId],
    queryFn: async (): Promise<KnockoutMatchesResult> => {
      let query = supabase
        .from('matches')
        .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)')
        .in('stage', KNOCKOUT_STAGES)
        .order('scheduled_at', { ascending: true })

      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId)
      }

      const { data, error } = await query
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
