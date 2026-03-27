import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TextInputProps,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { DESIGN } from '@/constants/design';

interface StandardInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputContainerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  hideLabel?: boolean;
}

const StandardInput: React.FC<StandardInputProps> = ({
  label,
  error,
  containerStyle,
  labelStyle,
  inputContainerStyle,
  inputStyle,
  leftIcon,
  rightIcon,
  isPassword = false,
  hideLabel = false,
  secureTextEntry,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const renderRightElement = () => {
    if (isPassword) {
      return (
        <Pressable onPress={togglePasswordVisibility} style={styles.iconContainer}>
          {isPasswordVisible ? (
            <EyeOff size={20} color={DESIGN.colors.textTertiary} />
          ) : (
            <Eye size={20} color={DESIGN.colors.textTertiary} />
          )}
        </Pressable>
      );
    }
    return rightIcon;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && !hideLabel && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          inputContainerStyle,
        ]}
      >
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}

        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={DESIGN.colors.placeholder}
          secureTextEntry={isPassword ? !isPasswordVisible : secureTextEntry}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {renderRightElement()}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    ...DESIGN.typography.caption,
    fontWeight: '500' as const,
    color: DESIGN.colors.textSecondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN.colors.surfaceSecondary,
    borderRadius: DESIGN.radius.md,
    borderWidth: 0,
    minHeight: DESIGN.components.input.height,
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: DESIGN.colors.primary,
    backgroundColor: DESIGN.colors.surface,
  },
  inputError: {
    borderWidth: 2,
    borderColor: DESIGN.colors.error,
  },
  input: {
    flex: 1,
    ...DESIGN.typography.body,
    color: DESIGN.colors.text,
    paddingVertical: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  errorText: {
    ...DESIGN.typography.small,
    color: DESIGN.colors.error,
    marginTop: 6,
  },
});

export default StandardInput;
