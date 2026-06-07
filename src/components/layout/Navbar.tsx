import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faCalendarDays, faBullseye, faTrophy,
  faTableList, faSitemap, faUserShield, faBars, faXmark,
  faBell, faChevronDown,
} from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'Home', icon: faHouse },
  { path: '/predict', label: 'Predict', icon: faBullseye },
  { path: '/matches', label: 'Matches', icon: faCalendarDays },
  { path: '/leaderboard', label: 'Leaderboard', icon: faTrophy },
  { path: '/tables', label: 'Tables', icon: faTableList },
  { path: '/bracket', label: 'Bracket', icon: faSitemap },
]

export function Navbar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16">
        {/* Backdrop blur bar */}
        <div className="absolute inset-0 bg-pitch-950/90 backdrop-blur-md border-b border-border" />

        <div className="relative h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gold-400/10 border border-gold-400/30 flex items-center justify-center group-hover:bg-gold-400/20 transition-colors">
              <FontAwesomeIcon icon={faTrophy} className="text-gold-400 text-xs" />
            </div>
            <div className="hidden sm:block">
              <div className="font-display text-xl tracking-wider text-white leading-none">DIWANIYA</div>
              <div className="font-body text-[9px] text-gold-400/70 uppercase tracking-[0.2em] leading-none mt-0.5">
                WC 2026 Predictions
              </div>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-heading font-medium tracking-wide transition-all duration-200',
                    active
                      ? 'bg-pitch-700 text-white border border-border-glow/50'
                      : 'text-[#8BA898] hover:text-white hover:bg-pitch-800',
                  )}
                >
                  <FontAwesomeIcon icon={item.icon} className={cn('text-xs', active && 'text-gold-400')} />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative w-9 h-9 rounded-lg bg-pitch-800 border border-border flex items-center justify-center text-[#8BA898] hover:text-white hover:border-border-glow transition-all">
              <FontAwesomeIcon icon={faBell} className="text-sm" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold-400 rounded-full ring-1 ring-pitch-950" />
            </button>

            {/* User avatar */}
            <button className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl bg-pitch-800 border border-border hover:border-border-glow transition-all group">
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-pitch-700 flex items-center justify-center">
                <img
                  src={`https://flagcdn.com/w40/fr.png`}
                  alt="flag"
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
              <span className="hidden sm:block text-sm font-heading font-medium text-white">You</span>
              <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-[#8BA898] group-hover:text-gold-400 transition-colors" />
            </button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden w-9 h-9 rounded-lg bg-pitch-800 border border-border flex items-center justify-center text-[#8BA898] hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <FontAwesomeIcon icon={mobileOpen ? faXmark : faBars} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 pt-16">
          <div className="absolute inset-0 bg-pitch-950/95 backdrop-blur-lg" onClick={() => setMobileOpen(false)} />
          <div className="relative bg-pitch-900 border-b border-border p-4">
            <div className="grid grid-cols-3 gap-2">
              {navItems.map((item) => {
                const active = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
                      active
                        ? 'bg-pitch-700 border border-border-glow/50 text-white'
                        : 'text-[#8BA898] hover:text-white hover:bg-pitch-800',
                    )}
                  >
                    <FontAwesomeIcon icon={item.icon} className={cn('text-lg', active && 'text-gold-400')} />
                    <span className="text-xs font-heading font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Admin link */}
            <div className="mt-3 pt-3 border-t border-border">
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#8BA898] hover:text-white hover:bg-pitch-800 transition-all text-sm font-heading"
              >
                <FontAwesomeIcon icon={faUserShield} className="text-xs" />
                Admin Panel
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
