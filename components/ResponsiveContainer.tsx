import React from 'react';
import { StyleSheet, View, ViewStyle, ScrollView, ScrollViewProps } from 'react-native';
import { COLORS, DIMENSIONS, IS_TABLET, RESPONSIVE_LAYOUT } from '@/constants/colors';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
  scrollViewProps?: ScrollViewProps;
  maxWidth?: number | 'content' | 'full';
  padding?: 'none' | 'small' | 'medium' | 'large';
  backgroundColor?: string;
  centerContent?: boolean;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  scrollable = false,
  scrollViewProps,
  maxWidth = 'content',
  padding = 'medium',
  backgroundColor = 'transparent',
  centerContent = true,
}) => {
  const getPadding = () => {
    switch (padding) {
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

  const containerStyles = [
    styles.container,
    {
      backgroundColor,
      paddingHorizontal: getPadding(),
      maxWidth: getMaxWidth(),
      alignSelf: IS_TABLET && centerContent ? 'center' : 'stretch',
    },
    style,
  ];

  if (scrollable) {
    return (
      <ScrollView
        style={[containerStyles, { paddingHorizontal: 0 }]}
        contentContainerStyle={{
          paddingHorizontal: getPadding(),
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={containerStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});

export default ResponsiveContainer;