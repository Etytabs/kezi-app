import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { 
  SupportedLanguage, 
  LANGUAGES, 
  initializeLanguage, 
  setLanguage as setI18nLanguage,
  t as translate,
} from "@/i18n";

interface LanguageContextType {
  language: SupportedLanguage;
  languages: typeof LANGUAGES;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
  t: (scope: string, options?: object) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");
  const [isLoading, setIsLoading] = useState(true);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const init = async () => {
      try {
        const initialLanguage = await initializeLanguage();
        setLanguageState(initialLanguage);
      } catch (error) {
        console.error("Error initializing language:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const setLanguage = useCallback(async (newLanguage: SupportedLanguage) => {
    try {
      await setI18nLanguage(newLanguage);
      setLanguageState(newLanguage);
      forceUpdate({});
    } catch (error) {
      console.error("Error setting language:", error);
    }
  }, []);

  const t = useCallback((scope: string, options?: object): string => {
    return translate(scope, options);
  }, [language]);

  const value: LanguageContextType = {
    language,
    languages: LANGUAGES,
    setLanguage,
    t,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function useTranslation() {
  const { t, language } = useLanguage();
  return { t, language };
}
