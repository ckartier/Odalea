import React, { ReactNode, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AppBackgroundProps {
  children: ReactNode;
}

const GRAD_FROM = '#a3e5fa';
const GRAD_TO = '#f7b6d6';

export default function AppBackground({ children }: AppBackgroundProps) {
  const pointerEvents = useMemo(() => (Platform.OS === 'web' ? 'none' : 'auto'), []);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[GRAD_FROM, GRAD_TO]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents={pointerEvents as any}
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
