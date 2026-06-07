import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface PredictionInput {
  matchId: string
  predHome: number
  predAway: number
  predWinnerTeamId?: string
  predPenalties?: boolean
  predHomePenalty?: number
  predAwayPenalty?: number
}

export function useSavePrediction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PredictionInput): Promise<void> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('predictions').upsert(
        {
          user_id: user.id,
          match_id: input.matchId,
          pred_score_a: input.predHome,
          pred_score_b: input.predAway,
          pred_winner_team_id: input.predWinnerTeamId ?? null,
          pred_penalties: input.predPenalties ?? null,
          pred_penalty_a: input.predHomePenalty ?? null,
          pred_penalty_b: input.predAwayPenalty ?? null,
          is_submitted: true,
          last_updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,match_id' },
      )

      if (error) throw error
    },
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: ['predictions'] })
      void queryClient.invalidateQueries({ queryKey: ['my-prediction', input.matchId] })
    },
  })
}
