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
  faLanguage,
} from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { cn, formatKuwaitTime, getFlagUrl } from '@/lib/utils'
import { useAuthContext } from '@/contexts/useAuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useNotifications, useMarkNotificationRead, useUnreadCount } from '@/hooks/useNotifications'

export function Navbar() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const { profile, isAdmin, signOut, user } = useAuthContext()
  const { language, setLanguage } = useLanguage()
  const { data: notifications = [] } = useNotifications()
  const unreadCount = useUnreadCount()
  const markRead = useMarkNotificationRead()

  const navItems = [
    { path: '/', label: t('nav.home'), icon: faHouse },
    { path: '/matches', label: t('nav.matches'), icon: faCalendarDays },
    { path: '/leaderboard', label: t('nav.leaderboard'), icon: faTrophy },
  ]

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

  function toggleLanguage() {
    const next = language === 'ar' ? 'en' : 'ar'
    void setLanguage(next, user?.id)
  }

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 h-16">
        <div
          className="absolute inset-0 bg-pitch-900/90 backdrop-blur-xl border-b border-white/10"
          style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.07), 0 4px 24px rgba(0,0,0,0.5)' }}
        />

        <div className="relative h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className="w-9 h-9 rounded-lg bg-gold-400/10 border border-gold-400/30 flex items-center justify-center group-hover:bg-gold-400/20 transition-colors"
              style={{ boxShadow: '0 0 14px rgba(212,175,55,0.18)' }}
            >
              <FontAwesomeIcon icon={faTrophy} className="text-gold-400 text-sm" />
            </div>
            <div className="hidden sm:block">
              <div className="font-display text-xl tracking-wider text-white leading-none">
                {i18n.language === 'ar' ? 'ديوانية' : 'DIWANIYA'}
              </div>
              <div className="font-body text-[10px] text-gold-400 uppercase leading-none mt-0.5">
                {t('nav.wcPredictions')}
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const basePath = item.path.split('?')[0]
              const active =
                location.pathname === basePath ||
                (basePath === '/matches' &&
                  ['/matches', '/tables', '/bracket'].includes(location.pathname))
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-heading font-medium tracking-wide transition-all duration-200',
                    active
                      ? 'bg-primary/20 text-white border border-primary/40'
                      : 'text-secondary hover:text-white hover:bg-pitch-800/80',
                  )}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className={cn('text-xs', active ? 'text-primary' : '')}
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
                {t('nav.admin')}
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              title={t('common.language')}
              className="flex items-center gap-1.5 w-auto h-9 px-2.5 rounded-lg bg-pitch-800 border border-white/10 text-secondary hover:text-gold-400 hover:border-gold-400/40 transition-all text-xs font-heading tracking-wide"
            >
              <FontAwesomeIcon icon={faLanguage} className="text-sm" />
              <span className="hidden sm:inline">
                {language === 'ar' ? t('common.english') : t('common.arabic')}
              </span>
            </button>

            {/* Notification bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={handleBellClick}
                className="relative w-9 h-9 rounded-lg bg-pitch-800 border border-white/10 flex items-center justify-center text-secondary hover:text-white hover:border-white/20 transition-all"
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
                <div className="absolute end-0 top-full mt-2 w-80 glass-card rounded-xl z-50 overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <span className="font-heading text-sm font-semibold text-white tracking-wide">
                      {t('nav.notifications')}
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] text-gold-400 font-heading">
                        {t('nav.newCount', { count: unreadCount })}
                      </span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-muted font-body text-sm">
                        {t('nav.noNotifications')}
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => markRead.mutate(n.id)}
                          className={cn(
                            'w-full text-start px-4 py-3 border-b border-white/5 last:border-0 hover:bg-pitch-700/50 transition-colors',
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
                            <div className={cn('flex-1', n.isRead && 'ms-3.5')}>
                              <div className="font-heading text-xs font-semibold text-white leading-snug">
                                {n.title}
                              </div>
                              {n.body && (
                                <div className="font-body text-[11px] text-secondary mt-0.5 line-clamp-2">
                                  {n.body}
                                </div>
                              )}
                              <div className="font-body text-[10px] text-muted mt-1">
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
                className="flex items-center gap-2.5 ps-1 pe-3 py-1 rounded-xl bg-pitch-800 border border-white/10 hover:border-white/20 transition-all group"
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
                  className="text-[10px] text-secondary group-hover:text-gold-400 transition-colors"
                />
              </button>

              {userMenuOpen && (
                <div className="absolute end-0 top-full mt-2 w-48 glass-card rounded-xl py-1 z-50 shadow-2xl">
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-heading text-secondary hover:text-white hover:bg-pitch-700/50 transition-all"
                  >
                    {t('nav.myProfile')}
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-heading text-gold-400/80 hover:text-gold-400 hover:bg-pitch-700/50 transition-all"
                    >
                      <FontAwesomeIcon icon={faUserShield} className="text-xs" />
                      {t('nav.adminPanel')}
                    </Link>
                  )}
                  <div className="border-t border-white/10 my-1" />
                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      void signOut()
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-heading text-secondary hover:text-red-400 hover:bg-pitch-700/50 transition-all"
                  >
                    <FontAwesomeIcon icon={faArrowRightFromBracket} className="text-xs" />
                    {t('nav.signOut')}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden w-9 h-9 rounded-lg bg-pitch-800 border border-white/10 flex items-center justify-center text-secondary hover:text-white"
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
          <div className="relative bg-pitch-900 border-b border-white/10 p-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                ...navItems,
                ...(isAdmin ? [{ path: '/admin', label: t('nav.admin'), icon: faUserShield }] : []),
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
                        ? 'bg-primary/20 border border-primary/40 text-white'
                        : item.path === '/admin'
                          ? 'text-gold-400/70 hover:text-gold-400 hover:bg-gold-500/10'
                          : 'text-secondary hover:text-white hover:bg-pitch-800',
                    )}
                  >
                    <FontAwesomeIcon
                      icon={item.icon}
                      className={cn('text-lg', active ? 'text-primary' : '')}
                    />
                    <span className="text-xs font-heading font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
              <button
                onClick={() => {
                  toggleLanguage()
                  setMobileOpen(false)
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-pitch-800 border border-white/10 text-secondary hover:text-gold-400 text-sm font-heading"
              >
                <FontAwesomeIcon icon={faLanguage} />
                {language === 'ar' ? t('common.english') : t('common.arabic')}
              </button>
              <button
                onClick={() => {
                  setMobileOpen(false)
                  void signOut()
                }}
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-secondary hover:text-red-400 hover:bg-pitch-800 transition-all text-sm font-heading"
              >
                <FontAwesomeIcon icon={faArrowRightFromBracket} className="text-xs" />
                {t('nav.signOut')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
