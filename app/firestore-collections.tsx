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
  // Core Entities
  'users',
  'pets',
  'professionals',
  'petSitterProfiles',
  
  // Social
  'posts',
  'comments',
  'likes',
  'friendRequests',
  'favorites',
  'blockedUsers',
  
  // Messaging
  'conversations',
  'messages',
  
  // Commerce
  'products',
  'professionalProducts',
  'orders',
  'carts',
  'subscriptions',
  'promoSubmissions',
  
  // Services & Bookings
  'bookings',
  'vetBookings',
  'reviews',
  
  // Lost & Found
  'lostFoundReports',
  
  // Community & Challenges
  'challenges',
  'userChallenges',
  'challengeSubmissions',
  'challengeParticipations',
  'badges',
  'userBadges',
  
  // Health
  'healthRecords',
  'vaccinations',
  'treatments',
  'medications',
  'healthDocuments',
  'healthReminders',
  'vetSessions',
  
  // System & Config
  'notifications',
  'emergencyContacts',
  'animalSpecies',
  'animalBreeds',
  'config',
  'ai_logs',
  
  // Moderation
  'reports',
  'moderationActions',
  'userFlags',
  'moderationQueue',
  'professionalVerifications',
  
  // Matching
  'petMatches',
  'petLikes',
  'petPasses'
];

export default function FirestoreCollectionsScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['firestore-collections', 'counts'],
    queryFn: async () => {
      const entries: FirestoreCollectionInfo[] = [];
      // Execute in parallel batches to speed up
      const promises = KNOWN_COLLECTIONS.map(async (key) => {
        try {
          const snap = await getCountFromServer(collection(db, key));
          return { id: key, count: snap.data().count };
        } catch (e) {
          console.log(`Error fetching count for ${key}:`, e);
          return { id: key, count: -1 };
        }
      });
      
      const results = await Promise.all(promises);
      return results.sort((a, b) => {
        // Sort by count (desc) then name (asc)
        if (a.count !== b.count) return b.count - a.count;
        return a.id.localeCompare(b.id);
      });
    },
  });

  const content = useMemo(() => {
    if (isLoading) return <ActivityIndicator testID="loading-collections" size="large" color={COLORS.primary} style={{ marginTop: 20 }} />;
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
          <View key={item.id} style={[styles.card, item.count === 0 && styles.cardEmpty, item.count === -1 && styles.cardError]} testID={`collection-${item.id}`}>
            <View style={[styles.cardIcon, item.count > 0 && styles.cardIconActive]}>
              <Database size={18} color={item.count > 0 ? COLORS.primary : COLORS.gray} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, item.count === 0 && styles.textGray]}>{item.id}</Text>
              <Text style={styles.cardSubtitle}>
                {item.count === -1 ? 'Accès refusé / Inconnu' : `${item.count} documents`}
              </Text>
            </View>
            {item.count > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{item.count}</Text></View>}
          </View>
        ))}
      </View>
    );
  }, [data, isLoading, error, refetch]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="collections-screen">
      <Stack.Screen options={{ title: 'Collections Firestore' }} />
      <Text style={styles.headerTitle}>État de la Base de Données</Text>
      <Text style={styles.headerSubtitle}>Vue d'ensemble des {KNOWN_COLLECTIONS.length} collections</Text>
      <View style={{ marginTop: 16 }}>
        {content}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.screenBackground },
  content: { padding: DIMENSIONS.SPACING.lg, paddingBottom: 40 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.black, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: COLORS.darkGray, marginBottom: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  cardEmpty: { opacity: 0.7, backgroundColor: '#FAFAFA' },
  cardError: { opacity: 0.5, backgroundColor: '#FFF0F0', borderColor: '#FFD6D6' },
  cardIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cardIconActive: { backgroundColor: 'rgba(125,212,238,0.12)' },
  cardTitle: { fontWeight: '700' as const, color: COLORS.black, fontSize: 16 },
  textGray: { color: COLORS.gray },
  cardSubtitle: { color: COLORS.darkGray, fontSize: DIMENSIONS.FONT_SIZES.xs, marginTop: 2 },
  badge: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  errorBox: { backgroundColor: '#fff5f5', borderColor: '#ffd6d6', borderWidth: 1, padding: 12, borderRadius: 12 },
  errorTitle: { color: COLORS.error, fontWeight: '700' as const },
  errorText: { color: COLORS.error, marginTop: 4 },
  retryBtn: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  retryText: { color: COLORS.white, marginLeft: 6, fontWeight: '700' as const, fontSize: DIMENSIONS.FONT_SIZES.xs },
});
