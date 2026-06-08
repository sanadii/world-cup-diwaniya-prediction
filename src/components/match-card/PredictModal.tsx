import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark,
  faMinus,
  faPlus,
  faBullseye,
  faSpinner,
  faCheckCircle,
  faLock,
} from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { cn, getFlagUrl } from '@/lib/utils'
import { useSavePrediction } from '@/hooks/useSavePrediction'
import type { Match, Prediction } from '@/types/app'

interface Props {
  match: Match
  prediction?: Prediction
  onClose: () => void
}

function ScoreStepper({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] font-body text-[#4A6458] uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-10 h-10 rounded-xl bg-pitch-800 border border-border flex items-center justify-center text-[#8BA898] hover:text-white hover:border-border-glow active:scale-95 transition-all"
        >
          <FontAwesomeIcon icon={faMinus} className="text-xs" />
        </button>
        <div className="w-14 h-14 rounded-2xl bg-pitch-700 border border-border-glow/40 flex items-center justify-center">
          <span className="font-display text-4xl text-white leading-none">{value}</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(20, value + 1))}
          className="w-10 h-10 rounded-xl bg-pitch-800 border border-border flex items-center justify-center text-[#8BA898] hover:text-white hover:border-border-glow active:scale-95 transition-all"
        >
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
        </button>
      </div>
    </div>
  )
}

const KNOCKOUT_STAGES = [
  'round_of_32',
  'round_of_16',
  'quarterfinal',
  'semifinal',
  'final',
  'third_place',
]

export function PredictModal({ match, prediction, onClose }: Props) {
  const { t } = useTranslation()
  const [scoreA, setScoreA] = useState(prediction?.predictedScoreA ?? 0)
  const [scoreB, setScoreB] = useState(prediction?.predictedScoreB ?? 0)
  const [predictsPenalties, setPredictsPenalties] = useState(prediction?.predictsPenalties ?? false)
  const [penScoreA, setPenScoreA] = useState(prediction?.predictedPenaltyScoreA ?? 4)
  const [penScoreB, setPenScoreB] = useState(prediction?.predictedPenaltyScoreB ?? 3)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const isKnockout = KNOCKOUT_STAGES.includes(match.stage)
  const isDraw = scoreA === scoreB
  const showPenalties = isKnockout && isDraw && predictsPenalties

  const { mutate, isPending } = useSavePrediction()

  // Auto-derive outcome
  const outcome = scoreA > scoreB ? 'team_a' : scoreB > scoreA ? 'team_b' : 'draw'

  // Close on backdrop click / Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit() {
    mutate(
      {
        matchId: match.id,
        predictedScoreA: scoreA,
        predictedScoreB: scoreB,
        predictedOutcome: outcome,
        predictedWinnerTeamId: null,
        predictsPenalties: isKnockout && isDraw ? predictsPenalties : false,
        predictedPenaltyScoreA: showPenalties ? penScoreA : null,
        predictedPenaltyScoreB: showPenalties ? penScoreB : null,
      },
      {
        onSuccess: () => {
          setSaved(true)
          setSaveError(null)
          setTimeout(onClose, 900)
        },
        onError: () => {
          setSaveError(t('predictModal.saveFailed'))
        },
      },
    )
  }

  const teamA = match.teamA?.shortName ?? match.teamAPlaceholder ?? '?'
  const teamB = match.teamB?.shortName ?? match.teamBPlaceholder ?? '?'
  // Prefer flagUrl from DB; fall back to CDN via countryCode
  const flagA =
    match.teamA?.flagUrl ??
    (match.teamA?.countryCode ? getFlagUrl(match.teamA.countryCode, 'w80') : null)
  const flagB =
    match.teamB?.flagUrl ??
    (match.teamB?.countryCode ? getFlagUrl(match.teamB.countryCode, 'w80') : null)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-pitch-950/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-sm bg-[#0f1420] border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up sm:animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="sm:hidden w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/60">
          <div>
            <div className="font-heading text-xs font-semibold text-[#4A6458] uppercase tracking-widest">
              {prediction ? t('predictModal.updatePrediction') : t('predictModal.savePrediction')}
            </div>
            <div className="font-heading text-sm font-semibold text-white mt-0.5">
              {teamA} vs {teamB}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-pitch-800 border border-border flex items-center justify-center text-[#8BA898] hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="text-sm" />
          </button>
        </div>

        {/* Score inputs */}
        <div className="px-5 py-6">
          <div className="flex items-center justify-between gap-4">
            {/* Team A */}
            <div className="flex flex-col items-center gap-2 flex-1">
              {flagA && (
                <img
                  src={flagA}
                  alt={teamA}
                  className="w-14 h-10 object-cover rounded-lg border border-border/60"
                />
              )}
              <span className="font-heading text-xs font-semibold text-white text-center">
                {teamA}
              </span>
            </div>

            {/* Score steppers */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <ScoreStepper value={scoreA} onChange={setScoreA} label="" />
              <span className="font-display text-2xl text-[#4A6458]">—</span>
              <ScoreStepper value={scoreB} onChange={setScoreB} label="" />
            </div>

            {/* Team B */}
            <div className="flex flex-col items-center gap-2 flex-1">
              {flagB && (
                <img
                  src={flagB}
                  alt={teamB}
                  className="w-14 h-10 object-cover rounded-lg border border-border/60"
                />
              )}
              <span className="font-heading text-xs font-semibold text-white text-center">
                {teamB}
              </span>
            </div>
          </div>

          {/* Outcome preview */}
          <div className="mt-4 text-center">
            <span
              className={cn(
                'inline-block text-[11px] font-heading font-semibold uppercase tracking-wider px-3 py-1 rounded-full',
                outcome === 'team_a' && 'bg-gold-400/15 text-gold-400 border border-gold-400/30',
                outcome === 'team_b' && 'bg-gold-400/15 text-gold-400 border border-gold-400/30',
                outcome === 'draw' && 'bg-pitch-700 text-[#8BA898] border border-border',
              )}
            >
              {outcome === 'team_a' && `${teamA} wins`}
              {outcome === 'team_b' && `${teamB} wins`}
              {outcome === 'draw' && 'Draw'}
            </span>
          </div>

          {/* Penalty toggle (knockout + draw only) */}
          {isKnockout && isDraw && (
            <div className="mt-4 pt-4 border-t border-border/60">
              <button
                type="button"
                onClick={() => setPredictsPenalties((v) => !v)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
                  predictsPenalties
                    ? 'bg-gold-400/10 border-gold-400/30 text-gold-400'
                    : 'bg-pitch-800 border-border text-[#8BA898] hover:border-border-glow',
                )}
              >
                <span className="font-heading text-xs font-semibold uppercase tracking-wider">
                  Goes to penalties
                </span>
                <div
                  className={cn(
                    'w-10 h-5 rounded-full relative transition-all',
                    predictsPenalties ? 'bg-gold-400' : 'bg-pitch-700 border border-border',
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
                      predictsPenalties ? 'left-[22px]' : 'left-0.5',
                    )}
                  />
                </div>
              </button>

              {showPenalties && (
                <div className="mt-3 flex items-center justify-center gap-3">
                  <ScoreStepper value={penScoreA} onChange={setPenScoreA} label="Pen A" />
                  <span className="font-display text-xl text-[#4A6458] mt-5">—</span>
                  <ScoreStepper value={penScoreB} onChange={setPenScoreB} label="Pen B" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save error */}
        {saveError && (
          <div className="px-5 pb-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <FontAwesomeIcon icon={faXmark} className="text-red-400 text-xs flex-shrink-0" />
              <span className="text-xs text-red-400 font-body">{saveError}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 pb-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-pitch-800 border border-border text-[#8BA898] hover:text-white font-heading text-sm font-semibold tracking-wide transition-all"
          >
            {t('predictModal.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || saved}
            className={cn(
              'flex-[2] py-3 rounded-xl font-heading text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all',
              saved ? 'bg-live/20 border border-live/30 text-live' : 'btn-gold',
            )}
          >
            {saved ? (
              <>
                <FontAwesomeIcon icon={faCheckCircle} />
                {t('predictModal.save')}!
              </>
            ) : isPending ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
                {t('predictModal.saving')}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={prediction ? faLock : faBullseye} className="text-xs" />
                {prediction ? t('predictModal.updatePrediction') : t('predictModal.savePrediction')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
