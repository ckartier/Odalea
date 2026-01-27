import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS, DIMENSIONS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { useAuth } from '@/hooks/auth-store';
import FloatingMenu from '@/components/FloatingMenu';
import GlassCard from '@/components/GlassCard';
import AppBackground from '@/components/AppBackground';
import Button from '@/components/Button';
import { useQuery } from '@tanstack/react-query';
import { petSitterService, userService } from '@/services/database';
import {
  Heart,
  Star,
  MapPin,
  Clock,
  Calendar,
  Shield,
  Award,
  MessageCircle,
} from 'lucide-react-native';

interface CatSitter {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  location: string;
  distance: number;
  isAvailable: boolean;
  isVerified: boolean;
  isPremium: boolean;
  services: string[];
  responseTime: string;
  totalBookings: number;
  description: string;
  petTypes: string[];
  languages: string[];
}

export default function CatSitterScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.isCatSitter) {
      console.log('🐱 CatSitterScreen: user is cat sitter, redirecting to dashboard');
      router.replace('/(pro)/cat-sitter-dashboard' as any);
    }
  }, [router, user?.isCatSitter]);
  
  const [isMenuVisible, setIsMenuVisible] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'distance' | 'popularity'>('popularity');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState<boolean>(false);

  const catSittersQuery = useQuery({
    queryKey: ['catSitters'],
    queryFn: async () => {
      console.log('🔄 Fetching cat sitters from Firestore');
      const profiles = await petSitterService.getAllProfiles(50);
      
      const sittersWithUsers: CatSitter[] = await Promise.all(
        profiles.map(async (profile) => {
          const userData = await userService.getUser(profile.userId || profile.id);
          return {
            id: profile.userId || profile.id,
            userId: profile.userId || profile.id,
            name: userData?.name || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Cat Sitter',
            avatar: userData?.photo || '',
            rating: profile.rating || 4.5,
            reviewCount: profile.reviewCount || 0,
            hourlyRate: profile.hourlyRate || 15,
            location: userData?.city || userData?.address || 'France',
            distance: Math.random() * 5,
            isAvailable: profile.isActive !== false,
            isVerified: profile.backgroundCheckVerified || false,
            isPremium: userData?.isPremium || false,
            services: profile.services || ['Pet Sitting'],
            responseTime: profile.responseTime || '< 2 hours',
            totalBookings: profile.totalBookings || 0,
            description: profile.description || '',
            petTypes: profile.petTypes || ['Cats'],
            languages: profile.languages || ['French'],
          };
        })
      );
      
      console.log(`✅ Loaded ${sittersWithUsers.length} cat sitters`);
      return sittersWithUsers;
    },
    enabled: !!user,
  });

  const handleSitterPress = useCallback((sitterId: string) => {
    console.log('📍 Navigating to sitter profile:', sitterId);
    router.push(`/cat-sitter/${sitterId}` as const);
  }, [router]);

  const handleBookSitter = useCallback((sitterId: string) => {
    console.log('📍 Navigating to booking with sitter UID:', sitterId);
    router.push(`/booking/${sitterId}` as const);
  }, [router]);

  const handleMessageSitter = useCallback((sitterId: string) => {
    router.push(`/messages/new?userId=${sitterId}` as const);
  }, [router]);

  const data = useMemo<CatSitter[]>(() => {
    let arr = [...(catSittersQuery.data || [])];
    if (showOnlyAvailable) arr = arr.filter(s => s.isAvailable);
    if (sortBy === 'distance') arr.sort((a, b) => a.distance - b.distance);
    else arr.sort((a, b) => (b.rating - a.rating) || (b.reviewCount - a.reviewCount));
    return arr;
  }, [sortBy, showOnlyAvailable, catSittersQuery.data]);

  const renderSitter = useCallback(({ item }: { item: CatSitter }) => (
    <GlassCard
      tint="neutral"
      style={styles.sitterCard}
      onPress={() => handleSitterPress(item.id)}
      testID={`sitter-card-${item.id}`}
      noPadding
    >
      <View style={styles.sitterCardInner}>
      <View style={styles.sitterHeader}>
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image
              source={{ uri: item.avatar }}
              style={styles.avatar}
              resizeMode="cover"
              testID={`sitter-avatar-${item.id}`}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: COLORS.catSitter }]}
              testID={`sitter-avatar-${item.id}`}
            >
              <Text style={styles.avatarText}>
                {item.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
          )}
          {item.isPremium && (
            <View style={styles.premiumBadge}>
              <Heart size={12} color={COLORS.premium} />
            </View>
          )}
        </View>

        <View style={styles.sitterInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.sitterName}>{item.name}</Text>
            {item.isVerified && (
              <Shield size={16} color={COLORS.success} />
            )}
          </View>

          <View style={styles.ratingRow}>
            <Star size={14} color={COLORS.accent} fill={COLORS.accent} />
            <Text style={styles.rating}>{item.rating}</Text>
            <Text style={styles.reviewCount}>({item.reviewCount})</Text>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={14} color={COLORS.darkGray} />
            <Text style={styles.location}>{item.location}</Text>
            <Text style={styles.distance}>• {item.distance}km</Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>{item.hourlyRate}€</Text>
          <Text style={styles.priceUnit}>{t('sitters.per_hour')}</Text>
        </View>
      </View>

      <View style={styles.servicesContainer}>
        {item.services.slice(0, 3).map((service, index) => (
          <View key={index} style={styles.serviceTag}>
            <Text style={styles.serviceText}>{service}</Text>
          </View>
        ))}
        {item.services.length > 3 && (
          <Text style={styles.moreServices}>+{item.services.length - 3} {t('sitters.more')}</Text>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Clock size={14} color={COLORS.darkGray} />
          <Text style={styles.statText}>{item.responseTime}</Text>
        </View>
        <View style={styles.stat}>
          <Award size={14} color={COLORS.darkGray} />
          <Text style={styles.statText}>{item.totalBookings} {t('sitters.bookings')}</Text>
        </View>
        <View style={[styles.availabilityBadge, item.isAvailable ? styles.available : styles.busy]}
          testID={`sitter-availability-${item.id}`}
        >
          <Text style={[styles.availabilityText, item.isAvailable ? styles.availableText : styles.busyText]}>
            {item.isAvailable ? t('sitters.available') : t('sitters.busy')}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Button
          title={t('sitters.message')}
          onPress={() => handleMessageSitter(item.id)}
          variant="subtle"
          size="small"
          icon={<MessageCircle size={16} color={COLORS.black} />}
          style={styles.messageButton}
        />
        
        <Button
          title={t('sitters.book_now')}
          onPress={() => handleBookSitter(item.id)}
          variant="solid"
          size="small"
          disabled={!item.isAvailable}
          icon={<Calendar size={16} color={COLORS.white} />}
          style={styles.bookButton}
        />
      </View>
      </View>
    </GlassCard>
  ), [handleBookSitter, handleMessageSitter, handleSitterPress, t]);

  if (catSittersQuery.isLoading) {
    return (
      <AppBackground>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des cat sitters...</Text>
        </View>
      </AppBackground>
    );
  }

  if (catSittersQuery.error) {
    return (
      <AppBackground>
        <StatusBar style="dark" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Erreur lors du chargement</Text>
          <Button title="Réessayer" onPress={() => catSittersQuery.refetch()} />
        </View>
      </AppBackground>
    );
  }

  if (data.length === 0) {
    return (
      <AppBackground>
        <StatusBar style="dark" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Aucun cat sitter disponible</Text>
          <Text style={styles.emptyText}>Revenez plus tard ou ajustez vos filtres</Text>
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <FlatList
        ListHeaderComponent={(
          <View style={styles.filtersBar}>
            <View style={styles.sortChips}>
              <GlassCard
                tint={sortBy === 'distance' ? 'male' : 'neutral'}
                style={styles.chip}
                onPress={() => setSortBy('distance')}
                noPadding
              >
                <Text style={[styles.chipText, sortBy === 'distance' && styles.chipTextActive]}>Distance</Text>
              </GlassCard>
              <GlassCard
                tint={sortBy === 'popularity' ? 'male' : 'neutral'}
                style={styles.chip}
                onPress={() => setSortBy('popularity')}
                noPadding
              >
                <Text style={[styles.chipText, sortBy === 'popularity' && styles.chipTextActive]}>Popularité</Text>
              </GlassCard>
            </View>
            <GlassCard
              tint={showOnlyAvailable ? 'female' : 'neutral'}
              style={styles.toggleButton}
              onPress={() => setShowOnlyAvailable(v => !v)}
              noPadding
            >
              <Text style={[styles.toggleText, showOnlyAvailable && styles.toggleTextActive]}>
                {showOnlyAvailable ? 'Disponibles' : 'Tous'}
              </Text>
            </GlassCard>
          </View>
        )}
        data={data}
        renderItem={renderSitter}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={styles.flatList}
        testID="cat-sitter-list"
      />
      <FloatingMenu
        isOpen={isMenuVisible}
        onToggle={() => setIsMenuVisible(false)}
        isProfessional={user?.isProfessional}
      />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING.md,
  },
  loadingText: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    color: COLORS.darkGray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING.xl,
    gap: DIMENSIONS.SPACING.md,
  },
  emptyTitle: {
    fontSize: DIMENSIONS.FONT_SIZES.lg,
    fontWeight: '600' as const,
    color: COLORS.black,
    textAlign: 'center' as const,
  },
  emptyText: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    color: COLORS.darkGray,
    textAlign: 'center' as const,
  },
  listContent: {
    paddingBottom: DIMENSIONS.SPACING.xxl,
    paddingTop: DIMENSIONS.SPACING.md,
  },
  filtersBar: {
    paddingHorizontal: DIMENSIONS.SPACING.md,
    paddingBottom: DIMENSIONS.SPACING.sm,
  },
  sortChips: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING.sm,
    marginBottom: DIMENSIONS.SPACING.sm,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    color: COLORS.black,
    fontWeight: '600' as const,
  },
  chipTextActive: {
    fontWeight: '700' as const,
  },
  toggleButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toggleText: {
    color: COLORS.black,
    fontWeight: '600' as const,
  },
  toggleTextActive: {
    fontWeight: '700' as const,
  },
  sitterCard: {
    marginHorizontal: DIMENSIONS.SPACING.md,
    marginBottom: DIMENSIONS.SPACING.md,
  },
  sitterCardInner: {
    padding: DIMENSIONS.SPACING.md,
    minHeight: DIMENSIONS.COMPONENT_SIZES.CARD_MIN_HEIGHT + 100,
  },
  sitterHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: DIMENSIONS.SPACING.sm + 4,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: DIMENSIONS.SPACING.sm + 4,
  },
  avatar: {
    width: DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM + 8,
    height: DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM + 8,
    borderRadius: (DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM + 8) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: DIMENSIONS.FONT_SIZES.lg,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  premiumBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  sitterInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sitterName: {
    fontSize: DIMENSIONS.FONT_SIZES.lg,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  rating: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  reviewCount: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.darkGray,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.darkGray,
  },
  distance: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.darkGray,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: DIMENSIONS.FONT_SIZES.xl,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  priceUnit: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    color: COLORS.darkGray,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENSIONS.SPACING.sm,
    marginBottom: DIMENSIONS.SPACING.sm + 4,
  },
  serviceTag: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: DIMENSIONS.SPACING.sm,
    paddingVertical: DIMENSIONS.SPACING.xs,
    borderRadius: DIMENSIONS.SPACING.sm + 4,
  },
  serviceText: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    color: COLORS.darkGray,
  },
  moreServices: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    color: COLORS.black,
    fontWeight: '500' as const,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DIMENSIONS.SPACING.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING.xs,
  },
  statText: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    color: COLORS.darkGray,
  },
  availabilityBadge: {
    paddingHorizontal: DIMENSIONS.SPACING.sm,
    paddingVertical: DIMENSIONS.SPACING.xs,
    borderRadius: DIMENSIONS.SPACING.sm + 4,
  },
  available: {
    backgroundColor: COLORS.black,
  },
  busy: {
    backgroundColor: COLORS.darkGray,
  },
  availabilityText: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    fontWeight: '500' as const,
  },
  availableText: {
    color: COLORS.white,
  },
  busyText: {
    color: COLORS.white,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING.sm + 4,
  },
  messageButton: {
    flex: 1,
  },
  bookButton: {
    flex: 1,
  },
});