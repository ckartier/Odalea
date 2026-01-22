import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { Pet, User } from '@/types';
import { GooglePlace } from '@/services/google-places';
import { FileText, UserPlus, MessageCircle, Plus, X, MapPin, Phone, Globe, Star } from 'lucide-react-native';
import { getPetImageUrl, DEFAULT_PET_PLACEHOLDER } from '@/lib/image-helpers';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 90;

interface MapBottomSheetProps {
  pet?: Pet;
  googlePlace?: GooglePlace;
  owner?: User | null;
  distance?: string;
  isFriend?: boolean;
  isRequestSent?: boolean;
  isFavorite?: boolean;
  isProfessional?: boolean;
  professionalType?: 'catSitter' | 'vet' | 'breeder' | 'shelter' | 'educator';
  onViewProfile: () => void;
  onAddFriend: () => void;
  onMessage: () => void;
  onCreatePost: () => void;
  onClose: () => void;
}

export default function MapBottomSheet({
  pet,
  googlePlace,
  owner,
  distance,
  isFriend,
  isRequestSent,
  isFavorite,
  isProfessional,
  professionalType,
  onViewProfile,
  onAddFriend,
  onMessage,
  onCreatePost,
  onClose,
}: MapBottomSheetProps) {
  const insets = useSafeAreaInsets();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 65,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const petImageUrl = pet ? (getPetImageUrl(pet) || DEFAULT_PET_PLACEHOLDER) : (googlePlace?.photos?.[0] || DEFAULT_PET_PLACEHOLDER);
  const genderColor = pet ? (pet.gender === 'female' ? COLORS.female : COLORS.male) : '#f59e0b';

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

  const bottomOffset = Math.max(insets.bottom, 20) + TAB_BAR_HEIGHT;

  if (googlePlace) {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            bottom: bottomOffset,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
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
            </View>

            <View style={styles.info}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{googlePlace.name}</Text>
                  <Text style={styles.breed}>{googlePlace.address}</Text>
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

              {googlePlace.rating && (
                <View style={styles.locationRow}>
                  <Star size={14} color="#f59e0b" fill="#f59e0b" />
                  <Text style={styles.distance}>{googlePlace.rating.toFixed(1)}</Text>
                </View>
              )}

              {googlePlace.openingHours?.openNow !== undefined && (
                <View style={[styles.proBadge, { backgroundColor: googlePlace.openingHours.openNow ? '#10b981' : '#ef4444' }]}>
                  <Text style={styles.proBadgeText}>{googlePlace.openingHours.openNow ? 'Ouvert' : 'Fermé'}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.ownerSection}>
            <Text style={styles.ownerLabel}>Informations</Text>
            <View style={styles.contactInfo}>
              {googlePlace.phoneNumber && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={async () => {
                    try {
                      const raw = googlePlace.phoneNumber ?? '';
                      const sanitized = raw.replace(/\s+/g, '');
                      const telUrl = `tel:${sanitized}`;
                      console.log('[MapBottomSheet] open phone', telUrl);
                      if (Platform.OS === 'web') {
                        window.open(telUrl, '_blank');
                      } else {
                        const can = await Linking.canOpenURL(telUrl);
                        if (can) await Linking.openURL(telUrl);
                      }
                    } catch (e) {
                      console.log('[MapBottomSheet] failed open phone', e);
                    }
                  }}
                  activeOpacity={0.75}
                  testID="google-place-phone"
                >
                  <Phone size={16} color="#64748b" />
                  <Text style={styles.contactText}>{googlePlace.phoneNumber}</Text>
                </TouchableOpacity>
              )}
              {googlePlace.website && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={async () => {
                    try {
                      const url = googlePlace.website ?? '';
                      const finalUrl = url.startsWith('http') ? url : `https://${url}`;
                      console.log('[MapBottomSheet] open website', finalUrl);
                      if (Platform.OS === 'web') {
                        window.open(finalUrl, '_blank');
                      } else {
                        const can = await Linking.canOpenURL(finalUrl);
                        if (can) await Linking.openURL(finalUrl);
                      }
                    } catch (e) {
                      console.log('[MapBottomSheet] failed open website', e);
                    }
                  }}
                  activeOpacity={0.75}
                  testID="google-place-website"
                >
                  <Globe size={16} color="#64748b" />
                  <Text style={styles.contactText} numberOfLines={1}>
                    {googlePlace.website}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    );
  }

  if (!pet) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
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
            <View style={[styles.actionIcon, { backgroundColor: '#7C3AED' }]}>
              <FileText size={20} color="#ffffff" />
            </View>
            <Text style={styles.actionLabel}>Fiche</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={onMessage}
            disabled={!isFriend}
          >
            <View style={[styles.actionIcon, { backgroundColor: isFriend ? '#7C3AED' : '#e2e8f0' }]}>
              <MessageCircle size={20} color={isFriend ? '#ffffff' : '#94a3b8'} />
            </View>
            <Text style={[styles.actionLabel, !isFriend && { color: '#94a3b8' }]}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              (isFriend || isRequestSent) && styles.actionButtonDisabled,
            ]}
            onPress={onAddFriend}
            disabled={isFriend || isRequestSent}
          >
            <View style={[styles.actionIcon, { backgroundColor: (isFriend || isRequestSent) ? '#e2e8f0' : '#7C3AED' }]}>
              <UserPlus
                size={20}
                color={isFriend || isRequestSent ? '#94a3b8' : '#ffffff'}
              />
            </View>
            <Text
              style={[
                styles.actionLabel,
                (isFriend || isRequestSent) && styles.actionLabelDisabled,
              ]}
            >
              {isFriend ? 'Ami' : isRequestSent ? 'En attente' : 'Ami'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onCreatePost}>
            <View style={[styles.actionIcon, { backgroundColor: '#7C3AED' }]}>
              <Plus size={20} color="#ffffff" />
            </View>
            <Text style={styles.actionLabel}>Post</Text>
          </TouchableOpacity>
        </View>

        {owner && (
          <View style={styles.ownerSection}>
            <Text style={styles.ownerLabel}>
              {isProfessional ? 'Professionnel' : 'Propriétaire'}
            </Text>
            <TouchableOpacity style={styles.ownerRow} onPress={onViewProfile}>
              {owner.photo && (
                <Image source={{ uri: owner.photo }} style={styles.ownerAvatar} contentFit="cover" />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.ownerName}>
                  {owner.professionalData?.companyName || owner.pseudo || owner.name || 'Anonyme'}
                </Text>
                {isProfessional && owner.city && (
                  <Text style={styles.ownerCity}>{owner.city}</Text>
                )}
              </View>
            </TouchableOpacity>
            
            {isProfessional && (
              <View style={styles.contactInfo}>
                {owner.phoneNumber && (
                  <TouchableOpacity
                    style={styles.contactRow}
                    onPress={async () => {
                      try {
                        const raw = owner.phoneNumber ?? '';
                        const sanitized = raw.replace(/\s+/g, '');
                        const telUrl = `tel:${sanitized}`;
                        console.log('[MapBottomSheet] open pro phone', telUrl);
                        if (Platform.OS === 'web') {
                          window.open(telUrl, '_blank');
                        } else {
                          const can = await Linking.canOpenURL(telUrl);
                          if (can) await Linking.openURL(telUrl);
                        }
                      } catch (e) {
                        console.log('[MapBottomSheet] failed open pro phone', e);
                      }
                    }}
                    activeOpacity={0.75}
                    testID="pro-phone"
                  >
                    <Phone size={16} color="#64748b" />
                    <Text style={styles.contactText}>{owner.phoneNumber}</Text>
                  </TouchableOpacity>
                )}
                {owner.professionalData?.website && (
                  <TouchableOpacity
                    style={styles.contactRow}
                    onPress={async () => {
                      try {
                        const url = owner.professionalData?.website ?? '';
                        const finalUrl = url.startsWith('http') ? url : `https://${url}`;
                        console.log('[MapBottomSheet] open pro website', finalUrl);
                        if (Platform.OS === 'web') {
                          window.open(finalUrl, '_blank');
                        } else {
                          const can = await Linking.canOpenURL(finalUrl);
                          if (can) await Linking.openURL(finalUrl);
                        }
                      } catch (e) {
                        console.log('[MapBottomSheet] failed open pro website', e);
                      }
                    }}
                    activeOpacity={0.75}
                    testID="pro-website"
                  >
                    <Globe size={16} color="#64748b" />
                    <Text style={styles.contactText} numberOfLines={1}>
                      {owner.professionalData.website}
                    </Text>
                  </TouchableOpacity>
                )}
                {owner.professionalData?.businessDescription && (
                  <Text style={styles.businessDescription} numberOfLines={3}>
                    {owner.professionalData.businessDescription}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    maxHeight: SCREEN_HEIGHT * 0.55,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 18,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  breed: {
    fontSize: 13,
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
    gap: 10,
    marginBottom: 16,
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
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
  },
  actionLabelDisabled: {
    color: '#94a3b8',
  },
  ownerSection: {
    paddingTop: 14,
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
  ownerCity: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 2,
  },
  contactInfo: {
    marginTop: 12,
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
    flex: 1,
    textDecorationLine: 'underline',
  },
  businessDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748b',
    lineHeight: 18,
    marginTop: 4,
  },
});
