import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform, Pressable, PressableStateCallbackType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOWS, SPACING, TOUCH_TARGET, ANIMATION } from '@/theme/tokens';

interface Action {
  icon: React.ReactNode;
  onPress: () => void;
  primary?: boolean;
  testID?: string;
}

interface FloatingActionBarProps {
  actions: Action[];
}

export function FloatingActionBar({ actions }: FloatingActionBarProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION.duration.normal,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATION.duration.slow,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: insets.bottom + SPACING.md,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.bar}>
        {actions.map((action, index) => (
          <View key={index} style={styles.actionWrapper}>
            <View
              style={[
                styles.action,
                action.primary && styles.actionPrimary,
              ]}
            >
              <Pressable
                onPress={action.onPress}
                testID={action.testID}
                style={({ pressed }: PressableStateCallbackType) => [
                  styles.pressable,
                  pressed && styles.pressablePressed,
                ]}
              >
                {action.icon}
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    ...Platform.select({
      web: {
        pointerEvents: 'box-none',
      },
    }),
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.floatingBar,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    gap: SPACING.xl * 1.5,
    minWidth: 200,
    ...SHADOWS.floatingBar,
  },
  actionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  action: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSecondary,
  },
  actionPrimary: {
    backgroundColor: COLORS.primary,
  },
  pressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
  },
  pressablePressed: {
    opacity: 0.7,
  },
});
