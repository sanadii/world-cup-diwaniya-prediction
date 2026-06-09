import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrophy, faSpinner, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '@/contexts/useAuthContext'
import { cn, getFlagUrl } from '@/lib/utils'

const FLAG_OPTIONS = ['kw', 'sa', 'ae', 'eg', 'iq', 'jo', 'us', 'gb', 'fr', 'br']

export function RegisterPage() {
  const { t } = useTranslation()
  const { signUp } = useAuthContext()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [flagCode, setFlagCode] = useState('kw')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }
    if (password.length < 6) {
      setError(t('auth.passwordTooShort'))
      return
    }

    setIsLoading(true)
    try {
      await signUp(email, password, displayName, flagCode)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.registrationFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = cn(
    'w-full bg-pitch-950 border border-border rounded-xl px-4 py-3',
    'font-body text-sm text-white placeholder-[#4A6458]',
    'focus:outline-none focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50',
    'transition-all duration-200',
  )

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Full-bleed stadium background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/hero-stadium.jpg)' }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-pitch-950/96 via-pitch-950/85 to-pitch-950/70" />
      {/* Green floodlight glow from top */}
      <div className="absolute top-0 inset-x-0 h-80 bg-stadium-glow pointer-events-none" />
      {/* Pitch lines watermark */}
      <div
        className="absolute inset-0 bg-center bg-no-repeat bg-contain pointer-events-none"
        style={{ backgroundImage: 'url(/pitch-lines.svg)', opacity: 0.04 }}
      />

      {/* Ball decorative — top left corner */}
      <img
        src="/ball.svg"
        alt=""
        aria-hidden="true"
        className="absolute -top-16 -left-16 w-64 opacity-[0.06] pointer-events-none select-none -rotate-12"
      />

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background:
                'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)',
              border: '1px solid rgba(212,175,55,0.3)',
              boxShadow: '0 0 40px rgba(212,175,55,0.15)',
            }}
          >
            <FontAwesomeIcon icon={faTrophy} className="text-gold-400 text-2xl" />
          </div>
          <h1 className="font-display text-6xl tracking-wider text-white leading-none">DIWANIYA</h1>
          <p className="font-heading text-gold-400/70 text-xs uppercase tracking-[0.3em] mt-2">
            {t('auth.wcPredictions')}
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="h-px bg-gold-400/20 w-16" />
            <div className="w-1.5 h-1.5 rounded-full bg-gold-400/40" />
            <div className="h-px bg-gold-400/20 w-16" />
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(11, 26, 16, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(30, 62, 42, 0.8)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="font-heading text-xl font-semibold text-white uppercase tracking-wide mb-6">
            {t('auth.requestAccess')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-body text-xs text-[#8BA898] uppercase tracking-wider mb-1.5">
                {t('auth.displayName')}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('auth.yourName')}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block font-body text-xs text-[#8BA898] uppercase tracking-wider mb-1.5">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block font-body text-xs text-[#8BA898] uppercase tracking-wider mb-1.5">
                {t('auth.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block font-body text-xs text-[#8BA898] uppercase tracking-wider mb-1.5">
                {t('auth.confirmPassword')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={inputClass}
              />
            </div>

            {/* Flag selector */}
            <div>
              <label className="block font-body text-xs text-[#8BA898] uppercase tracking-wider mb-2">
                {t('auth.yourFlag')}
              </label>
              <div className="grid grid-cols-5 gap-2">
                {FLAG_OPTIONS.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setFlagCode(code)}
                    className={cn(
                      'relative rounded-lg overflow-hidden aspect-video border-2 transition-all duration-200',
                      flagCode === code
                        ? 'border-gold-400 ring-2 ring-gold-400/30 scale-105'
                        : 'border-border hover:border-border-glow opacity-60 hover:opacity-100',
                    )}
                  >
                    <img
                      src={getFlagUrl(code, 'w80')}
                      alt={code.toUpperCase()}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Approval notice */}
            <div className="flex items-start gap-2.5 bg-pitch-900/60 border border-border rounded-xl px-4 py-3">
              <FontAwesomeIcon
                icon={faInfoCircle}
                className="text-gold-400/70 text-sm mt-0.5 flex-shrink-0"
              />
              <p className="font-body text-xs text-[#8BA898] leading-relaxed">
                {t('auth.approvalNotice')}
              </p>
            </div>

            {error && (
              <p className="font-body text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'btn-gold w-full py-3 rounded-xl font-heading font-semibold text-sm tracking-widest uppercase',
                'flex items-center justify-center gap-2',
                isLoading && 'opacity-70 cursor-not-allowed',
              )}
            >
              {isLoading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
                  {t('auth.creatingAccount')}
                </>
              ) : (
                t('auth.requestAccess')
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border/50 text-center">
            <p className="font-body text-sm text-[#4A6458]">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link
                to="/login"
                className="text-gold-400 hover:text-gold-300 transition-colors font-medium"
              >
                {t('auth.signInLink')}
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-[#2E5A42] font-body mt-6 tracking-wider">
          {t('auth.privateCompetition')}
        </p>
      </div>
    </div>
  )
}
