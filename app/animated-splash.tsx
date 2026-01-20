import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { ENDEL } from '@/constants/endel';
import { useAuth } from '@/hooks/auth-store';
import { useI18n } from '@/hooks/i18n-store';
import { useOnboarding } from '@/hooks/onboarding-store';

const LOGO = require('@/assets/images/splash-icon.png');

type TargetRoute =
  | '/(tabs)/map'
  | '/onboarding'
  | '/(pro)/dashboard'
  | '/(tabs)/community';

export default function AnimatedSplashScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isLoading: i18nLoading } = useI18n();
  const { hasCompleted, isReady: onboardingReady } = useOnboarding();

  const [reduceMotionEnabled, setReduceMotionEnabled] = useState<boolean>(false);
  const [isReadyToShow, setIsReadyToShow] = useState<boolean>(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const glowOpacity = useRef(new Animated.Value(0)).current;

  const canNavigate = useMemo(() => {
    return !i18nLoading && onboardingReady;
  }, [i18nLoading, onboardingReady]);

  const target = useMemo((): TargetRoute => {
    if (user?.isProfessional) return '/(pro)/dashboard';
    if (user) {
      if (hasCompleted) return '/(tabs)/map';
      return '/onboarding';
    }
    return '/onboarding';
  }, [hasCompleted, user]);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!mounted) return;
        setReduceMotionEnabled(Boolean(enabled));
      })
      .catch((e: unknown) => {
        console.log('[AnimatedSplash] reduce motion check failed', e);
        if (!mounted) return;
        setReduceMotionEnabled(false);
      });

    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled: boolean) => {
      console.log('[AnimatedSplash] reduceMotionChanged', enabled);
      setReduceMotionEnabled(Boolean(enabled));
    });

    return () => {
      mounted = false;
      // @ts-ignore - RN types differ across platforms/versions
      sub?.remove?.();
    };
  }, []);

  const hideNativeSplash = useCallback(() => {
    console.log('[AnimatedSplash] hide native splash');
    if (Platform.OS === 'web') return;
    
    // Use setTimeout to ensure we're not in a promise chain that could throw
    setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {
        // Safe to ignore - splash screen may already be hidden or not registered
      });
    }, 0);
  }, []);

  const waitingToExitRef = useRef<boolean>(false);
  const exitStartedRef = useRef<boolean>(false);

  const runExit = useCallback(() => {
    if (exitStartedRef.current) return;
    exitStartedRef.current = true;

    console.log('[AnimatedSplash] start exit');

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -12,
        duration: 400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.92,
        duration: 400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: 0,
        duration: 320,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      console.log('[AnimatedSplash] exit finished', { finished });
      if (!finished) return;
      router.replace(target as any);
    });
  }, [glowOpacity, opacity, router, scale, target, translateY]);

  useEffect(() => {
    if (!canNavigate) return;
    if (!waitingToExitRef.current) return;
    console.log('[AnimatedSplash] became ready while waiting -> exit');
    runExit();
  }, [canNavigate, runExit]);

  const runAnimation = useCallback(() => {
    console.log('[AnimatedSplash] runAnimation', { reduceMotionEnabled, canNavigate, target });

    waitingToExitRef.current = false;
    exitStartedRef.current = false;

    const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

    const enter = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        easing: easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 250,
        easing: easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 250,
        easing: easeOut,
        useNativeDriver: true,
      }),
    ]);

    const pulseOnce = Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.03,
        duration: 130,
        easing: easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 145,
        easing: easeOut,
        useNativeDriver: true,
      }),
    ]);

    const holdOrPulses = reduceMotionEnabled
      ? Animated.delay(350)
      : Animated.sequence([pulseOnce, pulseOnce]);

    Animated.sequence([enter, holdOrPulses]).start(({ finished }) => {
      console.log('[AnimatedSplash] enter+pulses finished', { finished, canNavigate });
      if (!finished) return;

      if (canNavigate) {
        runExit();
        return;
      }

      console.log('[AnimatedSplash] not ready yet -> waiting before exit');
      waitingToExitRef.current = true;
    });
  }, [canNavigate, glowOpacity, opacity, reduceMotionEnabled, runExit, scale, target]);

  useEffect(() => {
    if (!isReadyToShow) return;
    hideNativeSplash();
    runAnimation();
  }, [hideNativeSplash, isReadyToShow, runAnimation]);

  useEffect(() => {
    if (!canNavigate) return;
    console.log('[AnimatedSplash] canNavigate', { target, hasUser: Boolean(user), hasCompleted });
  }, [canNavigate, hasCompleted, target, user]);

  return (
    <View
      style={styles.root}
      testID="animated-splash-root"
      onLayout={() => {
        if (!isReadyToShow) {
          console.log('[AnimatedSplash] onLayout -> ready');
          setIsReadyToShow(true);
        }
      }}
    >
      <StatusBar style="dark" />

      <Animated.View
        style={{
          opacity,
          transform: [{ translateY }, { scale }],
        }}
        testID="animated-splash-content"
      >
        <View style={styles.center}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glow,
              {
                opacity: glowOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
                transform: [{ scale: 1 }],
              },
            ]}
            testID="animated-splash-glow"
          />

          <View style={styles.logoWrap} testID="animated-splash-logo-wrap">
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </View>

          <Text style={styles.title} testID="animated-splash-title">
            Odalea
          </Text>
        </View>
      </Animated.View>

      <View style={styles.bottomHint} pointerEvents="none" testID="animated-splash-bottom">
        <View style={styles.hintBar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700' as const,
    color: ENDEL.colors.text,
    letterSpacing: -0.2,
  },
  glow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FFFFFF',
    shadowColor: Platform.OS === 'android' ? '#000' : 'rgba(17, 17, 17, 0.10)',
    shadowOpacity: Platform.OS === 'android' ? 0.18 : 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  bottomHint: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintBar: {
    width: 56,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(17, 17, 17, 0.14)',
  },
});
