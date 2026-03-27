import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

import { ENDEL } from '@/constants/endel';
import { useOnboarding } from '@/hooks/onboarding-store';
import { usePets } from '@/hooks/pets-store';
import { useActivePet } from '@/hooks/active-pet-store';

type RouteTarget = '/(tabs)/map' | '/(tabs)/community' | '/(tabs)/lost-found' | '/(tabs)/cat-sitter';

function routeFromIntent(intent: ReturnType<typeof useOnboarding>['preferredIntent']): RouteTarget {
  if (intent === 'community') return '/(tabs)/community';
  if (intent === 'lostFound') return '/(tabs)/lost-found';
  if (intent === 'catSitter') return '/(tabs)/cat-sitter';
  return '/(tabs)/map';
}

function RowCard({
  title,
  subtitle,
  right,
  onPress,
  testID,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  testID: string;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} testID={testID} style={styles.rowPress}>
      <View style={styles.rowCard}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{title}</Text>
          {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
        </View>
        {right}
      </View>
    </Pressable>
  );
}

export default function OnboardingSetupScreen() {
  const router = useRouter();
  const { preferredIntent, complete } = useOnboarding();
  const { userPets } = usePets();
  const { activePetId, setActivePet } = useActivePet();

  const [locationEnabled, setLocationEnabled] = useState<boolean>(false);
  const [requestingLoc, setRequestingLoc] = useState<boolean>(false);

  const stepLabel = '2/3';

  useEffect(() => {
    (async () => {
      try {
        const fg = await Location.getForegroundPermissionsAsync();
        const granted = fg.granted || fg.status === 'granted';
        setLocationEnabled(granted);
      } catch (e) {
        console.log('[OnboardingSetup] get permissions error', e);
      }
    })();
  }, []);

  const requestLocation = useCallback(async () => {
    if (requestingLoc) return;
    setRequestingLoc(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      const res = await Location.requestForegroundPermissionsAsync();
      const granted = res.granted || res.status === 'granted';
      setLocationEnabled(granted);
      if (!granted) {
        Alert.alert('Localisation', 'Permission refusée. Tu peux l’activer plus tard dans les réglages.');
      }
    } catch (e) {
      console.error('[OnboardingSetup] request location error', e);
      Alert.alert('Erreur', 'Impossible de demander la localisation.');
    } finally {
      setRequestingLoc(false);
    }
  }, [requestingLoc]);

  const hasPets = (userPets?.length ?? 0) > 0;
  const needsPrimary = (userPets?.length ?? 0) > 1;

  const onContinue = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);

    if (!hasPets) {
      Alert.alert('Ajoute au moins un animal', 'Pour personnaliser l’expérience, ajoute ton animal maintenant (ou choisis “Plus tard”).');
      return;
    }

    complete();

    const target = routeFromIntent(preferredIntent);
    console.log('[OnboardingSetup] complete ->', target);
    router.replace(target as any);
  }, [complete, hasPets, preferredIntent, router]);

  const onLater = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    complete();
    const target = routeFromIntent(preferredIntent);
    router.replace(target as any);
  }, [complete, preferredIntent, router]);

  const pickPrimary = useCallback(
    async (petId: string) => {
      await Haptics.selectionAsync().catch(() => undefined);
      setActivePet(petId);
    },
    [setActivePet],
  );

  const primaryList = useMemo(() => {
    if (!needsPrimary) return null;

    return (
      <View style={styles.section} testID="setup-primary">
        <Text style={styles.sectionTitle}>Animal principal</Text>
        <View style={{ gap: 10 }}>
          {userPets.map((p) => {
            const selected = p.id === activePetId;
            return (
              <Pressable
                key={p.id}
                onPress={() => pickPrimary(p.id)}
                testID={`primary-${p.id}`}
                style={[styles.pill, selected && styles.pillActive]}
              >
                <Text style={[styles.pillText, selected && styles.pillTextActive]} numberOfLines={1}>
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }, [activePetId, needsPrimary, pickPrimary, userPets]);

  return (
    <View style={styles.root} testID="onboarding-setup">
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.content} testID="onboarding-setup-scroll">
        <View style={styles.topRow}>
          <Text style={styles.stepper} testID="setup-stepper">{stepLabel}</Text>
          <Text style={styles.topTitle} testID="setup-title">Setup rapide</Text>
          <Text style={styles.topSubtitle} testID="setup-subtitle">Rends ODALEA utile en 20 secondes.</Text>
        </View>

        <View style={styles.section}>
          <RowCard
            title="Ajouter ton animal"
            subtitle={hasPets ? `${userPets.length} animal${userPets.length > 1 ? 'x' : ''} ajouté` : 'Nom, type, photo'}
            onPress={() => router.push('/pet/add' as any)}
            testID="setup-add-pet"
            right={<View style={styles.chev} />}
          />

          <RowCard
            title="Activer la localisation"
            subtitle={locationEnabled ? 'Activée' : 'Recommandé pour la carte'}
            onPress={requestLocation}
            testID="setup-location"
            right={<View style={[styles.dotState, locationEnabled ? styles.dotOn : styles.dotOff]} />}
          />
        </View>

        {primaryList}

        <View style={styles.ctaRow}>
          <Pressable onPress={onContinue} testID="setup-continue" style={styles.ctaPrimary}>
            <Text style={styles.ctaPrimaryText}>Continuer</Text>
          </Pressable>
          <Pressable onPress={onLater} testID="setup-later" style={styles.ctaSecondary}>
            <Text style={styles.ctaSecondaryText}>Plus tard</Text>
          </Pressable>
        </View>
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
  topRow: {
    marginBottom: ENDEL.spacing.lg,
  },
  stepper: {
    ...ENDEL.typography.caption,
  },
  topTitle: {
    marginTop: 8,
    ...ENDEL.typography.title,
  },
  topSubtitle: {
    marginTop: 6,
    ...ENDEL.typography.subtitle,
  },
  section: {
    marginTop: 10,
    gap: 12,
  },
  sectionTitle: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700' as const,
    color: ENDEL.colors.text,
  },
  rowPress: {
    borderRadius: ENDEL.radii.card,
  },
  rowCard: {
    borderRadius: ENDEL.radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ENDEL.colors.borderSubtle,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: ENDEL.spacing.lg,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
    ...((ENDEL.shadows.card as unknown) as object),
  },
  rowText: {
    flex: 1,
    paddingRight: 12,
  },
  rowTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700' as const,
    color: ENDEL.colors.text,
  },
  rowSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
    color: ENDEL.colors.textSecondary,
  },
  dotState: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotOn: {
    backgroundColor: ENDEL.colors.success,
  },
  dotOff: {
    backgroundColor: '#D1D5DB',
  },
  chev: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    opacity: 0.35,
  },
  pill: {
    borderRadius: ENDEL.radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ENDEL.colors.borderSubtle,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  pillActive: {
    borderColor: ENDEL.colors.accent,
    backgroundColor: '#F5F3FF',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: ENDEL.colors.text,
  },
  pillTextActive: {
    color: ENDEL.colors.text,
  },
  ctaRow: {
    marginTop: ENDEL.spacing.xl,
    gap: 12,
  },
  ctaPrimary: {
    borderRadius: ENDEL.radii.card,
    minHeight: 52,
    backgroundColor: ENDEL.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimaryText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  ctaSecondary: {
    borderRadius: ENDEL.radii.card,
    minHeight: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ENDEL.colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaSecondaryText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700' as const,
    color: ENDEL.colors.text,
  },
});
