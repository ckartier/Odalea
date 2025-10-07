import React, { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/colors';

interface AppBackgroundProps {
  children: ReactNode;
  variant?: 'default' | 'male' | 'female';
}

export default function AppBackground({ children, variant = 'default' }: AppBackgroundProps) {
  const getGradientColors = (): [string, string] => {
    switch (variant) {
      case 'male':
        return [COLORS.male, COLORS.maleAccent];
      case 'female':
        return [COLORS.female, COLORS.femaleAccent];
      default:
        return ['#A3E5FA', '#F7B6D6'];
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents={Platform.OS === 'web' ? 'none' : 'auto'}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
});
