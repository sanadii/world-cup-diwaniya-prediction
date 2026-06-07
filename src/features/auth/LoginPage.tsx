import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrophy, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { useAuthContext } from '@/contexts/useAuthContext'
import { cn } from '@/lib/utils'

export function LoginPage() {
  const { signIn } = useAuthContext()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-pitch-950 turf-overlay flex items-center justify-center px-4 py-12">
      {/* Stadium glow */}
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
          <h2 className="font-heading text-xl font-semibold text-white uppercase tracking-wide mb-6">
            Sign In
          </h2>

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

            <div>
              <label className="block font-body text-xs text-[#8BA898] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <Link
              to="/forgot-password"
              className="block font-body text-sm text-[#8BA898] hover:text-gold-400 transition-colors"
            >
              Forgot password?
            </Link>
            <p className="font-body text-sm text-[#4A6458]">
              Don't have an account?{' '}
              <Link to="/register" className="text-gold-400 hover:text-gold-300 transition-colors">
                Request access
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
