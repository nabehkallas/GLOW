import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from './locales/ar.json'
import en from './locales/en.json'

const savedLang = localStorage.getItem('glow_lang') || 'ar'

// Set document direction on startup
document.documentElement.dir  = savedLang === 'ar' ? 'rtl' : 'ltr'
document.documentElement.lang = savedLang

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export function switchLanguage(lang) {
  i18n.changeLanguage(lang)
  localStorage.setItem('glow_lang', lang)
  document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
}

export default i18n
