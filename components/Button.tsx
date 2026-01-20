import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';

import { COLORS, SHADOWS, DIMENSIONS, IS_SMALL_DEVICE, moderateScale } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';
import GlassView from './GlassView';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'subtle' | 'ghost' | 'outline' | 'male' | 'female' | 'solid';
  size?: 'xs' | 'small' | 'medium' | 'large' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  gradient?: boolean;
  fullWidth?: boolean;
  liquidGlass?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  gradient = true,
  fullWidth = false,
  liquidGlass = true,
  ...props
}) => {
  const getBorderRadius = () => {
    switch (size) {
      case 'xs':
        return moderateScale(12);
      case 'small':
        return moderateScale(14);
      case 'large':
        return moderateScale(20);
      case 'xl':
        return moderateScale(24);
      default:
        return moderateScale(16);
    }
  };

  const getShadow = () => {
    if (variant === 'ghost') return SHADOWS.none;
    if (disabled) return SHADOWS.none;
    switch (size) {
      case 'xs':
      case 'small':
        return SHADOWS.xs;
      case 'large':
      case 'xl':
        return SHADOWS.medium;
      default:
        return SHADOWS.small;
    }
  };



  const getShadowForVariant = () => {
    if (disabled || variant === 'ghost') return SHADOWS.none;
    if (!liquidGlass) return getShadow();
    
    switch (variant) {
      case 'male':
        return SHADOWS.liquidGlass;
      case 'female':
        return SHADOWS.liquidGlassFemale;
      default:
        return SHADOWS.liquidGlassNeutral;
    }
  };

  const getTextColor = () => {
    if (disabled) return COLORS.gray;
    if (variant === 'solid' || variant === 'primary') return '#FFFFFF';
    return '#000000';
  };

  const getPadding = () => {
    const basePadding = {
      xs: { vertical: 6, horizontal: 12 },
      small: { vertical: 8, horizontal: 16 },
      medium: { vertical: 12, horizontal: 20 },
      large: { vertical: 14, horizontal: 24 },
      xl: { vertical: 16, horizontal: 28 },
    } as const;
    const padding = basePadding[size] || basePadding.medium;
    return {
      paddingVertical: moderateScale(padding.vertical),
      paddingHorizontal: moderateScale(padding.horizontal),
    };
  };

  const getTextStyle = () => {
    switch (size) {
      case 'xs':
        return TYPOGRAPHY.buttonSmall;
      case 'small':
        return TYPOGRAPHY.buttonSmall;
      case 'large':
      case 'xl':
        return TYPOGRAPHY.buttonLarge;
      default:
        return TYPOGRAPHY.button;
    }
  };

  const getTint = () => {
    switch (variant) {
      case 'male':
        return 'male' as const;
      case 'female':
        return 'female' as const;
      default:
        return 'neutral' as const;
    }
  };

  const ButtonContent = () => (
    <>
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <View style={styles.iconContainer}>{icon as React.ReactNode}</View>}
          <Text style={[styles.text, getTextStyle(), { color: getTextColor() }, textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && <View style={styles.iconContainer}>{icon as React.ReactNode}</View>}
        </>
      )}
    </>
  );

  if (variant === 'solid' || variant === 'primary') {
    return (
      <TouchableOpacity
        testID="button"
        accessibilityRole="button"
        style={[
          styles.button,
          {
            borderRadius: getBorderRadius(),
            ...getPadding(),
            width: fullWidth ? '100%' : undefined,
            backgroundColor: disabled ? COLORS.mediumGray : '#000000',
          },
          getShadow(),
          style,
        ]}
        onPress={onPress || (() => {})}
        disabled={disabled || loading}
        activeOpacity={0.8}
        {...props}
      >
        <ButtonContent />
      </TouchableOpacity>
    );
  }

  if (liquidGlass) {
    return (
      <TouchableOpacity
        testID="button"
        accessibilityRole="button"
        style={[
          styles.buttonWrapper,
          {
            width: fullWidth ? '100%' : undefined,
          },
          style,
        ]}
        onPress={onPress || (() => {})}
        disabled={disabled || loading}
        activeOpacity={0.8}
        {...props}
      >
        <GlassView
          tint={getTint()}
          liquidGlass={true}
          intensity={45}
          style={[
            styles.button,
            {
              borderRadius: getBorderRadius(),
              ...getPadding(),
            },
            getShadowForVariant(),
          ]}
        >
          <ButtonContent />
        </GlassView>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      testID="button"
      accessibilityRole="button"
      style={[
        styles.button,
        {
          borderRadius: getBorderRadius(),
          ...getPadding(),
          width: fullWidth ? '100%' : undefined,
          backgroundColor: disabled ? COLORS.mediumGray : 'rgba(255,255,255,0.08)',
        },
        getShadow(),
        style,
      ]}
      onPress={onPress || (() => {})}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      <ButtonContent />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    overflow: 'hidden',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: moderateScale(6),
    minHeight: IS_SMALL_DEVICE
      ? DIMENSIONS.COMPONENT_SIZES.BUTTON_HEIGHT * 0.85
      : DIMENSIONS.COMPONENT_SIZES.BUTTON_HEIGHT,
    overflow: 'hidden',
  },
  touchable: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  text: {
    textAlign: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Button;
