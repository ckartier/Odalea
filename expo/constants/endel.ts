import { Platform } from 'react-native';

export const ENDEL = {
  colors: {
    bg: '#FFFFFF',
    text: '#111111',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    borderSubtle: '#F3F4F6',
    accent: '#000000',
    danger: '#EF4444',
    success: '#10B981',
  },
  radii: {
    card: 18,
    sheet: 20,
    pill: 999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    title: {
      fontSize: 22,
      lineHeight: 26,
      fontWeight: '700' as const,
      color: '#111111',
      letterSpacing: -0.2,
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500' as const,
      color: '#6B7280',
    },
    body: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '500' as const,
      color: '#111111',
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600' as const,
      color: '#6B7280',
    },
  },
  shadows: {
    card: Platform.select({
      ios: {
        shadowColor: 'rgba(17, 17, 17, 0.08)',
        shadowOpacity: 1,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 2 },
      default: {
        shadowColor: 'rgba(17, 17, 17, 0.08)',
        shadowOpacity: 1,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      },
    }),
  },
} as const;
