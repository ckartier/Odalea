import React, { useCallback, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLORS } from '@/constants/colors';
import type { Badge, Challenge } from '@/types';
import { badges as badgeMocks, challenges as challengeMocks } from '@/mocks/badges';

interface SeedResultItem {
  id: string;
  type: 'badge' | 'challenge' | 'validation';
  status: 'success' | 'error';
  message: string;
}

export default function FirebaseSeedGamificationScreen() {
  const [isSeedingBadges, setIsSeedingBadges] = useState<boolean>(false);
  const [isSeedingChallenges, setIsSeedingChallenges] = useState<boolean>(false);
  const [results, setResults] = useState<SeedResultItem[]>([]);

  const upsertBadges = useCallback(async () => {
    if (!db) return;
    setIsSeedingBadges(true);
    try {
      const col = collection(db, 'badges');
      for (const b of badgeMocks as Badge[]) {
        try {
          const payload: Badge = {
            id: b.id,
            name: b.name,
            description: b.description,
            imageUrl: b.imageUrl,
            unlocked: b.unlocked ?? false,
            category: b.category,
            requirement: b.requirement,
          };
          await setDoc(doc(col, payload.id), payload, { merge: true });
          setResults(prev => [
            ...prev,
            { id: payload.id, type: 'badge', status: 'success', message: `Badge «${payload.name}» importé` },
          ]);
        } catch (e) {
          setResults(prev => [
            ...prev,
            { id: b.id, type: 'badge', status: 'error', message: (e as Error)?.message ?? 'Erreur inconnue' },
          ]);
        }
      }
    } finally {
      setIsSeedingBadges(false);
    }
  }, []);

  const upsertChallenges = useCallback(async () => {
    if (!db) return;
    setIsSeedingChallenges(true);
    try {
      const col = collection(db, 'challenges');
      for (const c of challengeMocks as Challenge[]) {
        try {
          const payload: Challenge = {
            id: c.id,
            name: c.name,
            description: c.description,
            imageUrl: c.imageUrl,
            progress: c.progress ?? 0,
            total: c.total,
            reward: c.reward,
            completed: c.completed ?? false,
          };
          await setDoc(doc(col, payload.id), payload, { merge: true });
          setResults(prev => [
            ...prev,
            { id: payload.id, type: 'challenge', status: 'success', message: `Challenge «${payload.name}» importé` },
          ]);
        } catch (e) {
          setResults(prev => [
            ...prev,
            { id: c.id, type: 'challenge', status: 'error', message: (e as Error)?.message ?? 'Erreur inconnue' },
          ]);
        }
      }
    } finally {
      setIsSeedingChallenges(false);
    }
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="firebase-seed-gamification">
      <Stack.Screen options={{ title: 'Seed Badges & Challenges' }} />
      <Text style={styles.title}>Seeder des collections Gamification</Text>
      <Text style={styles.subtitle}>Badges et Challenges depuis les mocks. Environnement: {Platform.OS}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity
          testID="seed-badges"
          style={[styles.primaryBtn, isSeedingBadges && styles.disabledBtn]}
          disabled={isSeedingBadges}
          onPress={upsertBadges}
        >
          {isSeedingBadges ? (
            <>
              <ActivityIndicator color={COLORS.white} />
              <Text style={styles.primaryBtnText}> Import badges...</Text>
            </>
          ) : (
            <Text style={styles.primaryBtnText}>Créer/Mettre à jour les Badges</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          testID="seed-challenges"
          style={[styles.secondaryBtn, isSeedingChallenges && styles.disabledBtn]}
          disabled={isSeedingChallenges}
          onPress={upsertChallenges}
        >
          {isSeedingChallenges ? (
            <>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.secondaryBtnText}> Import challenges...</Text>
            </>
          ) : (
            <Text style={styles.secondaryBtnText}>Créer/Mettre à jour les Challenges</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.results}>
        <Text style={styles.sectionTitle}>Résultats ({results.length})</Text>
        {results.map((r, i) => (
          <View key={`${r.type}-${r.id}-${i}`} style={[styles.resultItem, r.status === 'success' ? styles.ok : styles.err]} testID={`result-${i}`}>
            <Text style={styles.resultText}>{r.status.toUpperCase()} • {r.type} • {r.id}</Text>
            <Text style={styles.resultDetail}>{r.message}</Text>
          </View>
        ))}
        {!results.length && <Text style={styles.hint}>Aucun résultat pour l’instant.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.black },
  subtitle: { fontSize: 14, color: COLORS.gray },
  section: { backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 6 },
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  secondaryBtn: { backgroundColor: COLORS.white, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.mediumGray, alignItems: 'center', marginTop: 8 },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  secondaryBtnText: { color: COLORS.black, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  results: { backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12 },
  resultItem: { backgroundColor: COLORS.white, borderLeftWidth: 4, padding: 10, borderRadius: 8, marginBottom: 8 },
  ok: { borderLeftColor: '#22C55E' },
  err: { borderLeftColor: '#EF4444' },
  resultText: { fontSize: 13, fontWeight: '700', color: COLORS.black },
  resultDetail: { fontSize: 12, color: COLORS.darkGray },
  hint: { fontSize: 12, color: COLORS.gray },
});