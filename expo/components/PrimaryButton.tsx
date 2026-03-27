import React from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { DESIGN } from '@/constants/design';

interface PrimaryButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  testID?: string;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
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
  fullWidth = true,
  testID,
}) => {
  const handlePress = async () => {
    if (disabled || loading) return;
    
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress?.();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      height: size === 'small' ? DESIGN.components.button.heightSmall : DESIGN.components.button.height,
      borderRadius: DESIGN.radius.full,
      paddingHorizontal: size === 'small' ? 20 : 28,
    };

    if (variant === 'primary') {
      return {
        ...baseStyle,
        backgroundColor: disabled ? DESIGN.colors.border : DESIGN.colors.primary,
      };
    }

    if (variant === 'outline') {
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: disabled ? DESIGN.colors.border : DESIGN.colors.primary,
      };
    }

    return {
      ...baseStyle,
      backgroundColor: 'transparent',
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...DESIGN.typography.button,
      fontSize: size === 'small' ? DESIGN.typography.buttonSmall.fontSize : DESIGN.typography.button.fontSize,
    };

    if (variant === 'primary') {
      return {
        ...baseStyle,
        color: disabled ? DESIGN.colors.textTertiary : DESIGN.colors.textInverse,
      };
    }

    return {
      ...baseStyle,
      color: disabled ? DESIGN.colors.textTertiary : DESIGN.colors.primary,
    };
  };

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        getButtonStyle(),
        fullWidth && styles.fullWidth,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? DESIGN.colors.textInverse : DESIGN.colors.primary}
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  text: {
    textAlign: 'center',
  },
});

export default PrimaryButton;
