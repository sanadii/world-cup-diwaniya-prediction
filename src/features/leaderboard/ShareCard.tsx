import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrophy, faShareNodes } from '@fortawesome/free-solid-svg-icons'
import type { LeaderboardEntry } from '@/types/app'

interface ShareCardProps {
  entry: LeaderboardEntry
  onClose: () => void
}

export function ShareCard({ entry, onClose }: ShareCardProps) {
  const flagUrl = entry.profile.flagCode
    ? `https://flagcdn.com/w40/${entry.profile.flagCode.toLowerCase()}.png`
    : null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      {/* Card */}
      <div className="relative bg-gradient-to-br from-[#0a0e1a] via-[#1a1f2e] to-[#0a0e1a] border border-[#f59e0b]/30 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
        {/* Gold top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#f59e0b] to-transparent rounded-t-2xl" />

        {/* Trophy / rank */}
        <div className="text-[#f59e0b] text-5xl font-display mb-2">
          {entry.rank === 1 ? <FontAwesomeIcon icon={faTrophy} /> : `#${entry.rank}`}
        </div>

        {/* Flag + name */}
        <div className="flex items-center justify-center gap-2 mb-1">
          {flagUrl && <img src={flagUrl} alt="" className="w-6 h-4 rounded object-cover" />}
          <span className="text-white font-heading text-xl">{entry.profile.displayName}</span>
        </div>

        {/* Points */}
        <div className="text-[#f59e0b] font-display text-6xl my-4">{entry.totalPoints}</div>
        <div className="text-gray-400 font-body text-sm mb-6">POINTS</div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <div className="text-white font-display text-2xl">{entry.exactScoresCount}</div>
            <div className="text-gray-500 text-xs font-body">Exact Scores</div>
          </div>
          <div>
            <div className="text-white font-display text-2xl">{entry.correctOutcomesCount}</div>
            <div className="text-gray-500 text-xs font-body">Correct Picks</div>
          </div>
          <div>
            <div className="text-white font-display text-2xl">{entry.submissionsCount}</div>
            <div className="text-gray-500 text-xs font-body">Predictions</div>
          </div>
        </div>

        {/* Branding */}
        <div className="text-[#f59e0b]/60 font-heading text-xs tracking-widest uppercase">
          Diwaniya WC 2026
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
        >
          ×
        </button>

        {/* Share hint */}
        <p className="text-gray-600 text-xs mt-4 font-body">
          <FontAwesomeIcon icon={faShareNodes} className="mr-1" />
          Screenshot to share on WhatsApp
        </p>
      </div>
    </div>
  )
}
