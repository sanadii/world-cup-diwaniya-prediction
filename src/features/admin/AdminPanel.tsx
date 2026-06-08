import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faShield,
  faUsers,
  faCalendarAlt,
  faCog,
  faClipboardList,
  faCheck,
  faSpinner,
  faSave,
  faCalculator,
  faChevronDown,
  faRotate,
  faCircleCheck,
  faCircleExclamation,
  faDatabase,
} from '@fortawesome/free-solid-svg-icons'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  useAdminUsers,
  useApproveUser,
  useUpdateMatchScore,
  useTriggerScoring,
} from '@/hooks/useAdmin'
import { useMatches } from '@/hooks/useMatches'
import { DEFAULT_POINTS, STAGE_BONUS } from '@/lib/scoring'
import { cn, getFlagUrl, getStageName, formatKuwaitTime } from '@/lib/utils'
import type { MatchStatus, Match } from '@/types/app'
import type { UpdateMatchScoreInput } from '@/hooks/useAdmin'

type Tab = 'users' | 'matches' | 'sync' | 'scoring' | 'audit'

// ─── Sync Tab ─────────────────────────────────────────────────────────────────
interface SyncResult {
  success: boolean
  teams_synced?: number
  matches_synced?: number
  scores_updated?: number
  errors?: string[]
  fatal_error?: string
  warning?: string
  synced_at?: string
  // Debug fields returned when API or DB fails
  step?: string
  api_status?: number
  api_response_preview?: string
  api_errors?: unknown
  results_field?: number
}

function SyncTab() {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  // Fetch last sync time from DB
  useQuery({
    queryKey: ['last-sync-time'],
    queryFn: async () => {
      const { data } = await supabase
        .from('matches')
        .select('last_synced_at')
        .not('last_synced_at', 'is', null)
        .order('last_synced_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data?.last_synced_at) setLastSyncTime(data.last_synced_at)
      return data
    },
    staleTime: 30_000,
  })

  async function handleSync() {
    setSyncing(true)
    setResult(null)
    try {
      const { data, error } = await supabase.functions.invoke('sync-fixtures')
      if (error) {
        setResult({ success: false, fatal_error: error.message })
      } else {
        setResult(data as SyncResult)
        setLastSyncTime(new Date().toISOString())
      }
    } catch (err) {
      setResult({ success: false, fatal_error: err instanceof Error ? err.message : String(err) })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-lg">
      {/* Header */}
      <div>
        <h2 className="font-heading text-white text-sm uppercase tracking-wider">
          API-Football Live Sync
        </h2>
        <p className="font-body text-[#8BA898] text-xs mt-1">
          Syncs all WC2026 fixtures, teams, venues and live scores from API-Football (RapidAPI).
          Auto-runs every 5 min via pg_cron.
        </p>
      </div>

      {/* Last synced */}
      {lastSyncTime && (
        <div className="flex items-center gap-2 text-xs font-body text-[#4A6458]">
          <FontAwesomeIcon icon={faDatabase} className="text-[10px]" />
          Last synced:{' '}
          {new Date(lastSyncTime).toLocaleString('en-KW', {
            timeZone: 'Asia/Kuwait',
            dateStyle: 'medium',
            timeStyle: 'short',
          })}{' '}
          KWT
        </div>
      )}

      {/* Sync button */}
      <button
        onClick={() => void handleSync()}
        disabled={syncing}
        className={cn(
          'flex items-center gap-3 px-6 py-3 rounded-xl font-heading text-sm font-semibold uppercase tracking-wider transition-all',
          syncing
            ? 'bg-pitch-800 border border-border text-[#8BA898] cursor-not-allowed'
            : 'btn-gold',
        )}
      >
        <FontAwesomeIcon
          icon={syncing ? faSpinner : faRotate}
          className={syncing ? 'fa-spin' : ''}
        />
        {syncing ? 'Syncing...' : 'Force Sync Now'}
      </button>

      {/* Result card */}
      {result && (
        <div
          className={cn(
            'rounded-xl border p-4 space-y-3',
            result.success ? 'bg-live/5 border-live/20' : 'bg-red-500/5 border-red-500/20',
          )}
        >
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={result.success ? faCircleCheck : faCircleExclamation}
              className={result.success ? 'text-live' : 'text-red-400'}
            />
            <span
              className={cn(
                'font-heading text-xs uppercase tracking-wider',
                result.success ? 'text-live' : 'text-red-400',
              )}
            >
              {result.success ? 'Sync Successful' : result.warning ? 'Warning' : 'Sync Failed'}
            </span>
          </div>

          {result.step && (
            <p className="font-body text-[#4A6458] text-xs">
              Failed at step: <span className="text-white font-mono">{result.step}</span>
            </p>
          )}
          {result.warning && <p className="font-body text-[#8BA898] text-xs">{result.warning}</p>}
          {result.fatal_error && (
            <p className="font-body text-red-400 text-xs break-all">{result.fatal_error}</p>
          )}
          {result.api_status && (
            <p className="font-body text-red-400 text-xs">
              API HTTP status: <span className="font-mono">{result.api_status}</span>
            </p>
          )}
          {result.api_response_preview && (
            <pre className="font-mono text-[10px] text-[#8BA898] bg-pitch-900 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
              {result.api_response_preview}
            </pre>
          )}
          {result.api_errors && (
            <pre className="font-mono text-[10px] text-red-400/80 bg-pitch-900 rounded p-2 overflow-x-auto">
              {JSON.stringify(result.api_errors, null, 2) as string}
            </pre>
          )}
          {result.results_field !== undefined && (
            <p className="font-body text-[#4A6458] text-xs">
              API <code>results</code> field:{' '}
              <span className="text-white">{result.results_field}</span>
            </p>
          )}

          {result.success && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Teams', value: result.teams_synced ?? 0 },
                { label: 'Matches', value: result.matches_synced ?? 0 },
                { label: 'Live/Done', value: result.scores_updated ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="font-display text-3xl text-gold-400">{value}</div>
                  <div className="font-heading text-[10px] uppercase tracking-wider text-[#4A6458] mt-0.5">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(result.errors?.length ?? 0) > 0 && (
            <div className="space-y-1">
              <p className="font-heading text-[10px] uppercase tracking-wider text-[#4A6458]">
                Non-fatal errors:
              </p>
              {result.errors!.map((e, i) => (
                <p key={i} className="font-body text-red-400/80 text-xs break-all">
                  {e}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Key setup reminder */}
      <div className="rounded-xl bg-pitch-800 border border-border p-4 space-y-2">
        <p className="font-heading text-xs uppercase tracking-wider text-[#8BA898]">
          Setup Reminder
        </p>
        <ol className="space-y-1.5 font-body text-[#4A6458] text-xs list-decimal list-inside">
          <li>
            Go to{' '}
            <span className="text-gold-400">
              Supabase Dashboard &rarr; Edge Functions &rarr; sync-fixtures &rarr; Secrets
            </span>
          </li>
          <li>
            Add secret: <span className="text-white font-mono">RAPID_API_KEY</span>
          </li>
          <li>Value: your RapidAPI key for API-Football</li>
          <li>Click Force Sync Now to populate all matches</li>
        </ol>
      </div>
    </div>
  )
}

// --- Users Tab ---
function UsersTab() {
  const { data: users, isLoading } = useAdminUsers()
  const approveUser = useApproveUser()

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-pitch-800 text-[#4A6458] font-heading text-xs uppercase tracking-wider">
            <th className="text-left py-3 px-4">Player</th>
            <th className="text-left py-3 px-4 hidden sm:table-cell">Role</th>
            <th className="text-left py-3 px-4">Status</th>
            <th className="text-left py-3 px-4 hidden md:table-cell">Joined</th>
            <th className="text-right py-3 px-4">Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-pitch-800">
                <td className="py-3 px-4">
                  <div className="h-4 w-40 bg-pitch-800 rounded animate-pulse" />
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  <div className="h-4 w-16 bg-pitch-800 rounded animate-pulse" />
                </td>
                <td className="py-3 px-4">
                  <div className="h-4 w-20 bg-pitch-800 rounded animate-pulse" />
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  <div className="h-4 w-24 bg-pitch-800 rounded animate-pulse" />
                </td>
                <td className="py-3 px-4">
                  <div className="h-4 w-16 bg-pitch-800 rounded animate-pulse ml-auto" />
                </td>
              </tr>
            ))}

          {!isLoading && (!users || users.length === 0) && (
            <tr>
              <td
                colSpan={5}
                className="py-12 text-center font-heading text-[#4A6458] text-sm uppercase tracking-wider"
              >
                No users found
              </td>
            </tr>
          )}

          {!isLoading &&
            users?.map((u) => (
              <tr
                key={u.id}
                className="border-b border-pitch-800 hover:bg-pitch-900/40 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {u.flagCode && (
                      <img
                        src={getFlagUrl(u.flagCode, 'w40')}
                        alt=""
                        className="w-6 h-4 object-cover rounded-sm"
                      />
                    )}
                    <span className="font-body text-white text-sm">{u.displayName}</span>
                  </div>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  <span className="font-heading text-[#8BA898] text-xs uppercase">{u.role}</span>
                </td>
                <td className="py-3 px-4">
                  {u.approvalStatus === 'approved' ? (
                    <span className="badge-scored inline-flex items-center px-2 py-0.5 rounded text-xs font-heading border uppercase tracking-wide">
                      <FontAwesomeIcon icon={faCheck} className="mr-1 text-xs" />
                      Approved
                    </span>
                  ) : (
                    <span className="badge-locked inline-flex items-center px-2 py-0.5 rounded text-xs font-heading border uppercase tracking-wide">
                      Pending
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  <span className="font-body text-[#4A6458] text-xs">
                    {new Date(u.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {u.approvalStatus !== 'approved' && (
                    <button
                      onClick={() => approveUser.mutate(u.id)}
                      disabled={approveUser.isPending}
                      className="btn-gold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 ml-auto"
                    >
                      {approveUser.isPending ? (
                        <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
                      ) : (
                        <FontAwesomeIcon icon={faCheck} />
                      )}
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

// --- Score Entry Form ---
function ScoreEntryForm({ match, onClose }: { match: Match; onClose: () => void }) {
  const [homeScore, setHomeScore] = useState(match.fullTimeScoreA?.toString() ?? '')
  const [awayScore, setAwayScore] = useState(match.fullTimeScoreB?.toString() ?? '')
  const [wentToPenalties, setWentToPenalties] = useState(match.wentToPenalties ?? false)
  const [homePenalty, setHomePenalty] = useState(match.penaltyScoreA?.toString() ?? '')
  const [awayPenalty, setAwayPenalty] = useState(match.penaltyScoreB?.toString() ?? '')
  const [status, setStatus] = useState<string>(match.status === 'scored' ? 'scored' : 'finished')
  const [saved, setSaved] = useState(false)

  const updateScore = useUpdateMatchScore()
  const triggerScoring = useTriggerScoring(match.id)

  async function handleSave() {
    const input: UpdateMatchScoreInput = {
      matchId: match.id,
      fullTimeScoreA: parseInt(homeScore, 10),
      fullTimeScoreB: parseInt(awayScore, 10),
      wentToPenalties,
      penaltyScoreA: wentToPenalties ? parseInt(homePenalty, 10) : undefined,
      penaltyScoreB: wentToPenalties ? parseInt(awayPenalty, 10) : undefined,
      status,
    }
    await updateScore.mutateAsync(input)
    setSaved(true)
  }

  return (
    <div className="bg-pitch-900 border border-pitch-700 rounded-xl p-4 space-y-4">
      <h3 className="font-heading text-white text-sm uppercase tracking-wider">
        Enter Score: {match.teamA?.name ?? match.teamAPlaceholder ?? '?'} vs{' '}
        {match.teamB?.name ?? match.teamBPlaceholder ?? '?'}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-body text-[#8BA898] text-xs mb-1">
            {match.teamA?.name ?? match.teamAPlaceholder ?? 'Team A'} Score
          </label>
          <input
            type="number"
            min="0"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            className="w-full bg-pitch-800 border border-pitch-700 rounded-lg px-3 py-2 text-white font-body text-sm focus:outline-none focus:border-gold-500/50"
          />
        </div>
        <div>
          <label className="block font-body text-[#8BA898] text-xs mb-1">
            {match.teamB?.name ?? match.teamBPlaceholder ?? 'Team B'} Score
          </label>
          <input
            type="number"
            min="0"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            className="w-full bg-pitch-800 border border-pitch-700 rounded-lg px-3 py-2 text-white font-body text-sm focus:outline-none focus:border-gold-500/50"
          />
        </div>
      </div>

      {match.stage !== 'group' && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`penalties-${match.id}`}
            checked={wentToPenalties}
            onChange={(e) => setWentToPenalties(e.target.checked)}
            className="accent-gold-400"
          />
          <label htmlFor={`penalties-${match.id}`} className="font-body text-[#8BA898] text-sm">
            Went to penalties?
          </label>
        </div>
      )}

      {wentToPenalties && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-body text-[#8BA898] text-xs mb-1">Home Penalties</label>
            <input
              type="number"
              min="0"
              value={homePenalty}
              onChange={(e) => setHomePenalty(e.target.value)}
              className="w-full bg-pitch-800 border border-pitch-700 rounded-lg px-3 py-2 text-white font-body text-sm focus:outline-none focus:border-gold-500/50"
            />
          </div>
          <div>
            <label className="block font-body text-[#8BA898] text-xs mb-1">Away Penalties</label>
            <input
              type="number"
              min="0"
              value={awayPenalty}
              onChange={(e) => setAwayPenalty(e.target.value)}
              className="w-full bg-pitch-800 border border-pitch-700 rounded-lg px-3 py-2 text-white font-body text-sm focus:outline-none focus:border-gold-500/50"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block font-body text-[#8BA898] text-xs mb-1">Status</label>
        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-pitch-800 border border-pitch-700 rounded-lg px-3 py-2 text-white font-body text-sm focus:outline-none focus:border-gold-500/50 appearance-none pr-8"
          >
            <option value="finished">Finished</option>
            <option value="scored">Scored</option>
          </select>
          <FontAwesomeIcon
            icon={faChevronDown}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A6458] text-xs pointer-events-none"
          />
        </div>
      </div>

      {updateScore.isError && (
        <p className="font-body text-red-400 text-xs">{(updateScore.error as Error).message}</p>
      )}

      <div className="flex gap-2 flex-wrap">
        {!saved ? (
          <button
            onClick={() => void handleSave()}
            disabled={updateScore.isPending}
            className="btn-gold px-4 py-2 rounded-xl text-xs flex items-center gap-2"
          >
            {updateScore.isPending ? (
              <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
            ) : (
              <FontAwesomeIcon icon={faSave} />
            )}
            Save Score
          </button>
        ) : (
          <button
            onClick={() => triggerScoring.mutate()}
            disabled={triggerScoring.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading text-xs uppercase tracking-wider transition-colors"
          >
            {triggerScoring.isPending ? (
              <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
            ) : (
              <FontAwesomeIcon icon={faCalculator} />
            )}
            Recalculate
          </button>
        )}
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-pitch-800 border border-pitch-700 text-[#8BA898] font-heading text-xs uppercase tracking-wider hover:text-white transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// --- Matches Tab ---
function MatchesTab() {
  const [filter, setFilter] = useState<MatchStatus | undefined>(undefined)
  const [openFormId, setOpenFormId] = useState<string | null>(null)
  const { data: matches, isLoading } = useMatches(filter ? { status: filter } : undefined)

  const statusFilters: { label: string; value: MatchStatus | undefined }[] = [
    { label: 'All', value: undefined },
    { label: 'Open', value: 'open' },
    { label: 'Live', value: 'live' },
    { label: 'Finished', value: 'finished' },
    { label: 'Scored', value: 'scored' },
  ]

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex gap-2 px-2 flex-wrap">
        {statusFilters.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => setFilter(value)}
            className={cn(
              'px-3 py-1.5 rounded-lg font-heading text-xs uppercase tracking-wider transition-all border',
              filter === value
                ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                : 'border-pitch-700 bg-pitch-800 text-[#8BA898] hover:text-white hover:border-pitch-600',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-pitch-800 text-[#4A6458] font-heading text-xs uppercase tracking-wider">
              <th className="text-left py-3 px-4">Match</th>
              <th className="text-left py-3 px-4 hidden sm:table-cell">Stage</th>
              <th className="text-left py-3 px-4 hidden md:table-cell">Date (Kuwait)</th>
              <th className="text-center py-3 px-4">Score</th>
              <th className="text-center py-3 px-4">Status</th>
              <th className="text-right py-3 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-pitch-800">
                  <td className="py-3 px-4">
                    <div className="h-4 w-40 bg-pitch-800 rounded animate-pulse" />
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <div className="h-4 w-20 bg-pitch-800 rounded animate-pulse" />
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <div className="h-4 w-28 bg-pitch-800 rounded animate-pulse" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 w-12 bg-pitch-800 rounded animate-pulse mx-auto" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 w-16 bg-pitch-800 rounded animate-pulse mx-auto" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 w-20 bg-pitch-800 rounded animate-pulse ml-auto" />
                  </td>
                </tr>
              ))}

            {!isLoading && (!matches || matches.length === 0) && (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center font-heading text-[#4A6458] text-sm uppercase tracking-wider"
                >
                  No matches found
                </td>
              </tr>
            )}

            {!isLoading &&
              matches?.map((match) => (
                <>
                  <tr
                    key={match.id}
                    className="border-b border-pitch-800 hover:bg-pitch-900/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {match.teamA?.countryCode && (
                          <img
                            src={getFlagUrl(match.teamA.countryCode, 'w40')}
                            alt=""
                            className="w-5 h-3.5 object-cover rounded-sm"
                          />
                        )}
                        <span className="font-body text-white text-sm">
                          {match.teamA?.shortName ?? match.teamAPlaceholder ?? '?'}
                        </span>
                        <span className="text-[#4A6458] font-body text-xs">vs</span>
                        <span className="font-body text-white text-sm">
                          {match.teamB?.shortName ?? match.teamBPlaceholder ?? '?'}
                        </span>
                        {match.teamB?.countryCode && (
                          <img
                            src={getFlagUrl(match.teamB.countryCode, 'w40')}
                            alt=""
                            className="w-5 h-3.5 object-cover rounded-sm"
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className="font-body text-[#8BA898] text-xs">
                        {getStageName(match.stage)}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="font-body text-[#4A6458] text-xs">
                        {formatKuwaitTime(match.kickoffUtc, 'datetime')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {match.fullTimeScoreA !== undefined && match.fullTimeScoreB !== undefined ? (
                        <span className="font-display text-lg text-white">
                          {match.fullTimeScoreA} – {match.fullTimeScoreB}
                        </span>
                      ) : (
                        <span className="text-[#4A6458] font-body text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-heading border uppercase tracking-wide',
                          match.status === 'live' && 'badge-live',
                          match.status === 'open' && 'badge-open',
                          match.status === 'locked' && 'badge-locked',
                          match.status === 'finished' && 'badge-finished',
                          match.status === 'scored' && 'badge-scored',
                          !['live', 'open', 'locked', 'finished', 'scored'].includes(
                            match.status,
                          ) && 'text-[#4A6458] border-[#4A6458]/30',
                        )}
                      >
                        {match.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setOpenFormId(openFormId === match.id ? null : match.id)}
                        className="px-3 py-1.5 rounded-lg bg-pitch-800 border border-pitch-700 text-[#8BA898] hover:text-gold-400 hover:border-gold-500/40 font-heading text-xs uppercase tracking-wider transition-all"
                      >
                        Enter Score
                      </button>
                    </td>
                  </tr>
                  {openFormId === match.id && (
                    <tr key={`form-${match.id}`} className="border-b border-pitch-800">
                      <td colSpan={6} className="px-4 py-3">
                        <ScoreEntryForm match={match} onClose={() => setOpenFormId(null)} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// --- Scoring Tab ---
function ScoringTab() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-3">
        <h3 className="font-heading text-white uppercase tracking-wider text-sm">Base Points</h3>
        <div className="space-y-2">
          {Object.entries(DEFAULT_POINTS).map(([key, value]) => {
            const labels: Record<string, string> = {
              validSubmission: 'Valid Submission',
              lockedAtKickoff: 'Locked at Kickoff',
              correctWinnerOrOutcome: 'Correct Winner / Outcome',
              exactFullTimeScore: 'Exact Full-Time Score',
              correctlyPredictedPenalties: 'Correctly Predicted Penalties',
              exactPenaltyScore: 'Exact Penalty Score',
            }
            return (
              <div
                key={key}
                className="flex items-center justify-between py-2 border-b border-pitch-800"
              >
                <span className="font-body text-[#8BA898] text-sm">{labels[key] ?? key}</span>
                <span className="font-display text-xl text-gold-400">+{value}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-heading text-white uppercase tracking-wider text-sm">Stage Bonuses</h3>
        <div className="space-y-2">
          {Object.entries(STAGE_BONUS).map(([stage, bonus]) => (
            <div
              key={stage}
              className="flex items-center justify-between py-2 border-b border-pitch-800"
            >
              <span className="font-body text-[#8BA898] text-sm">
                {getStageName(stage as Parameters<typeof getStageName>[0])}
              </span>
              <span
                className={cn(
                  'font-display text-xl',
                  bonus > 0 ? 'text-gold-400' : 'text-[#4A6458]',
                )}
              >
                {bonus > 0 ? `+${bonus}` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="font-body text-[#4A6458] text-xs italic">
        Note: Scoring changes require a database migration.
      </p>
    </div>
  )
}

// --- Audit Log Tab ---
interface AuditEntry {
  id: string
  created_at: string
  action: string
  match_id?: string
  payload?: Record<string, unknown>
  actor?: { display_name: string } | null
}

function AuditTab() {
  const { data: entries, isLoading } = useQuery({
    queryKey: ['audit-log'],
    queryFn: async (): Promise<AuditEntry[]> => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*, actor:profiles(display_name)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return (data ?? []) as AuditEntry[]
    },
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-pitch-800 text-[#4A6458] font-heading text-xs uppercase tracking-wider">
            <th className="text-left py-3 px-4">Date (Kuwait)</th>
            <th className="text-left py-3 px-4">Admin</th>
            <th className="text-left py-3 px-4">Action</th>
            <th className="text-left py-3 px-4 hidden sm:table-cell">Match</th>
            <th className="text-left py-3 px-4 hidden md:table-cell">Details</th>
          </tr>
        </thead>
        <tbody>
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-pitch-800">
                <td className="py-3 px-4">
                  <div className="h-4 w-32 bg-pitch-800 rounded animate-pulse" />
                </td>
                <td className="py-3 px-4">
                  <div className="h-4 w-24 bg-pitch-800 rounded animate-pulse" />
                </td>
                <td className="py-3 px-4">
                  <div className="h-4 w-32 bg-pitch-800 rounded animate-pulse" />
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  <div className="h-4 w-16 bg-pitch-800 rounded animate-pulse" />
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  <div className="h-4 w-40 bg-pitch-800 rounded animate-pulse" />
                </td>
              </tr>
            ))}

          {!isLoading && (!entries || entries.length === 0) && (
            <tr>
              <td
                colSpan={5}
                className="py-12 text-center font-heading text-[#4A6458] text-sm uppercase tracking-wider"
              >
                No audit log entries
              </td>
            </tr>
          )}

          {!isLoading &&
            entries?.map((entry) => (
              <tr
                key={entry.id}
                className="border-b border-pitch-800 hover:bg-pitch-900/40 transition-colors"
              >
                <td className="py-3 px-4">
                  <span className="font-body text-[#8BA898] text-xs">
                    {formatKuwaitTime(entry.created_at, 'datetime')}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-body text-white text-sm">
                    {entry.actor?.display_name ?? '—'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-heading text-gold-400 text-xs uppercase tracking-wide">
                    {entry.action.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  <span className="font-body text-[#4A6458] text-xs">
                    {entry.match_id?.slice(0, 8) ?? '—'}
                  </span>
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  {entry.payload && (
                    <span className="font-body text-[#4A6458] text-xs">
                      {JSON.stringify(entry.payload).slice(0, 60)}…
                    </span>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

// --- Main Admin Panel ---
export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('users')

  const tabs: { key: Tab; label: string; icon: typeof faUsers }[] = [
    { key: 'users', label: 'Users', icon: faUsers },
    { key: 'matches', label: 'Matches', icon: faCalendarAlt },
    { key: 'sync', label: 'Sync', icon: faRotate },
    { key: 'scoring', label: 'Scoring', icon: faCog },
    { key: 'audit', label: 'Audit Log', icon: faClipboardList },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FontAwesomeIcon icon={faShield} className="text-gold-400 text-2xl" />
        <div>
          <h1 className="font-display text-4xl text-white tracking-wider">ADMIN PANEL</h1>
          <p className="font-body text-[#8BA898] text-sm">World Cup 2026 · Kuwait Diwaniya</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="elevated-card rounded-2xl overflow-hidden">
        <div className="flex border-b border-pitch-800">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-2 px-5 py-4 font-heading text-xs uppercase tracking-wider transition-all relative',
                activeTab === key ? 'text-gold-400' : 'text-[#4A6458] hover:text-[#8BA898]',
              )}
            >
              <FontAwesomeIcon icon={icon} className="text-sm" />
              <span className="hidden sm:inline">{label}</span>
              {activeTab === key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500" />
              )}
            </button>
          ))}
        </div>

        <div>
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'matches' && <MatchesTab />}
          {activeTab === 'sync' && <SyncTab />}
          {activeTab === 'scoring' && <ScoringTab />}
          {activeTab === 'audit' && <AuditTab />}
        </div>
      </div>
    </div>
  )
}
