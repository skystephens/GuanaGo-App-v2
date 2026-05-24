// ═══════════════════════════════════════════════════════════════════════
// GuanaGO — Sistema de Idiomas (i18n)
// Librería: react-i18next + i18next-browser-languagedetector
// Default: español | Soporta: inglés, portugués
// Detección: localStorage (guanago_lang) → navegador → fallback 'es'
// ═══════════════════════════════════════════════════════════════════════

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from '../locales/es.json';
import en from '../locales/en.json';
import pt from '../locales/pt.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      pt: { translation: pt },
    },
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false, // React ya escapa
    },
    detection: {
      // 1) idioma guardado por el usuario, 2) idioma del navegador
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'guanago_lang',
    },
  });

export default i18n;

// ─── Uso en cualquier componente ────────────────────────────────────────────
//
//   import { useTranslation } from 'react-i18next';
//
//   const MiComponente = () => {
//     const { t } = useTranslation();
//     return <h1>{t('home.title')}</h1>;
//   };
//
// ─── Selector de idioma ─────────────────────────────────────────────────────
//
//   const { i18n } = useTranslation();
//   i18n.changeLanguage('en');   // cambia y persiste en localStorage
