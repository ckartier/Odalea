import React, { ReactNode } from 'react';
import { Platform, StyleSheet, View, TouchableOpacity, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '@/constants/colors';

export type GlassTint = 'light' | 'dark' | 'male' | 'female' | 'neutral';

interface GlassCardProps {
  tint?: GlassTint;
  intensity?: number;
  onPress?: () => void;
  disabled?: boolean;
  noPadding?: boolean;
  style?: ViewStyle;
  children?: ReactNode;
  testID?: string;
}

const getGradientColors = (tint: GlassTint): [string, string] => {
  switch (tint) {
    case 'male':
      return ['rgba(163, 213, 255, 0.35)', 'rgba(107, 182, 255, 0.25)'];
    case 'female':
      return ['rgba(255, 179, 217, 0.35)', 'rgba(255, 138, 201, 0.25)'];
    case 'neutral':
      return ['rgba(224, 242, 254, 0.4)', 'rgba(186, 230, 253, 0.3)'];
    case 'dark':
      return ['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.3)'];
    default:
      return ['rgba(255, 255, 255, 0.75)', 'rgba(255, 255, 255, 0.55)'];
  }
};

const getShadow = (tint: GlassTint) => {
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

export default function GlassCard({
  tint = 'light',
  intensity = 40,
  onPress,
  disabled = false,
  noPadding = false,
  style,
  children,
  testID,
}: GlassCardProps) {
  const gradientColors = getGradientColors(tint);
  const shadow = getShadow(tint);

  const containerStyle = [
    styles.container,
    shadow,
    !noPadding && styles.padding,
    style,
  ];

  const content = (
    <>
      {Platform.OS === 'web' ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            } as any,
          ]}
        />
      ) : (
        <>
          <BlurView
            intensity={intensity}
            tint={tint === 'male' || tint === 'female' || tint === 'neutral' ? 'light' : tint}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </>
      )}
      <View style={styles.contentContainer}>{children}</View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        testID={testID}
        activeOpacity={0.8}
        onPress={onPress}
        disabled={disabled}
        style={containerStyle}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} style={containerStyle}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.liquidGlassBorder,
  },
  padding: {
    padding: 16,
  },
  contentContainer: {
    position: 'relative',
    zIndex: 1,
  },
});
