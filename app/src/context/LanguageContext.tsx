import React, { createContext, useContext, useState } from 'react';

export type Lang = 'en' | 'hu';

type LangCtx = { lang: Lang; setLang: (l: Lang) => void };

const LanguageContext = createContext<LangCtx>({ lang: 'en', setLang: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
