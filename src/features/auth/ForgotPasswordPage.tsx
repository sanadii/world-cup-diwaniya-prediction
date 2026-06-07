import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrophy, faSpinner, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export function ForgotPasswordPage() {
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
      setError(err instanceof Error ? err.message : 'Failed to send reset link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-pitch-950 turf-overlay flex items-center justify-center px-4 py-12">
      <div className="fixed top-0 left-0 right-0 h-96 bg-stadium-glow pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-400/10 border border-gold-400/30 mb-4">
            <FontAwesomeIcon icon={faTrophy} className="text-gold-400 text-2xl" />
          </div>
          <h1 className="font-display text-5xl tracking-wider text-white leading-none">DIWANIYA</h1>
          <p className="font-heading text-gold-400/80 text-sm uppercase tracking-[0.2em] mt-1">
            World Cup 2026
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="font-heading text-xl font-semibold text-white uppercase tracking-wide mb-2">
            Reset Password
          </h2>
          <p className="font-body text-sm text-[#8BA898] mb-6">
            Enter your email and we'll send you a link to reset your password.
          </p>

          {success ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-400 text-2xl" />
              </div>
              <div>
                <p className="font-heading font-semibold text-white uppercase tracking-wide">
                  Check your email
                </p>
                <p className="font-body text-sm text-[#8BA898] mt-1">
                  A password reset link has been sent to <span className="text-white">{email}</span>
                  .
                </p>
              </div>
              <Link
                to="/login"
                className="font-body text-sm text-gold-400 hover:text-gold-300 transition-colors mt-2"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-xs text-[#8BA898] uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className={cn(
                    'w-full bg-pitch-900 border border-border rounded-xl px-4 py-3',
                    'font-body text-sm text-white placeholder-[#4A6458]',
                    'focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400/50',
                    'transition-all duration-200',
                  )}
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
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <div className="text-center mt-4">
                <Link
                  to="/login"
                  className="font-body text-sm text-[#8BA898] hover:text-gold-400 transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
