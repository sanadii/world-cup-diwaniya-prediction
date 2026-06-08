import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MatchStatus, MatchStage, Match, Team } from '@/types/app'

export interface MatchFilters {
  status?: MatchStatus | MatchStatus[]
  stage?: MatchStage
  date?: string // YYYY-MM-DD in Kuwait time (UTC+3)
}

// Shape returned by the DB join before mapping
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

export function useMatches(filters?: MatchFilters) {
  return useQuery({
    queryKey: ['matches', filters],
    queryFn: async (): Promise<Match[]> => {
      let query = supabase
        .from('matches')
        .select('*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)')
        .order('kickoff_at_utc', { ascending: true })

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

      if (filters?.date) {
        // Kuwait Time note: filter by date in Kuwait timezone (UTC+3)
        const kuwaitDate = new Date(`${filters.date}T00:00:00+03:00`)
        const nextDay = new Date(kuwaitDate.getTime() + 24 * 60 * 60 * 1000)
        query = query
          .gte('kickoff_at_utc', kuwaitDate.toISOString())
          .lt('kickoff_at_utc', nextDay.toISOString())
      }

      const { data, error } = await query

      if (error) throw error
      return (data as RawMatch[]).map(mapMatch)
    },
  })
}
