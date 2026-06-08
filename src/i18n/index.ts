import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ar from './locales/ar.json'

export type Language = 'en' | 'ar'
export const SUPPORTED_LANGUAGES: Language[] = ['ar', 'en']
export const DEFAULT_LANGUAGE: Language = 'ar'

const savedLang = (localStorage.getItem('preferred_language') as Language) ?? DEFAULT_LANGUAGE

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

// Apply direction immediately on load
applyDirection(savedLang)

export function applyDirection(lang: Language) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.dir = dir
  document.documentElement.lang = lang
  document.documentElement.setAttribute('data-lang', lang)
}

export default i18n
