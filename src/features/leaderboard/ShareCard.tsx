import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrophy, faShareNodes, faTimes } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import type { LeaderboardEntry } from '@/types/app'

interface ShareCardProps {
  entry: LeaderboardEntry
  onClose: () => void
}

export function ShareCard({ entry, onClose }: ShareCardProps) {
  const { t } = useTranslation()
  const flagUrl = entry.profile.flagCode
    ? `https://flagcdn.com/w40/${entry.profile.flagCode.toLowerCase()}.png`
    : null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      {/* Card */}
      <div className="relative bg-gradient-to-br from-pitch-950 via-pitch-900 to-pitch-950 border border-[#d4af37]/30 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
        {/* Gold top accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent rounded-t-2xl" />

        {/* Trophy / rank */}
        <div className="text-[#d4af37] text-5xl font-display mb-2">
          {entry.rank === 1 ? <FontAwesomeIcon icon={faTrophy} /> : `#${entry.rank}`}
        </div>

        {/* Flag + name */}
        <div className="flex items-center justify-center gap-2 mb-1">
          {flagUrl && <img src={flagUrl} alt="" className="w-6 h-4 rounded object-cover" />}
          <span className="text-white font-heading text-xl">{entry.profile.displayName}</span>
        </div>

        {/* Points */}
        <div className="text-[#d4af37] font-display text-6xl my-4">{entry.totalPoints}</div>
        <div className="text-secondary font-body text-sm mb-6">{t('shareCard.points')}</div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <div className="text-white font-display text-2xl">{entry.exactScoresCount}</div>
            <div className="text-muted text-xs font-body">{t('shareCard.exactScores')}</div>
          </div>
          <div>
            <div className="text-white font-display text-2xl">{entry.correctOutcomesCount}</div>
            <div className="text-muted text-xs font-body">{t('shareCard.correctPicks')}</div>
          </div>
          <div>
            <div className="text-white font-display text-2xl">{entry.submissionsCount}</div>
            <div className="text-muted text-xs font-body">{t('shareCard.predictions')}</div>
          </div>
        </div>

        {/* Branding */}
        <div className="text-[#d4af37]/60 font-heading text-xs tracking-widest uppercase">
          {t('shareCard.branding')}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 end-3 text-muted hover:text-white transition-colors"
        >
          <FontAwesomeIcon icon={faTimes} className="text-xs" />
        </button>

        {/* Share hint */}
        <p className="text-muted text-xs mt-4 font-body">
          <FontAwesomeIcon icon={faShareNodes} className="me-1" />
          {t('shareCard.shareHint')}
        </p>
      </div>
    </div>
  )
}
