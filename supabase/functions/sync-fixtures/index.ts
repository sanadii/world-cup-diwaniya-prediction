import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LEAGUE_ID = 1
const SEASON = 2026
const API_BASE = 'https://api-football-v1.p.rapidapi.com/v3'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const COUNTRY_CODES: Record<string, string> = {
  'Argentina': 'ar', 'Mexico': 'mx', 'United States': 'us', 'USA': 'us',
  'Brazil': 'br', 'France': 'fr', 'England': 'gb-eng', 'Spain': 'es',
  'Germany': 'de', 'Portugal': 'pt', 'Netherlands': 'nl', 'Belgium': 'be',
  'Japan': 'jp', 'Korea Republic': 'kr', 'South Korea': 'kr', 'Australia': 'au',
  'Morocco': 'ma', 'Senegal': 'sn', 'Canada': 'ca', 'Switzerland': 'ch',
  'Croatia': 'hr', 'Uruguay': 'uy', 'Ecuador': 'ec', 'Colombia': 'co',
  'Norway': 'no', 'Turkey': 'tr', 'Turkiye': 'tr', 'Saudi Arabia': 'sa',
  'Iran': 'ir', 'South Africa': 'za', 'Egypt': 'eg', 'New Zealand': 'nz',
  'Ghana': 'gh', 'Panama': 'pa', 'Congo DR': 'cd', 'DR Congo': 'cd',
  "Ivory Coast": 'ci', "Cote d'Ivoire": 'ci', "Côte d'Ivoire": 'ci',
  'Scotland': 'gb-sct', 'Haiti': 'ht', 'Qatar': 'qa',
  'Bosnia': 'ba', 'Bosnia and Herzegovina': 'ba',
  'Czech Republic': 'cz', 'Czechia': 'cz',
  'Curacao': 'cw', 'Curaçao': 'cw',
  'Tunisia': 'tn', 'Sweden': 'se', 'Algeria': 'dz',
  'Austria': 'at', 'Jordan': 'jo', 'Uzbekistan': 'uz', 'Iraq': 'iq',
  'Cape Verde': 'cv', 'Paraguay': 'py',
  'Wales': 'gb-wls', 'Ireland': 'ie', 'Costa Rica': 'cr',
  'Honduras': 'hn', 'El Salvador': 'sv', 'Jamaica': 'jm',
  'Chile': 'cl', 'Venezuela': 've', 'Bolivia': 'bo', 'Peru': 'pe',
  'Cameroon': 'cm', 'Nigeria': 'ng', 'Mali': 'ml',
  'Albania': 'al', 'Serbia': 'rs', 'Slovakia': 'sk', 'Slovenia': 'si',
  'Romania': 'ro', 'Hungary': 'hu', 'Greece': 'gr', 'Ukraine': 'ua',
  'Poland': 'pl', 'Denmark': 'dk', 'Finland': 'fi', 'Iceland': 'is',
  'Georgia': 'ge',
}

function mapStatus(short: string, date: string): string {
  const msToKickoff = new Date(date).getTime() - Date.now()
  const oneHour = 36e5
  if (short === 'NS') {
    if (!date || date.startsWith('0000')) return 'scheduled'
    return msToKickoff > oneHour ? 'open' : 'locked'
  }
  if (short === 'TBD') return 'scheduled'
  if (['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(short)) return 'live'
  if (['FT', 'AET', 'PEN'].includes(short)) return 'finished'
  if (short === 'PST') return 'postponed'
  if (['CANC', 'ABD', 'AWD', 'WO'].includes(short)) return 'cancelled'
  return 'scheduled'
}

function mapStage(round: string): string {
  const r = round.toLowerCase()
  if (r.includes('group')) return 'group'
  if (r.includes('32')) return 'round_of_32'
  if (r.includes('16')) return 'round_of_16'
  if (r.includes('quarter')) return 'quarterfinal'
  if (r.includes('semi')) return 'semifinal'
  if (r.includes('3rd') || r.includes('third') || r.includes('place')) return 'third_place'
  if (r.includes('final')) return 'final'
  return 'group'
}

function mapGroup(group: string | null | undefined): string | null {
  if (!group) return null
  const m = group.match(/Group\s+([A-L])/i)
  return m ? m[1].toUpperCase() : null
}

interface ApiTeam { id: number; name: string; logo: string }
interface ApiFixture {
  fixture: {
    id: number
    date: string
    venue: { name: string; city: string } | null
    status: { short: string; elapsed: number | null }
  }
  league: { round: string; group: string | null }
  teams: { home: ApiTeam; away: ApiTeam }
  goals: { home: number | null; away: number | null }
  score: { penalty: { home: number | null; away: number | null } | null }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  const rapidApiKey = Deno.env.get('RAPID_API_KEY')
  if (!rapidApiKey) {
    return Response.json(
      { success: false, error: 'RAPID_API_KEY secret not set. Add it in Supabase Dashboard → Edge Functions → Secrets.' },
      { status: 500, headers: CORS_HEADERS }
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const apiHeaders = {
    'X-RapidAPI-Key': rapidApiKey,
    'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
  }

  const errors: string[] = []
  let teams_synced = 0
  let matches_synced = 0
  let scores_updated = 0

  try {
    // 1. Fetch all fixtures
    console.log(`[sync-fixtures] Fetching league=${LEAGUE_ID} season=${SEASON}`)
    const fixturesRes = await fetch(
      `${API_BASE}/fixtures?league=${LEAGUE_ID}&season=${SEASON}`,
      { headers: apiHeaders }
    )
    if (!fixturesRes.ok) throw new Error(`Fixtures API ${fixturesRes.status}: ${await fixturesRes.text()}`)
    const fixturesJson = await fixturesRes.json() as { response: ApiFixture[]; errors: unknown }
    const fixtures = fixturesJson.response ?? []
    if (!fixtures.length) {
      return Response.json(
        { success: false, warning: 'No fixtures returned — season may not be published yet.' },
        { headers: CORS_HEADERS }
      )
    }
    console.log(`[sync-fixtures] ${fixtures.length} fixtures received`)

    // 2. Fetch standings for group info (best-effort)
    const teamGroupMap = new Map<number, string>()
    try {
      const standRes = await fetch(
        `${API_BASE}/standings?league=${LEAGUE_ID}&season=${SEASON}`,
        { headers: apiHeaders }
      )
      const standJson = await standRes.json() as {
        response: { league: { standings: { team: { id: number }; group: string }[][] } }[]
      }
      const groups = standJson.response?.[0]?.league?.standings
      if (groups) {
        for (const group of groups) {
          for (const entry of group) {
            const letter = mapGroup(entry.group)
            if (letter) teamGroupMap.set(entry.team.id, letter)
          }
        }
      }
      console.log(`[sync-fixtures] Group map: ${teamGroupMap.size} teams`)
    } catch (e) {
      errors.push(`Standings (non-fatal): ${e}`)
    }

    // 3. Collect unique teams from fixtures
    const apiTeams = new Map<number, ApiTeam>()
    for (const f of fixtures) {
      apiTeams.set(f.teams.home.id, f.teams.home)
      apiTeams.set(f.teams.away.id, f.teams.away)
    }

    // 4. Upsert teams
    const teamsToUpsert = Array.from(apiTeams.entries()).map(([apiId, t]) => {
      const code = COUNTRY_CODES[t.name] ?? null
      return {
        name: t.name,
        short_name: t.name.substring(0, 3).toUpperCase(),
        country_code: code,
        flag_url: code ? `https://flagcdn.com/w80/${code}.png` : t.logo,
        group_name: teamGroupMap.get(apiId) ?? null,
        fifa_code: String(apiId),
      }
    })
    const { error: teamsErr } = await supabase
      .from('teams')
      .upsert(teamsToUpsert, { onConflict: 'name' })
    if (teamsErr) errors.push(`Teams: ${teamsErr.message}`)
    else teams_synced = teamsToUpsert.length

    // 5. Build name→id map
    const { data: dbTeams } = await supabase.from('teams').select('id, name')
    const teamNameToId = new Map<string, string>()
    for (const t of dbTeams ?? []) teamNameToId.set(t.name, t.id)

    // 6. Delete old placeholder matches (seeded without external_provider)
    await supabase.from('matches').delete().is('external_provider', null)

    // 7. Sort by date and build match rows
    const sorted = [...fixtures].sort(
      (a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
    )
    const matchRows = sorted.map((f, i) => {
      const isPen = f.fixture.status.short === 'PEN'
      const status = mapStatus(f.fixture.status.short, f.fixture.date)
      if (['live', 'finished'].includes(status)) scores_updated++
      return {
        external_provider: 'api-football',
        external_match_id: String(f.fixture.id),
        match_number: i + 1,
        stage: mapStage(f.league.round),
        group_name: mapGroup(f.league.group),
        team_a_id: teamNameToId.get(f.teams.home.name) ?? null,
        team_b_id: teamNameToId.get(f.teams.away.name) ?? null,
        team_a_placeholder: teamNameToId.has(f.teams.home.name) ? null : f.teams.home.name,
        team_b_placeholder: teamNameToId.has(f.teams.away.name) ? null : f.teams.away.name,
        kickoff_at_utc: f.fixture.date,
        venue: f.fixture.venue?.name ?? null,
        city: f.fixture.venue?.city ?? null,
        status,
        full_time_score_a: f.goals.home,
        full_time_score_b: f.goals.away,
        went_to_penalties: isPen,
        penalty_score_a: isPen ? (f.score.penalty?.home ?? null) : null,
        penalty_score_b: isPen ? (f.score.penalty?.away ?? null) : null,
        last_synced_at: new Date().toISOString(),
      }
    })

    // 8. Upsert in batches of 50
    const CHUNK = 50
    for (let i = 0; i < matchRows.length; i += CHUNK) {
      const { error: matchErr } = await supabase
        .from('matches')
        .upsert(matchRows.slice(i, i + CHUNK), { onConflict: 'external_match_id' })
      if (matchErr) errors.push(`Matches batch ${Math.floor(i / CHUNK)}: ${matchErr.message}`)
      else matches_synced += Math.min(CHUNK, matchRows.length - i)
    }

    const result = {
      success: errors.length === 0,
      teams_synced,
      matches_synced,
      scores_updated,
      errors,
      synced_at: new Date().toISOString(),
    }
    console.log('[sync-fixtures] Done:', result)
    return Response.json(result, { headers: CORS_HEADERS })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[sync-fixtures] Fatal:', message)
    return Response.json(
      { success: false, fatal_error: message, teams_synced, matches_synced, errors },
      { status: 500, headers: CORS_HEADERS }
    )
  }
})
