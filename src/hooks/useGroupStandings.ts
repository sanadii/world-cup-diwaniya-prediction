import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { GroupStanding, GroupData } from '@/types/app'

export type { GroupStanding, GroupData }

interface RawTeam {
  id: string
  name: string
  short_name: string
  country_code: string | null
  flag_url: string | null
  group_name: string | null
  primary_color: string | null
  secondary_color: string | null
}

interface RawMatch {
  team_a_id: string | null
  team_b_id: string | null
  full_time_score_a: number | null
  full_time_score_b: number | null
}

export function useGroupStandings() {
  return useQuery({
    queryKey: ['group-standings'],
    staleTime: 60_000,
    queryFn: async (): Promise<GroupData[]> => {
      const { data: teams, error: teamErr } = await supabase
        .from('teams')
        .select(
          'id, name, short_name, country_code, flag_url, group_name, primary_color, secondary_color',
        )
        .not('group_name', 'is', null)
        .order('group_name')

      if (teamErr) throw teamErr

      const { data: matches, error: matchErr } = await supabase
        .from('matches')
        .select('team_a_id, team_b_id, full_time_score_a, full_time_score_b')
        .eq('stage', 'group')
        .in('status', ['scored', 'finished'])

      if (matchErr) throw matchErr

      type Stats = {
        played: number
        won: number
        drawn: number
        lost: number
        gf: number
        ga: number
        pts: number
      }
      const statsMap = new Map<string, Stats>()
      const init = (id: string) => {
        if (!statsMap.has(id))
          statsMap.set(id, { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 })
      }

      for (const m of (matches ?? []) as RawMatch[]) {
        if (
          !m.team_a_id ||
          !m.team_b_id ||
          m.full_time_score_a === null ||
          m.full_time_score_b === null
        )
          continue
        init(m.team_a_id)
        init(m.team_b_id)
        const a = statsMap.get(m.team_a_id)!
        const b = statsMap.get(m.team_b_id)!
        const sa = m.full_time_score_a
        const sb = m.full_time_score_b
        a.played++
        b.played++
        a.gf += sa
        a.ga += sb
        b.gf += sb
        b.ga += sa
        if (sa > sb) {
          a.won++
          a.pts += 3
          b.lost++
        } else if (sb > sa) {
          b.won++
          b.pts += 3
          a.lost++
        } else {
          a.drawn++
          a.pts++
          b.drawn++
          b.pts++
        }
      }

      const groupMap = new Map<string, GroupData>()
      for (const t of (teams ?? []) as RawTeam[]) {
        const letter = t.group_name!
        const s = statsMap.get(t.id) ?? {
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          gf: 0,
          ga: 0,
          pts: 0,
        }
        const standing: GroupStanding = {
          teamId: t.id,
          team: {
            id: t.id,
            name: t.name,
            shortName: t.short_name,
            fifaCode: null,
            countryCode: t.country_code,
            flagUrl: t.flag_url,
            groupName: letter,
            primaryColor: t.primary_color,
            secondaryColor: t.secondary_color,
          },
          groupLetter: letter,
          played: s.played,
          won: s.won,
          drawn: s.drawn,
          lost: s.lost,
          goalsFor: s.gf,
          goalsAgainst: s.ga,
          goalDifference: s.gf - s.ga,
          points: s.pts,
        }
        if (!groupMap.has(letter))
          groupMap.set(letter, { letter, name: `Group ${letter}`, standings: [] })
        groupMap.get(letter)!.standings.push(standing)
      }

      for (const g of groupMap.values()) {
        g.standings.sort(
          (a, b) =>
            b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor,
        )
      }

      return Array.from(groupMap.values()).sort((a, b) => a.letter.localeCompare(b.letter))
    },
  })
}
