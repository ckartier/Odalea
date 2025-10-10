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
  tint?: 'light' | 'dark' | 'default' | 'male' | 'female' | 'neutral';
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
  tint = 'neutral',
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
        intensity={40}
        tint={tint}
        liquidGlass={true}
        style={[
          styles.inputGlass,
          error ? styles.inputError : null,
          SHADOWS.small,
          inputStyle,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            inputTextStyle,
          ]}
          placeholderTextColor={COLORS.darkGray}
          secureTextEntry={isPassword ? !isPasswordVisible : secureTextEntry}
          {...props}
        />
        
        {isPassword && (
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
    fontWeight: '600' as const,
    marginBottom: moderateScale(6),
    color: COLORS.black,
  },
  inputGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: moderateScale(4),
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
    borderWidth: 1.5,
  },
  errorText: {
    color: COLORS.error,
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    marginTop: moderateScale(4),
    fontWeight: '500' as const,
  },
  iconContainer: {
    paddingHorizontal: moderateScale(10),
  },
});

export default Input;
