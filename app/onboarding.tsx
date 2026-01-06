import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ENDEL } from '@/constants/endel';
import { useOnboarding } from '@/hooks/onboarding-store';

type IntentKey = 'map' | 'community' | 'lostFound' | 'pros' | 'catSitter';

const INTENTS: {
  key: IntentKey;
  title: string;
  subtitle: string;
  route: string;
}[] = [
  { key: 'map', title: 'Autour de moi', subtitle: 'Carte & proches', route: '/(tabs)/map' },
  { key: 'community', title: 'Publier', subtitle: 'Communauté', route: '/(tabs)/community' },
  { key: 'lostFound', title: 'Perdu / Trouvé', subtitle: 'Alerte & entraide', route: '/(tabs)/lost-found' },
  { key: 'pros', title: 'Trouver un service', subtitle: 'Vétos, shops…', route: '/(tabs)/map' },
  { key: 'catSitter', title: 'Réserver un cat sitter', subtitle: 'Disponibilités', route: '/(tabs)/cat-sitter' },
];

function IntentCard({
  title,
  subtitle,
  onPress,
  testID,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
  testID: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 12,
      tension: 110,
    }).start();
  }, [scale]);

  const pressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 12,
      tension: 110,
    }).start();
  }, [scale]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      testID={testID}
      style={styles.cardPress}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function OnboardingIntentScreen() {
  const router = useRouter();
  const { hasCompleted, isReady, setPreferredIntent } = useOnboarding();
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  useEffect(() => {
    if (isReady && hasCompleted) {
      router.replace('/(tabs)/map');
    }
  }, [hasCompleted, isReady, router]);

  const onPick = useCallback(
    async (intent: IntentKey, route: string) => {
      if (isNavigating) return;
      setIsNavigating(true);

      console.log('[OnboardingIntent] pick', intent, route);
      setPreferredIntent(intent);

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);

      router.push('/onboarding-setup' as any);

      setTimeout(() => setIsNavigating(false), 600);
    },
    [isNavigating, router, setPreferredIntent],
  );

  const header = useMemo(() => {
    return {
      title: 'Bienvenue',
      subtitle: 'Choisis ton intention.',
    };
  }, []);

  return (
    <View style={styles.root} testID="onboarding-intent">
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        testID="onboarding-intent-scroll"
      >
        <View style={styles.header}>
          <Text style={styles.hTitle} testID="onboarding-intent-title">
            {header.title}
          </Text>
          <Text style={styles.hSubtitle} testID="onboarding-intent-subtitle">
            {header.subtitle}
          </Text>
        </View>

        <View style={styles.cards}>
          {INTENTS.map((i) => (
            <IntentCard
              key={i.key}
              title={i.title}
              subtitle={i.subtitle}
              onPress={() => onPick(i.key, i.route)}
              testID={`intent-${i.key}`}
            />
          ))}
        </View>

        <Text style={styles.footNote} testID="onboarding-intent-footnote">
          Tu pourras changer plus tard depuis le profil.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ENDEL.colors.bg,
  },
  content: {
    paddingHorizontal: ENDEL.spacing.lg,
    paddingTop: ENDEL.spacing.xl,
    paddingBottom: ENDEL.spacing.xl,
  },
  header: {
    marginBottom: ENDEL.spacing.lg,
  },
  hTitle: {
    ...ENDEL.typography.title,
  },
  hSubtitle: {
    marginTop: 6,
    ...ENDEL.typography.subtitle,
  },
  cards: {
    gap: 12,
  },
  cardPress: {
    borderRadius: ENDEL.radii.card,
  },
  card: {
    minHeight: 72,
    borderRadius: ENDEL.radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ENDEL.colors.borderSubtle,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: ENDEL.spacing.lg,
    paddingVertical: 16,
    justifyContent: 'center',
    ...((ENDEL.shadows.card as unknown) as object),
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700' as const,
    color: ENDEL.colors.text,
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
    color: ENDEL.colors.textSecondary,
  },
  footNote: {
    marginTop: ENDEL.spacing.lg,
    ...ENDEL.typography.caption,
  },
});
