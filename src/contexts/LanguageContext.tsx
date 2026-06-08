import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { applyDirection, type Language } from '@/i18n'

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language, userId?: string) => Promise<void>
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'ar',
  setLanguage: async () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const [language, setLanguageState] = useState<Language>((i18n.language as Language) ?? 'ar')

  const setLanguage = useCallback(
    async (lang: Language, userId?: string) => {
      // 1. Apply to i18next
      await i18n.changeLanguage(lang)
      // 2. Apply RTL/LTR direction
      applyDirection(lang)
      // 3. Save to localStorage
      localStorage.setItem('preferred_language', lang)
      // 4. Update React state
      setLanguageState(lang)
      // 5. Persist to DB if user is logged in
      if (userId) {
        await supabase
          .from('profiles')
          .update({ preferred_language: lang })
          .eq('id', userId)
          .then(() => {})
      }
    },
    [i18n],
  )

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  return useContext(LanguageContext)
}
