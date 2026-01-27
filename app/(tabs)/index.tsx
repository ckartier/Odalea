import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Href, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS, COMPONENT_SIZES } from '@/theme/tokens';

import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { usePremium } from '@/hooks/premium-store';
import { useActivePetWithData } from '@/hooks/active-pet-store';
import { useFriends } from '@/hooks/friends-store';
import { useUserPets } from '@/hooks/useUserPets';
import {
  Bell,
  Menu,
  Plus,
  Check,
  Trophy,
  Heart,
  MessageCircle,
  Search,
  MapPin,
  Users,
  Star,
  ShoppingBag,
  ChevronRight,
  UserPlus,
  Sparkles,
  Stethoscope,
} from 'lucide-react-native';

const toHref = (path: string): Href => path as Href;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useFirebaseUser();
  const { isPremium } = usePremium();
  const { activePetId, setActivePet, userPets, isLoading: petsLoading } = useActivePetWithData();
  const { pendingRequests, friends } = useFriends();
  const { deletePet, isDeletingPet, refetch: refetchPets, error: petsError } = useUserPets();

  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const petsSubtitle = useMemo(() => {
    if (userPets.length === 0) return 'Ajoutez votre premier compagnon';
    return userPets.map(p => p.name).join(' · ');
  }, [userPets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refetchPets();
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
  }, [refetchPets]);

  const handleMenuPress = useCallback(() => {
    router.push(toHref('/menu'));
  }, [router]);

  const handleNotificationPress = useCallback(() => {
    router.push(toHref('/friends'));
  }, [router]);

  const handleAddPet = useCallback(() => {
    router.push(toHref('/pet/add'));
  }, [router]);

  const handlePetPress = useCallback((petId: string) => {
    router.push(toHref(`/pet/edit/${petId}`));
  }, [router]);

  const handleDeletePet = useCallback(async (petId: string, petName: string) => {
    console.log('[Home] Deleting pet:', petId);
    const result = await deletePet(petId);
    if (result.success) {
      console.log('[Home] Pet deleted successfully');
    } else {
      Alert.alert('Erreur', result.error || 'Impossible de supprimer cet animal.');
    }
  }, [deletePet]);

  const handlePetLongPress = useCallback((petId: string, petName: string) => {
    const isActive = activePetId === petId;
    Alert.alert(
      petName,
      'Que souhaitez-vous faire ?',
      [
        {
          text: 'Modifier',
          onPress: () => router.push(toHref(`/pet/edit/${petId}`)),
        },
        {
          text: isActive ? 'Animal actif' : 'Définir comme actif',
          onPress: () => !isActive && setActivePet(petId),
          style: isActive ? 'cancel' : 'default',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Supprimer',
              `Êtes-vous sûr de vouloir supprimer ${petName} ? Cette action est irréversible.`,
              [
                { text: 'Annuler', style: 'cancel' },
                { 
                  text: 'Supprimer', 
                  style: 'destructive', 
                  onPress: () => handleDeletePet(petId, petName),
                },
              ]
            );
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  }, [activePetId, router, setActivePet, handleDeletePet]);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace(toHref('/splash'));
          },
        },
      ]
    );
  }, [signOut, router]);

  const quickActions = useMemo(() => [
    { id: 'vet-assistant', label: 'Bien-être', icon: Stethoscope, route: '/vet-assistant' },
    { id: 'challenges', label: 'Défis', icon: Trophy, route: '/defis' },
    { id: 'catsitter', label: 'Cat sitter', icon: Heart, route: '/(tabs)/cat-sitter' },
    { id: 'messages', label: 'Messages', icon: MessageCircle, route: '/(tabs)/messages' },
  ], []);

  const discoverActions = useMemo(() => [
    { id: 'profiles', label: 'Découvrir des profils', icon: Search, route: '/search' },
    { id: 'community', label: 'Communauté', icon: Users, route: '/(tabs)/community' },
    { id: 'map', label: 'Explorer autour de moi', icon: MapPin, route: '/(tabs)/map' },
  ], []);

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => router.push(toHref('/profile/edit'))}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: user.photo || 'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=200' }}
            style={styles.avatar}
            contentFit="cover"
          />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {user.pseudo || user.firstName || 'Utilisateur'}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {petsSubtitle}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={handleNotificationPress}
            activeOpacity={0.7}
          >
            <Bell size={22} color="#000000" strokeWidth={2} />
            {pendingRequests.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {pendingRequests.length > 9 ? '9+' : pendingRequests.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={handleMenuPress}
            activeOpacity={0.7}
          >
            <Menu size={22} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000000" />
        }
      >
        {/* Section: Mes animaux */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes animaux</Text>
          </View>

          {petsLoading ? (
            <View style={styles.petsLoadingContainer}>
              <ActivityIndicator size="small" color="#000000" />
              <Text style={styles.petsLoadingText}>Chargement...</Text>
            </View>
          ) : petsError ? (
            <View style={styles.petsErrorContainer}>
              <Text style={styles.petsErrorText}>{petsError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={refetchPets}>
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.petsScroll}
            >
              {userPets.length === 0 ? (
                <TouchableOpacity
                  style={styles.emptyPetCard}
                  onPress={handleAddPet}
                  activeOpacity={0.8}
                >
                  <View style={styles.emptyPetIconContainer}>
                    <Plus size={32} color="#000000" strokeWidth={2} />
                  </View>
                  <Text style={styles.emptyPetTitle}>Ajoutez votre premier compagnon</Text>
                  <Text style={styles.emptyPetSubtitle}>Tapez ici pour commencer</Text>
                </TouchableOpacity>
              ) : (
                <>
                  {userPets.map((pet) => {
                    const isActive = activePetId === pet.id;
                    return (
                      <Pressable
                        key={pet.id}
                        style={[styles.petCard, isActive && styles.petCardActive]}
                        onPress={() => handlePetPress(pet.id)}
                        onLongPress={() => handlePetLongPress(pet.id, pet.name)}
                        disabled={isDeletingPet}
                      >
                        <Image
                          source={{ uri: pet.mainPhoto || 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=300' }}
                          style={styles.petImage}
                          contentFit="cover"
                          placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
                        />
                        <View style={styles.petInfo}>
                          <Text style={styles.petName} numberOfLines={1}>{pet.name}</Text>
                          <Text style={styles.petBreed} numberOfLines={1}>{pet.breed || pet.type}</Text>
                        </View>
                        {isActive && (
                          <View style={styles.activeBadge}>
                            <Check size={14} color="#FFFFFF" strokeWidth={3} />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}

                  <TouchableOpacity
                    style={styles.addPetCard}
                    onPress={handleAddPet}
                    activeOpacity={0.8}
                  >
                    <View style={styles.addPetIconContainer}>
                      <Plus size={28} color="#000000" strokeWidth={2} />
                    </View>
                    <Text style={styles.addPetText}>Ajouter</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          )}
        </View>

        {/* Section: Texte éditorial */}
        <View style={styles.editorialSection}>
          <Text style={styles.editorialTitle}>
            Que veux-tu partager aujourd'hui avec ton compagnon ?
          </Text>
          <Text style={styles.editorialSubtitle}>
            Balade, rencontre, jeu, besoin d'aide... choisis ce qui compte.
          </Text>
        </View>

        {/* Section: Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => router.push(toHref(action.route))}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconContainer}>
                  <action.icon size={24} color="#000000" strokeWidth={2} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Section: Découvrir */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Découvrir</Text>
          <View style={styles.discoverList}>
            {discoverActions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.discoverItem,
                  index === discoverActions.length - 1 && styles.discoverItemLast,
                ]}
                onPress={() => router.push(toHref(action.route))}
                activeOpacity={0.7}
              >
                <View style={styles.discoverIconContainer}>
                  <action.icon size={20} color="#000000" strokeWidth={2} />
                </View>
                <Text style={styles.discoverLabel}>{action.label}</Text>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Section: Social */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social</Text>
          <View style={styles.socialCard}>
            <TouchableOpacity
              style={styles.socialItem}
              onPress={() => router.push(toHref('/friends'))}
              activeOpacity={0.7}
            >
              <View style={styles.socialIconContainer}>
                <UserPlus size={20} color="#000000" strokeWidth={2} />
              </View>
              <View style={styles.socialInfo}>
                <Text style={styles.socialLabel}>Demandes d'amis</Text>
                {pendingRequests.length > 0 && (
                  <View style={styles.socialBadge}>
                    <Text style={styles.socialBadgeText}>{pendingRequests.length}</Text>
                  </View>
                )}
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.socialDivider} />

            <TouchableOpacity
              style={styles.socialItem}
              onPress={() => router.push(toHref('/friends'))}
              activeOpacity={0.7}
            >
              <View style={styles.socialIconContainer}>
                <Users size={20} color="#000000" strokeWidth={2} />
              </View>
              <View style={styles.socialInfo}>
                <Text style={styles.socialLabel}>Mes amis</Text>
                <Text style={styles.socialCount}>{friends.length}</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Premium & Shop */}
        <View style={styles.section}>
          <View style={styles.premiumShopRow}>
            <TouchableOpacity
              style={[styles.premiumCard, isPremium && styles.premiumCardActive]}
              onPress={() => router.push(toHref('/premium'))}
              activeOpacity={0.8}
            >
              <Star size={24} color={isPremium ? '#000000' : '#000000'} fill={isPremium ? '#000000' : 'none'} strokeWidth={2} />
              <Text style={styles.premiumText}>
                {isPremium ? 'Premium actif' : 'Passer Premium'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shopCard}
              onPress={() => router.push(toHref('/(tabs)/shop'))}
              activeOpacity={0.8}
            >
              <ShoppingBag size={24} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.shopText}>Boutique</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  avatarButton: {
    marginRight: SPACING.m,
  },
  avatar: {
    width: COMPONENT_SIZES.avatarLarge,
    height: COMPONENT_SIZES.avatarLarge,
    borderRadius: COMPONENT_SIZES.avatarLarge / 2,
    backgroundColor: COLORS.surfaceSecondary,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerName: {
    ...TYPOGRAPHY.bodySemibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerIconButton: {
    width: COMPONENT_SIZES.touchTarget,
    height: COMPONENT_SIZES.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: COMPONENT_SIZES.touchTarget / 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.badge,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: COLORS.badgeText,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.xl,
  },
  section: {
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  sectionTitle: {
    ...TYPOGRAPHY.titleM,
    color: COLORS.textPrimary,
    marginBottom: SPACING.m,
  },
  petsScroll: {
    gap: SPACING.m,
    paddingRight: SPACING.l,
  },
  petCard: {
    width: 140,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.card,
  },
  petCardActive: {
    borderColor: COLORS.primary,
  },
  petImage: {
    width: '100%',
    height: 110,
    backgroundColor: COLORS.surfaceSecondary,
  },
  petInfo: {
    padding: SPACING.m,
  },
  petName: {
    ...TYPOGRAPHY.smallSemibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  petBreed: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  activeBadge: {
    position: 'absolute',
    top: SPACING.s,
    right: SPACING.s,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPetCard: {
    width: 140,
    height: 170,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 2,
    borderColor: COLORS.divider,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.s,
  },
  addPetIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPetText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  petsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['5xl'],
    gap: SPACING.m,
  },
  petsLoadingText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  petsErrorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['3xl'],
    gap: SPACING.m,
  },
  petsErrorText: {
    ...TYPOGRAPHY.small,
    color: COLORS.danger,
    textAlign: 'center' as const,
  },
  retryButton: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.small,
  },
  retryButtonText: {
    ...TYPOGRAPHY.smallSemibold,
    color: COLORS.textInverse,
  },
  emptyPetCard: {
    width: COMPONENT_SIZES.petCardWidth,
    height: 170,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 2,
    borderColor: COLORS.divider,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.s,
    paddingHorizontal: SPACING.l,
  },
  emptyPetIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  emptyPetTitle: {
    ...TYPOGRAPHY.smallSemibold,
    color: COLORS.textPrimary,
    textAlign: 'center' as const,
  },
  emptyPetSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
  },
  editorialSection: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.xl,
    marginBottom: SPACING['2xl'],
  },
  editorialTitle: {
    ...TYPOGRAPHY.titleM,
    color: COLORS.textPrimary,
    marginBottom: SPACING.s,
  },
  editorialSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.m,
  },
  actionCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    alignItems: 'center',
    gap: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
    ...SHADOWS.card,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    ...TYPOGRAPHY.smallSemibold,
    color: COLORS.textPrimary,
  },
  discoverList: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.divider,
    ...SHADOWS.card,
  },
  discoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.l,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  discoverItemLast: {
    borderBottomWidth: 0,
  },
  discoverIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  discoverLabel: {
    flex: 1,
    ...TYPOGRAPHY.smallSemibold,
    color: COLORS.textPrimary,
  },
  socialCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.divider,
    ...SHADOWS.card,
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.l,
  },
  socialIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  socialInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  socialLabel: {
    ...TYPOGRAPHY.smallSemibold,
    color: COLORS.textPrimary,
  },
  socialBadge: {
    backgroundColor: COLORS.badge,
    borderRadius: 10,
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
  },
  socialBadgeText: {
    ...TYPOGRAPHY.captionSemibold,
    color: COLORS.badgeText,
  },
  socialCount: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  socialDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.divider,
    marginLeft: 66,
  },
  premiumShopRow: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  premiumCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    alignItems: 'center',
    gap: SPACING.s,
    borderWidth: 2,
    borderColor: COLORS.divider,
    ...SHADOWS.card,
  },
  premiumCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceSecondary,
  },
  premiumText: {
    ...TYPOGRAPHY.smallSemibold,
    color: COLORS.textPrimary,
  },
  shopCard: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    alignItems: 'center',
    gap: SPACING.s,
    ...SHADOWS.card,
  },
  shopText: {
    ...TYPOGRAPHY.smallSemibold,
    color: COLORS.textInverse,
  },
});
