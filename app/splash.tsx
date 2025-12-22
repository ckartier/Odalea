import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DIMENSIONS } from '@/constants/colors';
import { useAuth } from '@/hooks/auth-store';
import { useI18n } from '@/hooks/i18n-store';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isLoading: i18nLoading } = useI18n();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;

  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;
  const float4 = useRef(new Animated.Value(0)).current;
  const float5 = useRef(new Animated.Value(0)).current;

  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const logoAnimation = Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 1000, delay: 300, useNativeDriver: true }),
      ]),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      ),
    ]);

    const floatingAnimations = [
      Animated.loop(Animated.sequence([
        Animated.timing(float1, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(float1, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(float2, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(float2, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(float3, { toValue: 1, duration: 3500, useNativeDriver: true }),
        Animated.timing(float3, { toValue: 0, duration: 3500, useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(float4, { toValue: 1, duration: 2800, useNativeDriver: true }),
        Animated.timing(float4, { toValue: 0, duration: 2800, useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(float5, { toValue: 1, duration: 4500, useNativeDriver: true }),
        Animated.timing(float5, { toValue: 0, duration: 4500, useNativeDriver: true }),
      ])),
    ];

    const particleAnimations = [
      Animated.loop(Animated.timing(particle1, { toValue: 1, duration: 6000, useNativeDriver: true })),
      Animated.loop(Animated.timing(particle2, { toValue: 1, duration: 8000, useNativeDriver: true })),
      Animated.loop(Animated.timing(particle3, { toValue: 1, duration: 7000, useNativeDriver: true })),
    ];

    const gradientLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, { toValue: 1, duration: 4000, useNativeDriver: false }),
        Animated.timing(gradientAnim, { toValue: 0, duration: 4000, useNativeDriver: false }),
      ])
    );

    logoAnimation.start();
    floatingAnimations.forEach((anim) => anim.start());
    particleAnimations.forEach((anim) => anim.start());
    gradientLoop.start();

    const timer = setTimeout(() => {
      if (!i18nLoading) {
        if (user) {
          if (user.isProfessional) {
            router.replace('/(pro)/dashboard');
          } else {
            router.replace('/(tabs)/map');
          }
        } else {
          router.replace('/onboarding');
        }
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      logoAnimation.stop();
      floatingAnimations.forEach((anim) => anim.stop());
      particleAnimations.forEach((anim) => anim.stop());
      gradientLoop.stop();
    };
  }, [user, i18nLoading, fadeAnim, scaleAnim, slideAnim, pulseAnim, float1, float2, float3, float4, float5, particle1, particle2, particle3, router, gradientAnim]);

  const float1Y = float1.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const float2Y = float2.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const float3Y = float3.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });
  const float4Y = float4.interpolate({ inputRange: [0, 1], outputRange: [0, 25] });
  const float5Y = float5.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });

  const particle1X = particle1.interpolate({ inputRange: [0, 1], outputRange: [0, width] });
  const particle2X = particle2.interpolate({ inputRange: [0, 1], outputRange: [width, -50] });
  const particle3X = particle3.interpolate({ inputRange: [0, 1], outputRange: [0, width * 0.8] });

  const particle1Y = particle1.interpolate({ inputRange: [0, 1], outputRange: [height, -50] });
  const particle2Y = particle2.interpolate({ inputRange: [0, 1], outputRange: [height * 0.3, height] });
  const particle3Y = particle3.interpolate({ inputRange: [0, 1], outputRange: [height * 0.8, -50] });

  const COLOR_A = '#FFB3E6' as const;
  const COLOR_B = '#A855F7' as const;
  const COLOR_C = '#60A5FA' as const;
  const topOpacity = gradientAnim;
  const bottomOpacity = gradientAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View style={styles.container} testID="splash-root">
      <StatusBar style="light" />

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bottomOpacity }]}>
        <LinearGradient
          colors={[COLOR_A, COLOR_B, COLOR_C]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: topOpacity }]}>
        <LinearGradient
          colors={[COLOR_C, COLOR_B, COLOR_A]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.particleContainer}>
        <Animated.View
          style={[styles.particle, styles.particle1, { transform: [{ translateX: particle1X }, { translateY: particle1Y }, { rotate: '45deg' }] }]}
        />
        <Animated.View
          style={[styles.particle, styles.particle2, { transform: [{ translateX: particle2X }, { translateY: particle2Y }, { rotate: '-30deg' }] }]}
        />
        <Animated.View
          style={[styles.particle, styles.particle3, { transform: [{ translateX: particle3X }, { translateY: particle3Y }, { rotate: '60deg' }] }]}
        />
      </View>

      <View style={styles.backgroundPattern}>
        <Animated.View
          style={[styles.floatingElement, styles.element1, { opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] }), transform: [{ scale: scaleAnim }, { translateY: float1Y }, { rotate: '45deg' }] }]}
        />
        <Animated.View
          style={[styles.floatingElement, styles.element2, { opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }), transform: [{ scale: scaleAnim }, { translateY: float2Y }, { rotate: '-30deg' }] }]}
        />
        <Animated.View
          style={[styles.floatingElement, styles.element3, { opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }), transform: [{ scale: scaleAnim }, { translateY: float3Y }] }]}
        />
        <Animated.View
          style={[styles.floatingElement, styles.element4, { opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] }), transform: [{ scale: scaleAnim }, { translateY: float4Y }, { rotate: '15deg' }] }]}
        />
        <Animated.View
          style={[styles.floatingElement, styles.element5, { opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }), transform: [{ scale: scaleAnim }, { translateY: float5Y }, { rotate: '-45deg' }] }]}
        />
      </View>

      <Animated.View
        testID="splash-content"
        style={[styles.content, { opacity: fadeAnim, transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }, { translateY: slideAnim }] }]}
      >
        <Animated.View testID="splash-logo" style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Image
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/a2k5bslyqhaly2a9nocjw' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          testID="splash-title"
          style={[styles.titleContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 100], outputRange: [0, 50] }) }] }]}
        >
          <Animated.Text style={styles.appTitle}>Coppet</Animated.Text>

        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 4,
  },
  particle1: {
    width: 8,
    height: 8,
    left: -50,
    top: height + 50,
  },
  particle2: {
    width: 6,
    height: 6,
    right: -50,
    top: height * 0.3,
  },
  particle3: {
    width: 10,
    height: 10,
    left: -50,
    top: height * 0.8,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  floatingElement: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  element1: {
    width: 120,
    height: 120,
    borderRadius: 20,
    top: '15%',
    right: '10%',
  },
  element2: {
    width: 80,
    height: 80,
    borderRadius: 40,
    bottom: '25%',
    left: '15%',
  },
  element3: {
    width: 60,
    height: 60,
    borderRadius: 30,
    top: '65%',
    right: '25%',
  },
  element4: {
    width: 100,
    height: 100,
    borderRadius: 15,
    top: '35%',
    left: '5%',
  },
  element5: {
    width: 70,
    height: 70,
    borderRadius: 35,
    bottom: '15%',
    right: '5%',
  },
  content: {
    alignItems: 'center',
    zIndex: 2,
  },
  logoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 60,
    padding: DIMENSIONS.SPACING.xl,
    backdropFilter: 'blur(30px)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: 'rgba(138, 43, 226, 0.3)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 20,
    marginBottom: DIMENSIONS.SPACING.lg,
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 140,
    height: 140,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: DIMENSIONS.SPACING.sm,
  },
  appTitle: {
    fontSize: 42,
    fontWeight: '800' as const,
    letterSpacing: 2,
    textAlign: 'center',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: DIMENSIONS.SPACING.xs,
  },

});