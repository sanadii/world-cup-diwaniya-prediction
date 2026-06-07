import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Prediction, PredictionStatus } from '@/types/app'

interface RawPrediction {
  id: string
  user_id: string
  match_id: string
  pred_score_a: number
  pred_score_b: number
  pred_outcome?: 'team_a' | 'draw' | 'team_b'
  pred_winner_team_id?: string
  pred_penalties?: boolean
  pred_penalty_a?: number
  pred_penalty_b?: number
  last_updated_at: string
  is_locked: boolean
  status: PredictionStatus
  points?: number
}

function mapPrediction(raw: RawPrediction): Prediction {
  return {
    id: raw.id,
    userId: raw.user_id,
    matchId: raw.match_id,
    predictedScoreA: raw.pred_score_a,
    predictedScoreB: raw.pred_score_b,
    predictedOutcome: raw.pred_outcome,
    predictedWinnerTeamId: raw.pred_winner_team_id,
    predictspenalties: raw.pred_penalties,
    predictedPenaltyScoreA: raw.pred_penalty_a,
    predictedPenaltyScoreB: raw.pred_penalty_b,
    lastUpdatedAt: raw.last_updated_at,
    isLocked: raw.is_locked,
    status: raw.status,
    points: raw.points,
  }
}

export function usePredictions(matchId?: string) {
  return useQuery({
    queryKey: ['predictions', matchId],
    queryFn: async (): Promise<Prediction[]> => {
      let query = supabase.from('predictions').select('*')

      if (matchId) {
        query = query.eq('match_id', matchId)
      }

      const { data, error } = await query

      if (error) throw error
      return (data as RawPrediction[]).map(mapPrediction)
    },
  })
}

export function useMyPrediction(matchId: string | undefined) {
  return useQuery({
    queryKey: ['my-prediction', matchId],
    enabled: !!matchId,
    queryFn: async (): Promise<Prediction | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('match_id', matchId!)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      if (!data) return null
      return mapPrediction(data as RawPrediction)
    },
  })
}
