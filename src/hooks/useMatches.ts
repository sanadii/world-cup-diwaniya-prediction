import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MatchStatus, MatchStage, Match, Team } from '@/types/app'

export interface MatchFilters {
  status?: MatchStatus | MatchStatus[]
  stage?: MatchStage
  date?: string // YYYY-MM-DD in Kuwait time (UTC+3) // Kuwait Time note
  tournamentId?: string
}

// Shape returned by the DB join before mapping
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

export function useMatches(filters?: MatchFilters) {
  return useQuery({
    queryKey: ['matches', filters],
    queryFn: async (): Promise<Match[]> => {
      let query = supabase
        .from('matches')
        .select(
          '*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), group:groups(*)',
        )
        .order('scheduled_at', { ascending: true })

      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status)
        } else {
          query = query.eq('status', filters.status)
        }
      }

      if (filters?.stage) {
        query = query.eq('stage', filters.stage)
      }

      if (filters?.tournamentId) {
        query = query.eq('tournament_id', filters.tournamentId)
      }

      if (filters?.date) {
        // Kuwait Time note: filter by date in Kuwait timezone (UTC+3)
        // Convert YYYY-MM-DD Kuwait date to UTC range
        const kuwaitDate = new Date(`${filters.date}T00:00:00+03:00`)
        const nextDay = new Date(kuwaitDate.getTime() + 24 * 60 * 60 * 1000)
        query = query
          .gte('scheduled_at', kuwaitDate.toISOString())
          .lt('scheduled_at', nextDay.toISOString())
      }

      const { data, error } = await query

      if (error) throw error
      return (data as RawMatch[]).map(mapMatch)
    },
  })
}
