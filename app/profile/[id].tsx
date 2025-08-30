import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import Button from '@/components/Button';
import PetCard from '@/components/PetCard';
import { useAuth } from '@/hooks/auth-store';
import { useMessaging } from '@/hooks/messaging-store';
import type { Gender, Pet, User } from '@/types';
import { MapPin, MessageSquare, Phone, Shield, UserCheck, UserPlus } from 'lucide-react-native';
import { db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
      isProfessional: raw?.isProfessional ? Boolean(raw.isProfessional) : undefined,
      professionalData: raw?.professionalData,
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
  const { areFriends, hasPendingRequest, sendFriendRequest } = useMessaging();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const canSeePhone = useMemo(() => (profileUser ? areFriends(profileUser.id) : false), [profileUser, areFriends]);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      if (user?.id === id) {
        router.replace('/profile');
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
    } catch (e) {
      console.error('Failed to load profile', e);
      Alert.alert('Erreur', 'Impossible de charger le profil.');
    } finally {
      setLoading(false);
    }
  }, [id, user, router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSendMessage = useCallback(() => {
    if (profileUser) {
      router.push(`/messages/new?userId=${profileUser.id}`);
    }
  }, [profileUser, router]);

  const handleAddFriend = useCallback(async () => {
    if (!profileUser) return;
    try {
      setLoading(true);
      await sendFriendRequest.mutateAsync(profileUser.id);
      Alert.alert('Succès', 'Demande d’ami envoyée');
    } catch (error) {
      Alert.alert('Erreur', "Échec de l'envoi de la demande");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [profileUser, sendFriendRequest]);

  if (loading) {
    return (
      <View style={styles.loadingContainer} testID="profile-loading">
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  if (!profileUser) {
    return (
      <View style={styles.loadingContainer} testID="profile-empty">
        <Text>Profil introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="user-profile-screen">
      <StatusBar style="dark" />
      <Stack.Screen options={{ title: `@${profileUser.pseudo}` }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.header}>
            <View style={styles.profileInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.name}>@{profileUser.pseudo}</Text>
                {profileUser.isCatSitter && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>Cat Sitter</Text>
                  </View>
                )}
              </View>

              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <MapPin size={16} color={COLORS.darkGray} />
                  <Text style={styles.detailText}>{profileUser.city}</Text>
                </View>

                {canSeePhone && (
                  <View style={styles.detailItem}>
                    <Phone size={16} color={COLORS.darkGray} />
                    <Text style={styles.detailText}>
                      {profileUser.countryCode} {profileUser.phoneNumber}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionSection}>
          <View style={styles.actionButtons}>
            {canSeePhone ? (
              <Button
                title="Message"
                onPress={handleSendMessage}
                icon={<MessageSquare size={20} color={COLORS.white} />}
                style={styles.actionButton}
                testID="btn-message"
              />
            ) : hasPendingRequest(profileUser.id) ? (
              <Button
                title="En attente"
                onPress={() => {}}
                disabled
                icon={<UserCheck size={20} color={COLORS.white} />}
                style={styles.actionButton}
                testID="btn-request-pending"
              />
            ) : (
              <Button
                title="Ajouter en ami"
                onPress={handleAddFriend}
                icon={<UserPlus size={20} color={COLORS.white} />}
                style={styles.actionButton}
                testID="btn-add-friend"
              />
            )}
          </View>
        </View>

        {profileUser.isCatSitter && (
          <View style={styles.membershipSection}>
            <View style={[styles.membershipCard, SHADOWS.medium]}>
              <View style={styles.membershipInfo}>
                <Shield size={24} color={COLORS.maleAccent} />
                <View>
                  <Text style={styles.membershipTitle}>Cat Sitter vérifié</Text>
                  <Text style={styles.membershipSubtitle}>Profil vérifié sur la plateforme</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.petsSection}>
          <Text style={styles.sectionTitle}>Animaux de @{profileUser.pseudo}</Text>
          <FlatList
            data={profileUser.pets}
            renderItem={({ item }) => <PetCard pet={item} style={styles.petCard} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petsContainer}
          />
        </View>

        {!canSeePhone && (
          <View style={styles.privacySection}>
            <View style={[styles.privacyCard, SHADOWS.small]}>
              <Text style={styles.privacyTitle}>Ajoutez @{profileUser.pseudo} comme ami pour voir plus</Text>
              <Text style={styles.privacyText}>Certaines infos ne sont visibles qu’aux amis</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 8,
    color: COLORS.darkGray,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileInfo: { flex: 1 },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginRight: 8,
  },
  badgeContainer: {
    backgroundColor: COLORS.maleAccent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500' as const,
  },
  detailsContainer: { gap: 4 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 14, color: COLORS.darkGray },
  actionSection: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 8,
  },
  actionButtons: {},
  actionButton: { width: '100%' },
  membershipSection: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 8,
  },
  membershipCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  membershipInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  membershipTitle: { fontSize: 16, fontWeight: '600' as const, color: COLORS.black, marginBottom: 2 },
  membershipSubtitle: { fontSize: 12, color: COLORS.darkGray },
  petsSection: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600' as const, color: COLORS.black, marginBottom: 16 },
  petsContainer: { paddingRight: 16, gap: 12 },
  petCard: { marginRight: 12 },
  privacySection: { backgroundColor: '#F3E5F5', paddingHorizontal: 16, paddingVertical: 20 },
  privacyCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, alignItems: 'center' },
  privacyTitle: { fontSize: 16, fontWeight: '600' as const, color: COLORS.black, marginBottom: 4, textAlign: 'center' },
  privacyText: { fontSize: 14, color: COLORS.darkGray, textAlign: 'center' },
});