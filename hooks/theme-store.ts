import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Appearance, ColorSchemeName } from 'react-native';
import { COLORS } from '@/constants/colors';
import { usePets } from './pets-store';

export type Gender = 'male' | 'female' | 'unknown';

export interface ThemeColors {
  background: string;
  primary: string;
  accent: string;
  text: string;
  card: string;
  border: string;
}

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEYS = {
  themeMode: 'app.theme.mode',
  accent: 'app.theme.accent',
} as const;

export const [ThemeContext, useTheme] = createContextHook(() => {
  const petsContext = usePets();
  const [mode, setMode] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());
  const [accent, setAccent] = useState<string>(COLORS.accent);

  const isDark = useMemo(() => {
    const scheme = mode === 'system' ? systemScheme : mode;
    return scheme === 'dark';
  }, [mode, systemScheme]);

  const [currentTheme, setCurrentTheme] = useState<ThemeColors>({
    background: COLORS.screenBackground,
    primary: COLORS.primary,
    accent: COLORS.accent,
    text: COLORS.black,
    card: COLORS.cardBackground,
    border: COLORS.border,
  });

  const getPrimaryPetGender = (): Gender => {
    const userPets = petsContext?.userPets ?? [];
    if (!userPets || userPets.length === 0) return 'unknown';
    const primaryPet = userPets.find((pet: any) => pet?.isPrimary) || userPets[0];
    const g = primaryPet?.gender;
    if (g === 'male' || g === 'female') return g;
    return 'unknown';
  };

  const computeTheme = (dark: boolean): ThemeColors => {
    const gender = getPrimaryPetGender();
    const genderAccent = gender === 'female' ? COLORS.femaleAccent : gender === 'male' ? COLORS.maleAccent : accent;
    if (dark) {
      return {
        background: COLORS.darkBackground,
        primary: COLORS.white,
        accent: genderAccent,
        text: COLORS.darkText,
        card: COLORS.darkCard,
        border: COLORS.darkBorder,
      };
    }
    return {
      background: COLORS.screenBackground,
      primary: COLORS.primary,
      accent: genderAccent,
      text: COLORS.black,
      card: COLORS.cardBackground,
      border: COLORS.border,
    };
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [storedMode, storedAccent] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.themeMode),
          AsyncStorage.getItem(STORAGE_KEYS.accent),
        ]);
        if (!mounted) return;
        if (storedMode === 'light' || storedMode === 'dark' || storedMode === 'system') {
          setMode(storedMode);
        }
        if (storedAccent && /^#([0-9A-Fa-f]{3}){1,2}$/.test(storedAccent)) {
          setAccent(storedAccent);
        }
      } catch (e) {
        console.log('Theme preload error', e);
      }
    })();
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    setCurrentTheme(computeTheme(isDark));
  }, [isDark, petsContext?.userPets, accent]);

  const setThemeMode = async (m: ThemeMode) => {
    try {
      setMode(m);
      await AsyncStorage.setItem(STORAGE_KEYS.themeMode, m);
    } catch (e) {
      console.log('Failed to persist theme mode', e);
    }
  };

  const setAccentColor = async (hex: string) => {
    try {
      if (!/^#([0-9A-Fa-f]{3}){1,2}$/.test(hex)) return;
      setAccent(hex);
      await AsyncStorage.setItem(STORAGE_KEYS.accent, hex);
    } catch (e) {
      console.log('Failed to persist accent', e);
    }
  };

  const getGradientColors = () => {
    const base = currentTheme.accent;
    return [base, COLORS.accentLight, COLORS.lightGray];
  };

  const getThemedColor = (colorType: 'primary' | 'background' | 'accent' | 'card' | 'text' | 'border') => {
    switch (colorType) {
      case 'primary':
        return currentTheme.primary;
      case 'background':
        return currentTheme.background;
      case 'accent':
        return currentTheme.accent;
      case 'card':
        return currentTheme.card;
      case 'text':
        return currentTheme.text;
      case 'border':
        return currentTheme.border;
      default:
        return currentTheme.primary;
    }
  };

  return {
    currentTheme,
    mode,
    isDark,
    accent,
    setThemeMode,
    setAccentColor,
    getGradientColors,
    getThemedColor,
    primaryPetGender: getPrimaryPetGender(),
  };
});