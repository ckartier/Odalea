import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

interface AppBackgroundProps {
  children: ReactNode;
}

export default function AppBackground({ children }: AppBackgroundProps) {
  return (
    <View style={styles.root}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
