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
import { Heart, MessageCircle, ArrowLeft } from 'lucide-react-native';
import { useMatching } from '@/hooks/matching-store';
import { usePets } from '@/hooks/pets-store';
import { Pet } from '@/types';
import { COLORS } from '@/constants/colors';
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
          <ActivityIndicator size="large" color={COLORS.secondary} />
          <Text style={styles.loadingText}>Chargement des matchs...</Text>
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
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Matchs</Text>
        <View style={styles.placeholder} />
      </View>

      {matches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Heart size={80} color={COLORS.gray} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Aucun match pour le moment</Text>
          <Text style={styles.emptyText}>
            Continuez à swiper pour trouver des compagnons pour votre animal!
          </Text>
          <TouchableOpacity
            style={styles.discoverButton}
            onPress={() => router.push('/matching/discover' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.discoverButtonText}>Découvrir</Text>
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
              <View key={match.id} style={styles.matchCard}>
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
                  <TouchableOpacity
                    style={styles.messageButton}
                    onPress={() => router.push(`/messages/new?recipientId=${matchedPet.ownerId}` as any)}
                    activeOpacity={0.8}
                  >
                    <MessageCircle size={20} color={COLORS.white} />
                    <Text style={styles.messageButtonText}>Message</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
    backgroundColor: COLORS.lightGray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  matchCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  petImage: {
    width: 120,
    height: 120,
  },
  matchInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  petDetails: {
    gap: 4,
  },
  petName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  petBreed: {
    fontSize: 14,
    color: COLORS.gray,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  discoverButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 16,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  discoverButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
});
