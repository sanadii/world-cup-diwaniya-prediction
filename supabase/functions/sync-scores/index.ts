import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    // Verify caller is admin via RLS client
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: profile, error: profileError } = await anonClient
      .from('profiles')
      .select('role')
      .single()
    if (profileError || !['admin', 'super_admin'].includes(profile?.role)) {
      return new Response(JSON.stringify({ error: 'Admin required' }), {
        status: 403,
        headers: corsHeaders,
      })
    }

    const { match_id, fixture_id } = await req.json()
    if (!match_id || !fixture_id) {
      return new Response(JSON.stringify({ error: 'match_id and fixture_id required' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Fetch from API-Football
    const apiKey = Deno.env.get('API_FOOTBALL_KEY') ?? ''
    const apiRes = await fetch(`https://v3.football.api-sports.io/fixtures?id=${fixture_id}`, {
      headers: { 'x-apisports-key': apiKey },
    })
    const apiData = await apiRes.json()
    const fixture = apiData?.response?.[0]
    if (!fixture) {
      return new Response(JSON.stringify({ error: 'Fixture not found in API-Football' }), {
        status: 404,
        headers: corsHeaders,
      })
    }

    // Parse scores
    const homeScore = fixture.score?.fulltime?.home ?? fixture.goals?.home ?? null
    const awayScore = fixture.score?.fulltime?.away ?? fixture.goals?.away ?? null
    const homePenalty = fixture.score?.penalty?.home ?? null
    const awayPenalty = fixture.score?.penalty?.away ?? null
    const wentToPenalties = homePenalty !== null && awayPenalty !== null

    // Map API-Football status to our status
    const apiStatus = fixture.fixture?.status?.short
    const statusMap: Record<string, string> = {
      'FT': 'finished',
      'AET': 'finished',
      'PEN': 'finished',
      '1H': 'live',
      'HT': 'live',
      '2H': 'live',
      'ET': 'live',
      'BT': 'live',
      'P': 'live',
      'NS': 'open',
      'TBD': 'scheduled',
      'PST': 'postponed',
      'CANC': 'cancelled',
      'ABD': 'cancelled',
      'WO': 'cancelled',
    }
    const matchStatus = statusMap[apiStatus] ?? 'scheduled'
    const liveMinute = fixture.fixture?.status?.elapsed ?? null

    // Update via service role (bypasses RLS)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    const { error: updateError } = await serviceClient
      .from('matches')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        went_to_penalties: wentToPenalties,
        home_penalty: homePenalty,
        away_penalty: awayPenalty,
        status: matchStatus,
        live_minute: liveMinute,
        updated_at: new Date().toISOString(),
      })
      .eq('id', match_id)
    if (updateError) throw updateError

    return new Response(
      JSON.stringify({
        success: true,
        match: {
          home_score: homeScore,
          away_score: awayScore,
          status: matchStatus,
          went_to_penalties: wentToPenalties,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
