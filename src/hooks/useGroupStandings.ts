import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { GroupStanding, GroupData } from '@/types/app'

export type { GroupStanding, GroupData }

interface RawGroupTeam {
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  points: number
  team: {
    id: string
    name: string
    short_name: string
    flag_code: string
  }
  group: {
    id: string
    letter: string
    name: string
    tournament_id: string
  }
}

export function useGroupStandings(tournamentId?: string) {
  return useQuery({
    queryKey: ['group-standings', tournamentId],
    queryFn: async (): Promise<GroupData[]> => {
      let query = supabase
        .from('group_teams')
        .select(
          `
          played, won, drawn, lost, goals_for, goals_against, points,
          team:teams(id, name, short_name, flag_code),
          group:groups(id, letter, name, tournament_id)
        `,
        )
        .order('points', { ascending: false })

      if (tournamentId) {
        query = query.eq('group.tournament_id', tournamentId)
      }

      const { data, error } = await query
      if (error) throw error

      // Group by letter
      const groupMap = new Map<string, GroupData>()

      for (const raw of data as unknown as RawGroupTeam[]) {
        if (!raw.group) continue

        const { letter, name } = raw.group
        const standing: GroupStanding = {
          teamId: raw.team.id,
          team: {
            id: raw.team.id,
            name: raw.team.name,
            shortName: raw.team.short_name,
            flagCode: raw.team.flag_code,
          },
          groupLetter: letter,
          played: raw.played,
          won: raw.won,
          drawn: raw.drawn,
          lost: raw.lost,
          goalsFor: raw.goals_for,
          goalsAgainst: raw.goals_against,
          goalDifference: raw.goals_for - raw.goals_against,
          points: raw.points,
        }

        if (!groupMap.has(letter)) {
          groupMap.set(letter, { letter, name, standings: [] })
        }
        groupMap.get(letter)!.standings.push(standing)
      }

      // Sort each group's standings: points desc, goalDifference desc, goalsFor desc
      for (const group of groupMap.values()) {
        group.standings.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
          return b.goalsFor - a.goalsFor
        })
      }

      // Return groups sorted by letter A-L
      return Array.from(groupMap.values()).sort((a, b) => a.letter.localeCompare(b.letter))
    },
  })
}
