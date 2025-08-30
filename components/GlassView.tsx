import React from 'react';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassViewProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

export default function GlassView({
  intensity = 30,
  tint = 'light',
  style,
  children,
  ...rest
}: GlassViewProps) {
  if (Platform.OS === 'web') {
    return (
      <View {...rest} style={[styles.webGlass, style]}>
        {children}
      </View>
    );
  }

  return (
    <BlurView intensity={intensity} tint={tint} style={style} {...rest}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  webGlass: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
    // @ts-ignore: propriété CSS spécifique au web
    backdropFilter: 'blur(20px)',
  },
});
