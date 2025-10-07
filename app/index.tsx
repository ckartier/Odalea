import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { useUser } from '@/hooks/user-store';
import { Heart } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';



export default function IndexScreen() {
  const { user, loading } = useUser();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const heartbeatAnim = useRef(new Animated.Value(1)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const heartbeatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(heartbeatAnim, {
          toValue: 1.15,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1.15,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    const gradientLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: false,
        }),
        Animated.timing(gradientAnim, {
          toValue: 0,
          duration: 3500,
          useNativeDriver: false,
        }),
      ])
    );

    heartbeatLoop.start();
    gradientLoop.start();

    return () => {
      heartbeatLoop.stop();
      gradientLoop.stop();
    };
  }, [fadeAnim, scaleAnim, heartbeatAnim, gradientAnim]);

  // Show loading with animation while checking auth state
  if (loading) {
    return (
      <View style={styles.container}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: gradientAnim }]}>
          <LinearGradient
            colors={['#E8B4D4', '#C8A2C8', '#A8B4D8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: gradientAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
          <LinearGradient
            colors={['#B8C8E8', '#C8B4D8', '#D8B4C8']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: Animated.multiply(scaleAnim, heartbeatAnim) },
              ],
            },
          ]}
        >
          <Heart size={80} color={COLORS.white} fill={COLORS.white} />
        </Animated.View>
      </View>
    );
  }

  // If user is authenticated, redirect based on user type
  if (user) {
    // Professional users go to their dashboard
    if (user.isProfessional) {
      return <Redirect href="/(pro)/dashboard" />;
    }
    // Regular users go to community page (new home)
    return <Redirect href="/(tabs)/community" />;
  }

  // For non-authenticated users, redirect to splash screen
  return <Redirect href="/splash" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 60,
    padding: 32,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
  },
});