import React, { ReactNode, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS } from '@/constants/colors';
import { useTheme } from '@/hooks/theme-store';
import { usePets } from '@/hooks/pets-store';

interface AppBackgroundProps {
  children: ReactNode;
  variant?: 'default' | 'male' | 'female';
}

export default function AppBackground({ children, variant }: AppBackgroundProps) {
  const { currentTheme, isDark } = useTheme();
  const { userPets } = usePets();
  
  const primaryPet = useMemo(() => {
    return userPets.find(pet => pet.isPrimary) || userPets[0];
  }, [userPets]);
  
  const getGradientColors = (): readonly [string, string, string] => {
    if (isDark) {
      return [currentTheme.background, currentTheme.card, currentTheme.background] as const;
    }
    
    const effectiveVariant = variant || (primaryPet?.gender === 'male' ? 'male' : primaryPet?.gender === 'female' ? 'female' : 'default');
    
    switch (effectiveVariant) {
      case 'male':
        return GRADIENTS.maleBackground;
      case 'female':
        return GRADIENTS.femaleBackground;
      default:
        return GRADIENTS.appBackground;
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
