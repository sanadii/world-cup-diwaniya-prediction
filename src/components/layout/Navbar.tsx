import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse,
  faCalendarDays,
  faTrophy,
  faUserShield,
  faBars,
  faXmark,
  faBell,
  faChevronDown,
  faArrowRightFromBracket,
  faCircle,
} from '@fortawesome/free-solid-svg-icons'
import { cn, formatKuwaitTime, getFlagUrl } from '@/lib/utils'
import { useAuthContext } from '@/contexts/useAuthContext'
import { useNotifications, useMarkNotificationRead, useUnreadCount } from '@/hooks/useNotifications'

const navItems = [
  { path: '/', label: 'Home', icon: faHouse },
  { path: '/matches', label: 'Matches', icon: faCalendarDays },
  { path: '/leaderboard', label: 'Leaderboard', icon: faTrophy },
]

export function Navbar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const { profile, isAdmin, signOut } = useAuthContext()
  const { data: notifications = [] } = useNotifications()
  const unreadCount = useUnreadCount()
  const markRead = useMarkNotificationRead()

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleBellClick() {
    setBellOpen((v) => !v)
    setUserMenuOpen(false)
  }

  function handleUserClick() {
    setUserMenuOpen((v) => !v)
    setBellOpen(false)
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16">
        <div className="absolute inset-0 bg-pitch-950/90 backdrop-blur-md border-b border-border" />

        <div className="relative h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gold-400/10 border border-gold-400/30 flex items-center justify-center group-hover:bg-gold-400/20 transition-colors">
              <FontAwesomeIcon icon={faTrophy} className="text-gold-400 text-xs" />
            </div>
            <div className="hidden sm:block">
              <div className="font-display text-xl tracking-wider text-white leading-none">
                DIWANIYA
              </div>
              <div className="font-body text-[9px] text-gold-400/70 uppercase tracking-[0.2em] leading-none mt-0.5">
                WC 2026 Predictions
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active =
                location.pathname === item.path ||
                (item.path === '/matches' &&
                  ['/matches', '/tables', '/bracket'].includes(location.pathname))
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
                  <FontAwesomeIcon
                    icon={item.icon}
                    className={cn('text-xs', active && 'text-gold-400')}
                  />
                  {item.label}
                </Link>
              )
            })}
            {isAdmin && (
              <Link
                to="/admin"
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-heading font-medium tracking-wide transition-all duration-200',
                  location.pathname === '/admin'
                    ? 'bg-gold-500/20 text-gold-400 border border-gold-400/30'
                    : 'text-gold-400/70 hover:text-gold-400 hover:bg-gold-500/10',
                )}
              >
                <FontAwesomeIcon icon={faUserShield} className="text-xs" />
                Admin
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={handleBellClick}
                className="relative w-9 h-9 rounded-lg bg-pitch-800 border border-border flex items-center justify-center text-[#8BA898] hover:text-white hover:border-border-glow transition-all"
              >
                <FontAwesomeIcon icon={faBell} className="text-sm" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gold-400 text-pitch-950 rounded-full text-[10px] font-heading font-bold flex items-center justify-center px-1 ring-2 ring-pitch-950">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Bell dropdown */}
              {bellOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 glass-card rounded-xl z-50 overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="font-heading text-sm font-semibold text-white tracking-wide">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] text-gold-400 font-heading">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-[#4A6458] font-body text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => markRead.mutate(n.id)}
                          className={cn(
                            'w-full text-left px-4 py-3 border-b border-border/40 last:border-0 hover:bg-pitch-700/40 transition-colors',
                            !n.isRead && 'bg-gold-500/5',
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {!n.isRead && (
                              <FontAwesomeIcon
                                icon={faCircle}
                                className="text-gold-400 text-[6px] mt-1.5 flex-shrink-0"
                              />
                            )}
                            <div className={cn('flex-1', n.isRead && 'ml-3.5')}>
                              <div className="font-heading text-xs font-semibold text-white leading-snug">
                                {n.title}
                              </div>
                              {n.body && (
                                <div className="font-body text-[11px] text-[#8BA898] mt-0.5 line-clamp-2">
                                  {n.body}
                                </div>
                              )}
                              <div className="font-body text-[10px] text-[#4A6458] mt-1">
                                {formatKuwaitTime(n.createdAt, 'relative')}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User dropdown */}
            <div className="relative" ref={userRef}>
              <button
                onClick={handleUserClick}
                className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl bg-pitch-800 border border-border hover:border-border-glow transition-all group"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-pitch-700 flex items-center justify-center">
                  <img
                    src={getFlagUrl(profile?.flagCode ?? 'kw', 'w40')}
                    alt={profile?.flagCode ?? 'flag'}
                    className="w-full h-full object-cover opacity-80"
                  />
                </div>
                <span className="hidden sm:flex items-center gap-1.5 text-sm font-heading font-medium text-white">
                  {profile?.displayName ?? '...'}
                  {isAdmin && (
                    <span className="text-[9px] bg-gold-400/20 text-gold-400 border border-gold-400/30 rounded px-1 py-0.5 uppercase tracking-wider font-semibold">
                      ADMIN
                    </span>
                  )}
                </span>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="text-[10px] text-[#8BA898] group-hover:text-gold-400 transition-colors"
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 glass-card rounded-xl py-1 z-50 shadow-2xl">
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-heading text-[#8BA898] hover:text-white hover:bg-pitch-700/50 transition-all"
                  >
                    My Profile
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-heading text-gold-400/80 hover:text-gold-400 hover:bg-pitch-700/50 transition-all"
                    >
                      <FontAwesomeIcon icon={faUserShield} className="text-xs" />
                      Admin Panel
                    </Link>
                  )}
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      signOut()
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-heading text-[#8BA898] hover:text-red-400 hover:bg-pitch-700/50 transition-all"
                  >
                    <FontAwesomeIcon icon={faArrowRightFromBracket} className="text-xs" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile toggle */}
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
          <div
            className="absolute inset-0 bg-pitch-950/95 backdrop-blur-lg"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative bg-pitch-900 border-b border-border p-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                ...navItems,
                ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: faUserShield }] : []),
              ].map((item) => {
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
                        : item.path === '/admin'
                          ? 'text-gold-400/70 hover:text-gold-400 hover:bg-gold-500/10'
                          : 'text-[#8BA898] hover:text-white hover:bg-pitch-800',
                    )}
                  >
                    <FontAwesomeIcon
                      icon={item.icon}
                      className={cn('text-lg', active && 'text-gold-400')}
                    />
                    <span className="text-xs font-heading font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <button
                onClick={() => {
                  setMobileOpen(false)
                  signOut()
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#8BA898] hover:text-red-400 hover:bg-pitch-800 transition-all text-sm font-heading"
              >
                <FontAwesomeIcon icon={faArrowRightFromBracket} className="text-xs" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
