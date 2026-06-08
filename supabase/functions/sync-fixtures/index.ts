import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ESPN unofficial public API — no key needed, free, covers WC2026
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const COUNTRY_CODES: Record<string, string> = {
  'Argentina': 'ar', 'Mexico': 'mx', 'United States': 'us',
  'Brazil': 'br', 'France': 'fr', 'England': 'gb-eng', 'Spain': 'es',
  'Germany': 'de', 'Portugal': 'pt', 'Netherlands': 'nl', 'Belgium': 'be',
  'Japan': 'jp', 'Korea Republic': 'kr', 'South Korea': 'kr', 'Australia': 'au',
  'Morocco': 'ma', 'Senegal': 'sn', 'Canada': 'ca', 'Switzerland': 'ch',
  'Croatia': 'hr', 'Uruguay': 'uy', 'Ecuador': 'ec', 'Colombia': 'co',
  'Norway': 'no', 'Turkey': 'tr', 'Turkiye': 'tr', 'Saudi Arabia': 'sa',
  'Iran': 'ir', 'South Africa': 'za', 'Egypt': 'eg', 'New Zealand': 'nz',
  'Ghana': 'gh', 'Panama': 'pa', 'DR Congo': 'cd', 'Congo DR': 'cd',
  "Ivory Coast": 'ci', "Cote d'Ivoire": 'ci', "Côte d'Ivoire": 'ci',
  'Scotland': 'gb-sct', 'Haiti': 'ht', 'Qatar': 'qa',
  'Bosnia and Herzegovina': 'ba', 'Bosnia': 'ba',
  'Czechia': 'cz', 'Czech Republic': 'cz',
  'Curaçao': 'cw', 'Curacao': 'cw',
  'Tunisia': 'tn', 'Sweden': 'se', 'Algeria': 'dz',
  'Austria': 'at', 'Jordan': 'jo', 'Uzbekistan': 'uz', 'Iraq': 'iq',
  'Cape Verde': 'cv', 'Paraguay': 'py', 'Chile': 'cl',
  'Wales': 'gb-wls', 'Ireland': 'ie', 'Costa Rica': 'cr',
  'Honduras': 'hn', 'El Salvador': 'sv', 'Jamaica': 'jm',
  'Venezuela': 've', 'Bolivia': 'bo', 'Peru': 'pe',
  'Cameroon': 'cm', 'Nigeria': 'ng', 'Mali': 'ml',
  'Albania': 'al', 'Serbia': 'rs', 'Slovakia': 'sk', 'Slovenia': 'si',
  'Romania': 'ro', 'Hungary': 'hu', 'Greece': 'gr', 'Ukraine': 'ua',
  'Poland': 'pl', 'Denmark': 'dk', 'Finland': 'fi', 'Iceland': 'is',
  'Georgia': 'ge',
}

function mapStatus(espnStatus: string, date: string): string {
  const ms = new Date(date).getTime() - Date.now()
  const hr = 36e5
  switch (espnStatus) {
    case 'STATUS_SCHEDULED':
    case 'STATUS_TIMED': return ms > hr ? 'open' : 'locked'
    case 'STATUS_IN_PROGRESS':
    case 'STATUS_HALFTIME': return 'live'
    case 'STATUS_FINAL':
    case 'STATUS_FULL_TIME': return 'finished'
    case 'STATUS_POSTPONED': return 'postponed'
    case 'STATUS_CANCELLED': return 'cancelled'
    default: return 'scheduled'
  }
}

function mapStage(slug: string): string {
  const s = (slug ?? '').toLowerCase().replace(/-/g, '_')
  if (s.includes('group')) return 'group'
  if (s.includes('32') || s.includes('last_32')) return 'round_of_32'
  if (s.includes('16') || s.includes('last_16')) return 'round_of_16'
  if (s.includes('quarter')) return 'quarterfinal'
  if (s.includes('semi')) return 'semifinal'
  if (s.includes('third') || s.includes('place')) return 'third_place'
  if (s.includes('final')) return 'final'
  return 'group'
}

// Generate weekly date ranges: 20260611-20260617, etc.
function getWeeklyRanges(startDate: string, endDate: string): string[] {
  const ranges: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  const cur = new Date(start)
  while (cur <= end) {
    const from = cur.toISOString().slice(0, 10).replace(/-/g, '')
    const next = new Date(cur)
    next.setDate(next.getDate() + 6)
    const to = (next <= end ? next : end).toISOString().slice(0, 10).replace(/-/g, '')
    ranges.push(`${from}-${to}`)
    cur.setDate(cur.getDate() + 7)
  }
  return ranges
}

interface EspnTeam { id: string; displayName: string; shortDisplayName: string; abbreviation: string; logo: string }
interface EspnCompetitor { homeAway: string; score: string; winner?: boolean; team: EspnTeam }
interface EspnEvent {
  id: string
  date: string
  status: { type: { name: string; completed: boolean } }
  season: { year: number; slug: string }
  competitions: {
    venue?: { fullName: string; address?: { city?: string } }
    competitors: EspnCompetitor[]
    notes?: { type: string; headline: string }[]
  }[]
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const errors: string[] = []
  let teams_synced = 0, matches_synced = 0, scores_updated = 0
  let step = 'start'

  try {
    // Determine if initial sync (no ESPN matches yet) or live update
    step = 'check_existing'
    const { count } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .eq('external_provider', 'espn')
    const isInitial = (count ?? 0) === 0
    console.log(`[sync] isInitial=${isInitial}, existing ESPN matches=${count}`)

    // Fetch group info from standings
    step = 'fetch_standings'
    const teamGroupMap = new Map<string, string>() // ESPN team id -> group letter
    try {
      const sRes = await fetch(`${ESPN}/standings`)
      if (sRes.ok) {
        const sJson = await sRes.json() as { groups?: { name: string; standings?: { entries?: { team: { id: string } }[] } }[] }
        for (const group of sJson.groups ?? []) {
          const m = (group.name ?? '').match(/Group\s+([A-L])/i)
          const letter = m ? m[1].toUpperCase() : null
          if (letter) {
            for (const entry of group.standings?.entries ?? []) {
              teamGroupMap.set(entry.team.id, letter)
            }
          }
        }
        console.log(`[sync] Group map: ${teamGroupMap.size} teams`)
      }
    } catch (e) { errors.push(`Standings (non-fatal): ${e}`) }

    // Fetch all events
    step = 'fetch_events'
    const allEvents: EspnEvent[] = []

    if (isInitial) {
      // Full sync: fetch all tournament weeks
      const weeks = getWeeklyRanges('2026-06-11', '2026-07-19')
      console.log(`[sync] Initial sync, fetching ${weeks.length} weeks`)
      for (const range of weeks) {
        try {
          const r = await fetch(`${ESPN}/scoreboard?dates=${range}&limit=100`)
          if (r.ok) {
            const j = await r.json() as { events?: EspnEvent[] }
            allEvents.push(...(j.events ?? []))
            console.log(`[sync] Week ${range}: ${j.events?.length ?? 0} events`)
          }
        } catch (e) { errors.push(`Week ${range}: ${e}`) }
      }
    } else {
      // Live update: only today + tomorrow for score updates
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')
      const range = `${fmt(today)}-${fmt(tomorrow)}`
      const r = await fetch(`${ESPN}/scoreboard?dates=${range}&limit=50`)
      if (r.ok) {
        const j = await r.json() as { events?: EspnEvent[] }
        allEvents.push(...(j.events ?? []))
      }
    }

    console.log(`[sync] Total events: ${allEvents.length}`)
    if (!allEvents.length && isInitial) {
      return Response.json(
        { success: false, step, warning: 'ESPN returned 0 events. Tournament may not be in the system yet.' },
        { status: 200, headers: CORS }
      )
    }

    // De-duplicate by event id
    const eventsMap = new Map<string, EspnEvent>()
    for (const e of allEvents) eventsMap.set(e.id, e)
    const events = Array.from(eventsMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Collect unique teams
    step = 'upsert_teams'
    const teamMap = new Map<string, EspnTeam>()
    for (const ev of events) {
      for (const comp of ev.competitions ?? []) {
        for (const c of comp.competitors ?? []) {
          if (c.team?.id) teamMap.set(c.team.id, c.team)
        }
      }
    }

    const teamsToUpsert = Array.from(teamMap.entries()).map(([espnId, t]) => {
      const code = COUNTRY_CODES[t.displayName] ?? COUNTRY_CODES[t.shortDisplayName] ?? null
      return {
        name: t.displayName,
        short_name: t.abbreviation ?? t.displayName.substring(0, 3).toUpperCase(),
        country_code: code,
        flag_url: code ? `https://flagcdn.com/w80/${code}.png` : (t.logo ?? null),
        group_name: teamGroupMap.get(espnId) ?? null,
        fifa_code: espnId,
      }
    })

    if (teamsToUpsert.length > 0) {
      const { error: tErr } = await supabase.from('teams').upsert(teamsToUpsert, { onConflict: 'name' })
      if (tErr) errors.push(`Teams: ${tErr.message}`)
      else teams_synced = teamsToUpsert.length
    }

    // Build name->id map
    step = 'fetch_team_ids'
    const { data: dbTeams } = await supabase.from('teams').select('id, name')
    const nameToId = new Map<string, string>()
    for (const t of dbTeams ?? []) nameToId.set(t.name, t.id)

    // Delete old placeholder matches on initial sync
    if (isInitial) {
      const { error: dErr } = await supabase.from('matches').delete().is('external_provider', null)
      if (dErr) errors.push(`Delete placeholders: ${dErr.message}`)
    }

    // Build match rows
    step = 'upsert_matches'
    const matchRows = events.map((ev, i) => {
      const comp = ev.competitions?.[0]
      const home = comp?.competitors?.find(c => c.homeAway === 'home')
      const away = comp?.competitors?.find(c => c.homeAway === 'away')
      const homeScore = home?.score ? parseInt(home.score, 10) : null
      const awayScore = away?.score ? parseInt(away.score, 10) : null
      const hasScore = ev.status.type.completed && homeScore !== null && awayScore !== null
      const status = mapStatus(ev.status.type.name, ev.date)
      if (['live', 'finished'].includes(status)) scores_updated++

      // Try to get group from notes
      let groupLetter: string | null = null
      for (const note of comp?.notes ?? []) {
        const m = (note.headline ?? '').match(/Group\s+([A-L])/i)
        if (m) { groupLetter = m[1].toUpperCase(); break }
      }
      // Fallback: from standings map
      if (!groupLetter && home?.team?.id) groupLetter = teamGroupMap.get(home.team.id) ?? null

      return {
        external_provider: 'espn',
        external_match_id: ev.id,
        match_number: i + 1,
        stage: mapStage(ev.season?.slug ?? 'group-stage'),
        group_name: groupLetter,
        team_a_id: home?.team ? (nameToId.get(home.team.displayName) ?? null) : null,
        team_b_id: away?.team ? (nameToId.get(away.team.displayName) ?? null) : null,
        team_a_placeholder: home?.team && !nameToId.has(home.team.displayName) ? home.team.displayName : null,
        team_b_placeholder: away?.team && !nameToId.has(away.team.displayName) ? away.team.displayName : null,
        kickoff_at_utc: ev.date,
        venue: comp?.venue?.fullName ?? null,
        city: comp?.venue?.address?.city ?? null,
        status,
        full_time_score_a: hasScore ? homeScore : null,
        full_time_score_b: hasScore ? awayScore : null,
        went_to_penalties: false,
        penalty_score_a: null,
        penalty_score_b: null,
        last_synced_at: new Date().toISOString(),
      }
    })

    const CHUNK = 50
    for (let i = 0; i < matchRows.length; i += CHUNK) {
      const { error: e } = await supabase
        .from('matches')
        .upsert(matchRows.slice(i, i + CHUNK), { onConflict: 'external_match_id' })
      if (e) errors.push(`Batch ${Math.floor(i / CHUNK)}: ${e.message}`)
      else matches_synced += Math.min(CHUNK, matchRows.length - i)
    }

    const result = { success: errors.length === 0, teams_synced, matches_synced, scores_updated, is_initial: isInitial, errors, synced_at: new Date().toISOString() }
    console.log('[sync] Done:', result)
    return Response.json(result, { status: 200, headers: CORS })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[sync] Fatal at ${step}:`, msg)
    return Response.json(
      { success: false, step, fatal_error: msg, teams_synced, matches_synced, errors },
      { status: 200, headers: CORS }
    )
  }
})
