import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Dimensions,
  View,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

import { useAuth } from '@/hooks/auth-store';
import { useI18n } from '@/hooks/i18n-store';
import { useOnboarding } from '@/hooks/onboarding-store';

const VIDEO_URL = 'https://firebasestorage.googleapis.com/v0/b/copattes.firebasestorage.app/o/Coppet%2Flogo%20splash.m4v?alt=media&token=896a8261-2dbd-4700-b206-0be8f0848616';
const LOGO_URL = 'https://firebasestorage.googleapis.com/v0/b/copattes.firebasestorage.app/o/Coppet%2Flogo%2FOdalea%20Logo.png?alt=media&token=e36e5c80-f424-4c96-9243-d99e499f9652';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type TargetRoute = '/onboarding' | '/(tabs)/map' | '/auth/signin';

export default function AnimatedSplashScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isLoading: i18nLoading } = useI18n();
  const { hasCompleted, isReady: onboardingReady } = useOnboarding();

  const [reduceMotionEnabled, setReduceMotionEnabled] = useState<boolean>(false);
  const [isReadyToShow, setIsReadyToShow] = useState<boolean>(false);
  const [videoFinished, setVideoFinished] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);

  const videoRef = useRef<Video>(null);
  const fadeOutOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const splashHiddenRef = useRef<boolean>(false);

  const canNavigate = useMemo(() => {
    return !i18nLoading && onboardingReady;
  }, [i18nLoading, onboardingReady]);

  const target: TargetRoute = useMemo(() => {
    if (user) {
      return '/(tabs)/map';
    }
    if (hasCompleted) {
      return '/auth/signin';
    }
    return '/onboarding';
  }, [user, hasCompleted]);

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

  const hideNativeSplash = useCallback(async () => {
    if (Platform.OS === 'web') return;
    if (splashHiddenRef.current) {
      console.log('[AnimatedSplash] splash already hidden, skipping');
      return;
    }
    
    console.log('[AnimatedSplash] hide native splash');
    splashHiddenRef.current = true;
    
    try {
      await SplashScreen.hideAsync();
      console.log('[AnimatedSplash] native splash hidden successfully');
    } catch (error: unknown) {
      // Safe to ignore - splash screen may already be hidden or not registered
      // This is expected on some platforms/timing scenarios
      console.log('[AnimatedSplash] hideAsync skipped:', error instanceof Error ? error.message : 'unknown error');
    }
  }, []);

  const waitingToExitRef = useRef<boolean>(false);
  const exitStartedRef = useRef<boolean>(false);

  const runExit = useCallback(() => {
    if (exitStartedRef.current) return;
    exitStartedRef.current = true;

    console.log('[AnimatedSplash] start exit');

    Animated.timing(fadeOutOpacity, {
      toValue: 0,
      duration: 400,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      console.log('[AnimatedSplash] exit finished', { finished });
      if (!finished) return;
      router.replace(target as any);
    });
  }, [fadeOutOpacity, router, target]);

  const handleVideoStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    
    if (status.didJustFinish) {
      console.log('[AnimatedSplash] video finished');
      setVideoFinished(true);
    }
  }, []);

  const handleVideoError = useCallback((error: string) => {
    console.error('[AnimatedSplash] video error:', error);
    setVideoError(true);
    setVideoFinished(true);
  }, []);

  useEffect(() => {
    if (!canNavigate) return;
    if (!waitingToExitRef.current) return;
    if (!videoFinished) return;
    console.log('[AnimatedSplash] became ready while waiting -> exit');
    runExit();
  }, [canNavigate, runExit, videoFinished]);

  useEffect(() => {
    if (!videoFinished) return;
    if (!canNavigate) {
      console.log('[AnimatedSplash] video finished but not ready to navigate yet');
      waitingToExitRef.current = true;
      return;
    }
    console.log('[AnimatedSplash] video finished and ready -> exit');
    runExit();
  }, [videoFinished, canNavigate, runExit]);

  const runWebFallback = useCallback(() => {
    console.log('[AnimatedSplash] running web fallback animation');
    
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        setVideoFinished(true);
      }, 1500);
    });
  }, [logoOpacity, logoScale]);

  const startVideo = useCallback(async () => {
    console.log('[AnimatedSplash] startVideo', { reduceMotionEnabled, canNavigate, target, isWeb: Platform.OS === 'web' });

    waitingToExitRef.current = false;
    exitStartedRef.current = false;

    if (Platform.OS === 'web') {
      console.log('[AnimatedSplash] web platform - using fallback animation');
      runWebFallback();
      return;
    }

    if (reduceMotionEnabled || videoError) {
      console.log('[AnimatedSplash] skipping video (reduce motion or error)');
      setTimeout(() => {
        setVideoFinished(true);
      }, 500);
      return;
    }

    try {
      if (videoRef.current) {
        await videoRef.current.playAsync();
        console.log('[AnimatedSplash] video started playing');
      }
    } catch (error) {
      console.error('[AnimatedSplash] failed to play video:', error);
      setVideoError(true);
      setVideoFinished(true);
    }
  }, [canNavigate, reduceMotionEnabled, target, videoError, runWebFallback]);

  useEffect(() => {
    if (!isReadyToShow) return;
    hideNativeSplash();
    startVideo();
  }, [hideNativeSplash, isReadyToShow, startVideo]);

  useEffect(() => {
    if (!canNavigate) return;
    console.log('[AnimatedSplash] canNavigate', { target, hasUser: Boolean(user), hasCompleted });
  }, [canNavigate, hasCompleted, target, user]);

  return (
    <Animated.View
      style={[styles.root, { opacity: fadeOutOpacity }]}
      testID="animated-splash-root"
      onLayout={() => {
        if (!isReadyToShow) {
          console.log('[AnimatedSplash] onLayout -> ready');
          setIsReadyToShow(true);
        }
      }}
    >
      <StatusBar style="light" hidden />

      {Platform.OS === 'web' ? (
        <View style={styles.webFallback}>
          <Animated.Image
            source={{ uri: LOGO_URL }}
            style={[
              styles.logo,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
            resizeMode="contain"
            testID="animated-splash-logo"
          />
        </View>
      ) : (
        <Video
          ref={videoRef}
          source={{ uri: VIDEO_URL }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isLooping={false}
          isMuted={true}
          onPlaybackStatusUpdate={handleVideoStatusUpdate}
          onError={(error) => handleVideoError(String(error))}
          testID="animated-splash-video"
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  logo: {
    width: 200,
    height: 200,
  },
});
