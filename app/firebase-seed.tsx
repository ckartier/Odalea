import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { collection, doc, setDoc, addDoc, updateDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLORS } from '@/constants/colors';
import type { User, Message } from '@/types';

type DemoPet = { id: string; name: string; species: string; breed: string; gender: 'male' | 'female'; age: number; color: string; personality: string[]; mainPhoto?: string; galleryPhotos?: string[] };
interface DemoUser { id: string; firstName: string; lastName: string; pseudonym?: string; email?: string; phone: string; address: string; zipCode: string; city: string; isPremium?: boolean; pets: DemoPet[]; location?: { latitude: number; longitude: number } }

function rand(seed: number) { let x = Math.sin(seed) * 10000; return x - Math.floor(x); }
function jitter(base: number, delta: number, seed: number) { return base + (rand(seed) - 0.5) * delta; }

const CITY_COORDS: Record<string, { lat: number; lng: number }> = { Paris: { lat: 48.8566, lng: 2.3522 }, Lyon: { lat: 45.764, lng: 4.8357 }, Marseille: { lat: 43.2965, lng: 5.3698 } };

function makePet(ownerId: string, index: number): DemoPet {
  const genders = ['male', 'female'] as const;
  const species = ['cat', 'dog', 'rabbit', 'bird'];
  const breeds = { cat: ['Européen', 'Siamois', 'Maine Coon'], dog: ['Labrador', 'Beagle', 'Corgi'], rabbit: ['Nain', 'Bélier'], bird: ['Perruche', 'Canari'] } as const;
  const sp = species[index % species.length] as keyof typeof breeds;
  const gallery = getSpeciesImageUrls(sp).gallery;
  return {
    id: `${ownerId}-pet-${index}`,
    name: sp === 'cat' ? 'Luna' : sp === 'dog' ? 'Milo' : 'Nina',
    species: sp,
    breed: breeds[sp][index % breeds[sp].length],
    gender: genders[index % 2],
    age: 1 + (index % 10),
    color: ['noir', 'blanc', 'roux'][index % 3],
    personality: ['doux', 'joueur', 'curieux'].slice(0, 2),
    mainPhoto: getSpeciesImageUrls(sp).main,
    galleryPhotos: gallery,
  };
}

function makeUsersForCity(city: keyof typeof CITY_COORDS, count: number, seedBase: number): DemoUser[] {
  const arr: DemoUser[] = [];
  const base = CITY_COORDS[city];
  for (let i = 0; i < count; i++) {
    const id = `${city.toLowerCase()}-${i + 1}`;
    const lat = jitter(base.lat, 0.02, seedBase + i);
    const lng = jitter(base.lng, 0.02, seedBase + i * 7);
    const firstNames = ['Alex', 'Camille', 'Marie', 'Hugo', 'Lea', 'Paul', 'Zoe', 'Noah', 'Eva', 'Louis'];
    const lastNames = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Richard', 'Durand', 'Moreau', 'Simon'];
    const fn = firstNames[(i + seedBase) % firstNames.length];
    const ln = lastNames[(i * 3 + seedBase) % lastNames.length];
    const pseudo = `${fn}${ln}`.toLowerCase();
    const email = `${pseudo}@example.com`;
    const user: DemoUser = {
      id,
      firstName: fn,
      lastName: ln,
      pseudonym: pseudo,
      email,
      phone: '+3360000000' + ((i + seedBase) % 10).toString(),
      address: `${10 + i} Rue de Demo`,
      zipCode: city === 'Paris' ? '75001' : city === 'Lyon' ? '69001' : '13001',
      city,
      isPremium: i % 2 === 0,
      pets: [makePet(id, i)],
      location: { latitude: lat, longitude: lng },
    };
    arr.push(user);
  }
  return arr;
}

interface SeedResultItem {
  id: string;
  type: 'user' | 'petSitterProfile' | 'conversation' | 'message' | 'friendRequest' | 'booking' | 'validation';
  status: 'success' | 'error';
  message: string;
}

interface CreatedEntities {
  users: string[];
  sitters: string[];
  conversations: string[];
  bookings: string[];
}

type SpeciesKey = 'cat' | 'dog' | 'rabbit' | 'hamster' | 'bird' | 'other';
const SPECIES_IMAGES: Record<SpeciesKey, { main: string; gallery: string[] }> = {
  cat: {
    main: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=500&h=500&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=400&h=400&fit=crop',
    ],
  },
  dog: {
    main: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&h=500&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1583336663277-620dc1996580?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop',
    ],
  },
  rabbit: {
    main: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=500&h=500&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1548767797-d8d7e8d2e9b0?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?w=400&h=400&fit=crop',
    ],
  },
  hamster: {
    main: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=500&h=500&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1595436252086-03a4ed3f6421?w=400&h=400&fit=crop'],
  },
  bird: {
    main: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=500&h=500&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&h=400&fit=crop'],
  },
  other: {
    main: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=500&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&h=400&fit=crop'],
  },
};

function getSpeciesImageUrls(species: string) {
  const key = (species?.toLowerCase() as SpeciesKey) || 'other';
  return SPECIES_IMAGES[key] ?? SPECIES_IMAGES.other;
}

export default function FirebaseSeedScreen() {
  const router = useRouter();
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [results, setResults] = useState<SeedResultItem[]>([]);
  const [created, setCreated] = useState<CreatedEntities>({ users: [], sitters: [], conversations: [], bookings: [] });

  const demoUsers = useMemo(
    () => [...makeUsersForCity('Paris', 5, 11), ...makeUsersForCity('Lyon', 5, 23), ...makeUsersForCity('Marseille', 5, 37)],
    []
  );

  const parisUsers = useMemo(() => demoUsers.filter((u) => u.city === 'Paris'), [demoUsers]);
  const sitterCandidates = useMemo(() => parisUsers.slice(0, 2), [parisUsers]);

  const mapDemoToUser = useCallback((demo: DemoUser, overrides?: Partial<User>): User => {
    const name = `${demo.firstName} ${demo.lastName}`.trim();
    const pseudo = demo.pseudonym || demo.firstName.toLowerCase() + demo.lastName.toLowerCase();
    const email = demo.email || `${pseudo}@example.com`;
    const userMainPhoto = demo.pets && demo.pets[0]?.mainPhoto ? demo.pets[0]?.mainPhoto : getSpeciesImageUrls(demo.pets?.[0]?.species ?? 'cat').main;

    return {
      id: demo.id,
      firstName: demo.firstName,
      lastName: demo.lastName,
      name,
      pseudo,
      pseudoLower: pseudo.toLowerCase(),
      photo: userMainPhoto,
      email,
      emailLower: email.toLowerCase(),
      phoneNumber: demo.phone,
      countryCode: '+33',
      address: demo.address,
      zipCode: demo.zipCode,
      city: demo.city,
      isCatSitter: overrides?.isCatSitter ?? false,
      referralCode: undefined,
      isPremium: overrides?.isPremium ?? demo.isPremium ?? false,
      createdAt: Date.now(),
      pets: (demo.pets || []).map((p) => {
        const fallback = getSpeciesImageUrls(p.species);
        const main = p.mainPhoto ?? fallback.main;
        const gallery = (p.galleryPhotos && p.galleryPhotos.length > 0 ? p.galleryPhotos : fallback.gallery).slice(0, 3);
        return {
          id: p.id,
          ownerId: demo.id,
          name: p.name,
          type: p.species,
          breed: p.breed,
          gender: p.gender,
          dateOfBirth: new Date(Date.now() - p.age * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          color: p.color,
          character: p.personality,
          distinctiveSign: undefined,
          vaccinationDates: [],
          microchipNumber: undefined,
          mainPhoto: main,
          galleryPhotos: gallery,
          vet: undefined,
          walkTimes: [],
          isPrimary: true,
          location: demo.location ? { latitude: demo.location.latitude, longitude: demo.location.longitude } : undefined,
        };
      }),
      animalType: undefined,
      animalName: undefined,
      isProfessional: overrides?.isProfessional ?? false,
      professionalData: overrides?.professionalData,
      isActive: true,
      profileComplete: true,
    } satisfies User;
  }, []);

  const ensurePetPhotos = useCallback(
    async (cities: string[]) => {
      try {
        if (!db) return;
        const usersCol = collection(db, 'users');
        for (const city of cities) {
          const usersSnap = await getDocs(query(usersCol, where('city', '==', city)));
          for (const d of usersSnap.docs) {
            const u = d.data() as User;
            const pets = (u.pets ?? []).map((p) => {
              const fallback = getSpeciesImageUrls(p.type ?? 'cat');
              const main = p.mainPhoto ?? fallback.main;
              const gallery = (p.galleryPhotos && p.galleryPhotos.length > 0 ? p.galleryPhotos : fallback.gallery).slice(0, 3);
              return { ...p, mainPhoto: main, galleryPhotos: gallery };
            });
            await updateDoc(doc(usersCol, d.id), { pets });
            setResults((prev) => [
              ...prev,
              { id: d.id, type: 'validation', status: 'success', message: `Photos animaux mises à jour • ${city}` },
            ]);
          }
        }
      } catch (e) {
        setResults((prev) => [
          ...prev,
          { id: 'ensure-pet-photos', type: 'validation', status: 'error', message: (e as Error)?.message ?? 'Unknown error' },
        ]);
      }
    },
    []
  );

  const validate = useCallback(async (cities: string[]) => {
    try {
      if (!db) return;
      const usersCol = collection(db, 'users');
      const sittersCol = collection(db, 'petSitterProfiles');
      const conversationsCol = collection(db, 'conversations');
      const messagesCol = collection(db, 'messages');
      const bookingsCol = collection(db, 'bookings');

      let totalUsers = 0;
      let totalSitters = 0;
      for (const city of cities) {
        const usersSnap = await getDocs(query(usersCol, where('city', '==', city)));
        const sittersSnap = await getDocs(query(sittersCol, where('city', '==', city)));
        totalUsers += usersSnap.size;
        totalSitters += sittersSnap.size;
        setResults((prev) => [
          ...prev,
          { id: `users-${city}`, type: 'validation', status: 'success', message: `Utilisateurs à ${city}: ${usersSnap.size}` },
        ]);
        setResults((prev) => [
          ...prev,
          { id: `sitters-${city}`, type: 'validation', status: 'success', message: `Cat sitters à ${city}: ${sittersSnap.size}` },
        ]);
      }

      const convSnap = await getDocs(conversationsCol);
      const msgSnap = await getDocs(messagesCol);
      const bookSnap = await getDocs(bookingsCol);

      setResults((prev) => [
        ...prev,
        { id: 'summary-users', type: 'validation', status: 'success', message: `Total utilisateurs: ${totalUsers}` },
      ]);
      setResults((prev) => [
        ...prev,
        { id: 'summary-sitters', type: 'validation', status: 'success', message: `Total cat sitters: ${totalSitters}` },
      ]);
      setResults((prev) => [
        ...prev,
        { id: 'summary-conv', type: 'validation', status: 'success', message: `Conversations: ${convSnap.size}` },
      ]);
      setResults((prev) => [
        ...prev,
        { id: 'summary-msg', type: 'validation', status: 'success', message: `Messages: ${msgSnap.size}` },
      ]);
      setResults((prev) => [
        ...prev,
        { id: 'summary-book', type: 'validation', status: 'success', message: `Bookings: ${bookSnap.size}` },
      ]);
    } catch (e) {
      setResults((prev) => [
        ...prev,
        { id: 'validation', type: 'validation', status: 'error', message: (e as Error)?.message ?? 'Unknown error' },
      ]);
    }
  }, []);

  const seed = useCallback(async () => {
    if (!db) return;
    setIsSeeding(true);
    setResults([]);
    setCreated({ users: [], sitters: [], conversations: [], bookings: [] });

    try {
      const usersCol = collection(db, 'users');
      const sittersCol = collection(db, 'petSitterProfiles');
      const conversationsCol = collection(db, 'conversations');
      const messagesCol = collection(db, 'messages');
      const friendReqCol = collection(db, 'friendRequests');
      const bookingsCol = collection(db, 'bookings');

      const createdUsers: string[] = [];
      const createdSitters: string[] = [];
      const createdConvs: string[] = [];
      const createdBookings: string[] = [];

      // Seed ALL users: strict distribution 5 per city (Paris/Lyon/Marseille)
      for (const demo of demoUsers) {
        const user = mapDemoToUser(demo, { isCatSitter: false });
        try {
          console.log('Seeding user', user.id, user.city, user.pseudoLower);
          await setDoc(
            doc(usersCol, user.id),
            {
              ...user,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
          createdUsers.push(user.id);
          setResults((prev) => [...prev, { id: user.id, type: 'user', status: 'success', message: `Utilisateur sauvegardé (${user.city})` }]);
        } catch (e) {
          console.error('Error seeding user', user.id, e);
          setResults((prev) => [
            ...prev,
            { id: user.id, type: 'user', status: 'error', message: (e as Error)?.message ?? 'Unknown error' },
          ]);
        }
      }

      // Force exactly 2 cat sitters in Paris
      for (const demo of sitterCandidates) {
        const user = mapDemoToUser(demo, { isPremium: true, isCatSitter: true });
        try {
          console.log('Upgrading to cat sitter (Paris)', user.id, user.pseudoLower);
          await setDoc(
            doc(usersCol, user.id),
            { ...user, isCatSitter: true, isPremium: true, updatedAt: serverTimestamp() },
            { merge: true }
          );
          if (!createdUsers.includes(user.id)) createdUsers.push(user.id);
          createdSitters.push(user.id);
          setResults((prev) => [
            ...prev,
            { id: user.id, type: 'user', status: 'success', message: 'Cat sitter (Paris) sauvegardé' },
          ]);
        } catch (e) {
          console.error('Error seeding cat sitter user', user.id, e);
          setResults((prev) => [
            ...prev,
            { id: user.id, type: 'user', status: 'error', message: (e as Error)?.message ?? 'Unknown error' },
          ]);
        }

        try {
          const profile = {
            userId: user.id,
            displayName: user.pseudo,
            bio: "Cat sitter expérimenté(e) à Paris. Garde à domicile et visites quotidiennes.",
            services: [
              { id: 'visit', name: 'Visite à domicile', price: 15, currency: 'EUR', durationMins: 30 },
              { id: 'night', name: 'Nuit à domicile', price: 35, currency: 'EUR', durationMins: 480 },
            ],
            photos: user.pets?.map((p) => p.mainPhoto).filter(Boolean) ?? [],
            rating: 4.8,
            reviewsCount: 12,
            city: 'Paris',
            zipCode: user.zipCode,
            location: user.pets?.[0]?.location ?? undefined,
            availability: {
              mon: ['09:00-12:00', '14:00-18:00'],
              tue: ['09:00-12:00', '14:00-18:00'],
              wed: ['09:00-12:00', '14:00-18:00'],
              thu: ['09:00-12:00', '14:00-18:00'],
              fri: ['09:00-12:00', '14:00-18:00'],
              sat: ['10:00-16:00'],
              sun: [],
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isVerified: true,
          } as const;

          console.log('Seeding petSitter profile', user.id);
          await setDoc(doc(sittersCol, user.id), profile, { merge: true });
          setResults((prev) => [
            ...prev,
            { id: user.id, type: 'petSitterProfile', status: 'success', message: 'Profil cat sitter (Paris) sauvegardé' },
          ]);
        } catch (e) {
          console.error('Error seeding petSitter profile', user.id, e);
          setResults((prev) => [
            ...prev,
            { id: user.id, type: 'petSitterProfile', status: 'error', message: (e as Error)?.message ?? 'Unknown error' },
          ]);
        }
      }

      // Create a sample conversation and booking between a non-sitter and a sitter
      const premiumUserId = createdUsers.find((id) => !createdSitters.includes(id));
      const sitterUserId = createdSitters[0];

      if (premiumUserId && sitterUserId) {
        try {
          const fr1 = await addDoc(friendReqCol, {
            senderId: premiumUserId,
            receiverId: sitterUserId,
            status: 'pending',
            timestamp: serverTimestamp(),
          });
          setResults((prev) => [
            ...prev,
            { id: fr1.id, type: 'friendRequest', status: 'success', message: 'Friend request created (pending)' },
          ]);
        } catch (e) {
          setResults((prev) => [
            ...prev,
            { id: 'friend-ops', type: 'friendRequest', status: 'error', message: (e as Error)?.message ?? 'Unknown error' },
          ]);
        }

        try {
          const convRef = await addDoc(conversationsCol, {
            participants: [premiumUserId, sitterUserId],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            unreadCount: { [premiumUserId]: 0, [sitterUserId]: 1 },
          });
          createdConvs.push(convRef.id);
          setResults((prev) => [
            ...prev,
            { id: convRef.id, type: 'conversation', status: 'success', message: 'Conversation created' },
          ]);

          const msgs: Omit<Message, 'id'>[] = [
            { senderId: premiumUserId, receiverId: sitterUserId, content: 'Bonjour! Êtes-vous dispo pour une visite demain matin ?', timestamp: Date.now(), read: false },
            { senderId: sitterUserId, receiverId: premiumUserId, content: 'Bonjour! Oui, 10h convient. Votre chat a-t-il des besoins particuliers ?', timestamp: Date.now() + 1, read: false },
          ];

          let lastMessageId = '';
          for (const m of msgs) {
            const mRef = await addDoc(messagesCol, {
              ...m,
              conversationId: convRef.id,
              timestamp: serverTimestamp(),
            });
            lastMessageId = mRef.id;
            setResults((prev) => [...prev, { id: mRef.id, type: 'message', status: 'success', message: 'Message ajouté' }]);
          }

          await updateDoc(doc(conversationsCol, convRef.id), {
            lastMessage: {
              id: lastMessageId,
              senderId: msgs[msgs.length - 1].senderId,
              receiverId: msgs[msgs.length - 1].receiverId,
              content: msgs[msgs.length - 1].content,
              timestamp: Date.now(),
              read: false,
            },
            updatedAt: serverTimestamp(),
          });
        } catch (e) {
          setResults((prev) => [
            ...prev,
            { id: 'conv-ops', type: 'conversation', status: 'error', message: (e as Error)?.message ?? 'Unknown error' },
          ]);
        }

        try {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const bookingRef = await addDoc(bookingsCol, {
            catSitterId: sitterUserId,
            clientId: premiumUserId,
            petIds: [],
            date: tomorrow.toISOString().split('T')[0],
            timeSlot: 'morning',
            duration: 2,
            totalPrice: 30,
            message: 'Luna est timide, merci de la rassurer.',
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          createdBookings.push(bookingRef.id);
          setResults((prev) => [
            ...prev,
            { id: bookingRef.id, type: 'booking', status: 'success', message: 'Booking de démo créé' },
          ]);
        } catch (e) {
          setResults((prev) => [
            ...prev,
            { id: 'booking-ops', type: 'booking', status: 'error', message: (e as Error)?.message ?? 'Unknown error' },
          ]);
        }
      }

      setCreated({ users: createdUsers, sitters: [...createdSitters], conversations: createdConvs, bookings: createdBookings });

      await ensurePetPhotos(['Paris', 'Lyon', 'Marseille']);
      await validate(['Paris', 'Lyon', 'Marseille']);
    } catch (e) {
      console.error('Seed fatal error', e);
      setResults((prev) => [
        ...prev,
        { id: 'seed', type: 'user', status: 'error', message: (e as Error)?.message ?? 'Unknown error' },
      ]);
    } finally {
      setIsSeeding(false);
    }
  }, [demoUsers, sitterCandidates, mapDemoToUser, validate, ensurePetPhotos]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="firebase-seed-screen">
      <Stack.Screen options={{ title: 'Firestore Seed' }} />
      <Text style={styles.title}>Seeder Firestore: Distribution stricte + Cat Sitters Paris</Text>
      <Text style={styles.subtitle}>Crée 5 utilisateurs par ville (Paris/Lyon/Marseille) et 2 cat sitters à Paris. Assure des photos animaux valides.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aperçu</Text>
        <Text style={styles.item}>Utilisateurs: 15 (5 x 3 villes)</Text>
        <Text style={styles.item}>Cat sitters: 2 (Paris uniquement)</Text>
        <Text style={styles.item}>Villes: Paris (5), Lyon (5), Marseille (5)</Text>
        <Text style={styles.hint}>Environnement: {Platform.OS}</Text>
      </View>

      <TouchableOpacity testID="seed-action" style={[styles.primaryBtn, isSeeding && styles.disabledBtn]} disabled={isSeeding} onPress={seed}>
        {isSeeding ? (
          <>
            <ActivityIndicator color={COLORS.white} />
            <Text style={styles.primaryBtnText}> Import en cours...</Text>
          </>
        ) : (
          <Text style={styles.primaryBtnText}>Créer les données de test</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        testID="fix-photos-action"
        style={[styles.secondaryBtn, isSeeding && styles.disabledBtn]}
        disabled={isSeeding}
        onPress={() => ensurePetPhotos(['Paris', 'Lyon', 'Marseille'])}
      >
        {isSeeding ? (
          <>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.secondaryBtnText}> Traitement...</Text>
          </>
        ) : (
          <Text style={styles.secondaryBtnText}>Ajouter/compléter les photos animaux (Paris/Lyon/Marseille)</Text>
        )}
      </TouchableOpacity>

      <View style={styles.results} testID="seed-results">
        <Text style={styles.sectionTitle}>Résultats ({results.length})</Text>
        {results.map((r, i) => (
          <View key={`${r.type}-${r.id}-${i}`} style={[styles.resultItem, r.status === 'success' ? styles.ok : styles.err]} testID={`result-${i}`}>
            <Text style={styles.resultText}>{r.status.toUpperCase()} • {r.type} • {r.id}</Text>
            <Text style={styles.resultDetail}>{r.message}</Text>
          </View>
        ))}
        {!results.length && <Text style={styles.hint}>Aucun résultat pour l’instant.</Text>}
      </View>

      {created.users.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liens de test rapide</Text>
          {created.sitters[0] && (
            <TouchableOpacity testID="link-book-sitter" style={styles.linkBtn} onPress={() => router.push(`/booking/${created.sitters[0]}`)}>
              <Text style={styles.linkText}>Ouvrir Booking du Cat-sitter</Text>
            </TouchableOpacity>
          )}
          {created.conversations[0] && (
            <TouchableOpacity testID="link-open-chat" style={styles.linkBtn} onPress={() => router.push(`/messages/${created.conversations[0]}`)}>
              <Text style={styles.linkText}>Ouvrir le Chat de démo</Text>
            </TouchableOpacity>
          )}
          {created.users[0] && (
            <TouchableOpacity testID="link-open-profile" style={styles.linkBtn} onPress={() => router.push(`/profile/${created.users[0]}`)}>
              <Text style={styles.linkText}>Voir le profil du premier utilisateur</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.black },
  subtitle: { fontSize: 14, color: COLORS.gray },
  section: { backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 6 },
  item: { fontSize: 14, color: COLORS.darkGray, lineHeight: 18 },
  hint: { fontSize: 12, color: COLORS.gray, marginTop: 6 },
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  results: { backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12 },
  secondaryBtn: { backgroundColor: COLORS.white, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.mediumGray, alignItems: 'center' },
  secondaryBtnText: { color: COLORS.black, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  linkBtn: { backgroundColor: COLORS.white, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, marginTop: 8, borderWidth: 1, borderColor: COLORS.mediumGray, alignItems: 'center' },
  linkText: { color: COLORS.black, fontSize: 14, fontWeight: '600' },
  resultItem: { backgroundColor: COLORS.white, borderLeftWidth: 4, padding: 10, borderRadius: 8, marginBottom: 8 },
  ok: { borderLeftColor: '#22C55E' },
  err: { borderLeftColor: '#EF4444' },
  resultText: { fontSize: 13, fontWeight: '700', color: COLORS.black },
  resultDetail: { fontSize: 12, color: COLORS.darkGray },
});
