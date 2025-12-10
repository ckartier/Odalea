import React from 'react';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface GlassViewProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default' | 'male' | 'female' | 'neutral';
  liquidGlass?: boolean;
}

export default function GlassView({
  intensity = 30,
  tint = 'light',
  liquidGlass = true,
  style,
  children,
  ...rest
}: GlassViewProps) {
  const getGradientColors = (): [string, string] => {
    switch (tint) {
      case 'male':
        return ['rgba(163, 213, 255, 0.3)', 'rgba(107, 182, 255, 0.2)'];
      case 'female':
        return ['rgba(255, 179, 217, 0.3)', 'rgba(255, 138, 201, 0.2)'];
      case 'neutral':
        return ['rgba(224, 242, 254, 0.3)', 'rgba(186, 230, 253, 0.2)'];
      case 'dark':
        return ['rgba(15, 23, 42, 0.3)', 'rgba(30, 41, 59, 0.2)'];
      default:
        return ['rgba(255, 255, 255, 0.3)', 'rgba(248, 250, 252, 0.2)'];
    }
  };

  if (Platform.OS === 'web') {
    if (liquidGlass) {
      return (
        <View {...rest} style={[styles.webLiquidGlass, style]}>
          <View style={styles.webGradientOverlay} />
          {children}
        </View>
      );
    }
    return (
      <View {...rest} style={[styles.webGlass, style]}>
        {children}
      </View>
    );
  }

  if (liquidGlass) {
    return (
      <View style={[styles.liquidContainer, style]} {...rest}>
        <BlurView intensity={intensity} tint={tint === 'male' || tint === 'female' || tint === 'neutral' ? 'light' : tint} style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </BlurView>
        <View style={styles.contentContainer}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <BlurView intensity={intensity} tint={tint === 'male' || tint === 'female' || tint === 'neutral' ? 'light' : tint} style={style} {...rest}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  liquidContainer: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  contentContainer: {
    position: 'relative',
    zIndex: 1,
  },
  webGlass: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
  },
  webLiquidGlass: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    overflow: 'hidden',
  },
  webGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
});
