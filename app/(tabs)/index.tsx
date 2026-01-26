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
import { COLORS, SHADOWS, DIMENSIONS } from '@/constants/colors';
import { COLORS as THEME_COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/theme/tokens';

import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { usePremium } from '@/hooks/premium-store';
import { useActivePet } from '@/hooks/active-pet-store';
import { useFriends } from '@/hooks/friends-store';
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
} from 'lucide-react-native';

const toHref = (path: string): Href => path as Href;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useFirebaseUser();
  const { isPremium } = usePremium();
  const { activePetId, setActivePet } = useActivePet();
  const { pendingRequests, friends } = useFriends();

  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const userPets = user?.pets || [];

  const petsSubtitle = useMemo(() => {
    if (userPets.length === 0) return 'Ajoutez votre premier compagnon';
    return userPets.map(p => p.name).join(' · ');
  }, [userPets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
  }, []);

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
              `Êtes-vous sûr de vouloir supprimer ${petName} ?`,
              [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', style: 'destructive', onPress: () => console.log('Delete pet', petId) },
              ]
            );
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  }, [activePetId, router, setActivePet]);

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
    { id: 'challenges', label: 'Défis', icon: Trophy, route: '/defis' },
    { id: 'catsitter', label: 'Cat sitter', icon: Heart, route: '/(tabs)/cat-sitter' },
    { id: 'messages', label: 'Messages', icon: MessageCircle, route: '/(tabs)/messages' },
    { id: 'matchs', label: 'Matchs', icon: Sparkles, route: '/matching/discover' },
  ], []);

  const discoverActions = useMemo(() => [
    { id: 'profiles', label: 'Découvrir des profils', icon: Search, route: '/search' },
    { id: 'community', label: 'Communauté', icon: Users, route: '/(tabs)/community' },
    { id: 'map', label: 'Explorer autour de moi', icon: MapPin, route: '/(tabs)/map' },
  ], []);

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLORS.primary} />
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petsScroll}
          >
            {userPets.map((pet) => {
              const isActive = activePetId === pet.id;
              return (
                <Pressable
                  key={pet.id}
                  style={[styles.petCard, isActive && styles.petCardActive]}
                  onPress={() => handlePetPress(pet.id)}
                  onLongPress={() => handlePetLongPress(pet.id, pet.name)}
                >
                  <Image
                    source={{ uri: pet.mainPhoto || 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=300' }}
                    style={styles.petImage}
                    contentFit="cover"
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

            {/* Add pet card */}
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
          </ScrollView>
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
              <ShoppingBag size={24} color="#000000" strokeWidth={2} />
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
    backgroundColor: '#FAFAF8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  avatarButton: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#0F172A',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#0F172A',
    marginBottom: 12,
  },
  petsScroll: {
    gap: 12,
    paddingRight: 16,
  },
  petCard: {
    width: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.small,
  },
  petCardActive: {
    borderColor: '#000000',
  },
  petImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#F3F4F6',
  },
  petInfo: {
    padding: 10,
  },
  petName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0F172A',
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 12,
    color: '#64748B',
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPetCard: {
    width: 130,
    height: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addPetIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPetText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#64748B',
  },
  editorialSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 24,
  },
  editorialTitle: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: '#0F172A',
    lineHeight: 30,
    marginBottom: 8,
  },
  editorialSubtitle: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    ...SHADOWS.small,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#0F172A',
  },
  discoverList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  discoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  discoverItemLast: {
    borderBottomWidth: 0,
  },
  discoverIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  discoverLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#0F172A',
  },
  socialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  socialIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  socialInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  socialLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#0F172A',
  },
  socialBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  socialBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  socialCount: {
    fontSize: 14,
    color: '#64748B',
  },
  socialDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E2E8F0',
    marginLeft: 66,
  },
  premiumShopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  premiumCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    ...SHADOWS.small,
  },
  premiumCardActive: {
    borderColor: '#000000',
    backgroundColor: '#F8F8F6',
  },
  premiumText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0F172A',
  },
  shopCard: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    ...SHADOWS.small,
  },
  shopText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
