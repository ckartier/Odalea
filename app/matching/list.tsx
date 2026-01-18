import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, ArrowLeft } from 'lucide-react-native';
import { useMatching } from '@/hooks/matching-store';
import { usePets } from '@/hooks/pets-store';
import { Pet } from '@/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '@/theme/tokens';
import { Stack, useRouter } from 'expo-router';

export default function MatchesListScreen() {
  const router = useRouter();
  const { getPet } = usePets();
  const { matches, isLoadingMatches, selectedPetId, refetchMatches } = useMatching();

  useEffect(() => {
    if (selectedPetId) {
      refetchMatches();
    }
  }, [selectedPetId, refetchMatches]);

  const getMatchedPet = (match: any): Pet | undefined => {
    const otherPetId = match.petIds.find((id: string) => id !== selectedPetId);
    return otherPetId ? getPet(otherPetId) : undefined;
  };

  if (isLoadingMatches) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Matchs</Text>
        <View style={styles.placeholder} />
      </View>

      {matches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Heart size={80} color={COLORS.textSecondary} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Aucun match</Text>
          <Text style={styles.emptyText}>
            Continue à swiper pour trouver des compagnons
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/matching/discover' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Découvrir</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {matches.map((match) => {
            const matchedPet = getMatchedPet(match);
            if (!matchedPet) return null;

            return (
              <TouchableOpacity
                key={match.id}
                style={styles.matchCard}
                onPress={() => router.push(`/messages/new?recipientId=${matchedPet.ownerId}` as any)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: matchedPet.mainPhoto }}
                  style={styles.petImage}
                  resizeMode="cover"
                />
                <View style={styles.matchInfo}>
                  <View style={styles.petDetails}>
                    <Text style={styles.petName}>{matchedPet.name}</Text>
                    <Text style={styles.petBreed}>
                      {matchedPet.breed} • {matchedPet.gender === 'male' ? 'Mâle' : 'Femelle'}
                    </Text>
                  </View>
                  <View style={styles.badge}>
                    <Heart size={16} color={COLORS.primary} fill={COLORS.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  matchCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  petImage: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.surfaceSecondary,
  },
  matchInfo: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  petDetails: {
    flex: 1,
    gap: SPACING.xs,
  },
  petName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  petBreed: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.title,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.button,
    marginTop: SPACING.md,
    ...SHADOWS.card,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.surface,
  },
});
