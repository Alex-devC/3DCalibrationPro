import React, { createContext, useContext, useState, useEffect } from 'react';
import { ptBR } from './pt-BR/index.ts';
import { enUS } from './en-US/index.ts';

export type SupportedLanguage = 'pt-BR' | 'en-US';

type TranslationType = typeof ptBR;

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  translations: TranslationType;
}

const translationsMap: Record<SupportedLanguage, TranslationType> = {
  'pt-BR': ptBR,
  'en-US': enUS,
};

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_LANG_KEY = '3dcp_language_pref';

function getInitialLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === 'pt-BR' || saved === 'en-US') {
      return saved;
    }
    const browserLang = navigator.language || '';
    if (browserLang.toLowerCase().startsWith('en')) {
      return 'en-US';
    }
  } catch {
    // fallback
  }
  // Portuguese (Brazil) must be the default fallback
  return 'pt-BR';
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(getInitialLanguage);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const currentTranslations = translationsMap[language] || ptBR;

  // Dot-notation accessor with interpolation {key}
  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current: any = currentTranslations;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback to ptBR if key missing in selected language
        let fallback: any = ptBR;
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            fallback = path;
            break;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    if (!params) return current;

    return Object.entries(params).reduce((acc, [key, val]) => {
      return acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    }, current);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, translations: currentTranslations }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
