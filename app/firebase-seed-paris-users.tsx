import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { ArrowLeft, Users, Check } from 'lucide-react-native';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { postService, petSitterService } from '@/services/database';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PARIS_USERS = [
  {
    id: 'paris_user_1',
    firstName: 'Sophie',
    lastName: 'Martin',
    pseudo: 'sophie_paris',
    email: 'sophie.martin@example.com',
    phoneNumber: '+33612345678',
    countryCode: 'FR',
    address: '15 Rue de Rivoli',
    zipCode: '75001',
    city: 'Paris',
    location: { latitude: 48.8566, longitude: 2.3522 },
    isCatSitter: true,
    catSitterRadiusKm: 5,
    isPremium: false,
    isProfessional: false,
    isActive: true,
    profileComplete: true,
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    pet: {
      name: 'Minou',
      type: 'chat',
      breed: 'Européen',
      gender: 'female' as const,
      dateOfBirth: '2020-03-15',
      color: 'tigre',
      character: ['calin', 'joueur'],
      distinctiveSign: 'Tache blanche sur le nez',
      mainPhoto: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400',
      galleryPhotos: ['https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400'],
    }
  },
  {
    id: 'paris_user_2',
    firstName: 'Thomas',
    lastName: 'Dubois',
    pseudo: 'thomas_paris',
    email: 'thomas.dubois@example.com',
    phoneNumber: '+33623456789',
    countryCode: 'FR',
    address: '28 Avenue des Champs-Élysées',
    zipCode: '75008',
    city: 'Paris',
    location: { latitude: 48.8698, longitude: 2.3078 },
    isCatSitter: false,
    isPremium: true,
    isProfessional: false,
    isActive: true,
    profileComplete: true,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    pet: {
      name: 'Felix',
      type: 'chat',
      breed: 'Maine Coon',
      gender: 'male' as const,
      dateOfBirth: '2019-07-22',
      color: 'roux',
      character: ['calme', 'independant'],
      distinctiveSign: 'Très grand, poils longs',
      mainPhoto: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=400',
      galleryPhotos: ['https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=400'],
    }
  },
  {
    id: 'paris_user_3',
    firstName: 'Emma',
    lastName: 'Bernard',
    pseudo: 'emma_paris',
    email: 'emma.bernard@example.com',
    phoneNumber: '+33634567890',
    countryCode: 'FR',
    address: '42 Rue de la Paix',
    zipCode: '75002',
    city: 'Paris',
    location: { latitude: 48.8692, longitude: 2.3316 },
    isCatSitter: true,
    catSitterRadiusKm: 3,
    isPremium: false,
    isProfessional: false,
    isActive: true,
    profileComplete: true,
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    pet: {
      name: 'Luna',
      type: 'chat',
      breed: 'Siamois',
      gender: 'female' as const,
      dateOfBirth: '2021-01-10',
      color: 'creme',
      character: ['sociable', 'curieux'],
      distinctiveSign: 'Yeux bleus intenses',
      mainPhoto: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?w=400',
      galleryPhotos: ['https://images.unsplash.com/photo-1513245543132-31f507417b26?w=400'],
    }
  },
  {
    id: 'paris_user_4',
    firstName: 'Lucas',
    lastName: 'Petit',
    pseudo: 'lucas_paris',
    email: 'lucas.petit@example.com',
    phoneNumber: '+33645678901',
    countryCode: 'FR',
    address: '8 Boulevard Saint-Germain',
    zipCode: '75005',
    city: 'Paris',
    location: { latitude: 48.8499, longitude: 2.3469 },
    isCatSitter: false,
    isPremium: false,
    isProfessional: false,
    isActive: true,
    profileComplete: true,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    pet: {
      name: 'Simba',
      type: 'chat',
      breed: 'Persan',
      gender: 'male' as const,
      dateOfBirth: '2020-09-05',
      color: 'blanc',
      character: ['calin', 'calme'],
      distinctiveSign: 'Poils très longs et blancs',
      mainPhoto: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400',
      galleryPhotos: ['https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400'],
    }
  },
  {
    id: 'paris_user_5',
    firstName: 'Léa',
    lastName: 'Moreau',
    pseudo: 'lea_paris',
    email: 'lea.moreau@example.com',
    phoneNumber: '+33656789012',
    countryCode: 'FR',
    address: '33 Rue du Faubourg Saint-Antoine',
    zipCode: '75011',
    city: 'Paris',
    location: { latitude: 48.8534, longitude: 2.3723 },
    isCatSitter: true,
    catSitterRadiusKm: 7,
    isPremium: true,
    isProfessional: false,
    isActive: true,
    profileComplete: true,
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    pet: {
      name: 'Nala',
      type: 'chat',
      breed: 'Bengal',
      gender: 'female' as const,
      dateOfBirth: '2021-05-18',
      color: 'tigre',
      character: ['energetique', 'joueur', 'aventurier'],
      distinctiveSign: 'Motifs léopard très marqués',
      mainPhoto: 'https://images.unsplash.com/photo-1583795128727-6ec3642408f8?w=400',
      galleryPhotos: ['https://images.unsplash.com/photo-1583795128727-6ec3642408f8?w=400'],
    }
  }
];

export default function FirebaseSeedParisUsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp, updateUser, addPet } = useFirebaseUser();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [createdUsers, setCreatedUsers] = useState<string[]>([]);

  const createUsers = async () => {
    setLoading(true);
    setProgress('Démarrage de la création des utilisateurs...');
    const userIds: string[] = [];

    try {
      for (let i = 0; i < PARIS_USERS.length; i++) {
        const userData = PARIS_USERS[i];
        setProgress(`Création de l'utilisateur ${i + 1}/${PARIS_USERS.length}: ${userData.firstName} ${userData.lastName}...`);

        try {
          // Create user account
          const result = await signUp({
            email: userData.email,
            password: 'Test123456!',
            firstName: userData.firstName,
            lastName: userData.lastName,
            phoneNumber: userData.phoneNumber,
            countryCode: userData.countryCode,
          });

          if (!result.success || !result.user) {
            console.error(`Failed to create user ${userData.email}`);
            continue;
          }

          const userId = result.user.uid;
          userIds.push(userId);

          // Update user profile
          await updateUser({
            pseudo: userData.pseudo,
            pseudoLower: userData.pseudo.toLowerCase(),
            email: userData.email,
            emailLower: userData.email.toLowerCase(),
            phoneNumber: userData.phoneNumber,
            address: userData.address,
            zipCode: userData.zipCode,
            city: userData.city,
            countryCode: userData.countryCode,
            location: userData.location,
            isCatSitter: userData.isCatSitter,
            catSitterRadiusKm: userData.catSitterRadiusKm,
            photo: userData.photo,
            isPremium: userData.isPremium,
            isProfessional: userData.isProfessional,
            isActive: userData.isActive,
            profileComplete: userData.profileComplete,
          });

          // Create cat-sitter profile if needed
          if (userData.isCatSitter) {
            await petSitterService.saveProfile(userId, {
              isActive: true,
              hourlyRate: 15 + Math.floor(Math.random() * 10),
              description: `Passionné(e) par les animaux, je propose mes services de cat-sitting dans le ${userData.zipCode.substring(0, 2)}ème arrondissement de Paris.`,
              services: ['Pet Sitting', 'Visite à domicile', 'Promenade'],
              availability: {
                monday: { start: '08:00', end: '18:00', available: true },
                tuesday: { start: '08:00', end: '18:00', available: true },
                wednesday: { start: '08:00', end: '18:00', available: true },
                thursday: { start: '08:00', end: '18:00', available: true },
                friday: { start: '08:00', end: '18:00', available: true },
                saturday: { start: '09:00', end: '17:00', available: true },
                sunday: { start: '10:00', end: '16:00', available: false },
              },
              photos: [userData.photo],
              experience: `${2 + Math.floor(Math.random() * 3)} ans`,
              petTypes: ['Cats'],
              languages: ['French', 'English'],
              insurance: true,
              emergencyContact: true,
              responseTime: '< 2 hours',
              totalBookings: Math.floor(Math.random() * 20),
              rating: 4.5 + Math.random() * 0.5,
              reviewCount: Math.floor(Math.random() * 15),
              radiusKm: userData.catSitterRadiusKm || 5,
            });
          }

          // Add pet
          const petData = {
            name: userData.pet.name,
            type: userData.pet.type,
            breed: userData.pet.breed,
            gender: userData.pet.gender,
            dateOfBirth: userData.pet.dateOfBirth,
            color: userData.pet.color,
            character: userData.pet.character,
            distinctiveSign: userData.pet.distinctiveSign,
            vaccinationDates: [],
            mainPhoto: userData.pet.mainPhoto,
            galleryPhotos: userData.pet.galleryPhotos,
            isPrimary: true,
            location: userData.location,
          };

          await addPet(petData as any);

          // Create sample posts
          const postContents = [
            `Belle journée au parc avec ${userData.pet.name} ! 🐱☀️`,
            `${userData.pet.name} adore jouer avec sa nouvelle souris ! 🐭`,
            `Moment câlin avec mon adorable ${userData.pet.name} ❤️`,
            `${userData.pet.name} a découvert un nouveau coin dans l'appartement 😸`,
          ];

          const randomPost = postContents[Math.floor(Math.random() * postContents.length)];
          await postService.createPost({
            authorId: userId,
            authorName: `${userData.firstName} ${userData.lastName}`,
            authorPhoto: userData.photo,
            content: randomPost,
            images: [userData.pet.mainPhoto],
            type: 'photo',
            likesCount: 0,
            commentsCount: 0,
          });

          console.log(`✅ User created: ${userData.email} (ID: ${userId})`);
        } catch (error) {
          console.error(`Error creating user ${userData.email}:`, error);
        }
      }

      setCreatedUsers(userIds);
      setProgress(`✅ ${userIds.length} utilisateurs créés avec succès !`);

      // Display user IDs
      const userInfo = PARIS_USERS.map((user, index) => 
        `${index + 1}. ${user.firstName} ${user.lastName} (@${user.pseudo})\n   Email: ${user.email}\n   Mot de passe: Test123456!\n   ID: ${userIds[index] || 'N/A'}`
      ).join('\n\n');

      Alert.alert(
        'Utilisateurs créés !',
        `${userIds.length} utilisateurs ont été créés avec succès.\n\n${userInfo}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error in createUsers:', error);
      setProgress(`❌ Erreur: ${error}`);
      Alert.alert('Erreur', `Une erreur est survenue: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer Utilisateurs Paris</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.infoCard}>
          <Users size={48} color={COLORS.primary} />
          <Text style={styles.title}>Création de 5 utilisateurs test</Text>
          <Text style={styles.description}>
            Ce script va créer 5 utilisateurs réalistes basés à Paris avec leurs animaux et profils complets.
          </Text>
        </View>

        <View style={styles.usersPreview}>
          <Text style={styles.sectionTitle}>Utilisateurs à créer:</Text>
          {PARIS_USERS.map((user, index) => (
            <View key={index} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
                <Text style={styles.userDetail}>@{user.pseudo}</Text>
                <Text style={styles.userDetail}>{user.email}</Text>
                <Text style={styles.userDetail}>📍 {user.address}, {user.zipCode} {user.city}</Text>
                <Text style={styles.userDetail}>🐱 {user.pet.name} ({user.pet.breed})</Text>
                {user.isCatSitter && (
                  <Text style={styles.catSitterBadge}>Cat Sitter - Rayon {user.catSitterRadiusKm}km</Text>
                )}
                {user.isPremium && (
                  <Text style={styles.premiumBadge}>Premium</Text>
                )}
              </View>
              {createdUsers.length > index && (
                <Check size={24} color={COLORS.success} />
              )}
            </View>
          ))}
        </View>

        {progress !== '' && (
          <View style={styles.progressCard}>
            <Text style={styles.progressText}>{progress}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={createUsers}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Création en cours...' : 'Créer les utilisateurs'}
          </Text>
        </TouchableOpacity>

        <View style={styles.credentialsCard}>
          <Text style={styles.credentialsTitle}>Informations de connexion:</Text>
          <Text style={styles.credentialsText}>
            Tous les comptes utilisent le mot de passe: <Text style={styles.credentialsBold}>Test123456!</Text>
          </Text>
          <Text style={styles.credentialsText}>
            Vous pouvez vous connecter avec n&apos;importe quel email ci-dessus.
          </Text>
        </View>

        {createdUsers.length > 0 && (
          <View style={styles.idsCard}>
            <Text style={styles.idsTitle}>IDs des utilisateurs créés:</Text>
            {createdUsers.map((id, index) => (
              <View key={index} style={styles.idRow}>
                <Text style={styles.idLabel}>{PARIS_USERS[index].pseudo}:</Text>
                <Text style={styles.idValue}>{id}</Text>
              </View>
            ))}
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  usersPreview: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 12,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.neutral,
    borderRadius: 8,
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  userDetail: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  catSitterBadge: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600' as const,
    marginTop: 4,
  },
  premiumBadge: {
    fontSize: 11,
    color: COLORS.femaleAccent,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: COLORS.neutral,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.black,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  credentialsCard: {
    backgroundColor: COLORS.infoLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  credentialsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  credentialsText: {
    fontSize: 13,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  credentialsBold: {
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  idsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  idsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 12,
  },
  idRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  idLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.darkGray,
    width: 120,
  },
  idValue: {
    fontSize: 11,
    color: COLORS.black,
    flex: 1,
    fontFamily: 'monospace',
  },
});
