import { describe, it, expect } from 'vitest'
import { calculatePoints, STAGE_BONUS } from '@/lib/scoring'
import type { ScoringInput } from '@/lib/scoring'

function base(overrides: Partial<ScoringInput>): ScoringInput {
  return {
    stage: 'group',
    actualScoreA: 1,
    actualScoreB: 0,
    wentToPenalties: false,
    actualWinnerTeamId: 'team_a',
    predScoreA: 1,
    predScoreB: 0,
    predWinnerTeamId: 'team_a',
    predPenalties: false,
    isSubmitted: true,
    isLocked: true,
    ...overrides,
  }
}

describe('STAGE_BONUS values', () => {
  it('round_of_32 bonus = 1', () => {
    expect(STAGE_BONUS['round_of_32']).toBe(1)
  })

  it('third_place bonus = 2', () => {
    expect(STAGE_BONUS['third_place']).toBe(2)
  })

  it('semifinal bonus = 3', () => {
    expect(STAGE_BONUS['semifinal']).toBe(3)
  })

  it('quarterfinal bonus = 2', () => {
    expect(STAGE_BONUS['quarterfinal']).toBe(2)
  })
})

describe('calculatePoints edge cases', () => {
  it('exact score with group draw correctly handled', () => {
    // Draw: actualScore 1-1, pred 1-1. Submitted+locked(2) + correct outcome(2) + exact score(2) = 6
    const pts = calculatePoints(
      base({
        stage: 'group',
        actualScoreA: 1,
        actualScoreB: 1,
        predScoreA: 1,
        predScoreB: 1,
        actualWinnerTeamId: '',
      }),
    )
    expect(pts).toBe(6)
  })

  it('submitted but not locked = only validSubmission points (1 pt)', () => {
    const pts = calculatePoints(
      base({
        stage: 'group',
        isSubmitted: true,
        isLocked: false,
        actualScoreA: 2,
        actualScoreB: 0,
        predScoreA: 0,
        predScoreB: 1,
        actualWinnerTeamId: 'team_a',
        predWinnerTeamId: 'team_b',
      }),
    )
    expect(pts).toBe(1)
  })

  it('locked but not submitted = only lockedAtKickoff points (1 pt)', () => {
    const pts = calculatePoints(
      base({
        stage: 'group',
        isSubmitted: false,
        isLocked: true,
        actualScoreA: 2,
        actualScoreB: 0,
        predScoreA: 0,
        predScoreB: 1,
        actualWinnerTeamId: 'team_a',
        predWinnerTeamId: 'team_b',
      }),
    )
    expect(pts).toBe(1)
  })

  it('both submitted AND locked = 2 pts base before other bonuses', () => {
    // submitted+locked with wrong prediction = 2 base
    const pts = calculatePoints(
      base({
        stage: 'group',
        isSubmitted: true,
        isLocked: true,
        actualScoreA: 2,
        actualScoreB: 0,
        predScoreA: 0,
        predScoreB: 2,
        actualWinnerTeamId: 'team_a',
        predWinnerTeamId: 'team_b',
      }),
    )
    expect(pts).toBe(2)
  })

  it('penalties predicted but match did not go to penalties = no penalty points', () => {
    const pts = calculatePoints(
      base({
        stage: 'round_of_16',
        actualScoreA: 2,
        actualScoreB: 1,
        wentToPenalties: false,
        predScoreA: 2,
        predScoreB: 1,
        predPenalties: true,
        predPenaltyA: 4,
        predPenaltyB: 3,
        actualWinnerTeamId: 'team_a',
        predWinnerTeamId: 'team_a',
      }),
    )
    // submitted(1) + locked(1) + correct winner(2) + round_of_16 bonus(1) + exact score(2) = 7
    expect(pts).toBe(7)
  })

  it('match went to penalties but user did not predict penalties = no penalty points', () => {
    const pts = calculatePoints(
      base({
        stage: 'round_of_16',
        actualScoreA: 1,
        actualScoreB: 1,
        wentToPenalties: true,
        actualPenaltyA: 4,
        actualPenaltyB: 3,
        predScoreA: 1,
        predScoreB: 1,
        predPenalties: false,
        actualWinnerTeamId: 'team_a',
        predWinnerTeamId: 'team_a',
      }),
    )
    // submitted(1) + locked(1) + correct winner(2) + round_of_16 bonus(1) + exact score(2) = 7, no penalty pts
    expect(pts).toBe(7)
  })
})
