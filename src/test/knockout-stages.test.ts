import { describe, it, expect } from 'vitest'
import { getStageName } from '@/lib/utils'
import type { MatchStage } from '@/types/app'

const KNOCKOUT_STAGES: MatchStage[] = [
  'round_of_32',
  'round_of_16',
  'quarterfinal',
  'semifinal',
  'third_place',
  'final',
]

function isKnockoutStage(stage: MatchStage): boolean {
  return stage !== 'group'
}

const stageOrder: MatchStage[] = [
  'group',
  'round_of_32',
  'round_of_16',
  'quarterfinal',
  'semifinal',
  'third_place',
  'final',
]

describe('getStageName', () => {
  it('returns correct string for group', () => {
    expect(getStageName('group')).toBe('Group Stage')
  })
  it('returns correct string for round_of_32', () => {
    expect(getStageName('round_of_32')).toBe('Round of 32')
  })
  it('returns correct string for round_of_16', () => {
    expect(getStageName('round_of_16')).toBe('Round of 16')
  })
  it('returns correct string for quarterfinal', () => {
    expect(getStageName('quarterfinal')).toBe('Quarterfinal')
  })
  it('returns correct string for semifinal', () => {
    expect(getStageName('semifinal')).toBe('Semifinal')
  })
  it('returns correct string for third_place', () => {
    expect(getStageName('third_place')).toBe('Third Place')
  })
  it('returns correct string for final', () => {
    expect(getStageName('final')).toBe('Final')
  })
})

describe('KNOCKOUT_STAGES', () => {
  it('contains all stages except group', () => {
    expect(KNOCKOUT_STAGES).not.toContain('group')
    expect(KNOCKOUT_STAGES).toContain('round_of_32')
    expect(KNOCKOUT_STAGES).toContain('round_of_16')
    expect(KNOCKOUT_STAGES).toContain('quarterfinal')
    expect(KNOCKOUT_STAGES).toContain('semifinal')
    expect(KNOCKOUT_STAGES).toContain('third_place')
    expect(KNOCKOUT_STAGES).toContain('final')
  })

  it('has 6 stages', () => {
    expect(KNOCKOUT_STAGES).toHaveLength(6)
  })
})

describe('isKnockoutStage', () => {
  it('returns false for group', () => {
    expect(isKnockoutStage('group')).toBe(false)
  })

  it('returns true for round_of_32', () => {
    expect(isKnockoutStage('round_of_32')).toBe(true)
  })

  it('returns true for all knockout stages', () => {
    for (const stage of KNOCKOUT_STAGES) {
      expect(isKnockoutStage(stage)).toBe(true)
    }
  })
})

describe('stage ordering', () => {
  it('round_of_32 comes before round_of_16', () => {
    expect(stageOrder.indexOf('round_of_32')).toBeLessThan(stageOrder.indexOf('round_of_16'))
  })

  it('round_of_16 comes before quarterfinal', () => {
    expect(stageOrder.indexOf('round_of_16')).toBeLessThan(stageOrder.indexOf('quarterfinal'))
  })

  it('quarterfinal comes before semifinal', () => {
    expect(stageOrder.indexOf('quarterfinal')).toBeLessThan(stageOrder.indexOf('semifinal'))
  })

  it('semifinal comes before final', () => {
    expect(stageOrder.indexOf('semifinal')).toBeLessThan(stageOrder.indexOf('final'))
  })

  it('stages can be sorted by round progression', () => {
    const mixed: MatchStage[] = ['final', 'round_of_16', 'group', 'quarterfinal', 'semifinal']
    const sorted = [...mixed].sort((a, b) => stageOrder.indexOf(a) - stageOrder.indexOf(b))
    expect(sorted).toEqual(['group', 'round_of_16', 'quarterfinal', 'semifinal', 'final'])
  })
})
