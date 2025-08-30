import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

const i18n = new I18n({
  en,
  fr,
});

// Set the locale once at the beginning of your app - default to French as specified
i18n.locale = 'fr';

// When a value is missing from a language it'll fallback to another language with the key present
i18n.enableFallback = true;
i18n.defaultLocale = 'fr'; // Default to French as specified

// Load saved language preference
export const loadLanguagePreference = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem('user_language');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'fr')) {
      i18n.locale = savedLanguage;
      return savedLanguage;
    }
    
    // Default to French as specified
    i18n.locale = 'fr';
    return 'fr';
  } catch (error) {
    console.error('Error loading language preference:', error);
    return 'fr'; // Default to French
  }
};

// Save language preference
export const saveLanguagePreference = async (language: 'en' | 'fr'): Promise<void> => {
  try {
    await AsyncStorage.setItem('user_language', language);
    i18n.locale = language;
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};

// Translation function
export const t = (key: string, options?: any): string => {
  return i18n.t(key, options);
};

// Get current locale
export const getCurrentLocale = (): string => {
  return i18n.locale;
};

// Check if current locale is RTL
export const isRTL = (): boolean => {
  return Localization.getLocales()[0]?.textDirection === 'rtl' || false;
};

export default i18n;