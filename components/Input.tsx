import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  View, 
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SHADOWS, DIMENSIONS, moderateScale } from '@/constants/colors';
import { Eye, EyeOff } from 'lucide-react-native';
import GlassView from '@/components/GlassView';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: ViewStyle;
  inputTextStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  hideLabel?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  inputTextStyle,
  leftIcon,
  rightIcon,
  isPassword = false,
  hideLabel = false,
  secureTextEntry,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  
  const renderPasswordIcon = () => {
    if (!isPassword) return rightIcon;
    
    return (
      <TouchableOpacity onPress={togglePasswordVisibility} style={styles.iconContainer}>
        {isPasswordVisible ? (
          <EyeOff size={20} color={COLORS.darkGray} />
        ) : (
          <Eye size={20} color={COLORS.darkGray} />
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && !hideLabel && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      
      <GlassView
        intensity={35}
        tint="light"
        style={[
          styles.inputGlass,
          error ? styles.inputError : null,
          inputStyle,
        ]}
      >
        {leftIcon && <View style={styles.iconContainer}>{leftIcon as React.ReactNode}</View>}
        
        <TextInput
          style={[
            styles.input,
            leftIcon ? { paddingLeft: 8 } : null,
            (rightIcon || isPassword) ? { paddingRight: 8 } : null,
            inputTextStyle,
          ]}
          placeholderTextColor={COLORS.darkGray}
          secureTextEntry={isPassword ? !isPasswordVisible : secureTextEntry}
          {...props}
        />
        
        {(rightIcon || isPassword) && (
          <View style={styles.iconContainer}>
            {renderPasswordIcon()}
          </View>
        )}
      </GlassView>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: moderateScale(12),
    width: '100%',
  },
  label: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    fontWeight: '500' as const,
    marginBottom: moderateScale(4),
    color: COLORS.black,
  },
  inputGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: moderateScale(8),
  },
  input: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 14,
    fontSize: DIMENSIONS.FONT_SIZES.md,
    color: COLORS.black,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    marginTop: moderateScale(3),
  },
  iconContainer: {
    paddingHorizontal: moderateScale(10),
  },
});

export default Input;