import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCrown,
  faMedal,
  faUser,
  faBolt,
  faListOl,
  faShareNodes,
} from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useAuthContext } from '@/contexts/useAuthContext'
import { cn, getRankSuffix } from '@/lib/utils'
import type { LeaderboardEntry } from '@/types/app'
import { ShareCard } from './ShareCard'

function SkeletonRow() {
  return (
    <tr className="border-b border-pitch-800">
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
        <img src={entry.profile.avatarUrl} alt="" className="w-12 h-8 object-cover rounded" />
      )}
      <div className="font-heading text-white text-center text-sm tracking-wide uppercase">
        {entry.profile.displayName}
      </div>
      <div className={cn('font-display text-2xl', c.text)}>{entry.totalPoints}</div>
      <div className="text-[#4A6458] font-body text-xs">{t('leaderboard.pts')}</div>
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

      {/* Page Header Banner */}
      <div className="rounded-2xl overflow-hidden border border-border/40 shadow-lg">
        <img
          src="/leaderboard-banner.svg"
          alt={t('leaderboard.title')}
          className="w-full h-auto block"
          style={{ maxHeight: '200px', objectFit: 'cover', objectPosition: 'left center' }}
        />
      </div>

      {/* Current User Banner */}
      {currentUserEntry && (
        <div className="elevated-card rounded-2xl p-4 border border-gold-500/40 bg-gold-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faUser} className="text-gold-400" />
            <span className="font-body text-[#8BA898] text-sm">
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
                <div className="font-body text-[#4A6458] text-xs">{t('leaderboard.rank')}</div>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl text-white">
                  {currentUserEntry.totalPoints}
                </div>
                <div className="font-body text-[#4A6458] text-xs">{t('leaderboard.points')}</div>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl text-white">
                  {currentUserEntry.exactScoresCount}
                </div>
                <div className="font-body text-[#4A6458] text-xs">{t('leaderboard.exact')}</div>
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
        <div className="px-6 py-4 border-b border-pitch-800 flex items-center gap-2">
          <FontAwesomeIcon icon={faBolt} className="text-gold-400 text-sm" />
          <h2 className="font-heading text-white uppercase tracking-wider text-sm">
            {t('leaderboard.fullRankings')}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-pitch-800 text-[#4A6458] font-heading text-xs uppercase tracking-wider">
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
                      <FontAwesomeIcon icon={faListOl} className="text-[#4A6458] text-3xl" />
                      <p className="font-heading text-[#4A6458] text-sm uppercase tracking-wider">
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
                        'border-b border-pitch-800 transition-colors hover:bg-pitch-900/50',
                        isCurrentUser && 'border-s-2 border-s-gold-500 bg-gold-500/5',
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
                          <span className="font-body text-[#8BA898] text-sm">
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
                              className="w-6 h-4 object-cover rounded-sm"
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
                              <span className="text-[#4A6458] text-xs ms-1">
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

                      <td className="py-3 px-4 text-end font-body text-sm text-[#8BA898] hidden sm:table-cell">
                        {entry.submissionsCount}
                      </td>
                      <td className="py-3 px-4 text-end font-body text-sm text-[#8BA898] hidden sm:table-cell">
                        {entry.exactScoresCount}
                      </td>
                      <td className="py-3 px-4 text-end font-body text-sm text-[#8BA898] hidden sm:table-cell">
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
        <div className="px-6 py-3 border-t border-pitch-800">
          <p className="font-body text-[#4A6458] text-xs">{t('leaderboard.tieBreaker')}</p>
        </div>
      </div>
    </div>
  )
}
