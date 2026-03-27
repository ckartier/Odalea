import { TextStyle } from 'react-native';
import { COLORS, moderateScale } from './colors';

export const TYPOGRAPHY = {
  h1: {
    fontSize: moderateScale(28),
    fontWeight: '700' as const,
    color: COLORS.black,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: moderateScale(24),
    fontWeight: '700' as const,
    color: COLORS.black,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: moderateScale(20),
    fontWeight: '600' as const,
    color: COLORS.black,
    letterSpacing: 0,
  },
  h4: {
    fontSize: moderateScale(18),
    fontWeight: '600' as const,
    color: COLORS.black,
    letterSpacing: 0,
  },
  h5: {
    fontSize: moderateScale(16),
    fontWeight: '600' as const,
    color: COLORS.black,
    letterSpacing: 0,
  },
  h6: {
    fontSize: moderateScale(14),
    fontWeight: '600' as const,
    color: COLORS.black,
    letterSpacing: 0,
  },
  
  body1: {
    fontSize: moderateScale(16),
    fontWeight: '400' as const,
    color: COLORS.black,
    lineHeight: moderateScale(24),
  },
  body2: {
    fontSize: moderateScale(14),
    fontWeight: '400' as const,
    color: COLORS.black,
    lineHeight: moderateScale(20),
  },
  body3: {
    fontSize: moderateScale(12),
    fontWeight: '400' as const,
    color: COLORS.black,
    lineHeight: moderateScale(18),
  },
  
  subtitle1: {
    fontSize: moderateScale(16),
    fontWeight: '500' as const,
    color: COLORS.darkGray,
    lineHeight: moderateScale(24),
  },
  subtitle2: {
    fontSize: moderateScale(14),
    fontWeight: '500' as const,
    color: COLORS.darkGray,
    lineHeight: moderateScale(20),
  },
  
  caption: {
    fontSize: moderateScale(12),
    fontWeight: '400' as const,
    color: COLORS.darkGray,
    lineHeight: moderateScale(16),
  },
  overline: {
    fontSize: moderateScale(10),
    fontWeight: '500' as const,
    color: COLORS.darkGray,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  
  button: {
    fontSize: moderateScale(14),
    fontWeight: '600' as const,
    color: COLORS.black,
    letterSpacing: 0.5,
    textAlign: 'center' as const,
  },
  buttonLarge: {
    fontSize: moderateScale(16),
    fontWeight: '600' as const,
    color: COLORS.black,
    letterSpacing: 0.5,
    textAlign: 'center' as const,
  },
  buttonSmall: {
    fontSize: moderateScale(12),
    fontWeight: '600' as const,
    color: COLORS.black,
    letterSpacing: 0.5,
    textAlign: 'center' as const,
  },
  
  label: {
    fontSize: moderateScale(14),
    fontWeight: '500' as const,
    color: COLORS.black,
  },
  labelSmall: {
    fontSize: moderateScale(12),
    fontWeight: '500' as const,
    color: COLORS.black,
  },
  
  link: {
    fontSize: moderateScale(14),
    fontWeight: '500' as const,
    color: COLORS.primary,
    textDecorationLine: 'underline' as const,
  },
  
  error: {
    fontSize: moderateScale(12),
    fontWeight: '400' as const,
    color: COLORS.error,
    lineHeight: moderateScale(16),
  },
  
  success: {
    fontSize: moderateScale(12),
    fontWeight: '400' as const,
    color: COLORS.success,
    lineHeight: moderateScale(16),
  },
  
  badge: {
    fontSize: moderateScale(10),
    fontWeight: '600' as const,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  
  tabLabel: {
    fontSize: moderateScale(12),
    fontWeight: '500' as const,
    color: COLORS.darkGray,
  },
  tabLabelActive: {
    fontSize: moderateScale(12),
    fontWeight: '600' as const,
    color: COLORS.primary,
  },
} as const;

export type TypographyVariant = keyof typeof TYPOGRAPHY;

export const getTextStyle = (variant: TypographyVariant, override?: Partial<TextStyle>): TextStyle => {
  return {
    ...TYPOGRAPHY[variant],
    ...override,
  };
};
