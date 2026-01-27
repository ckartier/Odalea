import React from 'react';
import { StyleSheet, View, ViewStyle, DimensionValue, FlexAlignType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, DIMENSIONS, IS_TABLET, RESPONSIVE_LAYOUT, moderateScale, GRADIENTS } from '@/constants/colors';

interface ResponsiveCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'gradient';
  padding?: 'none' | 'xs' | 'small' | 'medium' | 'large' | 'xl';
  margin?: 'none' | 'small' | 'medium' | 'large';
  maxWidth?: number | 'content' | 'full';
  centerOnTablet?: boolean;
  borderRadius?: 'none' | 'xs' | 'small' | 'medium' | 'large' | 'xl' | 'full';
  gradientColors?: string[];
  interactive?: boolean;
  shadow?: 'none' | 'xs' | 'small' | 'medium' | 'large' | 'xl';
}

const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'medium',
  margin = 'medium',
  maxWidth = 'content',
  centerOnTablet = true,
  borderRadius = 'medium',
  gradientColors,
  interactive = false,
  shadow,
}) => {
  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'xs':
        return DIMENSIONS.SPACING.xs;
      case 'small':
        return DIMENSIONS.SPACING.sm;
      case 'large':
        return DIMENSIONS.SPACING.lg;
      case 'xl':
        return DIMENSIONS.SPACING.xl;
      default:
        return DIMENSIONS.SPACING.md;
    }
  };
  
  const getBorderRadius = () => {
    switch (borderRadius) {
      case 'none':
        return 0;
      case 'xs':
        return moderateScale(4);
      case 'small':
        return moderateScale(8);
      case 'large':
        return moderateScale(20);
      case 'xl':
        return moderateScale(28);
      case 'full':
        return 9999;
      default:
        return moderateScale(16); // Updated for 2025 trends
    }
  };
  
  const getShadow = () => {
    if (shadow) {
      switch (shadow) {
        case 'none':
          return SHADOWS.none;
        case 'xs':
          return SHADOWS.xs;
        case 'small':
          return SHADOWS.small;
        case 'large':
          return SHADOWS.large;
        case 'xl':
          return SHADOWS.xl;
        default:
          return SHADOWS.medium;
      }
    }
    
    // Default shadow based on variant
    switch (variant) {
      case 'elevated':
        return SHADOWS.large;
      case 'glass':
        return SHADOWS.medium;
      case 'gradient':
        return SHADOWS.medium;
      case 'outlined':
        return SHADOWS.none;
      default:
        return SHADOWS.small;
    }
  };

  const getMargin = () => {
    switch (margin) {
      case 'none':
        return 0;
      case 'small':
        return DIMENSIONS.SPACING.sm;
      case 'large':
        return DIMENSIONS.SPACING.lg;
      default:
        return RESPONSIVE_LAYOUT.containerPadding;
    }
  };

  const getMaxWidth = () => {
    if (typeof maxWidth === 'number') return maxWidth;
    if (maxWidth === 'full') return '100%';
    if (maxWidth === 'content') {
      return IS_TABLET ? RESPONSIVE_LAYOUT.contentMaxWidth : '100%';
    }
    return '100%';
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: COLORS.white,
        };
      case 'outlined':
        return {
          backgroundColor: COLORS.white,
          borderWidth: 1,
          borderColor: COLORS.border,
        };
      case 'glass':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        };
      case 'gradient':
        return {
          backgroundColor: 'transparent',
        };
      default:
        return {
          backgroundColor: COLORS.white,
        };
    }
  };

  const cardStyles = [
    styles.card,
    getVariantStyles(),
    {
      padding: getPadding(),
      marginHorizontal: getMargin(),
      marginVertical: DIMENSIONS.SPACING.sm,
      maxWidth: getMaxWidth() as DimensionValue,
      alignSelf: (IS_TABLET && centerOnTablet ? 'center' : 'stretch') as FlexAlignType,
      borderRadius: getBorderRadius(),
      transform: interactive ? [{ scale: 1 }] : undefined,
    },
    getShadow(),
    style,
  ];

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={gradientColors as any || GRADIENTS.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={cardStyles}
      >
        {children}
      </LinearGradient>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
  },
});

export default ResponsiveCard;