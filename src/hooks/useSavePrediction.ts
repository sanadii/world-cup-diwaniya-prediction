import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface PredictionInput {
  matchId: string
  predictedScoreA: number
  predictedScoreB: number
  predictedOutcome?: string | null
  predictedWinnerTeamId?: string | null
  predictsPenalties?: boolean
  predictedPenaltyScoreA?: number | null
  predictedPenaltyScoreB?: number | null
}

export function useSavePrediction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PredictionInput): Promise<void> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const now = new Date().toISOString()

      // Check if this is a first-time submission (first_submitted_at not yet set)
      const { data: existing } = await supabase
        .from('predictions')
        .select('first_submitted_at')
        .eq('user_id', user.id)
        .eq('match_id', input.matchId)
        .maybeSingle()

      const firstSubmittedAt = existing?.first_submitted_at ?? now

      const { error } = await supabase.from('predictions').upsert(
        {
          user_id: user.id,
          match_id: input.matchId,
          predicted_score_a: input.predictedScoreA,
          predicted_score_b: input.predictedScoreB,
          predicted_outcome: input.predictedOutcome ?? null,
          predicted_winner_team_id: input.predictedWinnerTeamId ?? null,
          predicts_penalties: input.predictsPenalties ?? false,
          predicted_penalty_score_a: input.predictedPenaltyScoreA ?? null,
          predicted_penalty_score_b: input.predictedPenaltyScoreB ?? null,
          first_submitted_at: firstSubmittedAt,
          last_updated_at: now,
        },
        { onConflict: 'user_id,match_id' },
      )

      if (error) throw error
    },
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: ['predictions'] })
      void queryClient.invalidateQueries({ queryKey: ['my-prediction', input.matchId] })
      void queryClient.invalidateQueries({ queryKey: ['my-predictions'] })
    },
  })
}
