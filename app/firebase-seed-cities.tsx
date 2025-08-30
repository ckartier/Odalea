import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLORS } from '@/constants/colors';
import type { Gender, Pet, User } from '@/types';

interface SeedResultItem {
  id: string;
  type: 'user' | 'petSitterProfile';
  status: 'success' | 'error';
  message: string;
}

const CITY_COORDS = {
  Paris: [
    { zip: '75001', address: '10 Rue de Rivoli', latitude: 48.8558, longitude: 2.3603 },
    { zip: '75004', address: '12 Quai de l’Hôtel de ville', latitude: 48.8568, longitude: 2.3526 },
    { zip: '75011', address: '15 Boulevard Voltaire', latitude: 48.861, longitude: 2.3786 },
    { zip: '75015', address: '25 Rue Lecourbe', latitude: 48.8414, longitude: 2.2989 },
    { zip: '75018', address: '120 Boulevard de Clichy', latitude: 48.8841, longitude: 2.3331 },
    { zip: '75020', address: '3 Rue de Belleville', latitude: 48.8718, longitude: 2.3809 },
  ],
  Lyon: [
    { zip: '69001', address: '5 Place des Terreaux', latitude: 45.7679, longitude: 4.8343 },
    { zip: '69002', address: '18 Rue Mercière', latitude: 45.7634, longitude: 4.8322 },
    { zip: '69003', address: '102 Cours Lafayette', latitude: 45.7625, longitude: 4.8565 },
    { zip: '69006', address: '20 Boulevard des Belges', latitude: 45.7752, longitude: 4.8529 },
    { zip: '69007', address: '60 Avenue Jean Jaurès', latitude: 45.7485, longitude: 4.8436 },
  ],
  Marseille: [
    { zip: '13001', address: '2 La Canebière', latitude: 43.2965, longitude: 5.3764 },
    { zip: '13002', address: '15 Rue de la République', latitude: 43.2989, longitude: 5.3689 },
    { zip: '13006', address: '10 Cours Julien', latitude: 43.2902, longitude: 5.3813 },
    { zip: '13008', address: '210 Avenue du Prado', latitude: 43.2702, longitude: 5.3823 },
    { zip: '13012', address: '4 Avenue des Caillols', latitude: 43.3012, longitude: 5.4379 },
  ],
  Toulouse: [
    { zip: '31000', address: '1 Place du Capitole', latitude: 43.6045, longitude: 1.4440 },
    { zip: '31300', address: '10 Avenue de Grande-Bretagne', latitude: 43.6031, longitude: 1.4238 },
    { zip: '31400', address: '25 Avenue du Colonel Roche', latitude: 43.5669, longitude: 1.4745 },
  ],
  Bordeaux: [
    { zip: '33000', address: '12 Cours d’Albret', latitude: 44.8378, longitude: -0.5792 },
    { zip: '33100', address: '5 Avenue Thiers', latitude: 44.8422, longitude: -0.5565 },
    { zip: '33200', address: '3 Rue Judaïque', latitude: 44.8463, longitude: -0.5966 },
  ],
  Nice: [
    { zip: '06000', address: '10 Avenue Jean Médecin', latitude: 43.7009, longitude: 7.2683 },
    { zip: '06300', address: '2 Quai des États-Unis', latitude: 43.6956, longitude: 7.2725 },
    { zip: '06100', address: '55 Boulevard Gorbella', latitude: 43.7235, longitude: 7.2578 },
  ],
  Nantes: [
    { zip: '44000', address: '3 Place du Commerce', latitude: 47.2138, longitude: -1.5560 },
    { zip: '44100', address: '12 Boulevard de la Liberté', latitude: 47.2050, longitude: -1.5985 },
    { zip: '44300', address: '100 Route de Paris', latitude: 47.2487, longitude: -1.5255 },
  ],
  Montpellier: [
    { zip: '34000', address: '15 Place de la Comédie', latitude: 43.6087, longitude: 3.8795 },
    { zip: '34070', address: '220 Avenue du Mondial 98', latitude: 43.5990, longitude: 3.8470 },
    { zip: '34090', address: '5 Rue de l’École Normale', latitude: 43.6321, longitude: 3.8613 },
  ],
  Lille: [
    { zip: '59000', address: '20 Rue Faidherbe', latitude: 50.6366, longitude: 3.0703 },
    { zip: '59160', address: '5 Place de la République, Lomme', latitude: 50.6385, longitude: 2.9876 },
    { zip: '59260', address: '8 Rue du Général Leclerc, Hellemmes', latitude: 50.6227, longitude: 3.1103 },
  ],
  Strasbourg: [
    { zip: '67000', address: '5 Place Kléber', latitude: 48.5846, longitude: 7.7466 },
    { zip: '67100', address: '10 Avenue de Colmar', latitude: 48.5608, longitude: 7.7509 },
    { zip: '67200', address: '3 Rue d’Oberhausbergen', latitude: 48.5973, longitude: 7.7061 },
  ],
} as const;


const AVATARS = [
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?q=80&w=800&auto=format&fit=crop',
] as const;

const CAT_MAIN = [
  'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517423568366-8b83523034fd?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555680209-38deda7673a3?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1513451713350-dee890297c4a?q=80&w=800&auto=format&fit=crop',
] as const;

const CAT_GALLERY: string[][] = [
  [
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=800&auto=format&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1508672019048-805c876b67e2?q=80&w=800&auto=format&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?q=80&w=800&auto=format&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1555680209-38deda7673a3?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=800&auto=format&fit=crop',
  ],
];

type City = keyof typeof CITY_COORDS;

type CityCoord = (typeof CITY_COORDS)[City][number];

function buildPet(ownerId: string, i: number, coord: { latitude: number; longitude: number }): Pet {
  const gender: Gender = i % 2 === 0 ? 'female' : 'male';
  const main = CAT_MAIN[i % CAT_MAIN.length];
  const gallery = CAT_GALLERY[i % CAT_GALLERY.length];
  const pet: Pet = {
    id: `${ownerId}-pet-1`,
    ownerId,
    name: ['Chacha', 'Minou', 'Tigrou', 'Nougat', 'Pixel'][i % 5],
    type: 'cat',
    breed: ['Européen', 'Siamois', 'Maine Coon', 'British Shorthair', 'Bengal'][i % 5],
    gender,
    dateOfBirth: '2021-05-01',
    color: ['tigré', 'blanc', 'noir', 'roux', 'gris'][i % 5],
    character: ['joueur', 'calin'],
    distinctiveSign: 'petite tâche blanche sur la patte',
    vaccinationDates: [],
    microchipNumber: `FR-${i}${i}${i}${i}`,
    mainPhoto: main,
    galleryPhotos: gallery,
    vet: undefined,
    walkTimes: [],
    isPrimary: true,
    location: { latitude: coord.latitude, longitude: coord.longitude },
  };
  return pet;
}

function buildUser(city: City, index: number, catSitter: boolean): User {
  const coord: CityCoord = CITY_COORDS[city][index % CITY_COORDS[city].length];
  const firstNames = ['Luna', 'Milo', 'Nala', 'Oscar', 'Maya'] as const;
  const lastNames = ['Dupont', 'Martin', 'Bernard', 'Durand', 'Lefevre'] as const;
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[index % lastNames.length];
  const name = `${firstName} ${lastName}`;
  const pseudo = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${city.toLowerCase()}_${index + 1}`;
  const email = `${pseudo}@demo.coppet.app`;
  const id = `${city.substring(0, 3).toLowerCase()}_${index}_${Date.now()}`;
  const photo = AVATARS[index % AVATARS.length];
  const pet = buildPet(id, index, { latitude: coord.latitude, longitude: coord.longitude });

  const user: User = {
    id,
    firstName,
    lastName,
    name,
    pseudo,
    pseudoLower: pseudo.toLowerCase(),
    photo,
    email,
    emailLower: email.toLowerCase(),
    phoneNumber: '+3360000000' + ((index + 1) % 10),
    countryCode: '+33',
    address: coord.address ?? `${10 + index} Rue de la Paix`,
    zipCode: coord.zip,
    city,
    isCatSitter: catSitter,
    referralCode: undefined,
    isPremium: catSitter,
    createdAt: Date.now(),
    pets: [pet],
    animalType: undefined,
    animalName: undefined,
    animalGender: pet.gender,
    animalPhoto: pet.mainPhoto,
    isProfessional: catSitter,
    professionalData: catSitter
      ? {
          companyName: 'Coppet Sitter',
          siret: '12345678900011',
          businessAddress: `${10 + index} Rue de la Paix, ${coord.zip} ${city}`,
          businessEmail: email,
          businessPhone: '+33600000000',
          businessDescription: 'Garde et visites à domicile pour chats, expérience 3+ ans.',
          companyLogo: photo,
          iban: 'FR7612345987650000000000000',
          acceptedTerms: true,
          language: 'fr',
          isVerified: true,
          subscriptionType: 'premium',
          subscriptionExpiry: undefined,
          products: [],
          orders: [],
          analytics: {
            totalSales: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            topProducts: [],
            monthlyRevenue: [],
            customerRetention: 0,
          },
        }
      : undefined,
    isActive: true,
    profileComplete: true,
  };

  return user;
}

export default function FirebaseSeedCities() {
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [results, setResults] = useState<SeedResultItem[]>([]);

  const plan = useMemo(() => {
    return [
      { city: 'Paris' as const, count: 6, catSitterIndexes: [0, 3] },
      { city: 'Lyon' as const, count: 5, catSitterIndexes: [1, 4] },
      { city: 'Marseille' as const, count: 5, catSitterIndexes: [2, 3] },
      { city: 'Toulouse' as const, count: 3, catSitterIndexes: [0] },
      { city: 'Bordeaux' as const, count: 3, catSitterIndexes: [1] },
      { city: 'Nice' as const, count: 3, catSitterIndexes: [2] },
      { city: 'Nantes' as const, count: 3, catSitterIndexes: [0] },
      { city: 'Montpellier' as const, count: 3, catSitterIndexes: [1] },
      { city: 'Lille' as const, count: 3, catSitterIndexes: [2] },
      { city: 'Strasbourg' as const, count: 3, catSitterIndexes: [0] },
    ];
  }, []);

  const run = useCallback(async () => {
    if (!db) return;
    setIsSeeding(true);
    setResults([]);

    try {
      const usersCol = collection(db, 'users');
      const sittersCol = collection(db, 'petSitterProfiles');

      for (const batch of plan) {
        for (let i = 0; i < batch.count; i += 1) {
          const isCatSitter = batch.catSitterIndexes.includes(i);
          const user = buildUser(batch.city, i, isCatSitter);
          try {
            console.log('Seeding user', user.city, user.pseudo);
            await setDoc(doc(usersCol, user.id), {
              ...user,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }, { merge: true });
            setResults(prev => [...prev, { id: user.id, type: 'user', status: 'success', message: `${user.city} • ${user.pseudo}` }]);
          } catch (e) {
            setResults(prev => [...prev, { id: user.id, type: 'user', status: 'error', message: (e as Error)?.message ?? 'Erreur inconnue' }]);
          }

          if (isCatSitter) {
            try {
              const profile = {
                userId: user.id,
                displayName: user.pseudo,
                bio: 'Cat sitter expérimenté(e). Visites, garde de nuit et soins de base.',
                services: [
                  { id: 'visit', name: 'Visite à domicile', price: 15, currency: 'EUR', durationMins: 30 },
                  { id: 'night', name: 'Nuit à domicile', price: 40, currency: 'EUR', durationMins: 480 },
                ],
                photos: user.pets?.map(p => p.mainPhoto) ?? [],
                rating: 4.8,
                reviewsCount: 12,
                city: user.city,
                zipCode: user.zipCode,
                location: user.pets?.[0]?.location,
                availability: {
                  mon: ['09:00-12:00', '14:00-18:00'],
                  tue: ['09:00-12:00', '14:00-18:00'],
                  wed: ['09:00-12:00'],
                  thu: ['14:00-18:00'],
                  fri: ['09:00-12:00'],
                  sat: ['10:00-16:00'],
                  sun: [],
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isVerified: true,
              } as const;
              await setDoc(doc(sittersCol, user.id), profile, { merge: true });
              setResults(prev => [...prev, { id: user.id, type: 'petSitterProfile', status: 'success', message: 'Profil cat-sitter créé' }]);
            } catch (e) {
              setResults(prev => [...prev, { id: user.id, type: 'petSitterProfile', status: 'error', message: (e as Error)?.message ?? 'Erreur inconnue' }]);
            }
          }
        }
      }
    } catch (e) {
      setResults(prev => [...prev, { id: 'seed', type: 'user', status: 'error', message: (e as Error)?.message ?? 'Erreur inconnue' }]);
    } finally {
      setIsSeeding(false);
    }
  }, [plan]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="firebase-seed-cities">
      <Stack.Screen options={{ title: 'Seed: FR Grandes Villes' }} />
      <Text style={styles.title}>Créer 15 utilisateurs (5/cité) avec fiches complètes</Text>
      <Text style={styles.subtitle}>Inclut 2 cat sitters par ville. Environnement: {Platform.OS}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plan</Text>
        {plan.map((p) => (
          <Text key={p.city} style={styles.item}>{p.city}: {p.count} (cat sitters aux index {p.catSitterIndexes.join(', ')})</Text>
        ))}
      </View>

      <TouchableOpacity
        testID="seed-cities-action"
        style={[styles.primaryBtn, isSeeding && styles.disabledBtn]}
        disabled={isSeeding}
        onPress={run}
      >
        {isSeeding ? (
          <>
            <ActivityIndicator color={COLORS.white} />
            <Text style={styles.primaryBtnText}> Import en cours...</Text>
          </>
        ) : (
          <Text style={styles.primaryBtnText}>Créer les utilisateurs</Text>
        )}
      </TouchableOpacity>

      <View style={styles.results}>
        <Text style={styles.sectionTitle}>Résultats ({results.length})</Text>
        {results.map((r, i) => (
          <View
            key={`${r.type}-${r.id}-${i}`}
            style={[styles.resultItem, r.status === 'success' ? styles.ok : styles.err]}
            testID={`result-${i}`}
          >
            <Text style={styles.resultText}>{r.status.toUpperCase()} • {r.type} • {r.id}</Text>
            <Text style={styles.resultDetail}>{r.message}</Text>
          </View>
        ))}
        {!results.length && (
          <Text style={styles.hint}>Aucun résultat pour l’instant.</Text>
        )}
      </View>
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
  resultItem: { backgroundColor: COLORS.white, borderLeftWidth: 4, padding: 10, borderRadius: 8, marginBottom: 8 },
  ok: { borderLeftColor: '#22C55E' },
  err: { borderLeftColor: '#EF4444' },
  resultText: { fontSize: 13, fontWeight: '700', color: COLORS.black },
  resultDetail: { fontSize: 12, color: COLORS.darkGray },
});
