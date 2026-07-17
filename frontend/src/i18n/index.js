import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import pt from './pt.json'
import en from './en.json'
import es from './es.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      es: { translation: es }
    },
    fallbackLng: 'pt',
    // O idioma do utilizador vive na base de dados (aplicado no login pelo
    // AuthContext). Não guardamos nem lemos cache do browser — só usamos o
    // idioma do browser como palpite inicial antes do login.
    detection: { order: ['navigator'], caches: [] },
    interpolation: { escapeValue: false }
  })

// Remove a cache antiga deixada por versões anteriores (deixou de ser usada).
localStorage.removeItem('i18nextLng')

