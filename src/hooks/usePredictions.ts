import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Prediction } from '@/types/app'

interface RawPredictionScore {
  total_points: number | null
  is_exact_score: boolean | null
  is_correct_outcome: boolean | null
  breakdown: Record<string, number> | null
}

interface RawPrediction {
  id: string
  user_id: string
  match_id: string
  predicted_score_a: number
  predicted_score_b: number
  predicted_outcome: string | null
  predicted_winner_team_id: string | null
  predicts_penalties: boolean
  predicted_penalty_score_a: number | null
  predicted_penalty_score_b: number | null
  first_submitted_at: string | null
  last_updated_at: string | null
  locked_at: string | null
  is_locked: boolean
  is_valid: boolean
  created_at: string
  updated_at: string
  prediction_scores: RawPredictionScore[] | null
}

function mapPrediction(raw: RawPrediction): Prediction {
  const score = raw.prediction_scores?.[0] ?? null
  return {
    id: raw.id,
    userId: raw.user_id,
    matchId: raw.match_id,
    predictedScoreA: raw.predicted_score_a,
    predictedScoreB: raw.predicted_score_b,
    predictedOutcome: raw.predicted_outcome,
    predictedWinnerTeamId: raw.predicted_winner_team_id,
    predictsPenalties: raw.predicts_penalties ?? false,
    predictedPenaltyScoreA: raw.predicted_penalty_score_a,
    predictedPenaltyScoreB: raw.predicted_penalty_score_b,
    firstSubmittedAt: raw.first_submitted_at,
    lastUpdatedAt: raw.last_updated_at,
    lockedAt: raw.locked_at,
    isLocked: raw.is_locked ?? false,
    isValid: raw.is_valid ?? true,
    isSubmitted: raw.first_submitted_at !== null,
    totalPoints: score?.total_points ?? undefined,
    isExactScore: score?.is_exact_score ?? undefined,
    isCorrectOutcome: score?.is_correct_outcome ?? undefined,
    breakdown: score?.breakdown ?? undefined,
  }
}

export function usePredictions(matchId?: string) {
  return useQuery({
    queryKey: ['predictions', matchId],
    queryFn: async (): Promise<Prediction[]> => {
      let query = supabase
        .from('predictions')
        .select('*, prediction_scores(total_points, is_exact_score, is_correct_outcome, breakdown)')

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
        .select('*, prediction_scores(total_points, is_exact_score, is_correct_outcome, breakdown)')
        .eq('match_id', matchId!)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      if (!data) return null
      return mapPrediction(data as RawPrediction)
    },
  })
}
