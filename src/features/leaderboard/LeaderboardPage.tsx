import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCrown,
  faMedal,
  faUser,
  faBolt,
  faListOl,
  faShareNodes,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useAuthContext } from '@/contexts/useAuthContext'
import { cn, getRankSuffix } from '@/lib/utils'
import type { LeaderboardEntry } from '@/types/app'
import { ShareCard } from './ShareCard'

function SkeletonRow() {
  return (
    <tr className="border-b border-white/8">
      <td className="py-3 px-4">
        <div className="h-4 w-8 bg-pitch-800 rounded animate-pulse" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 w-32 bg-pitch-800 rounded animate-pulse" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 w-12 bg-pitch-800 rounded animate-pulse" />
      </td>
      <td className="py-3 px-4 hidden sm:table-cell">
        <div className="h-4 w-8 bg-pitch-800 rounded animate-pulse" />
      </td>
      <td className="py-3 px-4 hidden sm:table-cell">
        <div className="h-4 w-8 bg-pitch-800 rounded animate-pulse" />
      </td>
      <td className="py-3 px-4 hidden sm:table-cell">
        <div className="h-4 w-8 bg-pitch-800 rounded animate-pulse" />
      </td>
    </tr>
  )
}

function PodiumCard({ entry, position }: { entry: LeaderboardEntry; position: 1 | 2 | 3 }) {
  const { t } = useTranslation()
  const isFirst = position === 1
  const colors = {
    1: { border: 'border-gold-500', text: 'text-gold-400', bg: 'bg-gold-500/10' },
    2: { border: 'border-[#C0C0C0]/50', text: 'text-[#C0C0C0]', bg: 'bg-[#C0C0C0]/5' },
    3: { border: 'border-[#CD7F32]/50', text: 'text-[#CD7F32]', bg: 'bg-[#CD7F32]/5' },
  }
  const c = colors[position]

  return (
    <div
      className={cn(
        'elevated-card rounded-2xl p-4 flex flex-col items-center gap-3 border',
        c.border,
        c.bg,
        isFirst ? 'scale-105 shadow-gold py-6' : '',
      )}
    >
      <div className={cn('font-display text-3xl', c.text)}>
        {position === 1 ? (
          <FontAwesomeIcon icon={faCrown} className={c.text} />
        ) : (
          <FontAwesomeIcon icon={faMedal} className={c.text} />
        )}
      </div>
      {entry.profile.avatarUrl && (
        <img
          src={entry.profile.avatarUrl}
          alt=""
          className="w-12 h-12 object-cover rounded-full border border-border/50"
        />
      )}
      <div className="font-heading text-white text-center text-sm tracking-wide uppercase">
        {entry.profile.displayName}
      </div>
      <div className={cn('font-display text-2xl', c.text)}>{entry.totalPoints}</div>
      <div className="text-muted font-body text-xs">{t('leaderboard.pts')}</div>
      <div className={cn('font-heading text-xs', c.text)}>
        {position}
        {getRankSuffix(position)} {t('leaderboard.place')}
      </div>
    </div>
  )
}

export function LeaderboardPage() {
  const { t } = useTranslation()
  const { data: entries, isLoading } = useLeaderboard()
  const { user } = useAuthContext()
  const [shareEntry, setShareEntry] = useState<LeaderboardEntry | null>(null)

  const currentUserEntry = entries?.find((e) => e.userId === user?.id)
  const top3 = entries?.slice(0, 3) ?? []
  const allEntries = entries ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {shareEntry && <ShareCard entry={shareEntry} onClose={() => setShareEntry(null)} />}

      {/* Page Header Hero */}
      <section className="relative rounded-3xl overflow-hidden border border-white/10 shadow-lg min-h-[180px]">
        {/* Stadium background */}
        <div
          className="absolute inset-0 bg-cover bg-no-repeat"
          style={{ backgroundImage: 'url(/hero-stadium.jpg)', backgroundPosition: 'center 35%' }}
        />
        {/* Layered overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-pitch-950/95 via-pitch-950/60 to-pitch-950/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-pitch-950/80 via-pitch-950/40 to-transparent" />
        {/* Gold top accent */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
        {/* Ambient glows */}
        <div className="absolute -bottom-8 left-1/4 w-72 h-72 bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-live/8 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative px-6 pt-8 pb-6 flex items-end justify-between min-h-[180px]">
          <div>
            {/* Season tag */}
            <div className="inline-flex items-center gap-2 bg-gold-400/10 border border-gold-400/25 rounded-full px-3 py-1 mb-4">
              <FontAwesomeIcon icon={faTrophy} className="text-gold-400 text-[9px]" />
              <span className="text-[10px] font-heading uppercase text-gold-400/80 tracking-widest">
                {t('dashboard.season')}
              </span>
            </div>
            <h1 className="font-display text-5xl tracking-widest text-white leading-none drop-shadow-lg">
              {t('leaderboard.title').toUpperCase()}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-px w-10 bg-gold-400/40" />
              <p className="font-heading text-[11px] text-gold-400/70 uppercase tracking-[0.25em]">
                {t('leaderboard.fullRankings')}
              </p>
            </div>
          </div>

          {/* Decorative podium */}
          <div className="hidden sm:flex items-end gap-1.5 opacity-35 pb-1 me-2">
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-7 h-14 rounded-t-sm bg-gradient-to-t from-gray-500 to-gray-300" />
              <span className="font-display text-[10px] text-gray-400">2</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-7 h-20 rounded-t-sm bg-gradient-to-t from-gold-500 to-gold-300" />
              <span className="font-display text-[10px] text-gold-400">1</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-7 h-10 rounded-t-sm bg-gradient-to-t from-amber-700 to-amber-500" />
              <span className="font-display text-[10px] text-amber-500">3</span>
            </div>
          </div>
        </div>
      </section>

      {/* Current User Banner */}
      {currentUserEntry && (
        <div className="elevated-card rounded-2xl p-4 border border-gold-500/40 bg-gold-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faUser} className="text-gold-400" />
            <span className="font-body text-secondary text-sm">
              {t('leaderboard.yourPosition')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="font-display text-2xl text-gold-400">
                  {currentUserEntry.rank != null ? (
                    <>
                      {currentUserEntry.rank}
                      {getRankSuffix(currentUserEntry.rank)}
                    </>
                  ) : (
                    '—'
                  )}
                </div>
                <div className="font-body text-muted text-xs">{t('leaderboard.rank')}</div>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl text-white">
                  {currentUserEntry.totalPoints}
                </div>
                <div className="font-body text-muted text-xs">{t('leaderboard.points')}</div>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl text-white">
                  {currentUserEntry.exactScoresCount}
                </div>
                <div className="font-body text-muted text-xs">{t('leaderboard.exact')}</div>
              </div>
            </div>
            <button
              onClick={() => setShareEntry(currentUserEntry)}
              className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 transition-colors font-body"
              title="Share"
            >
              <FontAwesomeIcon icon={faShareNodes} />
              {t('leaderboard.share')}
            </button>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {!isLoading && top3.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 items-end">
          <PodiumCard entry={top3[1]} position={2} />
          <PodiumCard entry={top3[0]} position={1} />
          <PodiumCard entry={top3[2]} position={3} />
        </div>
      )}

      {/* Full Rankings Table */}
      <div className="elevated-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
          <FontAwesomeIcon icon={faBolt} className="text-gold-400 text-sm" />
          <h2 className="font-heading text-white uppercase tracking-wider text-sm">
            {t('leaderboard.fullRankings')}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-muted font-heading text-xs uppercase tracking-wider">
                <th className="text-start py-3 px-4">{t('leaderboard.rank')}</th>
                <th className="text-start py-3 px-4">{t('leaderboard.player')}</th>
                <th className="text-end py-3 px-4">{t('leaderboard.points')}</th>
                <th className="text-end py-3 px-4 hidden sm:table-cell">
                  {t('leaderboard.predicted')}
                </th>
                <th className="text-end py-3 px-4 hidden sm:table-cell">
                  {t('leaderboard.exact')}
                </th>
                <th className="text-end py-3 px-4 hidden sm:table-cell">
                  {t('leaderboard.correct')}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}

              {!isLoading && allEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="space-y-2">
                      <FontAwesomeIcon icon={faListOl} className="text-muted text-3xl" />
                      <p className="font-heading text-muted text-sm uppercase tracking-wider">
                        {t('leaderboard.noPredictions')}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                allEntries.map((entry) => {
                  const isCurrentUser = entry.userId === user?.id
                  const isTop3 = (entry.rank ?? 999) <= 3

                  return (
                    <tr
                      key={entry.userId}
                      className={cn(
                        'border-b border-white/8 transition-colors hover:bg-pitch-700/30',
                        isCurrentUser && 'border-s-2 border-s-gold-400 bg-gold-400/5',
                      )}
                    >
                      <td className="py-3 px-4">
                        {isTop3 ? (
                          <span
                            className={cn(
                              'font-heading text-sm font-semibold',
                              entry.rank === 1 && 'rank-gold',
                              entry.rank === 2 && 'rank-silver',
                              entry.rank === 3 && 'rank-bronze',
                            )}
                          >
                            <FontAwesomeIcon icon={faMedal} className="me-1" />
                            {entry.rank ?? '—'}
                          </span>
                        ) : (
                          <span className="font-body text-secondary text-sm">
                            {entry.rank ?? '—'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {entry.profile.avatarUrl && (
                            <img
                              src={entry.profile.avatarUrl}
                              alt=""
                              className="w-7 h-7 object-cover rounded-full border border-border/50"
                            />
                          )}
                          <span
                            className={cn(
                              'font-body text-sm',
                              isCurrentUser ? 'text-gold-400 font-semibold' : 'text-white',
                            )}
                          >
                            {entry.profile.displayName}
                            {isCurrentUser && (
                              <span className="text-muted text-xs ms-1">
                                ({t('dashboard.you')})
                              </span>
                            )}
                          </span>
                        </div>
                      </td>

                      <td
                        className={cn(
                          'py-3 px-4 text-end font-display text-lg',
                          isTop3 ? 'text-gold-400' : 'text-white',
                        )}
                      >
                        {entry.totalPoints}
                      </td>

                      <td className="py-3 px-4 text-end font-body text-sm text-secondary hidden sm:table-cell">
                        {entry.submissionsCount}
                      </td>
                      <td className="py-3 px-4 text-end font-body text-sm text-secondary hidden sm:table-cell">
                        {entry.exactScoresCount}
                      </td>
                      <td className="py-3 px-4 text-end font-body text-sm text-secondary hidden sm:table-cell">
                        {entry.correctOutcomesCount}
                      </td>
                      {isCurrentUser && (
                        <td className="py-3 px-4 text-end">
                          <button
                            onClick={() => setShareEntry(entry)}
                            className="text-gold-400/70 hover:text-gold-400 transition-colors"
                            title="Share"
                          >
                            <FontAwesomeIcon icon={faShareNodes} className="text-xs" />
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>

        {/* Tie-breaker note */}
        <div className="px-6 py-3 border-t border-white/10">
          <p className="font-body text-muted text-xs">{t('leaderboard.tieBreaker')}</p>
        </div>
      </div>
    </div>
  )
}
