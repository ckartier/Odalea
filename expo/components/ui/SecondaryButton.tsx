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

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  size?: 'default' | 'small';
  danger?: boolean;
  testID?: string;
}

export function SecondaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  style,
  textStyle,
  size = 'default',
  danger = false,
  testID,
}: SecondaryButtonProps) {
  const isDisabled = disabled || loading;
  const height = size === 'small' ? COMPONENT_SIZES.buttonHeightSmall : COMPONENT_SIZES.buttonHeight;
  const color = danger ? COLORS.danger : COLORS.primary;
  const borderColor = danger ? COLORS.danger : COLORS.primary;
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { height, borderColor },
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={isDisabled}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon 
              size={COMPONENT_SIZES.iconMedium} 
              color={isDisabled ? COLORS.disabledText : color} 
              strokeWidth={2} 
            />
          )}
          <Text 
            style={[
              styles.text, 
              { color: isDisabled ? COLORS.disabledText : color },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {Icon && iconPosition === 'right' && (
            <Icon 
              size={COMPONENT_SIZES.iconMedium} 
              color={isDisabled ? COLORS.disabledText : color} 
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
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.button,
    borderWidth: 2,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
    gap: SPACING.s,
  },
  buttonDisabled: {
    borderColor: COLORS.disabled,
    backgroundColor: COLORS.surfaceSecondary,
  },
  text: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
  },
});
