import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, X } from 'lucide-react-native';
import { useMatching } from '@/hooks/matching-store';
import { usePets } from '@/hooks/pets-store';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import MatchModal from '@/components/MatchModal';
import { FloatingActionBar } from '@/components/FloatingActionBar';
import { Pet } from '@/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '@/theme/tokens';
import { Stack, useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

type FilterType = 'all' | 'dog' | 'cat' | 'other';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'dog', label: 'Chiens' },
  { key: 'cat', label: 'Chats' },
  { key: 'other', label: 'Autres' },
];

export default function PetDiscoveryScreen() {
  const router = useRouter();
  const { user } = useFirebaseUser();
  const { userPets } = usePets();
  const {
    selectedPetId,
    setSelectedPetId,
    discoveryPets,
    isLoadingDiscovery,
    likePet,
    passPet,
    showMatchModal,
    matchedPet,
    closeMatchModal,
  } = useMatching();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const position = useRef(new Animated.ValueXY()).current;
  
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const forceSwipe = useCallback((direction: 'left' | 'right') => {
    const x = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      const currentPet = discoveryPets[currentIndex];
      if (currentPet && selectedPetId && user) {
        if (direction === 'right') {
          likePet(selectedPetId, currentPet, user.id);
        } else {
          passPet(selectedPetId, currentPet.id);
        }
      }
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex(currentIndex + 1);
    });
  }, [position, discoveryPets, currentIndex, selectedPetId, user, likePet, passPet]);

  const resetPosition = useCallback(() => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  }, [position]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesture) => {
          position.setValue({ x: gesture.dx, y: gesture.dy });
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > SWIPE_THRESHOLD) {
            forceSwipe('right');
          } else if (gesture.dx < -SWIPE_THRESHOLD) {
            forceSwipe('left');
          } else {
            resetPosition();
          }
        },
      }),
    [position, forceSwipe, resetPosition]
  );

  const handleLike = () => {
    forceSwipe('right');
  };

  const handlePass = () => {
    forceSwipe('left');
  };

  React.useEffect(() => {
    if (userPets.length > 0 && !selectedPetId) {
      const primaryPet = userPets.find(p => p.isPrimary) || userPets[0];
      setSelectedPetId(primaryPet.id);
    }
  }, [userPets, selectedPetId, setSelectedPetId]);

  const renderCard = (pet: Pet, index: number) => {
    if (index < currentIndex) {
      return null;
    }

    if (index === currentIndex) {
      return (
        <Animated.View
          key={pet.id}
          style={[
            styles.card,
            {
              transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Image source={{ uri: pet.mainPhoto }} style={styles.cardImage} resizeMode="cover" />
          
          <Animated.View style={[styles.likeStamp, { opacity: likeOpacity }]}>
            <Text style={styles.stampText}>❤️</Text>
          </Animated.View>

          <Animated.View style={[styles.nopeStamp, { opacity: nopeOpacity }]}>
            <Text style={styles.stampText}>✖️</Text>
          </Animated.View>

          <View style={styles.cardContent}>
            <View style={styles.petInfo}>
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petDetails}>
                {pet.breed} • {pet.gender === 'male' ? 'Mâle' : 'Femelle'}
              </Text>
              {pet.character && pet.character.length > 0 && (
                <View style={styles.characterContainer}>
                  {pet.character.slice(0, 3).map((trait, i) => (
                    <View key={i} style={styles.characterBadge}>
                      <Text style={styles.characterText}>{trait}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      );
    }

    return (
      <View key={pet.id} style={[styles.card, styles.nextCard]}>
        <Image source={{ uri: pet.mainPhoto }} style={styles.cardImage} resizeMode="cover" />
      </View>
    );
  };

  if (!selectedPetId || userPets.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Aucun animal</Text>
          <Text style={styles.emptyText}>
            Ajoute un animal pour commencer à matcher
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/pet/add')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Ajouter un animal</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoadingDiscovery) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Recherche en cours...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (currentIndex >= discoveryPets.length) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Plus de profils</Text>
          <Text style={styles.emptyText}>
            Reviens plus tard pour voir de nouveaux animaux
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hey {user?.name?.split(' ')[0] || 'toi'}</Text>
          {user?.photo && (
            <Image source={{ uri: user.photo }} style={styles.avatar} />
          )}
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              selectedFilter === filter.key && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === filter.key && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.cardsContainer}>
        {discoveryPets.slice(currentIndex, currentIndex + 2).reverse().map((pet, index) =>
          renderCard(pet, currentIndex + (1 - index))
        )}
      </View>

      <FloatingActionBar
        actions={[
          {
            icon: <X size={28} color={COLORS.textPrimary} strokeWidth={2.5} />,
            onPress: handlePass,
            testID: 'pass-button',
          },
          {
            icon: <Heart size={28} color={COLORS.surface} strokeWidth={2.5} fill={COLORS.surface} />,
            onPress: handleLike,
            primary: true,
            testID: 'like-button',
          },
        ]}
      />

      <MatchModal
        visible={showMatchModal}
        matchedPet={matchedPet}
        onClose={closeMatchModal}
        onSendMessage={() => {
          closeMatchModal();
          if (matchedPet?.ownerId) {
            router.push(`/messages/new?recipientId=${matchedPet.ownerId}` as any);
          }
        }}
      />
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  greeting: {
    ...TYPOGRAPHY.title,
    color: COLORS.textPrimary,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
  },
  filtersContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.surface,
    fontWeight: '600' as const,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - (SPACING.lg * 2),
    height: SCREEN_HEIGHT * 0.6,
    borderRadius: RADIUS.card * 2,
    backgroundColor: COLORS.surface,
    ...SHADOWS.card,
    overflow: 'hidden',
  },
  nextCard: {
    opacity: 0.5,
    transform: [{ scale: 0.95 }],
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    backgroundColor: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
    borderBottomLeftRadius: RADIUS.card * 2,
    borderBottomRightRadius: RADIUS.card * 2,
  },
  petInfo: {
    gap: SPACING.xs,
  },
  petName: {
    ...TYPOGRAPHY.title,
    fontSize: 32,
    color: COLORS.surface,
  },
  petDetails: {
    ...TYPOGRAPHY.body,
    color: COLORS.surface,
    opacity: 0.9,
  },
  petLocation: {
    ...TYPOGRAPHY.caption,
    color: COLORS.surface,
    opacity: 0.8,
  },
  characterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  characterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  },
  characterText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.surface,
    fontWeight: '500' as const,
  },
  likeStamp: {
    position: 'absolute',
    top: 80,
    right: SPACING.xl,
    fontSize: 80,
  },
  nopeStamp: {
    position: 'absolute',
    top: 80,
    left: SPACING.xl,
    fontSize: 80,
  },
  stampText: {
    fontSize: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.title,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.button,
    ...SHADOWS.card,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.surface,
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
});
