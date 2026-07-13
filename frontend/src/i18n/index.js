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
    interpolation: { escapeValue: false }
  })

// Sem export — este módulo é importado por efeito colateral (inicializa o
// i18next). Os componentes usam o hook `useTranslation` do react-i18next.