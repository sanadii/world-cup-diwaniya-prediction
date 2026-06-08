import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface PredictionStats {
  matchId: string
  totalPredictions: number
  homeWinPct: number
  drawPct: number
  awayWinPct: number
  avgPredictedScoreA: number
  avgPredictedScoreB: number
  exactScoreDistribution: Array<{ score: string; count: number; pct: number }>
}

export function usePredictionStats(matchId: string, enabled = false) {
  return useQuery({
    queryKey: ['prediction-stats', matchId],
    enabled: enabled && !!matchId,
    queryFn: async (): Promise<PredictionStats> => {
      const { data, error } = await supabase
        .from('predictions')
        .select('predicted_score_a, predicted_score_b, predicted_outcome, predicted_winner_team_id')
        .eq('match_id', matchId)
        .not('first_submitted_at', 'is', null)

      if (error) throw error
      if (!data || data.length === 0) {
        return {
          matchId,
          totalPredictions: 0,
          homeWinPct: 0,
          drawPct: 0,
          awayWinPct: 0,
          avgPredictedScoreA: 0,
          avgPredictedScoreB: 0,
          exactScoreDistribution: [],
        }
      }

      const total = data.length
      const outcomes = data.reduce(
        (acc, p) => {
          const outcome =
            p.predicted_outcome ??
            (p.predicted_score_a > p.predicted_score_b
              ? 'home'
              : p.predicted_score_a < p.predicted_score_b
                ? 'away'
                : 'draw')
          acc[outcome] = (acc[outcome] ?? 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const avgA = data.reduce((s, p) => s + (p.predicted_score_a ?? 0), 0) / total
      const avgB = data.reduce((s, p) => s + (p.predicted_score_b ?? 0), 0) / total

      // Top score combos
      const scoreCounts = data.reduce(
        (acc, p) => {
          const key = `${p.predicted_score_a}-${p.predicted_score_b}`
          acc[key] = (acc[key] ?? 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const dist = Object.entries(scoreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([score, count]) => ({ score, count, pct: Math.round((count / total) * 100) }))

      return {
        matchId,
        totalPredictions: total,
        homeWinPct: Math.round(((outcomes['home'] ?? 0) / total) * 100),
        drawPct: Math.round(((outcomes['draw'] ?? 0) / total) * 100),
        awayWinPct: Math.round(((outcomes['away'] ?? 0) / total) * 100),
        avgPredictedScoreA: Math.round(avgA * 10) / 10,
        avgPredictedScoreB: Math.round(avgB * 10) / 10,
        exactScoreDistribution: dist,
      }
    },
    staleTime: 60_000,
  })
}
