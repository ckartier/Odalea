import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import GlassView from './GlassView';
import { SHADOWS, moderateScale } from '@/constants/colors';

interface SurfaceCardProps extends ViewProps {
  children?: React.ReactNode;
  tint?: 'light' | 'dark' | 'default' | 'male' | 'female' | 'neutral';
}

export default function SurfaceCard({ style, children, tint = 'neutral', ...rest }: SurfaceCardProps) {
  return (
    <GlassView
      tint={tint}
      liquidGlass={true}
      style={[styles.card, SHADOWS.medium, style]}
      {...rest}
    >
      {children}
    </GlassView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: moderateScale(20),
  },
});
