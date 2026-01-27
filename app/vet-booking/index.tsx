import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Phone,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '@/theme/tokens';
import { MOCK_VETERINARIANS, Veterinarian } from '@/mocks/veterinarians';

export default function VetListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { emergency, petId, petName } = useLocalSearchParams<{
    emergency?: string;
    petId?: string;
    petName?: string;
  }>();

  const isEmergency = emergency === 'true';
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmergencyOnly, setShowEmergencyOnly] = useState(isEmergency);

  const filteredVets = useMemo(() => {
    let vets = [...MOCK_VETERINARIANS];

    if (showEmergencyOnly) {
      vets = vets.filter(vet => vet.emergencyAvailable);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      vets = vets.filter(
        vet =>
          vet.name.toLowerCase().includes(query) ||
          vet.clinicName.toLowerCase().includes(query) ||
          vet.city.toLowerCase().includes(query) ||
          vet.specialties.some(s => s.toLowerCase().includes(query))
      );
    }

    vets.sort((a, b) => {
      if (a.emergencyAvailable && !b.emergencyAvailable) return -1;
      if (!a.emergencyAvailable && b.emergencyAvailable) return 1;
      if (a.isPartner && !b.isPartner) return -1;
      if (!a.isPartner && b.isPartner) return 1;
      return b.rating - a.rating;
    });

    return vets;
  }, [searchQuery, showEmergencyOnly]);

  const handleSelectVet = useCallback(
    (vet: Veterinarian) => {
      router.push({
        pathname: '/vet-booking/[vetId]',
        params: {
          vetId: vet.id,
          petId: petId || '',
          petName: petName || '',
        },
      });
    },
    [router, petId, petName]
  );

  const renderVetCard = useCallback(
    (vet: Veterinarian) => (
      <TouchableOpacity
        key={vet.id}
        style={[styles.vetCard, SHADOWS.card]}
        onPress={() => handleSelectVet(vet)}
        activeOpacity={0.7}
      >
        <View style={styles.vetCardHeader}>
          {vet.photo ? (
            <Image source={{ uri: vet.photo }} style={styles.vetPhoto} contentFit="cover" />
          ) : (
            <View style={styles.vetPhotoPlaceholder}>
              <Text style={styles.vetPhotoInitial}>{vet.name[0]}</Text>
            </View>
          )}
          <View style={styles.vetInfo}>
            <View style={styles.vetNameRow}>
              <Text style={styles.vetName} numberOfLines={1}>
                {vet.name}
              </Text>
              {vet.isVerified && <CheckCircle size={14} color={COLORS.success} />}
            </View>
            <Text style={styles.clinicName} numberOfLines={1}>
              {vet.clinicName}
            </Text>
            <View style={styles.ratingRow}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{vet.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({vet.reviewCount} avis)</Text>
            </View>
          </View>
          {vet.emergencyAvailable && (
            <View style={styles.emergencyBadge}>
              <AlertTriangle size={12} color="#FFFFFF" />
              <Text style={styles.emergencyBadgeText}>24h</Text>
            </View>
          )}
        </View>

        <View style={styles.vetDetails}>
          <View style={styles.detailRow}>
            <MapPin size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {vet.address}, {vet.city}
            </Text>
          </View>

          <View style={styles.specialtiesRow}>
            {vet.specialties.slice(0, 2).map((specialty, index) => (
              <View key={index} style={styles.specialtyChip}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
            {vet.specialties.length > 2 && (
              <Text style={styles.moreSpecialties}>+{vet.specialties.length - 2}</Text>
            )}
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.availabilityRow}>
              <Clock size={14} color={COLORS.success} />
              <Text style={styles.availabilityText}>{vet.nextAvailableSlot}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Consultation</Text>
              <Text style={styles.priceValue}>{vet.consultationPrice}€</Text>
            </View>
          </View>
        </View>

        <View style={styles.ctaRow}>
          <TouchableOpacity style={styles.phoneButton} activeOpacity={0.7}>
            <Phone size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => handleSelectVet(vet)}
            activeOpacity={0.8}
          >
            <Text style={styles.bookButtonText}>Prendre RDV</Text>
            <ChevronRight size={16} color={COLORS.textInverse} />
          </TouchableOpacity>
        </View>

        {vet.isPartner && (
          <View style={styles.partnerBadge}>
            <Text style={styles.partnerBadgeText}>Partenaire Odalea</Text>
          </View>
        )}
      </TouchableOpacity>
    ),
    [handleSelectVet]
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Vétérinaires',
          headerLargeTitle: false,
        }}
      />

      {isEmergency && (
        <View style={styles.emergencyBanner}>
          <AlertTriangle size={18} color="#FFFFFF" />
          <Text style={styles.emergencyBannerText}>
            Situation urgente détectée. Voici les vétérinaires disponibles 24h/24.
          </Text>
        </View>
      )}

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un vétérinaire..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, showEmergencyOnly && styles.filterButtonActive]}
          onPress={() => setShowEmergencyOnly(!showEmergencyOnly)}
          activeOpacity={0.7}
        >
          <AlertTriangle
            size={16}
            color={showEmergencyOnly ? COLORS.textInverse : COLORS.primary}
          />
          <Text
            style={[styles.filterButtonText, showEmergencyOnly && styles.filterButtonTextActive]}
          >
            24h
          </Text>
        </TouchableOpacity>
      </View>

      {petName && (
        <View style={styles.petBanner}>
          <Text style={styles.petBannerText}>
            Rendez-vous pour <Text style={styles.petBannerName}>{petName}</Text>
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredVets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Aucun résultat</Text>
            <Text style={styles.emptyStateSubtitle}>
              Essayez de modifier vos critères de recherche.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {filteredVets.length} vétérinaire{filteredVets.length > 1 ? 's' : ''} trouvé
              {filteredVets.length > 1 ? 's' : ''}
            </Text>
            {filteredVets.map(renderVetCard)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    gap: SPACING.s,
  },
  emergencyBannerText: {
    flex: 1,
    ...TYPOGRAPHY.small,
    color: '#FFFFFF',
    fontWeight: '500' as const,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    gap: SPACING.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.small,
    paddingHorizontal: SPACING.m,
    gap: SPACING.s,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.m,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    borderRadius: RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
  filterButtonTextActive: {
    color: COLORS.textInverse,
  },
  petBanner: {
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
  },
  petBannerText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  petBannerName: {
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.l,
    gap: SPACING.l,
  },
  resultsCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.s,
  },
  vetCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  vetCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.m,
  },
  vetPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceSecondary,
  },
  vetPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vetPhotoInitial: {
    ...TYPOGRAPHY.titleM,
    color: COLORS.textInverse,
  },
  vetInfo: {
    flex: 1,
    marginLeft: SPACING.m,
  },
  vetNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  vetName: {
    ...TYPOGRAPHY.bodySemibold,
    color: COLORS.textPrimary,
  },
  clinicName: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  ratingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    fontWeight: '600' as const,
  },
  reviewCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACING.s,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
  },
  emergencyBadgeText: {
    ...TYPOGRAPHY.caption,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  vetDetails: {
    gap: SPACING.s,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  detailText: {
    flex: 1,
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  specialtyChip: {
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: SPACING.s,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
  },
  specialtyText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  moreSpecialties: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    alignSelf: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.m,
    paddingTop: SPACING.m,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.divider,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  availabilityText: {
    ...TYPOGRAPHY.small,
    color: COLORS.success,
    fontWeight: '500' as const,
  },
  priceRow: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
  priceValue: {
    ...TYPOGRAPHY.bodySemibold,
    color: COLORS.textPrimary,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginTop: SPACING.m,
  },
  phoneButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.m,
    borderRadius: RADIUS.button,
  },
  bookButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textInverse,
  },
  partnerBadge: {
    position: 'absolute',
    top: SPACING.s,
    right: SPACING.s,
    backgroundColor: '#F59E0B',
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
    borderRadius: RADIUS.small,
  },
  partnerBadgeText: {
    ...TYPOGRAPHY.caption,
    color: '#FFFFFF',
    fontWeight: '600' as const,
    fontSize: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.titleM,
    color: COLORS.textPrimary,
    marginBottom: SPACING.s,
  },
  emptyStateSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
  },
});
