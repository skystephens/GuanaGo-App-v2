import React from 'react';
import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'es', flag: '🇨🇴', label: 'Español' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
] as const;

interface LanguageSelectorProps {
  /** 'pills' (default) — botones en fila | 'dropdown' — select nativo */
  variant?: 'pills' | 'dropdown';
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'pills', className = '' }) => {
  const { i18n } = useTranslation();
  const current = i18n.language?.slice(0, 2) ?? 'es';

  if (variant === 'dropdown') {
    return (
      <select
        value={current}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className={`bg-gray-100 border-0 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-emerald-500 cursor-pointer ${className}`}
        aria-label="Seleccionar idioma"
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.label}
          </option>
        ))}
      </select>
    );
  }

  // variant === 'pills'
  return (
    <div className={`flex items-center gap-2 ${className}`} role="group" aria-label="Idioma">
      {LANGS.map((l) => {
        const isActive = current === l.code;
        return (
          <button
            key={l.code}
            onClick={() => i18n.changeLanguage(l.code)}
            title={l.label}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all
              ${isActive
                ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
          >
            <span className="text-base leading-none">{l.flag}</span>
            <span className="hidden sm:inline">{l.label}</span>
            <span className="sm:hidden uppercase text-xs">{l.code}</span>
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSelector;
