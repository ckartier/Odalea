import React from 'react';
import { 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, COMPONENT_SIZES } from '@/theme/tokens';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  size?: 'default' | 'small';
  testID?: string;
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  style,
  textStyle,
  size = 'default',
  testID,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  const height = size === 'small' ? COMPONENT_SIZES.buttonHeightSmall : COMPONENT_SIZES.buttonHeight;
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { height },
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={isDisabled}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.textInverse} size="small" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon 
              size={COMPONENT_SIZES.iconMedium} 
              color={COLORS.textInverse} 
              strokeWidth={2} 
            />
          )}
          <Text style={[styles.text, textStyle]}>{title}</Text>
          {Icon && iconPosition === 'right' && (
            <Icon 
              size={COMPONENT_SIZES.iconMedium} 
              color={COLORS.textInverse} 
              strokeWidth={2} 
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
    gap: SPACING.s,
  },
  buttonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  text: {
    ...TYPOGRAPHY.button,
    color: COLORS.textInverse,
  },
});
