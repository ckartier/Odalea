import { useState, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { loadLanguagePreference, saveLanguagePreference, t, getCurrentLocale } from '@/services/i18n';
import { Platform } from 'react-native';

export const [I18nContext, useI18n] = createContextHook(() => {
  const [currentLocale, setCurrentLocale] = useState<'en' | 'fr' | 'es' | 'de' | 'it'>('fr'); // Default to French
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const locale = await loadLanguagePreference();
        setCurrentLocale(locale as 'en' | 'fr' | 'es' | 'de' | 'it');
      } catch (error) {
        console.error('Error initializing language:', error);
        setCurrentLocale('fr'); // Default to French
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguage();
  }, []);

  const changeLanguage = async (language: 'en' | 'fr' | 'es' | 'de' | 'it') => {
    try {
      await saveLanguagePreference(language);
      setCurrentLocale(language);
      
      if (Platform.OS === 'web') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const translate = (key: string, options?: any): string => {
    return t(key, options);
  };

  return {
    currentLocale,
    isLoading,
    changeLanguage,
    t: translate,
    getCurrentLocale,
  };
});