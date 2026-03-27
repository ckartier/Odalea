import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
  noBorder?: boolean;
  noShadow?: boolean;
}

export function Card({ 
  children, 
  style, 
  noPadding = false,
  noBorder = false,
  noShadow = false,
}: CardProps) {
  return (
    <View 
      style={[
        styles.card,
        noPadding && styles.noPadding,
        noBorder && styles.noBorder,
        noShadow && styles.noShadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.divider,
    ...SHADOWS.card,
  },
  noPadding: {
    padding: 0,
  },
  noBorder: {
    borderWidth: 0,
  },
  noShadow: {
    shadowOpacity: 0,
    elevation: 0,
  },
});
