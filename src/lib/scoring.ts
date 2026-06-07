/**
 * Scoring logic for World Cup Diwaniya Prediction app
 * Based on spec sections 11 & 12
 */

export const DEFAULT_POINTS = {
  validSubmission: 1,
  lockedAtKickoff: 1,
  correctWinnerOrOutcome: 2,
  exactFullTimeScore: 2,
  correctlyPredictedPenalties: 1,
  exactPenaltyScore: 1,
}

export const STAGE_BONUS: Record<string, number> = {
  group: 0,
  round_of_32: 1,
  round_of_16: 1,
  quarterfinal: 2,
  semifinal: 3,
  third_place: 2,
  final: 5,
}

export interface ScoringInput {
  stage: string
  actualScoreA: number
  actualScoreB: number
  wentToPenalties?: boolean
  actualPenaltyA?: number
  actualPenaltyB?: number
  actualWinnerTeamId: string
  predScoreA: number
  predScoreB: number
  predWinnerTeamId?: string
  predPenalties?: boolean
  predPenaltyA?: number
  predPenaltyB?: number
  isSubmitted: boolean
  isLocked: boolean
}

export function calculatePoints(input: ScoringInput): number {
  let pts = 0

  if (input.isSubmitted) pts += DEFAULT_POINTS.validSubmission
  if (input.isLocked) pts += DEFAULT_POINTS.lockedAtKickoff

  // Correct outcome / winner
  const actualOutcome =
    input.actualScoreA > input.actualScoreB
      ? 'team_a'
      : input.actualScoreA < input.actualScoreB
        ? 'team_b'
        : 'draw'

  if (input.stage === 'group') {
    const predOutcome =
      input.predScoreA > input.predScoreB
        ? 'team_a'
        : input.predScoreA < input.predScoreB
          ? 'team_b'
          : 'draw'
    if (predOutcome === actualOutcome) {
      pts += DEFAULT_POINTS.correctWinnerOrOutcome
      pts += STAGE_BONUS[input.stage] ?? 0
    }
  } else {
    if (input.predWinnerTeamId === input.actualWinnerTeamId) {
      pts += DEFAULT_POINTS.correctWinnerOrOutcome
      pts += STAGE_BONUS[input.stage] ?? 0
    }
  }

  // Exact full-time score
  if (input.predScoreA === input.actualScoreA && input.predScoreB === input.actualScoreB) {
    pts += DEFAULT_POINTS.exactFullTimeScore
  }

  // Penalties (knockout only)
  if (input.stage !== 'group' && input.wentToPenalties && input.predPenalties) {
    pts += DEFAULT_POINTS.correctlyPredictedPenalties
    if (
      input.predPenaltyA === input.actualPenaltyA &&
      input.predPenaltyB === input.actualPenaltyB
    ) {
      pts += DEFAULT_POINTS.exactPenaltyScore
    }
  }

  return pts
}
