import React, { useMemo } from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/services/firebase';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { User, Pet } from '@/types';
import UserCard from '@/components/UserCard';
import { COLORS, DIMENSIONS } from '@/constants/colors';
import { RefreshCw } from 'lucide-react-native';

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
  };
  return user;
}

export default function FirestoreUsersScreen() {
  console.log('[Users] render');

  const usersQuery = useQuery({
    queryKey: ['firestore-users', 'active-complete'],
    queryFn: async () => {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('isActive', '==', true), where('profileComplete', '==', true), limit(200));
      const snap = await getDocs(q);
      return snap.docs.map(d => toUser(d.data(), d.id));
    },
  });

  const content = useMemo(() => {
    if (usersQuery.isLoading) {
      return <ActivityIndicator testID="loading-users" />;
    }
    if (usersQuery.error) {
      return (
        <View style={styles.errorBox} testID="error-users">
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorText}>{(usersQuery.error as any)?.message ?? 'Chargement échoué'}</Text>
          <TouchableOpacity onPress={() => usersQuery.refetch()} style={styles.retryBtn} testID="retry-users">
            <RefreshCw size={16} color={COLORS.white} />
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    const list = usersQuery.data ?? [];
    if (list.length === 0) {
      return <Text style={styles.emptyText} testID="empty-users">Aucun utilisateur actif trouvé</Text>;
    }
    return (
      <View>
        {list.map(u => (
          <UserCard key={u.id} user={u} style={{ marginBottom: 10 }} showActions={false} />
        ))}
      </View>
    );
  }, [usersQuery.data, usersQuery.error, usersQuery.isLoading]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="users-screen">
      <Stack.Screen options={{ title: 'Utilisateurs (Firestore)' }} />
      <View>
        {content}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.screenBackground },
  content: { padding: DIMENSIONS.SPACING.lg },
  errorBox: { backgroundColor: '#fff5f5', borderColor: '#ffd6d6', borderWidth: 1, padding: 12, borderRadius: 12 },
  errorTitle: { color: COLORS.error, fontWeight: '700' as const },
  errorText: { color: COLORS.error, marginTop: 4 },
  retryBtn: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  retryText: { color: COLORS.white, marginLeft: 6, fontWeight: '700' as const, fontSize: DIMENSIONS.FONT_SIZES.xs },
  emptyText: { color: COLORS.darkGray, fontSize: DIMENSIONS.FONT_SIZES.sm },
});