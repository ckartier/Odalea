import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/auth-store';
import { useMessaging } from '@/hooks/messaging-store';
import { useCatSitter } from '@/hooks/cat-sitter-store';
import type { Gender, Pet, User } from '@/types';
import { 
  MapPin, 
  MessageSquare, 
  Shield, 
  UserCheck, 
  UserPlus, 
  Calendar, 
  Clock, 
  Heart,
  PawPrint,
  ChevronRight,
} from 'lucide-react-native';
import { db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';



const COLORS = {
  primary: '#0B2A3C',
  primaryLight: '#1A4A5E',
  accent: '#FF6B6B',
  success: '#4CAF50',
  white: '#FFFFFF',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  cardBg: '#FFFFFF',
};

function isGender(v: unknown): v is Gender {
  return v === 'male' || v === 'female';
}

function parsePet(raw: any): Pet | null {
  try {
    const pet: Pet = {
      id: String(raw?.id ?? ''),
      ownerId: String(raw?.ownerId ?? ''),
      name: String(raw?.name ?? ''),
      type: String(raw?.type ?? ''),
      breed: String(raw?.breed ?? ''),
      gender: isGender(raw?.gender) ? raw.gender : 'male',
      dateOfBirth: String(raw?.dateOfBirth ?? ''),
      color: String(raw?.color ?? ''),
      character: Array.isArray(raw?.character) ? raw.character.map(String) : [],
      distinctiveSign: raw?.distinctiveSign ? String(raw.distinctiveSign) : undefined,
      vaccinationDates: Array.isArray(raw?.vaccinationDates) ? raw.vaccinationDates : [],
      microchipNumber: raw?.microchipNumber ? String(raw.microchipNumber) : undefined,
      mainPhoto: String(raw?.mainPhoto ?? ''),
      galleryPhotos: Array.isArray(raw?.galleryPhotos) ? raw.galleryPhotos.map(String) : [],
      vet: raw?.vet,
      walkTimes: Array.isArray(raw?.walkTimes) ? raw.walkTimes.map(String) : [],
      isPrimary: Boolean(raw?.isPrimary),
      location: raw?.location?.latitude != null && raw?.location?.longitude != null
        ? { latitude: Number(raw.location.latitude), longitude: Number(raw.location.longitude) }
        : undefined,
    };
    if (!pet.id || !pet.name) return null;
    return pet;
  } catch (e) {
    console.log('parsePet error', e);
    return null;
  }
}

function parseUser(id: string, raw: any): User | null {
  try {
    const pets: Pet[] = Array.isArray(raw?.pets)
      ? raw.pets.map(parsePet).filter(Boolean) as Pet[]
      : [];

    const createdAtNum = raw?.createdAt?.toMillis ? Number(raw.createdAt.toMillis()) : Number(raw?.createdAt ?? Date.now());

    const user: User = {
      id,
      firstName: String(raw?.firstName ?? ''),
      lastName: String(raw?.lastName ?? ''),
      name: String(raw?.name ?? ''),
      pseudo: String(raw?.pseudo ?? ''),
      pseudoLower: raw?.pseudoLower ? String(raw.pseudoLower) : undefined,
      photo: raw?.photo ? String(raw.photo) : undefined,
      email: String(raw?.email ?? ''),
      emailLower: raw?.emailLower ? String(raw.emailLower) : undefined,
      phoneNumber: String(raw?.phoneNumber ?? ''),
      countryCode: String(raw?.countryCode ?? '+33'),
      address: String(raw?.address ?? ''),
      zipCode: String(raw?.zipCode ?? ''),
      city: String(raw?.city ?? ''),
      isCatSitter: Boolean(raw?.isCatSitter),
      referralCode: raw?.referralCode ? String(raw.referralCode) : undefined,
      isPremium: Boolean(raw?.isPremium),
      createdAt: Number.isFinite(createdAtNum) ? createdAtNum : Date.now(),
      pets,
      animalType: raw?.animalType ? String(raw.animalType) : undefined,
      animalName: raw?.animalName ? String(raw.animalName) : undefined,
      isActive: Boolean(raw?.isActive ?? true),
      profileComplete: Boolean(raw?.profileComplete ?? true),
    };

    if (!user.pseudo || !user.email) return null;
    return user;
  } catch (e) {
    console.log('parseUser error', e);
    return null;
  }
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { areFriends, hasPendingRequest, sendFriendRequest, createConversation } = useMessaging();
  const { loadProfile: loadCatSitterProfile } = useCatSitter();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [catSitterProfile, setCatSitterProfile] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const isFriend = useMemo(() => (profileUser ? areFriends(profileUser.id) : false), [profileUser, areFriends]);
  const isPending = useMemo(() => (profileUser ? hasPendingRequest(profileUser.id) : false), [profileUser, hasPendingRequest]);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      if (user?.id === id) {
        router.replace('/(tabs)/profile');
        return;
      }
      const ref = doc(db, 'users', String(id));
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        Alert.alert('Profil introuvable', "L'utilisateur n'existe pas.");
        router.back();
        return;
      }
      const parsed = parseUser(snap.id, snap.data());
      if (!parsed) {
        Alert.alert('Erreur', 'Données utilisateur invalides');
        router.back();
        return;
      }
      setProfileUser(parsed);
      
      if (parsed.isCatSitter) {
        try {
          const csProfile = await loadCatSitterProfile(parsed.id);
          setCatSitterProfile(csProfile);
        } catch (err) {
          console.error('Failed to load cat sitter profile', err);
        }
      }
    } catch (e) {
      console.error('Failed to load profile', e);
      Alert.alert('Erreur', 'Impossible de charger le profil.');
    } finally {
      setLoading(false);
    }
  }, [id, user, router, loadCatSitterProfile]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSendMessage = useCallback(async () => {
    if (!profileUser || !user) return;
    setActionLoading(true);
    try {
      const conversationId = await createConversation.mutateAsync(profileUser.id);
      router.push(`/messages/${conversationId}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Erreur', 'Impossible de créer la conversation');
    } finally {
      setActionLoading(false);
    }
  }, [profileUser, user, createConversation, router]);

  const handleAddFriend = useCallback(async () => {
    if (!profileUser) return;
    try {
      setActionLoading(true);
      await sendFriendRequest.mutateAsync(profileUser.id);
      Alert.alert('Succès', 'Demande d\'ami envoyée !');
    } catch (error: any) {
      const message = error?.message || "Échec de l'envoi de la demande";
      Alert.alert('Info', message);
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  }, [profileUser, sendFriendRequest]);

  const handleBookService = useCallback(() => {
    if (!profileUser) return;
    router.push(`/booking/${profileUser.id}`);
  }, [profileUser, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer} testID="profile-loading">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  if (!profileUser) {
    return (
      <View style={styles.loadingContainer} testID="profile-empty">
        <Text style={styles.emptyText}>Profil introuvable</Text>
      </View>
    );
  }

  const heroPhoto = profileUser.photo || 
    (profileUser.pets && profileUser.pets.length > 0 ? profileUser.pets[0].mainPhoto : null) ||
    'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=500';

  return (
    <View style={styles.container} testID="user-profile-screen">
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: heroPhoto }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
          />
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronRight size={24} color={COLORS.white} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <View style={styles.nameRow}>
              <Text style={styles.heroName}>@{profileUser.pseudo}</Text>
              {profileUser.isCatSitter && (
                <View style={styles.catSitterBadge}>
                  <PawPrint size={12} color={COLORS.white} />
                  <Text style={styles.catSitterBadgeText}>Cat Sitter</Text>
                </View>
              )}
            </View>
            
            {profileUser.city && (
              <View style={styles.locationRow}>
                <MapPin size={14} color={COLORS.white} />
                <Text style={styles.heroLocation}>{profileUser.city}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {isFriend ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleSendMessage}
              disabled={actionLoading}
            >
              <MessageSquare size={20} color={COLORS.white} />
              <Text style={styles.primaryButtonText}>Message</Text>
            </TouchableOpacity>
          ) : isPending ? (
            <View style={[styles.actionButton, styles.pendingButton]}>
              <UserCheck size={20} color={COLORS.textSecondary} />
              <Text style={styles.pendingButtonText}>En attente</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleAddFriend}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <UserPlus size={20} color={COLORS.white} />
                  <Text style={styles.primaryButtonText}>Ajouter</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {profileUser.isCatSitter && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleBookService}
            >
              <Calendar size={20} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Réserver</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Cat Sitter Section */}
        {profileUser.isCatSitter && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Shield size={20} color={COLORS.success} />
              <Text style={styles.cardTitle}>Cat Sitter vérifié</Text>
            </View>
            <Text style={styles.cardDescription}>
              Professionnel vérifié sur la plateforme Odalea
            </Text>

            {catSitterProfile?.customServices && catSitterProfile.customServices.length > 0 && (
              <View style={styles.servicesSection}>
                <Text style={styles.servicesTitle}>Services proposés</Text>
                {catSitterProfile.customServices
                  .filter((s: any) => s.isActive)
                  .slice(0, 3)
                  .map((service: any) => (
                    <View key={service.id} style={styles.serviceItem}>
                      <View style={styles.serviceLeft}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        <View style={styles.serviceDetails}>
                          <Clock size={12} color={COLORS.textSecondary} />
                          <Text style={styles.serviceDetailText}>{service.duration} min</Text>
                        </View>
                      </View>
                      <View style={styles.serviceRight}>
                        <Text style={styles.servicePrice}>{service.price}€</Text>
                      </View>
                    </View>
                  ))}
              </View>
            )}
          </View>
        )}

        {/* Pets Section */}
        {profileUser.pets && profileUser.pets.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Heart size={20} color={COLORS.accent} />
              <Text style={styles.cardTitle}>Ses compagnons</Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.petsScroll}
            >
              {profileUser.pets.map((pet) => (
                <TouchableOpacity 
                  key={pet.id} 
                  style={styles.petCard}
                  onPress={() => router.push(`/pet/${pet.id}`)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: pet.mainPhoto || 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131' }}
                    style={styles.petImage}
                    contentFit="cover"
                  />
                  <View style={styles.petInfo}>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petBreed}>{pet.breed}</Text>
                  </View>
                  <View style={[
                    styles.genderIndicator, 
                    { backgroundColor: pet.gender === 'male' ? '#3B82F6' : '#EC4899' }
                  ]} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Privacy Notice */}
        {!isFriend && (
          <View style={styles.privacyCard}>
            <Text style={styles.privacyTitle}>Profil limité</Text>
            <Text style={styles.privacyText}>
              Ajoutez @{profileUser.pseudo} comme ami pour voir plus d{"'"}informations
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    height: 320,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
  },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  heroName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.white,
  },
  catSitterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  catSitterBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroLocation: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.primary,
  },
  pendingButton: {
    backgroundColor: COLORS.border,
  },
  pendingButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  servicesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  servicesTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  serviceLeft: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDetailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  serviceRight: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.primary,
  },
  petsScroll: {
    gap: 12,
    paddingTop: 8,
  },
  petCard: {
    width: 140,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  petImage: {
    width: '100%',
    height: 120,
  },
  petInfo: {
    padding: 12,
  },
  petName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  genderIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  privacyCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  privacyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
});
