import React, { useMemo } from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/services/firebase';
import { collection, getCountFromServer } from 'firebase/firestore';
import { COLORS, DIMENSIONS } from '@/constants/colors';
import { Database, RefreshCw } from 'lucide-react-native';

interface FirestoreCollectionInfo {
  id: string;
  count: number;
}

const KNOWN_COLLECTIONS: readonly string[] = [
  'users',
  'pets',
  'petSitterProfiles',
  'bookings',
  'conversations',
  'messages',
  'challenges',
  'orders',
  'posts',
  'comments',
  'likes',
  'lostFoundReports',
  'badges',
  'userBadges',
  'animalSpecies',
  'animalBreeds',
];

export default function FirestoreCollectionsScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['firestore-collections', 'counts'],
    queryFn: async () => {
      const entries: FirestoreCollectionInfo[] = [];
      for (const key of KNOWN_COLLECTIONS) {
        try {
          const snap = await getCountFromServer(collection(db, key));
          entries.push({ id: key, count: snap.data().count });
        } catch (e) {
          entries.push({ id: key, count: -1 });
        }
      }
      return entries.sort((a, b) => a.id.localeCompare(b.id));
    },
  });

  const content = useMemo(() => {
    if (isLoading) return <ActivityIndicator testID="loading-collections" />;
    if (error) {
      return (
        <View style={styles.errorBox} testID="error-collections">
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorText}>{(error as any)?.message ?? 'Chargement échoué'}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn} testID="retry-collections">
            <RefreshCw size={16} color={COLORS.white} />
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    const list = data ?? [];
    return (
      <View>
        {list.map(item => (
          <View key={item.id} style={styles.card} testID={`collection-${item.id}`}>
            <View style={styles.cardIcon}><Database size={18} color={COLORS.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.id}</Text>
              <Text style={styles.cardSubtitle}>Documents: {String(item.count)}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  }, [data, isLoading, error, refetch]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="collections-screen">
      <Stack.Screen options={{ title: 'Collections Firestore' }} />
      <View>
        {content}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.screenBackground },
  content: { padding: DIMENSIONS.SPACING.lg },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  cardIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(125,212,238,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cardTitle: { fontWeight: '700' as const, color: COLORS.black },
  cardSubtitle: { color: COLORS.darkGray, fontSize: DIMENSIONS.FONT_SIZES.xs, marginTop: 2 },
  errorBox: { backgroundColor: '#fff5f5', borderColor: '#ffd6d6', borderWidth: 1, padding: 12, borderRadius: 12 },
  errorTitle: { color: COLORS.error, fontWeight: '700' as const },
  errorText: { color: COLORS.error, marginTop: 4 },
  retryBtn: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  retryText: { color: COLORS.white, marginLeft: 6, fontWeight: '700' as const, fontSize: DIMENSIONS.FONT_SIZES.xs },
});