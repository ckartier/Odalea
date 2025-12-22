import React from 'react';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '@/constants/colors';

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
        return ['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.3)'];
      default:
        return ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.5)'];
    }
  };

  const getShadow = () => {
    switch (tint) {
      case 'male':
        return SHADOWS.liquidGlass;
      case 'female':
        return SHADOWS.liquidGlassFemale;
      case 'neutral':
        return SHADOWS.liquidGlassNeutral;
      default:
        return SHADOWS.liquidGlass;
    }
  };

  if (Platform.OS === 'web') {
    if (liquidGlass) {
      const webGradient = getGradientColors();
      return (
        <View 
          {...rest} 
          style={[
            styles.webLiquidGlass,
            liquidGlass && getShadow(),
            { borderRadius: 20 },
            style
          ]}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `linear-gradient(135deg, ${webGradient[0]}, ${webGradient[1]})`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: 20,
            }}
          />
          <View style={styles.webContent}>
            {children}
          </View>
        </View>
      );
    }
    return (
      <View 
        {...rest} 
        style={[styles.webGlass, { borderRadius: 16 }, style]}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 16,
          }}
        />
        <View style={styles.webContent}>
          {children}
        </View>
      </View>
    );
  }

  if (liquidGlass) {
    return (
      <View style={[styles.liquidContainer, getShadow(), { borderRadius: 20 }, style]} {...rest}>
        <BlurView 
          intensity={intensity} 
          tint={tint === 'male' || tint === 'female' || tint === 'neutral' ? 'light' : tint} 
          style={StyleSheet.absoluteFill}
        >
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
    borderColor: COLORS.liquidGlassBorder,
  },
  contentContainer: {
    position: 'relative',
    zIndex: 1,
  },
  webGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: COLORS.liquidGlassBorder,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  webLiquidGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: COLORS.liquidGlassBorder,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  webContent: {
    position: 'relative',
    zIndex: 1,
  },
});
