import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { Pet, User } from '@/types';
import { FileText, UserPlus, MessageCircle, Heart, X, MapPin, Phone } from 'lucide-react-native';
import { getPetImageUrl, DEFAULT_PET_PLACEHOLDER } from '@/lib/image-helpers';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SNAP_POINTS = {
  COLLAPSED: SCREEN_HEIGHT * 0.35,
  HALF: SCREEN_HEIGHT * 0.6,
  FULL: SCREEN_HEIGHT * 0.85,
};

interface MapBottomSheetProps {
  pet: Pet;
  owner?: User | null;
  distance?: string;
  isFriend?: boolean;
  isRequestSent?: boolean;
  isFavorite?: boolean;
  isProfessional?: boolean;
  professionalType?: 'catSitter' | 'vet' | 'breeder' | 'shelter' | 'educator';
  onViewProfile: () => void;
  onAddFriend: () => void;
  onViewPosts: () => void;
  onToggleFavorite: () => void;
  onCall?: () => void;
  onClose: () => void;
}

export default function MapBottomSheet({
  pet,
  owner,
  distance,
  isFriend,
  isRequestSent,
  isFavorite,
  isProfessional,
  professionalType,
  onViewProfile,
  onAddFriend,
  onViewPosts,
  onToggleFavorite,
  onCall,
  onClose,
}: MapBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SNAP_POINTS.COLLAPSED)).current;
  const [currentSnap, setCurrentSnap] = useState(SNAP_POINTS.COLLAPSED);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.spring(translateY, {
      toValue: SNAP_POINTS.COLLAPSED,
      useNativeDriver: true,
      friction: 9,
    }).start();
  }, [translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const newY = currentSnap + gestureState.dy;
        if (newY >= 0 && newY <= SNAP_POINTS.COLLAPSED) {
          translateY.setValue(newY);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const velocity = gestureState.vy;
        const newY = currentSnap + gestureState.dy;

        if (velocity > 0.5 || newY > SNAP_POINTS.COLLAPSED * 0.7) {
          onClose();
        } else if (velocity < -0.5 || newY < SNAP_POINTS.COLLAPSED * 0.3) {
          snapTo(0);
        } else {
          snapTo(SNAP_POINTS.COLLAPSED);
        }
      },
    })
  ).current;

  const snapTo = (point: number) => {
    setCurrentSnap(point);
    Animated.spring(translateY, {
      toValue: point,
      useNativeDriver: true,
      friction: 9,
    }).start();
  };

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const petImageUrl = getPetImageUrl(pet) || DEFAULT_PET_PLACEHOLDER;
  const genderColor = pet.gender === 'female' ? COLORS.female : COLORS.male;

  const getProfessionalBadge = () => {
    if (!isProfessional || !professionalType) return null;

    const badges: Record<string, { label: string; emoji: string; color: string }> = {
      catSitter: { label: 'Cat Sitter', emoji: '🐱', color: '#6366f1' },
      vet: { label: 'Vétérinaire', emoji: '🏥', color: '#10b981' },
      breeder: { label: 'Éleveur', emoji: '🏡', color: '#f59e0b' },
      shelter: { label: 'Refuge', emoji: '🏠', color: '#8b5cf6' },
      educator: { label: 'Éducateur', emoji: '🎓', color: '#06b6d4' },
    };

    const badge = badges[professionalType];
    if (!badge) return null;

    return (
      <View style={[styles.proBadge, { backgroundColor: badge.color }]}>
        <Text style={styles.proBadgeEmoji}>{badge.emoji}</Text>
        <Text style={styles.proBadgeText}>{badge.label}</Text>
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          paddingBottom: insets.bottom + 16,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.handle} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: petImageUrl }}
              style={styles.image}
              contentFit="cover"
              placeholder={require('@/assets/images/icon.png')}
            />
            <View style={[styles.genderBadge, { backgroundColor: genderColor }]}>
              <Text style={styles.genderText}>{pet.gender === 'female' ? '♀' : '♂'}</Text>
            </View>
          </View>

          <View style={styles.info}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{pet.name}</Text>
                <Text style={styles.breed}>{pet.breed}</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {distance && (
              <View style={styles.locationRow}>
                <MapPin size={14} color="#64748b" />
                <Text style={styles.distance}>{distance}</Text>
              </View>
            )}

            {getProfessionalBadge()}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={onViewProfile}>
            <View style={[styles.actionIcon, { backgroundColor: '#f1f5f9' }]}>
              <FileText size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>Fiche</Text>
          </TouchableOpacity>

          {!isProfessional && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                (isFriend || isRequestSent) && styles.actionButtonDisabled,
              ]}
              onPress={onAddFriend}
              disabled={isFriend || isRequestSent}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#f1f5f9' }]}>
                <UserPlus
                  size={20}
                  color={isFriend || isRequestSent ? '#94a3b8' : COLORS.primary}
                />
              </View>
              <Text
                style={[
                  styles.actionLabel,
                  (isFriend || isRequestSent) && styles.actionLabelDisabled,
                ]}
              >
                {isFriend ? 'Ami' : isRequestSent ? 'Envoyée' : 'Ajouter'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionButton} onPress={onViewPosts}>
            <View style={[styles.actionIcon, { backgroundColor: '#f1f5f9' }]}>
              <MessageCircle size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>Posts</Text>
          </TouchableOpacity>

          {!isProfessional && (
            <TouchableOpacity style={styles.actionButton} onPress={onToggleFavorite}>
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: isFavorite ? '#fee2e2' : '#f1f5f9' },
                ]}
              >
                <Heart
                  size={20}
                  color={isFavorite ? COLORS.error : COLORS.primary}
                  fill={isFavorite ? COLORS.error : 'none'}
                />
              </View>
              <Text
                style={[styles.actionLabel, isFavorite && { color: COLORS.error }]}
              >
                Favori
              </Text>
            </TouchableOpacity>
          )}

          {isProfessional && onCall && (
            <TouchableOpacity style={styles.actionButton} onPress={onCall}>
              <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                <Phone size={20} color="#10b981" />
              </View>
              <Text style={[styles.actionLabel, { color: '#10b981' }]}>Appeler</Text>
            </TouchableOpacity>
          )}
        </View>

        {owner && (
          <View style={styles.ownerSection}>
            <Text style={styles.ownerLabel}>Propriétaire</Text>
            <TouchableOpacity style={styles.ownerRow} onPress={onViewProfile}>
              {owner.photo && (
                <Image source={{ uri: owner.photo }} style={styles.ownerAvatar} contentFit="cover" />
              )}
              <Text style={styles.ownerName}>
                {owner.pseudo || owner.name || 'Anonyme'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  genderBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  info: {
    flex: 1,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  breed: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distance: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  proBadgeEmoji: {
    fontSize: 12,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  actionLabelDisabled: {
    color: '#94a3b8',
  },
  ownerSection: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  ownerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ownerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
  },
  ownerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
});
