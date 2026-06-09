import { useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faTableList, faSitemap } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { MatchCalendarPage } from '@/features/matches/MatchCalendarPage'
import { GroupTablesPage } from '@/features/tables/GroupTablesPage'
import { KnockoutBracketPage } from '@/features/bracket/KnockoutBracketPage'

type Tab = 'calendar' | 'groups' | 'bracket'

export function TournamentPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const activeTab: Tab = (params.get('tab') as Tab) ?? 'calendar'

  const TABS: { id: Tab; label: string; icon: typeof faCalendarDays }[] = [
    { id: 'calendar', label: t('tournament.calendar'), icon: faCalendarDays },
    { id: 'groups', label: t('tournament.groups'), icon: faTableList },
    { id: 'bracket', label: t('tournament.bracket'), icon: faSitemap },
  ]

  function setTab(tab: Tab) {
    setParams(tab === 'calendar' ? {} : { tab })
  }

  return (
    <div className="animate-fade-in">
      {/* Tab bar */}
      <div className="sticky top-16 z-30 bg-pitch-950/90 backdrop-blur-md border-b border-border px-4">
        <div className="max-w-7xl mx-auto flex gap-1 py-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-heading font-semibold tracking-wide transition-all',
                activeTab === tab.id
                  ? 'bg-pitch-700 text-white border border-border-glow/50'
                  : 'text-[#8BA898] hover:text-white hover:bg-pitch-800',
              )}
            >
              <FontAwesomeIcon
                icon={tab.icon}
                className={cn('text-xs', activeTab === tab.id && 'text-gold-400')}
              />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'calendar' && <MatchCalendarPage />}
      {activeTab === 'groups' && <GroupTablesPage />}
      {activeTab === 'bracket' && <KnockoutBracketPage />}
    </div>
  )
}
