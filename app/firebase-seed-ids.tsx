import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { collection, doc, setDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLORS } from '@/constants/colors';

interface SeedResultItem {
  id: string;
  type: 'user' | 'petSitterProfile' | 'validation';
  status: 'success' | 'error';
  message: string;
}

type CityPreset = 'mix' | 'paris' | 'lyon' | 'marseille' | 'bordeaux' | 'toulouse' | 'nice' | 'lille' | 'nantes';
type PhotoPreset = 'cats1' | 'cats2' | 'avatars';

interface SeedOptions {
  forceAllPremium: boolean;
  forceAllCatSitter: boolean;
  cityPreset: CityPreset;
  photoPreset: PhotoPreset;
}

const TARGET_IDS: string[] = [
  'Dt57BkvpokdoDQCvH0LRC6XC8X02',
  '9vscJncP1GQnqsbd7F5qa3BuGT33',
  'B3hU7Nas1thU13RKRSE1wDd2bMe2',
  's5PRPTWdbQWTpKXX9dwb62cDmub2',
  'OrcNlRlopFgrwRNvut0UiVF16bO2',
];

const CITY_DATA: Record<string, { zip: string; lat: number; lon: number }[]> = {
  paris: [
    { zip: '75001', lat: 48.8625, lon: 2.3364 },
    { zip: '75011', lat: 48.8610, lon: 2.3786 },
    { zip: '75015', lat: 48.8414, lon: 2.2989 },
    { zip: '75018', lat: 48.8925, lon: 2.3442 },
    { zip: '75020', lat: 48.8640, lon: 2.3980 },
  ],
  lyon: [
    { zip: '69001', lat: 45.7692, lon: 4.8336 },
    { zip: '69002', lat: 45.7541, lon: 4.8285 },
    { zip: '69003', lat: 45.7615, lon: 4.8574 },
    { zip: '69006', lat: 45.7722, lon: 4.8519 },
    { zip: '69007', lat: 45.7485, lon: 4.8436 },
  ],
  marseille: [
    { zip: '13001', lat: 43.2976, lon: 5.3813 },
    { zip: '13006', lat: 43.2867, lon: 5.3791 },
    { zip: '13008', lat: 43.2702, lon: 5.3823 },
    { zip: '13009', lat: 43.2541, lon: 5.4201 },
    { zip: '13012', lat: 43.3045, lon: 5.4453 },
  ],
  bordeaux: [
    { zip: '33000', lat: 44.8378, lon: -0.5792 },
    { zip: '33100', lat: 44.8304, lon: -0.5440 },
    { zip: '33200', lat: 44.8588, lon: -0.6050 },
    { zip: '33300', lat: 44.8703, lon: -0.5665 },
    { zip: '33800', lat: 44.8231, lon: -0.5560 },
  ],
  toulouse: [
    { zip: '31000', lat: 43.6045, lon: 1.4442 },
    { zip: '31100', lat: 43.5761, lon: 1.3996 },
    { zip: '31200', lat: 43.6290, lon: 1.4595 },
    { zip: '31300', lat: 43.6033, lon: 1.4237 },
    { zip: '31500', lat: 43.6120, lon: 1.4757 },
  ],
  nice: [
    { zip: '06000', lat: 43.7009, lon: 7.2683 },
    { zip: '06100', lat: 43.7200, lon: 7.2640 },
    { zip: '06200', lat: 43.6899, lon: 7.2435 },
    { zip: '06300', lat: 43.6997, lon: 7.2851 },
    { zip: '06800', lat: 43.6621, lon: 7.2057 },
  ],
  lille: [
    { zip: '59000', lat: 50.6292, lon: 3.0573 },
    { zip: '59160', lat: 50.6320, lon: 3.0205 },
    { zip: '59260', lat: 50.7031, lon: 3.1598 },
    { zip: '59491', lat: 50.6800, lon: 3.1730 },
    { zip: '59777', lat: 50.7066, lon: 3.1602 },
  ],
  nantes: [
    { zip: '44000', lat: 47.2184, lon: -1.5536 },
    { zip: '44100', lat: 47.2075, lon: -1.5949 },
    { zip: '44200', lat: 47.1991, lon: -1.5421 },
    { zip: '44300', lat: 47.2580, lon: -1.5269 },
    { zip: '44400', lat: 47.2132, lon: -1.5305 },
  ],
};

const PRESET_TO_CITY_LIST: Record<CityPreset, { name: string; zips: string[]; coords: { lat: number; lon: number }[] }> = {
  mix: {
    name: 'Mix',
    zips: ['75018', '69002', '13006', '33000', '31000'],
    coords: [
      { lat: 48.8867, lon: 2.3431 },
      { lat: 45.7541, lon: 4.8285 },
      { lat: 43.2867, lon: 5.3791 },
      { lat: 44.8378, lon: -0.5792 },
      { lat: 43.6045, lon: 1.4442 },
    ],
  },
  paris: { name: 'Paris', zips: CITY_DATA.paris.map(c => c.zip), coords: CITY_DATA.paris.map(c => ({ lat: c.lat, lon: c.lon })) },
  lyon: { name: 'Lyon', zips: CITY_DATA.lyon.map(c => c.zip), coords: CITY_DATA.lyon.map(c => ({ lat: c.lat, lon: c.lon })) },
  marseille: { name: 'Marseille', zips: CITY_DATA.marseille.map(c => c.zip), coords: CITY_DATA.marseille.map(c => ({ lat: c.lat, lon: c.lon })) },
  bordeaux: { name: 'Bordeaux', zips: CITY_DATA.bordeaux.map(c => c.zip), coords: CITY_DATA.bordeaux.map(c => ({ lat: c.lat, lon: c.lon })) },
  toulouse: { name: 'Toulouse', zips: CITY_DATA.toulouse.map(c => c.zip), coords: CITY_DATA.toulouse.map(c => ({ lat: c.lat, lon: c.lon })) },
  nice: { name: 'Nice', zips: CITY_DATA.nice.map(c => c.zip), coords: CITY_DATA.nice.map(c => ({ lat: c.lat, lon: c.lon })) },
  lille: { name: 'Lille', zips: CITY_DATA.lille.map(c => c.zip), coords: CITY_DATA.lille.map(c => ({ lat: c.lat, lon: c.lon })) },
  nantes: { name: 'Nantes', zips: CITY_DATA.nantes.map(c => c.zip), coords: CITY_DATA.nantes.map(c => ({ lat: c.lat, lon: c.lon })) },
};

const PHOTOS: Record<PhotoPreset, { user: string[]; pets: { main: string; gallery: string[] }[] }> = {
  cats1: {
    user: [
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1547425260-5f0fc0c6a731?q=80&w=800&auto=format&fit=crop',
    ],
    pets: [
      {
        main: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=800&auto=format&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=800&auto=format&fit=crop',
        ],
      },
      {
        main: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=800&auto=format&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1513451713350-dee890297c4a?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1555680209-38deda7673a3?q=80&w=800&auto=format&fit=crop',
        ],
      },
      {
        main: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?q=80&w=800&auto=format&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=800&auto=format&fit=crop',
        ],
      },
      {
        main: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=800&auto=format&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1508672019048-805c876b67e2?q=80&w=800&auto=format&fit=crop',
        ],
      },
      {
        main: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800&auto=format&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=800&auto=format&fit=crop',
        ],
      },
    ],
  },
  cats2: {
    user: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=800&auto=format&fit=crop',
    ],
    pets: [
      {
        main: 'https://images.unsplash.com/photo-1595433707802-6b2626ef97fc?q=80&w=800&auto=format&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1508672019048-805c876b67e2?q=80&w=800&auto=format&fit=crop',
        ],
      },
      {
        main: 'https://images.unsplash.com/photo-1517423568366-8b83523034fd?q=80&w=800&auto=format&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=800&auto=format&fit=crop',
        ],
      },
      {
        main: 'https://images.unsplash.com/photo-1555680209-38deda7673a3?q=80&w=800&auto=format&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=800&auto=format&fit=crop',
        ],
      },
      {
        main: 'https://images.unsplash.com/photo-1513451713350-dee890297c4a?q=80&w=800&auto=format&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1555680209-38deda7673a3?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=800&auto=format&fit=crop',
        ],
      },
      {
        main: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?q=80&w=800&auto=format&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800&auto=format&fit=crop',
        ],
      },
    ],
  },
  avatars: {
    user: [
      'https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?q=80&w=800&auto=format&fit=crop',
    ],
    pets: [
      {
        main: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=800&auto=format&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=800&auto=format&fit=crop',
        ],
      },
      {
        main: 'https://images.unsplash.com/photo-1517423568366-8b83523034fd?q=80&w=800&auto=format&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1508672019048-805c876b67e2?q=80&w=800&auto=format&fit=crop',
        ],
      },
      {
        main: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=800&auto=format&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?q=80&w=800&auto=format&fit=crop',
        ],
      },
      {
        main: 'https://images.unsplash.com/photo-1555680209-38deda7673a3?q=80&w=800&auto=format&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=800&auto=format&fit=crop',
        ],
      },
      {
        main: 'https://images.unsplash.com/photo-1513451713350-dee890297c4a?q=80&w=800&auto=format&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1555680209-38deda7673a3?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=800&auto=format&fit=crop',
        ],
      },
    ],
  },
};

function buildUserPayload(userId: string, index: number, options: SeedOptions) {
  const isPremium = options.forceAllPremium ? true : index % 2 === 0;
  const isCatSitter = options.forceAllCatSitter ? true : index % 2 === 1;

  const firstNames = ['Luna', 'Milo', 'Nala', 'Oscar', 'Maya'] as const;
  const lastNames = ['Dupont', 'Martin', 'Bernard', 'Durand', 'Lefevre'] as const;

  const preset = PRESET_TO_CITY_LIST[options.cityPreset];
  const cities = {
    names: [
      options.cityPreset === 'mix' ? 'Paris' : preset.name,
      options.cityPreset === 'mix' ? 'Lyon' : preset.name,
      options.cityPreset === 'mix' ? 'Marseille' : preset.name,
      options.cityPreset === 'mix' ? 'Bordeaux' : preset.name,
      options.cityPreset === 'mix' ? 'Toulouse' : preset.name,
    ],
    zips: preset.zips,
    coords: preset.coords,
  } as const;

  const name = `${firstNames[index % firstNames.length]} ${lastNames[index % lastNames.length]}`;
  const pseudo = `${firstNames[index % firstNames.length].toLowerCase()}_${lastNames[index % lastNames.length].toLowerCase()}_${index + 1}`;
  const email = `${pseudo}@demo.coppet.app`;

  const petName = ['Chacha', 'Minou', 'Tigrou', 'Nougat', 'Pixel'][index % 5];
  const petBreed = ['Européen', 'Siamois', 'Maine Coon', 'British Shorthair', 'Bengal'][index % 5];
  const petColor = ['tigré', 'blanc', 'noir', 'roux', 'gris'][index % 5];
  const petGender: 'male' | 'female' = index % 2 === 0 ? 'female' : 'male';

  const userPhoto = PHOTOS[options.photoPreset].user[index % PHOTOS[options.photoPreset].user.length];
  const petPhotos = PHOTOS[options.photoPreset].pets[index % PHOTOS[options.photoPreset].pets.length];

  const coord = cities.coords[index % cities.coords.length];
  const zip = cities.zips[index % cities.zips.length];
  const cityName = cities.names[index % cities.names.length];

  return {
    id: userId,
    firstName: firstNames[index % firstNames.length],
    lastName: lastNames[index % lastNames.length],
    name,
    pseudo,
    pseudoLower: pseudo.toLowerCase(),
    photo: userPhoto,
    email,
    emailLower: email.toLowerCase(),
    phoneNumber: '+3360000000' + ((index + 1) % 10),
    countryCode: '+33',
    address: `${10 + index} Rue de la Paix`,
    zipCode: zip,
    city: cityName,
    isCatSitter,
    referralCode: undefined,
    isPremium,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    pets: [
      {
        id: `${userId}-pet-1`,
        ownerId: userId,
        name: petName,
        type: 'cat',
        breed: petBreed,
        gender: petGender,
        dateOfBirth: '2021-05-01',
        color: petColor,
        character: ['joueur', 'calin'],
        distinctiveSign: 'petite tâche blanche sur la patte',
        vaccinationDates: [],
        microchipNumber: `FR-${index}${index}${index}${index}`,
        mainPhoto: petPhotos.main,
        galleryPhotos: petPhotos.gallery,
        vet: undefined,
        walkTimes: [],
        isPrimary: true,
        location: { latitude: coord.lat, longitude: coord.lon },
      },
    ],
    animalType: undefined,
    animalName: undefined,
    isProfessional: isCatSitter,
    professionalData: isCatSitter
      ? {
          companyName: 'Coppet Sitter',
          siret: '12345678900011',
          businessAddress: `${10 + index} Rue de la Paix, ${zip} ${cityName}`,
          businessEmail: email,
          businessPhone: '+33600000000',
          businessDescription: 'Garde et visites à domicile pour chats, expérience 3+ ans.',
          companyLogo: userPhoto,
          iban: 'FR7612345987650000000000000',
          acceptedTerms: true,
          language: 'fr',
          isVerified: isPremium,
          subscriptionType: isPremium ? 'premium' : 'basic',
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
  } as const;
}

function buildSitterProfile(user: ReturnType<typeof buildUserPayload>) {
  if (!user.isCatSitter) return null;
  return {
    userId: user.id,
    displayName: user.pseudo,
    bio: 'Cat sitter expérimenté(e). Visites, garde de nuit et soins de base.',
    services: [
      { id: 'visit', name: 'Visite à domicile', price: 15, currency: 'EUR', durationMins: 30 },
      { id: 'night', name: 'Nuit à domicile', price: 40, currency: 'EUR', durationMins: 480 },
    ],
    photos: user.pets?.map(p => p.mainPhoto) ?? [],
    rating: user.isPremium ? 4.8 : 4.4,
    reviewsCount: user.isPremium ? 18 : 6,
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
    isVerified: user.isPremium,
  } as const;
}

export default function FirebaseSeedIdsScreen() {
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [results, setResults] = useState<SeedResultItem[]>([]);
  const [options, setOptions] = useState<SeedOptions>({
    forceAllPremium: false,
    forceAllCatSitter: false,
    cityPreset: 'mix',
    photoPreset: 'cats1',
  });

  const ids = useMemo(() => TARGET_IDS, []);

  const togglePremium = useCallback(() => {
    setOptions(prev => ({ ...prev, forceAllPremium: !prev.forceAllPremium }));
  }, []);

  const toggleCatSitter = useCallback(() => {
    setOptions(prev => ({ ...prev, forceAllCatSitter: !prev.forceAllCatSitter }));
  }, []);

  const setCity = useCallback((preset: CityPreset) => {
    setOptions(prev => ({ ...prev, cityPreset: preset }));
  }, []);

  const setPhotos = useCallback((preset: PhotoPreset) => {
    setOptions(prev => ({ ...prev, photoPreset: preset }));
  }, []);

  const validate = useCallback(async () => {
    try {
      if (!db) return;
      const usersCol = collection(db, 'users');
      const sittersCol = collection(db, 'petSitterProfiles');
      const targetCities = ['Paris', 'Lyon', 'Marseille'];
      for (const city of targetCities) {
        const usersSnap = await getDocs(query(usersCol, where('city', '==', city)));
        const sittersSnap = await getDocs(query(sittersCol, where('city', '==', city)));
        setResults(prev => [...prev, { id: `users-${city}`, type: 'validation', status: 'success', message: `Utilisateurs à ${city}: ${usersSnap.size}` }]);
        setResults(prev => [...prev, { id: `sitters-${city}`, type: 'validation', status: 'success', message: `Cat sitters à ${city}: ${sittersSnap.size}` }]);
      }
    } catch (e) {
      setResults(prev => [...prev, { id: 'validation', type: 'validation', status: 'error', message: (e as Error)?.message ?? 'Erreur inconnue' }]);
    }
  }, []);

  const run = useCallback(async () => {
    if (!db) return;
    setIsSeeding(true);
    setResults([]);

    try {
      const usersCol = collection(db, 'users');
      const sittersCol = collection(db, 'petSitterProfiles');

      for (let i = 0; i < ids.length; i += 1) {
        const uid = ids[i];
        const userData = buildUserPayload(uid, i, options);
        try {
          await setDoc(doc(usersCol, uid), userData, { merge: true });
          setResults(prev => [...prev, { id: uid, type: 'user', status: 'success', message: `Profil ${userData.pseudo} créé` }]);
        } catch (e) {
          setResults(prev => [...prev, { id: uid, type: 'user', status: 'error', message: (e as Error)?.message ?? 'Erreur inconnue' }]);
        }

        const sitter = buildSitterProfile(userData);
        if (sitter) {
          try {
            await setDoc(doc(sittersCol, uid), sitter, { merge: true });
            setResults(prev => [...prev, { id: uid, type: 'petSitterProfile', status: 'success', message: 'Profil cat-sitter créé' }]);
          } catch (e) {
            setResults(prev => [...prev, { id: uid, type: 'petSitterProfile', status: 'error', message: (e as Error)?.message ?? 'Erreur inconnue' }]);
          }
        }
      }
    } catch (e) {
      setResults(prev => [...prev, { id: 'seed', type: 'user', status: 'error', message: (e as Error)?.message ?? 'Erreur inconnue' }]);
    } finally {
      try {
        await validate();
      } finally {
        setIsSeeding(false);
      }
    }
  }, [ids, options, validate]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="firebase-seed-ids-screen">
      <Stack.Screen options={{ title: 'Créer profils par IDs' }} />
      <Text style={styles.title}>Seeder Firestore pour 5 IDs</Text>
      <Text style={styles.subtitle}>Crée des variantes: tous premium, tous cat-sitter, villes spécifiques, autres photos.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>IDs cibles ({ids.length})</Text>
        {ids.map((id) => (
          <Text key={id} style={styles.item}>{id}</Text>
        ))}
        <Text style={styles.hint}>Environnement: {Platform.OS}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Variantes</Text>
        <View style={styles.row}>
          <TouchableOpacity
            testID="toggle-premium"
            onPress={togglePremium}
            style={[styles.chip, options.forceAllPremium ? styles.chipActive : undefined]}
          >
            <Text style={[styles.chipText, options.forceAllPremium ? styles.chipTextActive : undefined]}>Tous premium</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="toggle-catsitter"
            onPress={toggleCatSitter}
            style={[styles.chip, options.forceAllCatSitter ? styles.chipActive : undefined]}
          >
            <Text style={[styles.chipText, options.forceAllCatSitter ? styles.chipTextActive : undefined]}>Tous cat-sitter</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabel}>Villes</Text>
        <View style={styles.rowWrap}>
          {(['mix','paris','lyon','marseille','bordeaux','toulouse','nice','lille','nantes'] as CityPreset[]).map((c) => (
            <TouchableOpacity
              key={c}
              testID={`city-${c}`}
              onPress={() => setCity(c)}
              style={[styles.chip, options.cityPreset === c ? styles.chipActive : undefined]}
            >
              <Text style={[styles.chipText, options.cityPreset === c ? styles.chipTextActive : undefined]}>{PRESET_TO_CITY_LIST[c].name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Photos</Text>
        <View style={styles.row}>
          {(['cats1','cats2','avatars'] as PhotoPreset[]).map(p => (
            <TouchableOpacity
              key={p}
              testID={`photos-${p}`}
              onPress={() => setPhotos(p)}
              style={[styles.chip, options.photoPreset === p ? styles.chipActive : undefined]}
            >
              <Text style={[styles.chipText, options.photoPreset === p ? styles.chipTextActive : undefined]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        testID="seed-ids-action"
        style={[styles.primaryBtn, isSeeding ? styles.disabledBtn : undefined]}
        disabled={isSeeding}
        onPress={run}
      >
        {isSeeding ? (
          <>
            <ActivityIndicator color={COLORS.white} />
            <Text style={styles.primaryBtnText}> Import en cours...</Text>
          </>
        ) : (
          <Text style={styles.primaryBtnText}>Créer/Mettre à jour les profils</Text>
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
  section: { backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 6 },
  item: { fontSize: 12, color: COLORS.darkGray, lineHeight: 16 },
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
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: COLORS.white, borderRadius: 9999, borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { color: COLORS.black, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: COLORS.white },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.darkGray, marginTop: 8, marginBottom: 6 },
});
