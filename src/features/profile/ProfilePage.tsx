import { useState, type FormEvent } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faPen,
  faStar,
  faMedal,
  faCheck,
  faTimes,
  faLock,
  faChartBar,
  faHistory,
  faSpinner,
  faShield,
} from '@fortawesome/free-solid-svg-icons'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/useAuthContext'
import { useUserStats } from '@/hooks/useUserStats'
import { cn, getFlagUrl, getRankSuffix, getBadgeInfo } from '@/lib/utils'
import type { Prediction, PredictionStatus, BadgeType, MatchStage } from '@/types/app'

const FLAG_OPTIONS = ['kw', 'sa', 'ae', 'eg', 'iq', 'jo', 'us', 'gb', 'fr', 'br']

const ALL_BADGES: BadgeType[] = [
  'exact_score_king',
  'penalty_genius',
  'comeback_master',
  'final_boss',
  'underdog_whisperer',
  'last_minute_predictor',
  'best_streak',
  'unlucky',
  'late_predictor',
]

interface PredictionWithMatch extends Prediction {
  match?: {
    id: string
    teamAName: string
    teamBName: string
    teamACode: string
    teamBCode: string
    fullTimeScoreA?: number
    fullTimeScoreB?: number
    kickoffKuwait: string
    stage: MatchStage
  }
}

function useMyPredictionsWithMatches(userId?: string) {
  return useQuery({
    queryKey: ['my-predictions-with-matches', userId],
    enabled: !!userId,
    queryFn: async (): Promise<PredictionWithMatch[]> => {
      const { data, error } = await supabase
        .from('predictions')
        .select(
          `*, prediction_scores(total_points, is_exact_score, is_correct_outcome, breakdown),
          match:matches(
            id, kickoff_at_utc, stage, status,
            full_time_score_a, full_time_score_b,
            team_a:teams!team_a_id(name, country_code),
            team_b:teams!team_b_id(name, country_code)
          )`,
        )
        .eq('user_id', userId!)
        .order('last_updated_at', { ascending: false })

      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const raw = row as {
          id: string
          user_id: string
          match_id: string
          predicted_score_a: number
          predicted_score_b: number
          predicted_outcome: string | null
          predicted_winner_team_id: string | null
          predicts_penalties: boolean
          predicted_penalty_score_a: number | null
          predicted_penalty_score_b: number | null
          first_submitted_at: string | null
          last_updated_at: string | null
          locked_at: string | null
          is_locked: boolean
          is_valid: boolean
          prediction_scores?: { total_points: number | null }[]
          match?: {
            id: string
            kickoff_at_utc: string
            stage: MatchStage
            status: string
            full_time_score_a: number | null
            full_time_score_b: number | null
            team_a?: { name: string; country_code: string | null }
            team_b?: { name: string; country_code: string | null }
          }
        }

        const score = (raw.prediction_scores ?? [])[0] ?? null
        const pred: PredictionWithMatch = {
          id: raw.id,
          userId: raw.user_id,
          matchId: raw.match_id,
          predictedScoreA: raw.predicted_score_a,
          predictedScoreB: raw.predicted_score_b,
          predictedOutcome: raw.predicted_outcome,
          predictedWinnerTeamId: raw.predicted_winner_team_id,
          predictsPenalties: raw.predicts_penalties ?? false,
          predictedPenaltyScoreA: raw.predicted_penalty_score_a,
          predictedPenaltyScoreB: raw.predicted_penalty_score_b,
          firstSubmittedAt: raw.first_submitted_at,
          lastUpdatedAt: raw.last_updated_at,
          lockedAt: raw.locked_at,
          isLocked: raw.is_locked ?? false,
          isValid: raw.is_valid ?? true,
          isSubmitted: raw.first_submitted_at !== null,
          totalPoints: score?.total_points ?? undefined,
        }

        if (raw.match) {
          pred.match = {
            id: raw.match.id,
            teamAName: raw.match.team_a?.name ?? '?',
            teamBName: raw.match.team_b?.name ?? '?',
            teamACode: raw.match.team_a?.country_code ?? '',
            teamBCode: raw.match.team_b?.country_code ?? '',
            fullTimeScoreA: raw.match.full_time_score_a ?? undefined,
            fullTimeScoreB: raw.match.full_time_score_b ?? undefined,
            kickoffKuwait: new Date(raw.match.kickoff_at_utc).toLocaleString('en-KW', {
              timeZone: 'Asia/Kuwait',
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
            stage: raw.match.stage,
          }
        }

        return pred
      })
    },
  })
}

function StatusBadge({ status }: { status: PredictionStatus }) {
  const map: Record<PredictionStatus, { label: string; cls: string }> = {
    not_submitted: {
      label: 'Not Submitted',
      cls: 'bg-[#4A6458]/20 text-[#4A6458] border-[#4A6458]/30',
    },
    saved: { label: 'Saved', cls: 'badge-open' },
    locked: { label: 'Locked', cls: 'badge-locked' },
    finished: { label: 'Finished', cls: 'badge-finished' },
    scored: { label: 'Scored', cls: 'badge-scored' },
  }
  const { label, cls } = map[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-heading border uppercase tracking-wide',
        cls,
      )}
    >
      {label}
    </span>
  )
}

export function ProfilePage() {
  const { user, profile } = useAuthContext()
  const { data: stats, isLoading: statsLoading } = useUserStats(user?.id)
  const { data: predictions, isLoading: predsLoading } = useMyPredictionsWithMatches(user?.id)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(profile?.displayName ?? '')
  const [editFlag, setEditFlag] = useState(profile?.flagCode ?? 'kw')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const earnedBadges = new Set<string>() // we'd get these from leaderboard entry; placeholder

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setSaveError('')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: editName.trim(), flag_code: editFlag })
        .eq('id', user.id)
      if (error) throw error
      setEditing(false)
      // Reload page to refresh auth context profile
      window.location.reload()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Header */}
      <div className="elevated-card rounded-2xl p-6">
        {!editing ? (
          <div className="flex items-start gap-6">
            {profile?.flagCode ? (
              <img
                src={getFlagUrl(profile.flagCode, 'w80')}
                alt={profile.flagCode}
                className="w-20 h-14 object-cover rounded-xl border border-pitch-800"
              />
            ) : (
              <div className="w-20 h-14 rounded-xl bg-pitch-800 flex items-center justify-center border border-pitch-800">
                <FontAwesomeIcon icon={faUser} className="text-[#4A6458] text-2xl" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display text-4xl text-white tracking-wider">
                  {profile?.displayName ?? 'Unknown'}
                </h1>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gold-500/10 border border-gold-500/30 text-gold-400 font-heading text-xs uppercase tracking-wider">
                    <FontAwesomeIcon icon={faShield} className="text-xs" />
                    Admin
                  </span>
                )}
              </div>
              <p className="font-body text-[#8BA898] text-sm mt-1">{user?.email}</p>
            </div>

            <button
              onClick={() => {
                setEditing(true)
                setEditName(profile?.displayName ?? '')
                setEditFlag(profile?.flagCode ?? 'kw')
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pitch-800 border border-pitch-700 hover:border-gold-500/40 text-[#8BA898] hover:text-gold-400 font-heading text-xs uppercase tracking-wider transition-all"
            >
              <FontAwesomeIcon icon={faPen} />
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSave(e)} className="space-y-5">
            <h2 className="font-heading text-white uppercase tracking-wider text-sm">
              Edit Profile
            </h2>

            <div>
              <label className="block font-body text-[#8BA898] text-xs mb-2 uppercase tracking-wider">
                Display Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-pitch-900 border border-pitch-700 rounded-xl px-4 py-3 font-body text-sm text-white placeholder-[#4A6458] focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400/50"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="block font-body text-[#8BA898] text-xs mb-2 uppercase tracking-wider">
                Flag
              </label>
              <div className="grid grid-cols-5 gap-2">
                {FLAG_OPTIONS.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setEditFlag(code)}
                    className={cn(
                      'aspect-[3/2] rounded-lg overflow-hidden border-2 transition-all',
                      editFlag === code
                        ? 'border-gold-500 ring-2 ring-gold-500/40'
                        : 'border-transparent hover:border-pitch-600',
                    )}
                  >
                    <img
                      src={getFlagUrl(code, 'w80')}
                      alt={code}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {saveError && <p className="font-body text-red-400 text-sm">{saveError}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="btn-gold px-6 py-2 rounded-xl text-sm flex items-center gap-2"
              >
                {saving ? (
                  <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
                ) : (
                  <FontAwesomeIcon icon={faCheck} />
                )}
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-6 py-2 rounded-xl bg-pitch-800 border border-pitch-700 text-[#8BA898] font-heading text-xs uppercase tracking-wider hover:text-white transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="mr-1" />
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Points', value: stats?.totalPoints ?? 0, icon: faStar, gold: true },
          {
            label: 'Rank',
            value: stats?.rank != null ? `${stats.rank}${getRankSuffix(stats.rank)}` : '—',
            icon: faMedal,
            gold: false,
          },
          {
            label: 'Predicted',
            value: stats?.matchesPredicted ?? 0,
            icon: faChartBar,
            gold: false,
          },
          { label: 'Exact Scores', value: stats?.exactScores ?? 0, icon: faCheck, gold: false },
        ].map(({ label, value, icon, gold }) => (
          <div key={label} className="elevated-card rounded-2xl p-4 text-center space-y-2">
            {statsLoading ? (
              <div className="h-8 w-16 bg-pitch-800 rounded animate-pulse mx-auto" />
            ) : (
              <>
                <FontAwesomeIcon
                  icon={icon}
                  className={cn('text-xl', gold ? 'text-gold-400' : 'text-[#8BA898]')}
                />
                <div className={cn('font-display text-3xl', gold ? 'text-gold-400' : 'text-white')}>
                  {value}
                </div>
                <div className="font-body text-[#4A6458] text-xs uppercase tracking-wider">
                  {label}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Prediction History */}
      <div className="elevated-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-pitch-800 flex items-center gap-2">
          <FontAwesomeIcon icon={faHistory} className="text-gold-400 text-sm" />
          <h2 className="font-heading text-white uppercase tracking-wider text-sm">
            Prediction History
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-pitch-800 text-[#4A6458] font-heading text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-4">Match</th>
                <th className="text-center py-3 px-4">Prediction</th>
                <th className="text-center py-3 px-4 hidden sm:table-cell">Actual</th>
                <th className="text-center py-3 px-4">Points</th>
                <th className="text-right py-3 px-4 hidden sm:table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {predsLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-pitch-800">
                    <td className="py-3 px-4">
                      <div className="h-4 w-40 bg-pitch-800 rounded animate-pulse" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-12 bg-pitch-800 rounded animate-pulse mx-auto" />
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <div className="h-4 w-12 bg-pitch-800 rounded animate-pulse mx-auto" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-8 bg-pitch-800 rounded animate-pulse mx-auto" />
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <div className="h-4 w-16 bg-pitch-800 rounded animate-pulse ml-auto" />
                    </td>
                  </tr>
                ))}

              {!predsLoading && (!predictions || predictions.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <FontAwesomeIcon
                      icon={faHistory}
                      className="text-[#4A6458] text-2xl mb-2 block mx-auto"
                    />
                    <p className="font-heading text-[#4A6458] text-sm uppercase tracking-wider">
                      No predictions yet
                    </p>
                  </td>
                </tr>
              )}

              {!predsLoading &&
                predictions?.map((pred) => (
                  <tr
                    key={pred.id}
                    className="border-b border-pitch-800 hover:bg-pitch-900/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {pred.match?.teamACode && (
                          <img
                            src={getFlagUrl(pred.match.teamACode, 'w40')}
                            alt=""
                            className="w-5 h-3.5 object-cover rounded-sm"
                          />
                        )}
                        <span className="font-body text-white text-sm">
                          {pred.match?.teamAName ?? '?'} vs {pred.match?.teamBName ?? '?'}
                        </span>
                        {pred.match?.teamBCode && (
                          <img
                            src={getFlagUrl(pred.match.teamBCode, 'w40')}
                            alt=""
                            className="w-5 h-3.5 object-cover rounded-sm"
                          />
                        )}
                      </div>
                      <div className="font-body text-[#4A6458] text-xs mt-0.5">
                        {pred.match?.kickoffKuwait}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="font-display text-lg text-white">
                        {pred.predictedScoreA} – {pred.predictedScoreB}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      {pred.match?.fullTimeScoreA !== undefined &&
                      pred.match.fullTimeScoreB !== undefined ? (
                        <span className="font-display text-lg text-[#8BA898]">
                          {pred.match.fullTimeScoreA} – {pred.match.fullTimeScoreB}
                        </span>
                      ) : (
                        <span className="text-[#4A6458] font-body text-xs">TBD</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          'font-display text-xl',
                          pred.totalPoints !== undefined && pred.totalPoints > 0
                            ? 'text-gold-400'
                            : 'text-[#4A6458]',
                        )}
                      >
                        {pred.totalPoints !== undefined ? pred.totalPoints : '—'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right hidden sm:table-cell">
                      <StatusBadge
                        status={
                          pred.totalPoints !== undefined
                            ? 'scored'
                            : pred.isLocked
                              ? 'locked'
                              : pred.isSubmitted
                                ? 'saved'
                                : 'not_submitted'
                        }
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Badges */}
      <div className="elevated-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <FontAwesomeIcon icon={faStar} className="text-gold-400 text-sm" />
          <h2 className="font-heading text-white uppercase tracking-wider text-sm">Your Badges</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {ALL_BADGES.map((badge) => {
            const info = getBadgeInfo(badge)
            const earned = earnedBadges.has(badge)
            return (
              <div
                key={badge}
                className={cn(
                  'rounded-xl p-3 border text-center space-y-1 transition-all',
                  earned
                    ? 'border-gold-500/40 bg-gold-500/5'
                    : 'border-pitch-700 bg-pitch-900/50 opacity-50',
                )}
              >
                {earned ? (
                  <div className={cn('font-heading text-xs', info.color)}>{info.label}</div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <FontAwesomeIcon icon={faLock} className="text-[#4A6458] text-sm" />
                    <div className="font-body text-[#4A6458] text-xs">{info.label}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
