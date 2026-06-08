import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrophy, faSpinner, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) throw resetError
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.resetFailed'))
    } finally {
      setIsLoading(false)
    }
  }

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

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
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
          <h2 className="font-heading text-xl font-semibold text-white uppercase tracking-wide mb-2">
            {t('auth.resetPassword')}
          </h2>
          <p className="font-body text-sm text-[#8BA898] mb-6">{t('auth.enterResetEmail')}</p>

          {success ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-400 text-2xl" />
              </div>
              <div>
                <p className="font-heading font-semibold text-white uppercase tracking-wide">
                  {t('auth.checkEmail')}
                </p>
                <p className="font-body text-sm text-[#8BA898] mt-1">
                  {t('auth.resetLinkSent')} <span className="text-white">{email}</span>.
                </p>
              </div>
              <Link
                to="/login"
                className="font-body text-sm text-gold-400 hover:text-gold-300 transition-colors mt-2"
              >
                {t('auth.backToSignIn')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-xs text-[#8BA898] uppercase tracking-wider mb-1.5">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className={cn(
                    'w-full border rounded-xl px-4 py-3',
                    'font-body text-sm text-white placeholder-[#4A6458]',
                    'focus:outline-none focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50',
                    'transition-all duration-200',
                  )}
                  style={{
                    background: 'rgba(6, 13, 9, 0.8)',
                    borderColor: 'rgba(30, 62, 42, 0.8)',
                  }}
                />
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
                    {t('auth.sending')}
                  </>
                ) : (
                  t('auth.sendResetLink')
                )}
              </button>

              <div className="text-center mt-4">
                <Link
                  to="/login"
                  className="font-body text-sm text-[#8BA898] hover:text-gold-400 transition-colors"
                >
                  {t('auth.backToSignIn')}
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] text-[#2E5A42] font-body mt-6 tracking-wider">
          {t('auth.privateCompetition')}
        </p>
      </div>
    </div>
  )
}
