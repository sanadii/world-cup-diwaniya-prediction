import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrophy, faSpinner, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { useAuthContext } from '@/contexts/useAuthContext'
import { cn, getFlagUrl } from '@/lib/utils'

const FLAG_OPTIONS = ['kw', 'sa', 'ae', 'eg', 'iq', 'jo', 'us', 'gb', 'fr', 'br']

export function RegisterPage() {
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
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setIsLoading(true)
    try {
      await signUp(email, password, displayName, flagCode)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = cn(
    'w-full bg-pitch-900 border border-border rounded-xl px-4 py-3',
    'font-body text-sm text-white placeholder-[#4A6458]',
    'focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400/50',
    'transition-all duration-200',
  )

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
          <h2 className="font-heading text-xl font-semibold text-white uppercase tracking-wide mb-6">
            Request Access
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-body text-xs text-[#8BA898] uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
                className={inputClass}
              />
            </div>

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
                className={inputClass}
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
                className={inputClass}
              />
            </div>

            <div>
              <label className="block font-body text-xs text-[#8BA898] uppercase tracking-wider mb-1.5">
                Confirm Password
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
                Your Flag
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
                Your account requires admin approval before you can participate.
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
                  Creating Account...
                </>
              ) : (
                'Request Access'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-body text-sm text-[#4A6458]">
              Already have an account?{' '}
              <Link to="/login" className="text-gold-400 hover:text-gold-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
