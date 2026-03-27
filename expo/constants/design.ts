import { SCREEN_WIDTH, scale, moderateScale } from './responsive';

export const DESIGN = {
  colors: {
    primary: '#000000',
    primaryLight: '#333333',
    
    background: '#FFFFFF',
    backgroundSecondary: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceSecondary: '#F5F5F5',
    
    text: '#000000',
    textSecondary: '#333333',
    textTertiary: '#999999',
    textInverse: '#FFFFFF',
    
    border: '#E5E5E5',
    borderLight: '#F0F0F0',
    
    placeholder: '#CCCCCC',
    
    error: '#DC2626',
    success: '#10B981',
    warning: '#F59E0B',
  },
  
  shadows: {
    soft: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
      elevation: 6,
    },
    floating: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 32,
      elevation: 12,
    },
  },
  
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    full: 9999,
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  typography: {
    h1: {
      fontSize: moderateScale(32),
      fontWeight: '700' as const,
      lineHeight: moderateScale(40),
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: moderateScale(24),
      fontWeight: '600' as const,
      lineHeight: moderateScale(32),
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: moderateScale(20),
      fontWeight: '600' as const,
      lineHeight: moderateScale(28),
    },
    body: {
      fontSize: moderateScale(16),
      fontWeight: '400' as const,
      lineHeight: moderateScale(24),
    },
    bodyMedium: {
      fontSize: moderateScale(16),
      fontWeight: '500' as const,
      lineHeight: moderateScale(24),
    },
    caption: {
      fontSize: moderateScale(14),
      fontWeight: '400' as const,
      lineHeight: moderateScale(20),
    },
    small: {
      fontSize: moderateScale(12),
      fontWeight: '400' as const,
      lineHeight: moderateScale(16),
    },
    button: {
      fontSize: moderateScale(16),
      fontWeight: '600' as const,
      lineHeight: moderateScale(20),
    },
    buttonSmall: {
      fontSize: moderateScale(14),
      fontWeight: '600' as const,
      lineHeight: moderateScale(18),
    },
  },
  
  components: {
    button: {
      height: scale(56),
      heightSmall: scale(48),
    },
    input: {
      height: scale(56),
    },
    card: {
      padding: scale(20),
    },
    modal: {
      borderRadius: 28,
    },
  },
  
  layout: {
    screenPadding: scale(20),
    cardWidth: SCREEN_WIDTH - scale(40),
  },
} as const;

export type DesignColors = typeof DESIGN.colors;
export type DesignShadows = typeof DESIGN.shadows;
export type DesignTypography = typeof DESIGN.typography;
