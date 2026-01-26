import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, ViewStyle, Animated, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, SHADOWS } from '@/constants/colors';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  animated?: boolean;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  size = 'medium',
  style,
  animated = false,
  showText = true,
}) => {
  const colorScheme = useColorScheme();
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const getSize = () => {
    switch (size) {
      case 'small':
        return { fontSize: 24, pawSize: 16 };
      case 'large':
        return { fontSize: 48, pawSize: 32 };
      default:
        return { fontSize: 36, pawSize: 24 };
    }
  };
  
  const { fontSize, pawSize } = getSize();

  // Animation effects
  useEffect(() => {
    if (animated) {
      // Bounce animation
      const bounceAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      // Rotation animation
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      );

      // Pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );

      bounceAnimation.start();
      rotateAnimation.start();
      pulseAnimation.start();

      return () => {
        bounceAnimation.stop();
        rotateAnimation.stop();
        pulseAnimation.stop();
      };
    }
  }, [animated, bounceAnim, pulseAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const logoSource = { uri: 'https://firebasestorage.googleapis.com/v0/b/copattes.firebasestorage.app/o/branding%2Fodalea-logo-black.png?alt=media' };
  
  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[
        styles.logoContainer,
        { 
          width: pawSize * 3, 
          height: pawSize * 3,
          transform: animated ? [
            { scale: Animated.multiply(bounceAnim, pulseAnim) },
            { rotate: spin }
          ] : []
        },
        SHADOWS.medium,
      ]}>
        <Image 
          source={logoSource}
          style={[
            styles.iconImage,
            { width: pawSize * 2.5, height: pawSize * 2.5 }
          ]}
          contentFit="contain"
          transition={200}
        />
      </Animated.View>
      
      {showText && (
        <Text style={[
          styles.text,
          { fontSize },
          { color: colorScheme === 'dark' ? COLORS.white : COLORS.black }
        ]}>
          Odalea
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoContainer: {
    backgroundColor: 'transparent',
    borderRadius: 999,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImage: {
    borderRadius: 0,
  },
  text: {
    fontWeight: '700' as const,
    color: COLORS.black,
  },
});

export default Logo;