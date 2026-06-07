/**
 * Tests for src/lib/scoring.ts — exported utilities
 */
import { describe, it, expect } from 'vitest'
import { calculatePoints, DEFAULT_POINTS, STAGE_BONUS } from '@/lib/scoring'

// ── Export value tests ──

describe('DEFAULT_POINTS exports', () => {
  it('exports DEFAULT_POINTS with correct values', () => {
    expect(DEFAULT_POINTS).toBeDefined()
    expect(DEFAULT_POINTS.validSubmission).toBe(1)
    expect(DEFAULT_POINTS.lockedAtKickoff).toBe(1)
    expect(DEFAULT_POINTS.correctWinnerOrOutcome).toBe(2)
    expect(DEFAULT_POINTS.exactFullTimeScore).toBe(2)
    expect(DEFAULT_POINTS.correctlyPredictedPenalties).toBe(1)
    expect(DEFAULT_POINTS.exactPenaltyScore).toBe(1)
  })

  it('exports STAGE_BONUS with correct values', () => {
    expect(STAGE_BONUS).toBeDefined()
    expect(STAGE_BONUS.group).toBe(0)
    expect(STAGE_BONUS.round_of_32).toBe(1)
    expect(STAGE_BONUS.round_of_16).toBe(1)
    expect(STAGE_BONUS.quarterfinal).toBe(2)
    expect(STAGE_BONUS.semifinal).toBe(3)
    expect(STAGE_BONUS.third_place).toBe(2)
    expect(STAGE_BONUS.final).toBe(5)
  })

  it('exports calculatePoints as a function', () => {
    expect(typeof calculatePoints).toBe('function')
  })
})

// ── Group stage tests ──

describe('Group stage scoring', () => {
  it('exact score returns submitted(1)+locked(1)+outcome(2)+exact(2) = 6', () => {
    expect(
      calculatePoints({
        stage: 'group',
        actualScoreA: 1,
        actualScoreB: 0,
        actualWinnerTeamId: 'teamA',
        predScoreA: 1,
        predScoreB: 0,
        isSubmitted: true,
        isLocked: true,
      }),
    ).toBe(6)
  })

  it('correct winner but wrong score returns 4', () => {
    expect(
      calculatePoints({
        stage: 'group',
        actualScoreA: 2,
        actualScoreB: 0,
        actualWinnerTeamId: 'teamA',
        predScoreA: 1,
        predScoreB: 0,
        isSubmitted: true,
        isLocked: true,
      }),
    ).toBe(4)
  })

  it('wrong outcome returns 2 (only submission + lock points)', () => {
    expect(
      calculatePoints({
        stage: 'group',
        actualScoreA: 2,
        actualScoreB: 0,
        actualWinnerTeamId: 'teamA',
        predScoreA: 0,
        predScoreB: 1,
        isSubmitted: true,
        isLocked: true,
      }),
    ).toBe(2)
  })

  it('draw predicted and actual draw = correct outcome', () => {
    expect(
      calculatePoints({
        stage: 'group',
        actualScoreA: 1,
        actualScoreB: 1,
        actualWinnerTeamId: '',
        predScoreA: 0,
        predScoreB: 0,
        isSubmitted: true,
        isLocked: true,
      }),
    ).toBe(4) // 1+1+2+0 (no exact)
  })

  it('group stage bonus is always 0', () => {
    expect(STAGE_BONUS['group']).toBe(0)
  })
})

// ── Knockout stage tests ──

describe('Knockout scoring — without penalties', () => {
  it('round_of_16: correct winner + exact score = 7 points', () => {
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
    ).toBe(7) // 1+1+2+1(bonus)+2(exact)
  })

  it('quarterfinal: correct winner + exact score = 8 points', () => {
    expect(
      calculatePoints({
        stage: 'quarterfinal',
        actualScoreA: 1,
        actualScoreB: 0,
        actualWinnerTeamId: 'spain',
        predScoreA: 1,
        predScoreB: 0,
        predWinnerTeamId: 'spain',
        isSubmitted: true,
        isLocked: true,
      }),
    ).toBe(8) // 1+1+2+2(bonus)+2(exact)
  })

  it('wrong winner in knockout gives no winner/bonus points', () => {
    expect(
      calculatePoints({
        stage: 'round_of_16',
        actualScoreA: 2,
        actualScoreB: 0,
        actualWinnerTeamId: 'france',
        predScoreA: 2,
        predScoreB: 0,
        predWinnerTeamId: 'germany',
        isSubmitted: true,
        isLocked: true,
      }),
    ).toBe(4) // 1+1+2(exact) no winner, no bonus
  })
})

describe('Knockout scoring — with penalties', () => {
  it('final with exact score + correct winner + exact penalties = 13 points', () => {
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
    ).toBe(13) // 1+1+2+5(bonus)+2(exact)+1(pen predicted)+1(pen exact)
  })

  it('final: predicted penalties, wrong penalty score = 12 points', () => {
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
    ).toBe(12) // 1+1+2+5+2+1 (no exact penalty)
  })

  it('no penalty bonus when predPenalties is false even if game went to penalties', () => {
    const pts = calculatePoints({
      stage: 'semifinal',
      actualScoreA: 1,
      actualScoreB: 1,
      wentToPenalties: true,
      actualPenaltyA: 5,
      actualPenaltyB: 4,
      actualWinnerTeamId: 'brazil',
      predScoreA: 1,
      predScoreB: 1,
      predWinnerTeamId: 'brazil',
      predPenalties: false,
      isSubmitted: true,
      isLocked: true,
    })
    // 1+1+2+3(semifinal bonus)+2(exact) = 9, no penalty points
    expect(pts).toBe(9)
  })
})

// ── Stage bonus tests ──

describe('Stage bonus application', () => {
  const stages: Array<[string, number]> = [
    ['group', 0],
    ['round_of_32', 1],
    ['round_of_16', 1],
    ['quarterfinal', 2],
    ['semifinal', 3],
    ['third_place', 2],
    ['final', 5],
  ]

  it.each(stages)('%s stage bonus is %i', (stage, bonus) => {
    // submitted+locked = 2, correct winner = 2, bonus = N
    const pts = calculatePoints({
      stage,
      actualScoreA: 2,
      actualScoreB: 0,
      actualWinnerTeamId: 'teamX',
      predScoreA: 1,
      predScoreB: 0,
      predWinnerTeamId: 'teamX',
      isSubmitted: true,
      isLocked: true,
    })
    const expected =
      stage === 'group'
        ? 2 + 2 + bonus // submitted+locked+outcome+bonus (pred wins since teamA>teamB)
        : 2 + 2 + bonus // submitted+locked+outcome+bonus (no exact)
    expect(pts).toBe(expected)
  })
})

// ── Edge cases ──

describe('Edge cases', () => {
  it('isSubmitted=false gives 0 participation points (but other points still count)', () => {
    const pts = calculatePoints({
      stage: 'group',
      actualScoreA: 1,
      actualScoreB: 0,
      actualWinnerTeamId: 'brazil',
      predScoreA: 1,
      predScoreB: 0,
      isSubmitted: false,
      isLocked: false,
    })
    // No submission (0) + no lock (0) + correct outcome (2) + exact (2) = 4
    expect(pts).toBe(4)
  })

  it('isSubmitted=true isLocked=false gives 1 base point', () => {
    const pts = calculatePoints({
      stage: 'group',
      actualScoreA: 3,
      actualScoreB: 0,
      actualWinnerTeamId: 'brazil',
      predScoreA: 0,
      predScoreB: 1,
      isSubmitted: true,
      isLocked: false,
    })
    expect(pts).toBe(1) // only validSubmission
  })

  it('unknown stage has no bonus (defaults to 0 via ??)', () => {
    const pts = calculatePoints({
      stage: 'unknown_stage',
      actualScoreA: 2,
      actualScoreB: 0,
      actualWinnerTeamId: 'teamX',
      predScoreA: 1,
      predScoreB: 0,
      predWinnerTeamId: 'teamX',
      isSubmitted: true,
      isLocked: true,
    })
    // 1+1+2+0(no bonus)+0(no exact) = 4
    expect(pts).toBe(4)
  })
})
