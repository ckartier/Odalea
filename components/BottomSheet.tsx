import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ENDEL } from '@/constants/endel';

export type BottomSheetSize = 'compact' | 'medium' | 'large';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  size?: BottomSheetSize;
  children: React.ReactNode;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  testID?: string;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export default function BottomSheet({
  isOpen,
  onClose,
  size = 'medium',
  children,
  containerStyle,
  contentStyle,
  testID,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(1000)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  const targetHeightPct = useMemo(() => {
    if (size === 'compact') return 0.34;
    if (size === 'large') return 0.86;
    return 0.58;
  }, [size]);

  const open = useCallback(() => {
    translateY.setValue(1000);
    backdrop.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }),
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdrop, translateY]);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 1000,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onClose();
    });
  }, [backdrop, onClose, translateY]);

  useEffect(() => {
    if (isOpen) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      }
      open();
    }
  }, [isOpen, open]);

  const sheetMaxHeightStyle = useMemo(() => {
    const screenHeight = 1000; // placeholder for web SSR safety; actual height is flex-based.
    const maxHeight = clamp(screenHeight * targetHeightPct, 260, 820);
    return { maxHeight } as const;
  }, [targetHeightPct]);

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={close}>
      <View style={styles.root} testID={testID ?? 'bottom-sheet'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} testID="bottom-sheet-backdrop">
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { opacity: backdrop }, styles.backdrop]}
          />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            sheetMaxHeightStyle,
            { paddingBottom: Math.max(insets.bottom, 12) },
            containerStyle,
            { transform: [{ translateY }] },
          ]}
        >
          <View style={styles.grabber} testID="bottom-sheet-grabber" />
          <View style={[styles.content, contentStyle]}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(17, 17, 17, 0.24)',
  },
  sheet: {
    backgroundColor: ENDEL.colors.bg,
    borderTopLeftRadius: ENDEL.radii.sheet,
    borderTopRightRadius: ENDEL.radii.sheet,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: ENDEL.colors.borderSubtle,
    paddingTop: 10,
    ...((ENDEL.shadows.card as unknown) as object),
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 99,
    backgroundColor: '#E5E7EB',
    marginBottom: 10,
  },
  content: {
    paddingHorizontal: ENDEL.spacing.lg,
    paddingBottom: ENDEL.spacing.md,
  },
});
