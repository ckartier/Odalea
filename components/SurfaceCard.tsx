import React from 'react';
import { StyleSheet, View, ViewProps, Platform } from 'react-native';

interface SurfaceCardProps extends ViewProps {
  children?: React.ReactNode;
}

export default function SurfaceCard({ style, children, ...rest }: SurfaceCardProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 28,
      },
      android: {
        elevation: 6,
      },
      web: {
        // @ts-ignore: propriété CSS spécifique au web
        boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
        // @ts-ignore
        backdropFilter: 'blur(10px)',
      },
    }),
  },
});
