import React, { useState, useMemo } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { COLORS, DIMENSIONS } from '@/constants/colors';
import { db } from '@/services/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  or,
} from 'firebase/firestore';
import { User, Pet } from '@/types';
import UserCard from '@/components/UserCard';
import { Search, Filter, X, Users, MapPin, Star, Briefcase, ShieldCheck } from 'lucide-react-native';
import { impersonateUser } from '@/hooks/auth-store';

function toUser(docData: any, id: string): User {
  const pets: Pet[] = Array.isArray(docData?.pets) ? docData.pets : [];
  const safePets: Pet[] = pets.map((p: any, idx: number) => ({
    id: String(p?.id ?? `${id}-pet-${idx}`),
    ownerId: String(p?.ownerId ?? id),
    name: String(p?.name ?? 'Neko'),
    type: String(p?.type ?? 'cat'),
    breed: String(p?.breed ?? 'Européen'),
    gender: (p?.gender === 'male' || p?.gender === 'female') ? p.gender : 'female',
    dateOfBirth: String(p?.dateOfBirth ?? '2020-01-01'),
    color: String(p?.color ?? 'noir'),
    character: Array.isArray(p?.character) ? p.character : (typeof p?.character === 'string' ? [p.character] : []),
    distinctiveSign: p?.distinctiveSign,
    vaccinationDates: Array.isArray(p?.vaccinationDates) ? p.vaccinationDates : [],
    microchipNumber: p?.microchipNumber,
    mainPhoto: String(p?.mainPhoto ?? docData?.photo ?? 'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=500'),
    galleryPhotos: Array.isArray(p?.galleryPhotos) && p.galleryPhotos.length > 0 ? p.galleryPhotos : [String(p?.mainPhoto ?? docData?.photo ?? 'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=500')],
    vet: p?.vet,
    walkTimes: Array.isArray(p?.walkTimes) ? p.walkTimes : [],
    isPrimary: Boolean(p?.isPrimary ?? (idx === 0)),
    location: p?.location ? { latitude: Number(p.location.latitude), longitude: Number(p.location.longitude) } : undefined,
  }));

  const firstName = String(docData?.firstName ?? 'User');
  const lastName = String(docData?.lastName ?? id.slice(0, 6));
  const pseudo = String(docData?.pseudo ?? `${firstName}${lastName}`.toLowerCase());

  const user: User = {
    id,
    firstName,
    lastName,
    name: String(docData?.name ?? `${firstName} ${lastName}`),
    pseudo,
    pseudoLower: String(docData?.pseudoLower ?? pseudo.toLowerCase()),
    photo: docData?.photo,
    email: String(docData?.email ?? `${id}@example.com`),
    emailLower: String(docData?.emailLower ?? `${id}@example.com`),
    phoneNumber: String(docData?.phoneNumber ?? ''),
    countryCode: String(docData?.countryCode ?? 'FR'),
    address: String(docData?.address ?? ''),
    zipCode: String(docData?.zipCode ?? ''),
    city: String(docData?.city ?? ''),
    location: docData?.location ? { latitude: Number(docData.location.latitude), longitude: Number(docData.location.longitude) } : undefined,
    isCatSitter: Boolean(docData?.isCatSitter ?? false),
    referralCode: docData?.referralCode,
    isPremium: Boolean(docData?.isPremium ?? false),
    createdAt: typeof docData?.createdAt?.toMillis === 'function' ? docData.createdAt.toMillis() : Number(docData?.createdAt ?? Date.now()),
    pets: safePets,
    animalType: docData?.animalType,
    animalName: docData?.animalName,
    isProfessional: Boolean(docData?.isProfessional ?? false),
    professionalData: docData?.professionalData,
    isActive: Boolean(docData?.isActive ?? true),
    profileComplete: Boolean(docData?.profileComplete ?? true),
    isAdmin: Boolean(docData?.isAdmin ?? false),
    isSuperAdmin: Boolean(docData?.isSuperAdmin ?? false),
  };
  return user;
}

export default function AdminSearchUsersScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    isPremium: false,
    isProfessional: false,
    isCatSitter: false,
    city: '',
  });

  const usersQuery = useQuery({
    queryKey: ['admin-search-users', searchText, filters],
    queryFn: async () => {
      console.log('[AdminSearchUsers] Searching:', searchText, filters);
      const usersRef = collection(db, 'users');
      
      if (!searchText && !filters.city && !filters.isPremium && !filters.isProfessional && !filters.isCatSitter) {
        const q = query(usersRef, orderBy('createdAt', 'desc'), limit(50));
        const snap = await getDocs(q);
        return snap.docs.map(d => toUser(d.data(), d.id));
      }

      const constraints: any[] = [];
      
      if (filters.isPremium) {
        constraints.push(where('isPremium', '==', true));
      }
      if (filters.isProfessional) {
        constraints.push(where('isProfessional', '==', true));
      }
      if (filters.isCatSitter) {
        constraints.push(where('isCatSitter', '==', true));
      }
      if (filters.city) {
        constraints.push(where('city', '==', filters.city));
      }

      if (searchText) {
        const searchLower = searchText.toLowerCase();
        
        const emailQuery = query(usersRef, where('emailLower', '>=', searchLower), where('emailLower', '<=', searchLower + '\uf8ff'), ...constraints, limit(20));
        const pseudoQuery = query(usersRef, where('pseudoLower', '>=', searchLower), where('pseudoLower', '<=', searchLower + '\uf8ff'), ...constraints, limit(20));
        
        const [emailSnap, pseudoSnap] = await Promise.all([
          getDocs(emailQuery),
          getDocs(pseudoQuery),
        ]);

        const userMap = new Map<string, User>();
        emailSnap.docs.forEach(d => userMap.set(d.id, toUser(d.data(), d.id)));
        pseudoSnap.docs.forEach(d => userMap.set(d.id, toUser(d.data(), d.id)));

        return Array.from(userMap.values());
      }

      const q = query(usersRef, ...constraints, orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      return snap.docs.map(d => toUser(d.data(), d.id));
    },
    enabled: true,
  });

  const handleImpersonate = (userId: string) => {
    impersonateUser(userId);
    router.push('/(tabs)/home');
  };

  const clearFilters = () => {
    setFilters({
      isPremium: false,
      isProfessional: false,
      isCatSitter: false,
      city: '',
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.isPremium) count++;
    if (filters.isProfessional) count++;
    if (filters.isCatSitter) count++;
    if (filters.city) count++;
    return count;
  }, [filters]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Recherche Utilisateurs' }} />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={COLORS.darkGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par email ou pseudo..."
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
            testID="search-input"
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')} testID="clear-search">
              <X size={20} color={COLORS.darkGray} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
          testID="toggle-filters"
        >
          <Filter size={20} color={activeFiltersCount > 0 ? COLORS.white : COLORS.primary} />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersPanel}>
          <View style={styles.filtersPanelHeader}>
            <Text style={styles.filtersPanelTitle}>Filtres</Text>
            {activeFiltersCount > 0 && (
              <TouchableOpacity onPress={clearFilters} testID="clear-filters">
                <Text style={styles.clearFiltersText}>Effacer tout</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, filters.isPremium && styles.filterChipActive]}
              onPress={() => setFilters(prev => ({ ...prev, isPremium: !prev.isPremium }))}
              testID="filter-premium"
            >
              <Star size={16} color={filters.isPremium ? COLORS.white : COLORS.primary} />
              <Text style={[styles.filterChipText, filters.isPremium && styles.filterChipTextActive]}>
                Premium
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filters.isProfessional && styles.filterChipActive]}
              onPress={() => setFilters(prev => ({ ...prev, isProfessional: !prev.isProfessional }))}
              testID="filter-professional"
            >
              <Briefcase size={16} color={filters.isProfessional ? COLORS.white : COLORS.primary} />
              <Text style={[styles.filterChipText, filters.isProfessional && styles.filterChipTextActive]}>
                Professionnel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filters.isCatSitter && styles.filterChipActive]}
              onPress={() => setFilters(prev => ({ ...prev, isCatSitter: !prev.isCatSitter }))}
              testID="filter-cat-sitter"
            >
              <ShieldCheck size={16} color={filters.isCatSitter ? COLORS.white : COLORS.primary} />
              <Text style={[styles.filterChipText, filters.isCatSitter && styles.filterChipTextActive]}>
                Cat-sitter
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cityFilterRow}>
            <MapPin size={16} color={COLORS.darkGray} />
            <TextInput
              style={styles.cityInput}
              placeholder="Ville (ex: Paris, Lyon...)"
              value={filters.city}
              onChangeText={(text) => setFilters(prev => ({ ...prev, city: text }))}
              testID="filter-city"
            />
          </View>
        </View>
      )}

      <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
        {usersQuery.isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Recherche en cours...</Text>
          </View>
        )}

        {usersQuery.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Erreur</Text>
            <Text style={styles.errorText}>
              {(usersQuery.error as any)?.message ?? 'Impossible de charger les utilisateurs'}
            </Text>
          </View>
        )}

        {!usersQuery.isLoading && !usersQuery.error && (
          <>
            <View style={styles.resultsHeader}>
              <Users size={18} color={COLORS.darkGray} />
              <Text style={styles.resultsCount}>
                {usersQuery.data?.length ?? 0} résultat{(usersQuery.data?.length ?? 0) > 1 ? 's' : ''}
              </Text>
            </View>

            {usersQuery.data && usersQuery.data.length > 0 ? (
              usersQuery.data.map(user => (
                <View key={user.id} style={styles.userCardWrapper}>
                  <UserCard user={user} showActions={false} />
                  <View style={styles.userActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleImpersonate(user.id)}
                      testID={`impersonate-${user.id}`}
                    >
                      <Text style={styles.actionButtonText}>Se connecter en tant que</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonSecondary]}
                      onPress={() => router.push(`/profile/${user.id}`)}
                      testID={`view-profile-${user.id}`}
                    >
                      <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                        Voir profil
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.userMeta}>
                    <Text style={styles.userMetaText}>ID: {user.id}</Text>
                    {user.isPremium && (
                      <View style={styles.badge}>
                        <Star size={12} color={COLORS.accent} />
                        <Text style={styles.badgeText}>Premium</Text>
                      </View>
                    )}
                    {user.isProfessional && (
                      <View style={styles.badge}>
                        <Briefcase size={12} color={COLORS.primary} />
                        <Text style={styles.badgeText}>Pro</Text>
                      </View>
                    )}
                    {user.isCatSitter && (
                      <View style={styles.badge}>
                        <ShieldCheck size={12} color={COLORS.success} />
                        <Text style={styles.badgeText}>Cat-sitter</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Users size={48} color={COLORS.lightGray} />
                <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
                <Text style={styles.emptySubtext}>
                  Essayez de modifier vos critères de recherche
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: DIMENSIONS.SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    gap: DIMENSIONS.SPACING.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.screenBackground,
    borderRadius: 12,
    paddingHorizontal: DIMENSIONS.SPACING.md,
    gap: DIMENSIONS.SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: DIMENSIONS.FONT_SIZES.md,
    color: COLORS.black,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(125, 212, 238, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  filterBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  filtersPanel: {
    backgroundColor: COLORS.white,
    padding: DIMENSIONS.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  filtersPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING.sm,
  },
  filtersPanelTitle: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  clearFiltersText: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENSIONS.SPACING.sm,
    marginBottom: DIMENSIONS.SPACING.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(125, 212, 238, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  cityFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING.sm,
    backgroundColor: COLORS.screenBackground,
    borderRadius: 12,
    paddingHorizontal: DIMENSIONS.SPACING.md,
  },
  cityInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.black,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    padding: DIMENSIONS.SPACING.md,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DIMENSIONS.SPACING.xl * 2,
  },
  loadingText: {
    marginTop: DIMENSIONS.SPACING.md,
    fontSize: DIMENSIONS.FONT_SIZES.md,
    color: COLORS.darkGray,
  },
  errorContainer: {
    backgroundColor: '#fff5f5',
    borderColor: '#ffd6d6',
    borderWidth: 1,
    padding: DIMENSIONS.SPACING.md,
    borderRadius: 12,
    marginVertical: DIMENSIONS.SPACING.md,
  },
  errorTitle: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    fontWeight: '700' as const,
    color: COLORS.error,
    marginBottom: 4,
  },
  errorText: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.error,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING.sm,
    marginBottom: DIMENSIONS.SPACING.md,
  },
  resultsCount: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    fontWeight: '600' as const,
    color: COLORS.darkGray,
  },
  userCardWrapper: {
    marginBottom: DIMENSIONS.SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: DIMENSIONS.SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userActions: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING.sm,
    marginTop: DIMENSIONS.SPACING.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: 'rgba(125, 212, 238, 0.1)',
  },
  actionButtonText: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  actionButtonTextSecondary: {
    color: COLORS.primary,
  },
  userMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENSIONS.SPACING.sm,
    marginTop: DIMENSIONS.SPACING.sm,
    alignItems: 'center',
  },
  userMetaText: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    color: COLORS.darkGray,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(125, 212, 238, 0.1)',
  },
  badgeText: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    fontWeight: '600' as const,
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DIMENSIONS.SPACING.xl * 2,
  },
  emptyText: {
    fontSize: DIMENSIONS.FONT_SIZES.lg,
    fontWeight: '600' as const,
    color: COLORS.darkGray,
    marginTop: DIMENSIONS.SPACING.md,
  },
  emptySubtext: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.darkGray,
    marginTop: DIMENSIONS.SPACING.sm,
    textAlign: 'center',
  },
});
