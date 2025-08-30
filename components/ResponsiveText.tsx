import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { DIMENSIONS, getResponsiveValue } from '@/constants/colors';

interface ResponsiveTextProps extends TextProps {
  variant?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'title';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  children: React.ReactNode;
}

const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  variant = 'md',
  weight = 'normal',
  color,
  align = 'left',
  style,
  children,
  ...props
}) => {
  const getFontSize = () => {
    return DIMENSIONS.FONT_SIZES[variant];
  };

  const getFontWeight = (): TextStyle['fontWeight'] => {
    switch (weight) {
      case 'medium':
        return '500';
      case 'semibold':
        return '600';
      case 'bold':
        return '700';
      default:
        return '400';
    }
  };

  const getLineHeight = () => {
    const fontSize = getFontSize();
    return getResponsiveValue(
      {
        xs: fontSize * 1.3,
        sm: fontSize * 1.4,
        md: fontSize * 1.4,
        lg: fontSize * 1.4,
        xl: fontSize * 1.3,
        xxl: fontSize * 1.3,
        xxxl: fontSize * 1.2,
      },
      fontSize * 1.4
    );
  };

  const textStyles: TextStyle[] = [
    {
      fontSize: getFontSize(),
      fontWeight: getFontWeight(),
      lineHeight: getLineHeight(),
      textAlign: align,
      color,
    },
    style as TextStyle,
  ];

  return (
    <Text style={textStyles} {...props}>
      {children}
    </Text>
  );
};

export default ResponsiveText;