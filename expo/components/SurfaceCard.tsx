import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import GlassView from './GlassView';
import { SHADOWS, moderateScale } from '@/constants/colors';

interface SurfaceCardProps extends ViewProps {
  children?: React.ReactNode;
  tint?: 'light' | 'dark' | 'default' | 'male' | 'female' | 'neutral';
}

export default function SurfaceCard({ style, children, tint = 'neutral', ...rest }: SurfaceCardProps) {
  const getShadow = () => {
    switch (tint) {
      case 'male':
        return SHADOWS.liquidGlass;
      case 'female':
        return SHADOWS.liquidGlassFemale;
      default:
        return SHADOWS.liquidGlassNeutral;
    }
  };

  return (
    <GlassView
      tint={tint}
      liquidGlass={true}
      style={[styles.card, getShadow(), style]}
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
