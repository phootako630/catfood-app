import { createContext, useContext, useState, type ReactNode } from 'react'
import { translations, type Lang, type Translations } from './translations'

interface LanguageState {
  lang: Lang
  t: Translations
  setLang: (lang: Lang) => void
}

const LanguageContext = createContext<LanguageState | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem('app_lang') as Lang) || 'zh'
  )

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('app_lang', l)
  }

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be inside LanguageProvider')
  return ctx
}
