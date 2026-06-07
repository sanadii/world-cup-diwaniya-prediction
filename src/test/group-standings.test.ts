import { describe, it, expect } from 'vitest'
import type { GroupStanding } from '@/types/app'

function makeStanding(overrides: Partial<GroupStanding> & { teamId: string }): GroupStanding {
  const base: GroupStanding = {
    teamId: overrides.teamId,
    team: {
      id: overrides.teamId,
      name: overrides.teamId,
      shortName: overrides.teamId,
      flagCode: 'xx',
    },
    groupLetter: 'A',
    played: 3,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }
  return { ...base, ...overrides }
}

function sortStandings(standings: GroupStanding[]): GroupStanding[] {
  return [...standings].sort(
    (a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor,
  )
}

describe('sortStandings', () => {
  it('higher points ranks first', () => {
    const standings = [
      makeStanding({ teamId: 'B', points: 3 }),
      makeStanding({ teamId: 'A', points: 6 }),
    ]
    const sorted = sortStandings(standings)
    expect(sorted[0].teamId).toBe('A')
    expect(sorted[1].teamId).toBe('B')
  })

  it('equal points: better GD ranks first', () => {
    const standings = [
      makeStanding({ teamId: 'B', points: 4, goalDifference: 0 }),
      makeStanding({ teamId: 'A', points: 4, goalDifference: 3 }),
    ]
    const sorted = sortStandings(standings)
    expect(sorted[0].teamId).toBe('A')
  })

  it('equal points + GD: more goals for ranks first', () => {
    const standings = [
      makeStanding({ teamId: 'B', points: 4, goalDifference: 1, goalsFor: 1 }),
      makeStanding({ teamId: 'A', points: 4, goalDifference: 1, goalsFor: 4 }),
    ]
    const sorted = sortStandings(standings)
    expect(sorted[0].teamId).toBe('A')
  })

  it('all equal: order preserved (stable sort)', () => {
    const standings = [
      makeStanding({ teamId: 'A', points: 4, goalDifference: 1, goalsFor: 2 }),
      makeStanding({ teamId: 'B', points: 4, goalDifference: 1, goalsFor: 2 }),
    ]
    const sorted = sortStandings(standings)
    expect(sorted[0].teamId).toBe('A')
    expect(sorted[1].teamId).toBe('B')
  })

  it('single team: returns correctly', () => {
    const standings = [makeStanding({ teamId: 'A', points: 9 })]
    const sorted = sortStandings(standings)
    expect(sorted).toHaveLength(1)
    expect(sorted[0].teamId).toBe('A')
  })

  it('empty array: returns empty', () => {
    expect(sortStandings([])).toEqual([])
  })

  it('full group of 4 teams: correct 1-4 ranking', () => {
    const standings = [
      makeStanding({ teamId: 'D', points: 0, goalDifference: -5, goalsFor: 0 }),
      makeStanding({ teamId: 'B', points: 6, goalDifference: 2, goalsFor: 3 }),
      makeStanding({ teamId: 'A', points: 9, goalDifference: 7, goalsFor: 9 }),
      makeStanding({ teamId: 'C', points: 3, goalDifference: -1, goalsFor: 2 }),
    ]
    const sorted = sortStandings(standings)
    expect(sorted.map((s) => s.teamId)).toEqual(['A', 'B', 'C', 'D'])
  })

  it('team with negative GD sorts below positive GD at equal points', () => {
    const standings = [
      makeStanding({ teamId: 'B', points: 4, goalDifference: -2, goalsFor: 1 }),
      makeStanding({ teamId: 'A', points: 4, goalDifference: 2, goalsFor: 3 }),
    ]
    const sorted = sortStandings(standings)
    expect(sorted[0].teamId).toBe('A')
    expect(sorted[1].teamId).toBe('B')
  })
})
