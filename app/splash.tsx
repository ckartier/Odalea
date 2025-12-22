import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DIMENSIONS } from '@/constants/colors';
import { useAuth } from '@/hooks/auth-store';
import { useI18n } from '@/hooks/i18n-store';



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



    const gradientLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, { toValue: 1, duration: 4000, useNativeDriver: false }),
        Animated.timing(gradientAnim, { toValue: 0, duration: 4000, useNativeDriver: false }),
      ])
    );

    logoAnimation.start();
    floatingAnimations.forEach((anim) => anim.start());
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
      gradientLoop.stop();
    };
  }, [user, i18nLoading, fadeAnim, scaleAnim, slideAnim, pulseAnim, float1, float2, float3, float4, float5, router, gradientAnim]);

  const float1Y = float1.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const float2Y = float2.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const float3Y = float3.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });
  const float4Y = float4.interpolate({ inputRange: [0, 1], outputRange: [0, 25] });
  const float5Y = float5.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });

  const COLOR_A = '#FFB3E6' as const;
  const COLOR_B = '#C084FC' as const;
  const COLOR_C = '#A855F7' as const;
  const COLOR_D = '#60A5FA' as const;
  const topOpacity = gradientAnim;
  const bottomOpacity = gradientAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View style={styles.container} testID="splash-root">
      <StatusBar style="light" />

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bottomOpacity }]}>
        <LinearGradient
          colors={[COLOR_A, COLOR_B, COLOR_C, COLOR_D]}
          locations={[0, 0.35, 0.65, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: topOpacity }]}>
        <LinearGradient
          colors={[COLOR_C, COLOR_B, COLOR_A, COLOR_D]}
          locations={[0, 0.35, 0.65, 1]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.particleContainer}>
        {[...Array(20)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.sparkle,
              {
                left: `${(i * 17 + 10) % 90}%`,
                top: `${(i * 23 + 15) % 85}%`,
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, (0.3 + (i % 5) * 0.15)],
                }),
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [0.5 + (i % 4) * 0.25, 1 + (i % 4) * 0.25],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
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
        <Animated.View 
          testID="splash-logo" 
          style={[
            styles.logoContainer, 
            { 
              transform: [
                { scale: pulseAnim },
                { 
                  rotateY: pulseAnim.interpolate({
                    inputRange: [1, 1.05, 1.1],
                    outputRange: ['0deg', '5deg', '0deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.Image
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/qg65dezpx8zrcqopuuggc' }}
            style={[
              styles.logoImage,
              {
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [1, 1.05],
                    }),
                  },
                ],
              },
            ]}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          testID="splash-title"
          style={[styles.titleContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 100], outputRange: [0, 50] }) }] }]}
        >
          <Animated.Text style={styles.appTitle}>Odalea</Animated.Text>
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
  sparkle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 80,
    padding: DIMENSIONS.SPACING.xl,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.4,
    shadowRadius: 50,
    elevation: 25,
    marginBottom: DIMENSIONS.SPACING.xl,
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 220,
    height: 220,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: DIMENSIONS.SPACING.sm,
  },
  appTitle: {
    fontSize: 56,
    fontWeight: '700' as const,
    letterSpacing: 3,
    textAlign: 'center',
    color: '#ffffff',
    textShadowColor: 'rgba(168, 85, 247, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
    marginBottom: DIMENSIONS.SPACING.xs,
  },

});