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
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, DIMENSIONS, IS_SMALL_DEVICE, moderateScale } from '@/constants/colors';
import GlassView from './GlassView';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'subtle' | 'ghost' | 'outline' | 'male' | 'female';
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

  const getGradientColors = (): [string, string] => {
    if (disabled) return [COLORS.mediumGray, COLORS.border];
    switch (variant) {
      case 'male':
        return [COLORS.male, COLORS.maleVivid];
      case 'female':
        return [COLORS.female, COLORS.femaleVivid];
      case 'primary':
        return [COLORS.primary, COLORS.primaryDark];
      default:
        return [COLORS.neutralLight, COLORS.neutralVivid];
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
    return COLORS.black;
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

  const getFontSize = () => {
    switch (size) {
      case 'xs':
        return DIMENSIONS.FONT_SIZES.xs;
      case 'small':
        return DIMENSIONS.FONT_SIZES.sm;
      case 'large':
        return DIMENSIONS.FONT_SIZES.lg;
      case 'xl':
        return DIMENSIONS.FONT_SIZES.xl;
      default:
        return DIMENSIONS.FONT_SIZES.md;
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
          <Text style={[styles.text, { color: getTextColor(), fontSize: getFontSize() }, textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && <View style={styles.iconContainer}>{icon as React.ReactNode}</View>}
        </>
      )}
    </>
  );

  if (liquidGlass || variant === 'primary') {
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
    fontWeight: '600' as const,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Button;
