/**
 * Scoring logic tests — based on spec examples (sections 12 & 11)
 */
import { describe, it, expect } from 'vitest'

// Scoring config defaults
const DEFAULT_POINTS = {
  validSubmission: 1,
  lockedAtKickoff: 1,
  correctWinnerOrOutcome: 2,
  exactFullTimeScore: 2,
  correctlyPredictedPenalties: 1,
  exactPenaltyScore: 1,
}

const STAGE_BONUS: Record<string, number> = {
  group: 0,
  round_of_32: 1,
  round_of_16: 1,
  quarterfinal: 2,
  semifinal: 3,
  third_place: 2,
  final: 5,
}

interface ScoreInput {
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

function calculatePoints(input: ScoreInput): number {
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

// ── Tests matching spec examples ──

describe('Group Stage scoring', () => {
  it('Example 1: exact score = 6 points', () => {
    expect(
      calculatePoints({
        stage: 'group',
        actualScoreA: 2,
        actualScoreB: 1,
        actualWinnerTeamId: 'brazil',
        predScoreA: 2,
        predScoreB: 1,
        isSubmitted: true,
        isLocked: true,
      }),
    ).toBe(6)
  })

  it('Example 2: correct winner only = 4 points', () => {
    expect(
      calculatePoints({
        stage: 'group',
        actualScoreA: 2,
        actualScoreB: 1,
        actualWinnerTeamId: 'brazil',
        predScoreA: 3,
        predScoreB: 1,
        isSubmitted: true,
        isLocked: true,
      }),
    ).toBe(4)
  })

  it('Wrong outcome = 2 points (submitted + locked only)', () => {
    expect(
      calculatePoints({
        stage: 'group',
        actualScoreA: 2,
        actualScoreB: 1,
        actualWinnerTeamId: 'brazil',
        predScoreA: 0,
        predScoreB: 1,
        isSubmitted: true,
        isLocked: true,
      }),
    ).toBe(2)
  })
})

describe('Knockout scoring', () => {
  it('Example 3: Final with penalties, exact everything = 13 points', () => {
    expect(
      calculatePoints({
        stage: 'final',
        actualScoreA: 1,
        actualScoreB: 1,
        wentToPenalties: true,
        actualPenaltyA: 4,
        actualPenaltyB: 3,
        actualWinnerTeamId: 'argentina',
        predScoreA: 1,
        predScoreB: 1,
        predWinnerTeamId: 'argentina',
        predPenalties: true,
        predPenaltyA: 4,
        predPenaltyB: 3,
        isSubmitted: true,
        isLocked: true,
      }),
    ).toBe(13)
  })

  it('Example 4: Final with penalties, wrong penalty score = 12 points', () => {
    expect(
      calculatePoints({
        stage: 'final',
        actualScoreA: 1,
        actualScoreB: 1,
        wentToPenalties: true,
        actualPenaltyA: 4,
        actualPenaltyB: 3,
        actualWinnerTeamId: 'argentina',
        predScoreA: 1,
        predScoreB: 1,
        predWinnerTeamId: 'argentina',
        predPenalties: true,
        predPenaltyA: 5,
        predPenaltyB: 4,
        isSubmitted: true,
        isLocked: true,
      }),
    ).toBe(12)
  })

  it('Round of 16: correct winner, no penalties = 7 points', () => {
    expect(
      calculatePoints({
        stage: 'round_of_16',
        actualScoreA: 2,
        actualScoreB: 0,
        actualWinnerTeamId: 'france',
        predScoreA: 2,
        predScoreB: 0,
        predWinnerTeamId: 'france',
        isSubmitted: true,
        isLocked: true,
      }),
    ).toBe(7)
  })
})

describe('Edge cases', () => {
  it('Not submitted = 0 points base', () => {
    expect(
      calculatePoints({
        stage: 'group',
        actualScoreA: 1,
        actualScoreB: 0,
        actualWinnerTeamId: 'brazil',
        predScoreA: 1,
        predScoreB: 0,
        isSubmitted: false,
        isLocked: false,
      }),
    ).toBe(4) // correct outcome + exact score, no participation points
  })
})
