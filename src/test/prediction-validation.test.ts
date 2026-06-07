/**
 * Pure logic tests for prediction validation
 */
import { describe, it, expect } from 'vitest'

interface PredictionInput {
  predHome: number
  predAway: number
  stage: string
  predWinnerId?: string
  predPenalties?: boolean
  predHomePenalty?: number
  predAwayPenalty?: number
}

function validatePrediction(input: PredictionInput): { valid: boolean; error?: string } {
  if (input.predHome < 0 || input.predHome > 20) {
    return { valid: false, error: 'Home score must be between 0 and 20' }
  }
  if (input.predAway < 0 || input.predAway > 20) {
    return { valid: false, error: 'Away score must be between 0 and 20' }
  }

  // Knockout stages require a winner selection
  if (input.stage !== 'group' && !input.predWinnerId) {
    return { valid: false, error: 'Knockout stage requires a winner selection' }
  }

  // If penalties are checked, penalty scores must be provided
  if (input.predPenalties) {
    if (input.predHomePenalty === undefined || input.predHomePenalty === null) {
      return { valid: false, error: 'Penalty home score is required when penalties are selected' }
    }
    if (input.predAwayPenalty === undefined || input.predAwayPenalty === null) {
      return { valid: false, error: 'Penalty away score is required when penalties are selected' }
    }
  }

  return { valid: true }
}

describe('validatePrediction — valid cases', () => {
  it('valid group stage prediction with scores 0-20', () => {
    expect(validatePrediction({ predHome: 2, predAway: 1, stage: 'group' })).toEqual({
      valid: true,
    })
  })

  it('valid group prediction with 0-0', () => {
    expect(validatePrediction({ predHome: 0, predAway: 0, stage: 'group' })).toEqual({
      valid: true,
    })
  })

  it('valid group prediction with max scores (20-20)', () => {
    expect(validatePrediction({ predHome: 20, predAway: 20, stage: 'group' })).toEqual({
      valid: true,
    })
  })

  it('valid knockout prediction with winner selected', () => {
    expect(
      validatePrediction({
        predHome: 1,
        predAway: 0,
        stage: 'round_of_16',
        predWinnerId: 'teamA',
      }),
    ).toEqual({ valid: true })
  })

  it('valid knockout prediction with penalties filled', () => {
    expect(
      validatePrediction({
        predHome: 1,
        predAway: 1,
        stage: 'final',
        predWinnerId: 'teamA',
        predPenalties: true,
        predHomePenalty: 4,
        predAwayPenalty: 3,
      }),
    ).toEqual({ valid: true })
  })
})

describe('validatePrediction — invalid cases', () => {
  it('home score > 20 is rejected', () => {
    const result = validatePrediction({ predHome: 21, predAway: 0, stage: 'group' })
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('away score > 20 is rejected', () => {
    const result = validatePrediction({ predHome: 0, predAway: 99, stage: 'group' })
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('negative home score is rejected', () => {
    const result = validatePrediction({ predHome: -1, predAway: 0, stage: 'group' })
    expect(result.valid).toBe(false)
  })

  it('negative away score is rejected', () => {
    const result = validatePrediction({ predHome: 0, predAway: -1, stage: 'group' })
    expect(result.valid).toBe(false)
  })

  it('knockout stage without winner is invalid', () => {
    const result = validatePrediction({
      predHome: 1,
      predAway: 0,
      stage: 'round_of_16',
      // no predWinnerId
    })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/winner/i)
  })

  it('semifinal without winner is invalid', () => {
    const result = validatePrediction({ predHome: 2, predAway: 1, stage: 'semifinal' })
    expect(result.valid).toBe(false)
  })

  it('final without winner is invalid', () => {
    const result = validatePrediction({ predHome: 1, predAway: 0, stage: 'final' })
    expect(result.valid).toBe(false)
  })

  it('penalties checked but no home penalty score is invalid', () => {
    const result = validatePrediction({
      predHome: 1,
      predAway: 1,
      stage: 'final',
      predWinnerId: 'teamA',
      predPenalties: true,
      // predHomePenalty missing
      predAwayPenalty: 3,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/penalty/i)
  })

  it('penalties checked but no away penalty score is invalid', () => {
    const result = validatePrediction({
      predHome: 1,
      predAway: 1,
      stage: 'final',
      predWinnerId: 'teamA',
      predPenalties: true,
      predHomePenalty: 4,
      // predAwayPenalty missing
    })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/penalty/i)
  })

  it('penalties checked but both penalty scores missing is invalid', () => {
    const result = validatePrediction({
      predHome: 1,
      predAway: 1,
      stage: 'quarterfinal',
      predWinnerId: 'teamA',
      predPenalties: true,
    })
    expect(result.valid).toBe(false)
  })
})
