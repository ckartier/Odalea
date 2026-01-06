import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { ENDEL } from '@/constants/endel';
import { useI18n } from '@/hooks/i18n-store';
import { useAuth } from '@/hooks/auth-store';
import { useOnboarding } from '@/hooks/onboarding-store';

const LOGO_URI = 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/qg65dezpx8zrcqopuuggc';

export default function SplashScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isLoading: i18nLoading } = useI18n();
  const { hasCompleted, isReady: onboardingReady } = useOnboarding();

  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(10)).current;
  const dots = useRef(new Animated.Value(0)).current;

  const canNavigate = useMemo(() => !i18nLoading && onboardingReady, [i18nLoading, onboardingReady]);

  const navigateOut = useCallback(() => {
    if (!canNavigate) return;

    const target = (() => {
      if (user?.isProfessional) return '/(pro)/dashboard' as const;
      if (user) {
        if (hasCompleted) return '/(tabs)/map' as const;
        return '/onboarding' as const;
      }
      return '/onboarding' as const;
    })();

    Animated.timing(fade, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        router.replace(target as any);
      }
    });
  }, [canNavigate, fade, hasCompleted, router, user]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dots, { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.timing(dots, { toValue: 0, duration: 520, useNativeDriver: true }),
      ]),
    );
    loop.start();

    return () => {
      loop.stop();
    };
  }, [dots, fade, lift]);

  useEffect(() => {
    const t = setTimeout(() => {
      console.log('[Splash] routing', { canNavigate, hasUser: Boolean(user), hasCompleted });
      navigateOut();
    }, 760);

    return () => clearTimeout(t);
  }, [canNavigate, hasCompleted, navigateOut, user]);

  const dotOpacity = (i: number) =>
    dots.interpolate({
      inputRange: [0, 1],
      outputRange: i === 0 ? [0.25, 1] : i === 1 ? [1, 0.25] : [0.55, 0.55],
    });

  return (
    <View style={styles.root} testID="splash-root">
      <StatusBar style="dark" />

      <Animated.View style={[styles.center, { opacity: fade, transform: [{ translateY: lift }] }]} testID="splash-content">
        <View style={styles.logoWrap} testID="splash-logo">
          <Animated.Image source={{ uri: LOGO_URI }} style={styles.logo} resizeMode="contain" />
        </View>

        <Text style={styles.title} testID="splash-title">Odalea</Text>
        <Text style={styles.baseline} testID="splash-baseline">Simple. Intention-first.</Text>
      </Animated.View>

      <Animated.View style={[styles.loaderRow, { opacity: fade }]} testID="splash-loader">
        <Animated.View style={[styles.dot, { opacity: dotOpacity(0) }]} />
        <Animated.View style={[styles.dot, { opacity: dotOpacity(1) }]} />
        <Animated.View style={[styles.dot, { opacity: dotOpacity(2) }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ENDEL.colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ENDEL.spacing.xl,
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ENDEL.colors.borderSubtle,
    ...((ENDEL.shadows.card as unknown) as object),
    marginBottom: 18,
  },
  logo: {
    width: 62,
    height: 62,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700' as const,
    color: ENDEL.colors.text,
    letterSpacing: -0.3,
  },
  baseline: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
    color: ENDEL.colors.textSecondary,
  },
  loaderRow: {
    position: 'absolute',
    bottom: 26,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#111111',
    opacity: 0.3,
  },
});
