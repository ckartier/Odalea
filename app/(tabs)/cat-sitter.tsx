import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
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

const mockCatSitters: CatSitter[] = [
  {
    id: '1',
    name: 'Marie Dubois',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=400',
    rating: 4.9,
    reviewCount: 127,
    hourlyRate: 15,
    location: 'Montmartre, Paris',
    distance: 0.8,
    isAvailable: true,
    isVerified: true,
    isPremium: true,
    services: ['Pet Sitting', 'Dog Walking', 'Overnight Care'],
    responseTime: '< 1 hour',
    totalBookings: 234,
    description: 'Passionate about animals with 5 years of experience. I love taking care of cats and dogs.',
    petTypes: ['Cats', 'Dogs', 'Small Animals'],
    languages: ['French', 'English'],
  },
  {
    id: '2',
    name: 'Pierre Martin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400',
    rating: 4.7,
    reviewCount: 89,
    hourlyRate: 12,
    location: 'Le Marais, Paris',
    distance: 1.2,
    isAvailable: false,
    isVerified: true,
    isPremium: false,
    services: ['Pet Sitting', 'Dog Walking'],
    responseTime: '< 2 hours',
    totalBookings: 156,
    description: 'Reliable pet sitter available weekends and evenings.',
    petTypes: ['Cats', 'Dogs'],
    languages: ['French'],
  },
  {
    id: '3',
    name: 'Sophie Laurent',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400',
    rating: 5.0,
    reviewCount: 203,
    hourlyRate: 18,
    location: 'Saint-Germain, Paris',
    distance: 2.1,
    isAvailable: true,
    isVerified: true,
    isPremium: true,
    services: ['Pet Sitting', 'Dog Walking', 'Grooming', 'Training'],
    responseTime: '< 30 min',
    totalBookings: 412,
    description: 'Professional pet care specialist with veterinary background.',
    petTypes: ['Cats', 'Dogs', 'Birds', 'Rabbits'],
    languages: ['French', 'English', 'Spanish'],
  },
];

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

  const handleSitterPress = useCallback((sitterId: string) => {
    router.push(`/cat-sitter/${sitterId}` as const);
  }, [router]);

  const handleBookSitter = useCallback((sitterId: string) => {
    router.push(`/booking/${sitterId}` as const);
  }, [router]);

  const handleMessageSitter = useCallback((sitterId: string) => {
    router.push(`/messages/new?userId=${sitterId}` as const);
  }, [router]);

  const data = useMemo<CatSitter[]>(() => {
    let arr = [...mockCatSitters];
    if (showOnlyAvailable) arr = arr.filter(s => s.isAvailable);
    if (sortBy === 'distance') arr.sort((a, b) => a.distance - b.distance);
    else arr.sort((a, b) => (b.rating - a.rating) || (b.reviewCount - a.reviewCount));
    return arr;
  }, [sortBy, showOnlyAvailable]);

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