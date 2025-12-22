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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, X } from 'lucide-react-native';
import { useMatching } from '@/hooks/matching-store';
import { usePets } from '@/hooks/pets-store';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import MatchModal from '@/components/MatchModal';
import { Pet } from '@/types';
import { COLORS } from '@/constants/colors';
import { Stack, useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

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
    isLiking,
    isPassing,
    showMatchModal,
    matchedPet,
    closeMatchModal,
  } = useMatching();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
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
            <Text style={styles.stampText}>❤️ J&apos;AIME</Text>
          </Animated.View>

          <Animated.View style={[styles.nopeStamp, { opacity: nopeOpacity }]}>
            <Text style={styles.stampText}>✖️ PASSER</Text>
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
          <Text style={styles.emptyTitle}>Aucun animal sélectionné</Text>
          <Text style={styles.emptyText}>
            Veuillez ajouter un animal pour commencer à matcher
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/pet/add')}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>Ajouter un animal</Text>
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
          <ActivityIndicator size="large" color={COLORS.secondary} />
          <Text style={styles.loadingText}>Recherche d&apos;animaux...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (currentIndex >= discoveryPets.length) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Plus d&apos;animaux à découvrir</Text>
          <Text style={styles.emptyText}>
            Revenez plus tard pour voir de nouveaux profils
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Découvrir</Text>
        <TouchableOpacity
          onPress={() => router.push('/matching/list' as any)}
          style={styles.matchesButton}
        >
          <Heart size={24} color={COLORS.secondary} fill={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardsContainer}>
        {discoveryPets.slice(currentIndex, currentIndex + 2).reverse().map((pet, index) =>
          renderCard(pet, currentIndex + (1 - index))
        )}
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={handlePass}
          disabled={isLiking || isPassing}
          activeOpacity={0.8}
        >
          <X size={32} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={handleLike}
          disabled={isLiking || isPassing}
          activeOpacity={0.8}
        >
          <Heart size={32} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <MatchModal
        visible={showMatchModal}
        matchedPet={matchedPet}
        onClose={closeMatchModal}
        onSendMessage={() => {
          if (matchedPet) {
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
    backgroundColor: COLORS.lightGray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  matchesButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.65,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  nextCard: {
    opacity: 0.9,
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
    padding: 20,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
  },
  petInfo: {
    gap: 8,
  },
  petName: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: COLORS.white,
  },
  petDetails: {
    fontSize: 18,
    color: COLORS.white,
    opacity: 0.9,
  },
  characterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  characterBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  characterText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '500' as const,
  },
  likeStamp: {
    position: 'absolute',
    top: 60,
    right: 40,
    transform: [{ rotate: '20deg' }],
    borderWidth: 6,
    borderColor: COLORS.success,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  nopeStamp: {
    position: 'absolute',
    top: 60,
    left: 40,
    transform: [{ rotate: '-20deg' }],
    borderWidth: 6,
    borderColor: COLORS.error,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  stampText: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: 2,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  passButton: {
    backgroundColor: COLORS.error,
  },
  likeButton: {
    backgroundColor: COLORS.success,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  addButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.white,
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
});
