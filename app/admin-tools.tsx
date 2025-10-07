import React, { useCallback, useMemo, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { COLORS, DIMENSIONS } from '@/constants/colors';
import { db, auth } from '@/services/firebase';
import {
  collection,
  getCountFromServer,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { messagingService, orderService, petService, petSitterService, userService, lostFoundService } from '@/services/database';
import { geocode, fallbackGeocode } from '@/services/geocoding';
import { Wrench, RefreshCw, Database, User as UserIcon, MessagesSquare, CalendarDays, BadgeCheck, ShoppingCart, Dog, ShieldCheck, Rocket, List, MessageSquareText, Trash2, PlusCircle, Star, UserCog, UserCheck, LogIn, LogOut, MapPin, Copy, AlertTriangle } from 'lucide-react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import type { User, Pet } from '@/types';

function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View>{typeof right === 'string' ? <Text>{right}</Text> : right}</View>
      </View>
      <View>{children}</View>
    </View>
  );
}

function StatCard({ label, value, icon, onPress }: { label: string; value: number | string; icon?: React.ReactNode; onPress?: () => void }) {
  return (
    <TouchableOpacity accessibilityRole="button" onPress={onPress} style={styles.statCard} testID={`stat-${label}`}>
      <View style={styles.statIcon}>{icon ? icon : null}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statValue}>{String(value ?? '-')}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

class SimpleErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; errorMsg?: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, errorMsg: (error as any)?.message ?? 'Unknown error' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorBox} testID="error-boundary">
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorText}>{this.state.errorMsg}</Text>
        </View>
      );
    }
    return this.props.children as any;
  }
}

import { useAuth, stopImpersonation } from '@/hooks/auth-store';

type AddressEntry = { address: string; city: string; zipCode: string; countryCode: 'FR' };

const ADDRESS_POOLS: Record<'Paris' | 'Lyon' | 'Marseille', AddressEntry[]> = {
  Paris: [
    { address: '120 Boulevard de Clichy', city: 'Paris', zipCode: '75018', countryCode: 'FR' },
    { address: '10 Avenue des Champs-Élysées', city: 'Paris', zipCode: '75008', countryCode: 'FR' },
    { address: '5 Rue de Rivoli', city: 'Paris', zipCode: '75004', countryCode: 'FR' },
    { address: '2 Place de la Bastille', city: 'Paris', zipCode: '75011', countryCode: 'FR' },
    { address: '18 Rue de Charonne', city: 'Paris', zipCode: '75011', countryCode: 'FR' },
    { address: '35 Rue de Bretagne', city: 'Paris', zipCode: '75003', countryCode: 'FR' },
    { address: '7 Rue Mazarine', city: 'Paris', zipCode: '75006', countryCode: 'FR' },
    { address: "14 Rue de l'Université", city: 'Paris', zipCode: '75007', countryCode: 'FR' },
    { address: '1 Place d’Italie', city: 'Paris', zipCode: '75013', countryCode: 'FR' },
    { address: '25 Rue de Belleville', city: 'Paris', zipCode: '75020', countryCode: 'FR' },
  ],
  Lyon: [
    { address: '1 Place Bellecour', city: 'Lyon', zipCode: '69002', countryCode: 'FR' },
    { address: '10 Rue de la République', city: 'Lyon', zipCode: '69002', countryCode: 'FR' },
    { address: '5 Quai Saint-Antoine', city: 'Lyon', zipCode: '69002', countryCode: 'FR' },
    { address: '18 Rue de la Barre', city: 'Lyon', zipCode: '69002', countryCode: 'FR' },
    { address: '3 Place des Terreaux', city: 'Lyon', zipCode: '69001', countryCode: 'FR' },
    { address: '20 Cours Vitton', city: 'Lyon', zipCode: '69006', countryCode: 'FR' },
    { address: '42 Avenue Jean Jaurès', city: 'Lyon', zipCode: '69007', countryCode: 'FR' },
    { address: '15 Rue de Marseille', city: 'Lyon', zipCode: '69007', countryCode: 'FR' },
    { address: '5 Place Carnot', city: 'Lyon', zipCode: '69002', countryCode: 'FR' },
    { address: '12 Rue de Brest', city: 'Lyon', zipCode: '69002', countryCode: 'FR' },
  ],
  Marseille: [
    { address: '1 La Canebière', city: 'Marseille', zipCode: '13001', countryCode: 'FR' },
    { address: '30 Avenue du Prado', city: 'Marseille', zipCode: '13006', countryCode: 'FR' },
    { address: '5 Quai du Port', city: 'Marseille', zipCode: '13002', countryCode: 'FR' },
    { address: '10 Rue Saint-Ferréol', city: 'Marseille', zipCode: '13001', countryCode: 'FR' },
    { address: '2 Boulevard Baille', city: 'Marseille', zipCode: '13006', countryCode: 'FR' },
    { address: '22 Rue de la République', city: 'Marseille', zipCode: '13001', countryCode: 'FR' },
    { address: '7 Rue de Rome', city: 'Marseille', zipCode: '13006', countryCode: 'FR' },
    { address: '12 Rue Paradis', city: 'Marseille', zipCode: '13001', countryCode: 'FR' },
    { address: '4 Place Félix Baret', city: 'Marseille', zipCode: '13006', countryCode: 'FR' },
    { address: '9 Rue Sainte', city: 'Marseille', zipCode: '13001', countryCode: 'FR' },
  ],
};

function pickAddress(city: keyof typeof ADDRESS_POOLS, index: number): AddressEntry {
  const pool = ADDRESS_POOLS[city];
  const idx = index % pool.length;
  return pool[idx];
}

async function geocodeAddress(entry: AddressEntry) {
  const res = await geocode(entry);
  const fb = res ?? fallbackGeocode(entry);
  return fb;
}

export default function AdminToolsScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const { signOut } = useAuth();

  const [lookupUserId, setLookupUserId] = useState<string>('');
  const [sitterId, setSitterId] = useState<string>('');
  const [conversationId, setConversationId] = useState<string>('');
  const [genCount, setGenCount] = useState<string>('3');
  const [purgeCollection, setPurgeCollection] = useState<string>('users');
  const [purgeLimit, setPurgeLimit] = useState<string>('50');
  const [toggleUserId, setToggleUserId] = useState<string>('');
  const [impersonateId, setImpersonateId] = useState<string>('');
  const [busyAction, setBusyAction] = useState<string>('');
  const [lastGeneratedIds, setLastGeneratedIds] = useState<string[]>([]);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [validationLog, setValidationLog] = useState<string[]>([]);
  const [validationStats, setValidationStats] = useState<{ checked: number; fixed: number; errors: number }>({ checked: 0, fixed: 0, errors: 0 });
  const [globalPetGender, setGlobalPetGender] = useState<'male' | 'female' | 'random'>('random');
  const [globalPetColor, setGlobalPetColor] = useState<string>('tigré');
  const [globalPetCharacters, setGlobalPetCharacters] = useState<string>('joueur,doux');

  const collections = useMemo(() => (
    [
      { key: 'users', label: 'Utilisateurs', icon: <UserIcon size={18} color={COLORS.primary} /> },
      { key: 'pets', label: 'Animaux', icon: <Dog size={18} color={COLORS.primary} /> },
      { key: 'bookings', label: 'Réservations', icon: <CalendarDays size={18} color={COLORS.primary} /> },
      { key: 'conversations', label: 'Conversations', icon: <MessagesSquare size={18} color={COLORS.primary} /> },
      { key: 'messages', label: 'Messages', icon: <MessageSquareText size={18} color={COLORS.primary} /> },
      { key: 'challenges', label: 'Challenges', icon: <BadgeCheck size={18} color={COLORS.primary} /> },
      { key: 'petSitterProfiles', label: 'Cat-sitters', icon: <ShieldCheck size={18} color={COLORS.primary} /> },
      { key: 'orders', label: 'Commandes', icon: <ShoppingCart size={18} color={COLORS.primary} /> },
      { key: 'posts', label: 'Posts', icon: <List size={18} color={COLORS.primary} /> },
    ] as const
  ), []);

  const statsQuery = useQuery({
    queryKey: ['admin-tools', 'counts'],
    queryFn: async () => {
      console.log('[AdminTools] Fetching counts');
      const entries = await Promise.all(collections.map(async c => {
        try {
          const snap = await getCountFromServer(collection(db, c.key));
          return [c.key, snap.data().count] as const;
        } catch (e) {
          console.log('[AdminTools] Count error for', c.key, e);
          return [c.key, -1] as const;
        }
      }));
      return Object.fromEntries(entries) as Record<string, number>;
    },
  });

  const userDetailsQuery = useQuery({
    queryKey: ['admin-tools', 'user', lookupUserId],
    enabled: !!lookupUserId,
    queryFn: async () => {
      console.log('[AdminTools] Loading user', lookupUserId);
      const u = await userService.getUser(lookupUserId);
      if (!u) throw new Error('Utilisateur introuvable');
      const [pets, convs, orders] = await Promise.all([
        petService.getPetsByOwner(lookupUserId),
        messagingService.getConversations(lookupUserId),
        orderService.getOrdersByCustomer(lookupUserId)
      ]);
      return { user: u, pets, convs, orders } as const;
    },
  });

  const sitterBookingsQuery = useQuery({
    queryKey: ['admin-tools', 'sitterBookings', sitterId],
    enabled: !!sitterId,
    queryFn: async () => {
      console.log('[AdminTools] Loading bookings for sitter', sitterId);
      const list = await petSitterService.listBookingsForSitter(sitterId);
      return list;
    },
  });

  const conversationMessagesQuery = useQuery({
    queryKey: ['admin-tools', 'conv', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      console.log('[AdminTools] Loading messages for conversation', conversationId);
      const msgsQ = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc'),
        limit(100)
      );
      const snap = await getDocs(msgsQ);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
  });

  const reconnect = useCallback(async () => {
    try {
      const { reconnectFirestore } = await import('@/services/firebase');
      const ok = await reconnectFirestore();
      if (ok) await qc.invalidateQueries();
    } catch (e) {
      console.log('Reconnect error', e);
    }
  }, [qc]);

  const disconnect = useCallback(async () => {
    try {
      const { disconnectFirestore } = await import('@/services/firebase');
      await disconnectFirestore();
    } catch (e) {
      console.log('Disconnect error', e);
    }
  }, []);

  const quickGenerate = useCallback(async () => {
    if (!db) return;
    setBusyAction('gen');
    try {
      const count = Math.max(1, Math.min(20, Number(genCount) || 1));
      const usersCol = collection(db, 'users');
      const petsCol = collection(db, 'pets');
      const cities: Array<keyof typeof ADDRESS_POOLS> = ['Paris', 'Lyon', 'Marseille'];
      const firstNames = ['Luna','Milo','Nala','Simba','Léa','Noah'];
      const lastNames = ['Martin','Bernard','Dubois','Thomas','Robert'];
      const created: string[] = [];
      for (let i = 0; i < count; i += 1) {
        const uid = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const firstName = firstNames[i % firstNames.length];
        const lastName = lastNames[Math.floor(Math.random()*lastNames.length)];
        const city = cities[i % cities.length];
        const addressEntry = pickAddress(city, i);
        const geo = await geocodeAddress(addressEntry);
        const isPremium = Math.random() > 0.5;
        const isProfessional = Math.random() > 0.7;
        const isCatSitter = Math.random() > 0.6;
        const photo = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random()*10000000)}?auto=format&fit=crop&w=600&q=60`;
        await setDoc(doc(usersCol, uid), {
          id: uid,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          pseudo: `${firstName}${lastName}`.toLowerCase(),
          pseudoLower: `${firstName}${lastName}`.toLowerCase(),
          email: `${uid}@example.com`,
          emailLower: `${uid}@example.com`,
          phoneNumber: '+336 00 00 00 00',
          countryCode: 'FR',
          address: addressEntry.address,
          zipCode: addressEntry.zipCode,
          city: addressEntry.city,
          location: geo ? { latitude: geo.latitude, longitude: geo.longitude } : undefined,
          normalizedAddress: geo?.normalizedAddress ?? `${addressEntry.address}, ${addressEntry.zipCode} ${addressEntry.city}`,
          addressVerified: Boolean(geo),
          isCatSitter,
          isPremium,
          isProfessional,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          pets: [],
          photo,
        }, { merge: true });
        const petId = `pet-${uid}`;
        const petType = Math.random() > 0.5 ? 'cat' : 'dog';
        await setDoc(doc(petsCol, petId), {
          id: petId,
          ownerId: uid,
          name: petType === 'cat' ? 'Neko' : 'Rex',
          type: petType,
          breed: petType === 'cat' ? 'Européen' : 'Berger',
          gender: Math.random() > 0.5 ? 'male' : 'female',
          dateOfBirth: new Date(2019, 1, 1).toISOString().split('T')[0],
          color: petType === 'cat' ? 'tigré' : 'noir',
          character: 'joueur',
          mainPhoto: photo,
          galleryPhotos: [photo],
          isPrimary: true,
          location: geo ? { latitude: geo.latitude, longitude: geo.longitude } : undefined,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        await updateDoc(doc(usersCol, uid), {
          pets: [{ id: petId, ownerId: uid, name: petType === 'cat' ? 'Neko' : 'Rex', type: petType, breed: petType === 'cat' ? 'Européen' : 'Berger', gender: 'male', dateOfBirth: new Date(2019,1,1).toISOString().split('T')[0], color: 'noir', character: 'joueur', mainPhoto: photo, galleryPhotos: [photo], isPrimary: true, location: geo ? { latitude: geo.latitude, longitude: geo.longitude } : undefined }]
        });
        created.push(uid);
      }
      setLastGeneratedIds(created);
      await qc.invalidateQueries();
    } catch (e) {
      console.log('Quick generate error', e);
    } finally {
      setBusyAction('');
    }
  }, [genCount, qc]);

  const seedParisUsers = useCallback(async () => {
    if (!db) return;
    setBusyAction('seed-paris');
    setStatusMsg('');
    try {
      const targetCount = 10;
      const catSitterCount = 3;
      const premiumCount = 3;
      const usersCol = collection(db, 'users');
      const petsCol = collection(db, 'pets');
      const petSitterCol = collection(db, 'petSitterProfiles');
      const createdIds: string[] = [];

      for (let i = 0; i < targetCount; i += 1) {
        const uid = `paris-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const addressEntry = pickAddress('Paris', i);
        const geo = await geocodeAddress(addressEntry);
        const isCatSitter = i < catSitterCount;
        const isPremium = i < premiumCount || isCatSitter;

        const firstName = ['Luna','Milo','Nala','Simba','Léa','Noah','Léo','Zoé','Adam','Chloé'][i % 10];
        const lastName = ['Martin','Bernard','Dubois','Thomas','Robert','Petit','Richard','Durand','Leroy','Moreau'][i % 10];
        const photo = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random()*10000000)}?auto=format&fit=crop&w=600&q=60`;

        await setDoc(doc(usersCol, uid), {
          id: uid,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          pseudo: `${firstName}${lastName}`.toLowerCase(),
          pseudoLower: `${firstName}${lastName}`.toLowerCase(),
          email: `${uid}@example.com`,
          emailLower: `${uid}@example.com`,
          phoneNumber: '+336 00 00 00 00',
          countryCode: 'FR',
          address: addressEntry.address,
          zipCode: addressEntry.zipCode,
          city: addressEntry.city,
          location: geo ? { latitude: geo.latitude, longitude: geo.longitude } : undefined,
          normalizedAddress: geo?.normalizedAddress ?? `${addressEntry.address}, ${addressEntry.zipCode} ${addressEntry.city}`,
          addressVerified: Boolean(geo),
          isCatSitter,
          isPremium,
          isProfessional: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          pets: [],
          photo,
        }, { merge: true });

        const petId = `pet-${uid}`;
        await setDoc(doc(petsCol, petId), {
          id: petId,
          ownerId: uid,
          name: i % 2 === 0 ? 'Neko' : 'Rex',
          type: i % 2 === 0 ? 'cat' : 'dog',
          breed: i % 2 === 0 ? 'Européen' : 'Berger',
          gender: i % 2 === 0 ? 'female' : 'male',
          dateOfBirth: new Date(2020, 1, 1).toISOString().split('T')[0],
          color: i % 2 === 0 ? 'tigré' : 'noir',
          character: ['joueur','doux'],
          mainPhoto: photo,
          galleryPhotos: [photo],
          isPrimary: true,
          location: geo ? { latitude: geo.latitude, longitude: geo.longitude } : undefined,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });

        await updateDoc(doc(usersCol, uid), {
          pets: [{ id: petId, ownerId: uid, name: i % 2 === 0 ? 'Neko' : 'Rex', type: i % 2 === 0 ? 'cat' : 'dog', breed: i % 2 === 0 ? 'Européen' : 'Berger', gender: i % 2 === 0 ? 'female' : 'male', dateOfBirth: new Date(2020,1,1).toISOString().split('T')[0], color: i % 2 === 0 ? 'tigré' : 'noir', character: ['joueur','doux'], mainPhoto: photo, galleryPhotos: [photo], isPrimary: true, location: geo ? { latitude: geo.latitude, longitude: geo.longitude } : undefined }]
        });

        if (isCatSitter) {
          await setDoc(doc(petSitterCol, uid), { userId: uid, displayName: `${firstName} ${lastName}`, radiusKm: 5, hourlyRate: 12 + i, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
        }

        createdIds.push(uid);
      }

      if (createdIds.length >= 4) {
        const [u1, u2, u3, u4] = createdIds;
        const conv1 = await messagingService.createConversation([u1, u2]);
        await messagingService.sendMessage({ senderId: u1, receiverId: u2, content: 'Bonjour! Test message 👋', conversationId: conv1 });
        await messagingService.sendMessage({ senderId: u2, receiverId: u1, content: 'Salut! Bien reçu ✅', conversationId: conv1 });
        const conv2 = await messagingService.createConversation([u3, u4]);
        await messagingService.sendMessage({ senderId: u3, receiverId: u4, content: 'Dispo pour garderie ce weekend?', conversationId: conv2 });
      }

      setLastGeneratedIds(createdIds);
      setStatusMsg(`Créés: ${createdIds.length} utilisateurs (Paris).`);
      await qc.invalidateQueries();
    } catch (e) {
      console.log('Seed Paris error', e);
      setStatusMsg('Erreur lors de la création du lot Paris');
    } finally {
      setBusyAction('');
    }
  }, [qc]);

  const seedLyonUsers = useCallback(async () => {
    if (!db) return;
    setBusyAction('seed-lyon');
    setStatusMsg('');
    try {
      const targetCount = 10;
      const catSitterCount = 3;
      const premiumCount = 3;
      const usersCol = collection(db, 'users');
      const petsCol = collection(db, 'pets');
      const petSitterCol = collection(db, 'petSitterProfiles');
      const createdIds: string[] = [];

      for (let i = 0; i < targetCount; i += 1) {
        const uid = `lyon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const addressEntry = pickAddress('Lyon', i);
        const geo = await geocodeAddress(addressEntry);
        const isCatSitter = i < catSitterCount;
        const isPremium = i < premiumCount || isCatSitter;

        const firstName = ['Luna','Milo','Nala','Simba','Léa','Noah','Léo','Zoé','Adam','Chloé'][i % 10];
        const lastName = ['Martin','Bernard','Dubois','Thomas','Robert','Petit','Richard','Durand','Leroy','Moreau'][i % 10];
        const photo = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random()*10000000)}?auto=format&fit=crop&w=600&q=60`;

        await setDoc(doc(usersCol, uid), {
          id: uid,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          pseudo: `${firstName}${lastName}`.toLowerCase(),
          pseudoLower: `${firstName}${lastName}`.toLowerCase(),
          email: `${uid}@example.com`,
          emailLower: `${uid}@example.com`,
          phoneNumber: '+336 00 00 00 00',
          countryCode: 'FR',
          address: addressEntry.address,
          zipCode: addressEntry.zipCode,
          city: addressEntry.city,
          location: geo ? { latitude: geo.latitude, longitude: geo.longitude } : undefined,
          normalizedAddress: geo?.normalizedAddress ?? `${addressEntry.address}, ${addressEntry.zipCode} ${addressEntry.city}`,
          addressVerified: Boolean(geo),
          isCatSitter,
          isPremium,
          isProfessional: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          pets: [],
          photo,
        }, { merge: true });

        const petId = `pet-${uid}`;
        await setDoc(doc(petsCol, petId), {
          id: petId,
          ownerId: uid,
          name: i % 2 === 0 ? 'Neko' : 'Rex',
          type: i % 2 === 0 ? 'cat' : 'dog',
          breed: i % 2 === 0 ? 'Européen' : 'Berger',
          gender: i % 2 === 0 ? 'female' : 'male',
          dateOfBirth: new Date(2020, 1, 1).toISOString().split('T')[0],
          color: i % 2 === 0 ? 'tigré' : 'noir',
          character: ['joueur','doux'],
          mainPhoto: photo,
          galleryPhotos: [photo],
          isPrimary: true,
          location: geo ? { latitude: geo.latitude, longitude: geo.longitude } : undefined,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });

        await updateDoc(doc(usersCol, uid), {
          pets: [{ id: petId, ownerId: uid, name: i % 2 === 0 ? 'Neko' : 'Rex', type: i % 2 === 0 ? 'cat' : 'dog', breed: i % 2 === 0 ? 'Européen' : 'Berger', gender: i % 2 === 0 ? 'female' : 'male', dateOfBirth: new Date(2020,1,1).toISOString().split('T')[0], color: i % 2 === 0 ? 'tigré' : 'noir', character: ['joueur','doux'], mainPhoto: photo, galleryPhotos: [photo], isPrimary: true, location: geo ? { latitude: geo.latitude, longitude: geo.longitude } : undefined }]
        });

        if (isCatSitter) {
          await setDoc(doc(petSitterCol, uid), { userId: uid, displayName: `${firstName} ${lastName}`, radiusKm: 5, hourlyRate: 12 + i, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
        }

        createdIds.push(uid);
      }

      if (createdIds.length >= 2) {
        const [u1, u2] = createdIds;
        const conv = await messagingService.createConversation([u1, u2]);
        await messagingService.sendMessage({ senderId: u1, receiverId: u2, content: 'Hello Lyon 👋', conversationId: conv });
      }

      setLastGeneratedIds(prev => [...prev, ...createdIds]);
      setStatusMsg(`Créés: ${createdIds.length} utilisateurs (Lyon).`);
      await qc.invalidateQueries();
    } catch (e) {
      console.log('Seed Lyon error', e);
      setStatusMsg('Erreur lors de la création du lot Lyon');
    } finally {
      setBusyAction('');
    }
  }, [qc]);

  const seedMarseilleUsers = useCallback(async () => {
    if (!db) return;
    setBusyAction('seed-marseille');
    setStatusMsg('');
    try {
      const targetCount = 10;
      const catSitterCount = 3;
      const premiumCount = 3;
      const usersCol = collection(db, 'users');
      const petsCol = collection(db, 'pets');
      const petSitterCol = collection(db, 'petSitterProfiles');
      const createdIds: string[] = [];

      for (let i = 0; i < targetCount; i += 1) {
        const uid = `marseille-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const addressEntry = pickAddress('Marseille', i);
        const geo = await geocodeAddress(addressEntry);
        const isCatSitter = i < catSitterCount;
        const isPremium = i < premiumCount || isCatSitter;

        const firstName = ['Luna','Milo','Nala','Simba','Léa','Noah','Léo','Zoé','Adam','Chloé'][i % 10];
        const lastName = ['Martin','Bernard','Dubois','Thomas','Robert','Petit','Richard','Durand','Leroy','Moreau'][i % 10];
        const photo = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random()*10000000)}?auto=format&fit=crop&w=600&q=60`;

        await setDoc(doc(usersCol, uid), {
          id: uid,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          pseudo: `${firstName}${lastName}`.toLowerCase(),
          pseudoLower: `${firstName}${lastName}`.toLowerCase(),
          email: `${uid}@example.com`,
          emailLower: `${uid}@example.com`,
          phoneNumber: '+336 00 00 00 00',
          countryCode: 'FR',
          address: addressEntry.address,
          zipCode: addressEntry.zipCode,
          city: addressEntry.city,
          location: geo ? { latitude: geo.latitude, longitude: geo.longitude } : undefined,
          normalizedAddress: geo?.normalizedAddress ?? `${addressEntry.address}, ${addressEntry.zipCode} ${addressEntry.city}`,
          addressVerified: Boolean(geo),
          isCatSitter,
          isPremium,
          isProfessional: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          pets: [],
          photo,
        }, { merge: true });

        const petId = `pet-${uid}`;
        await setDoc(doc(petsCol, petId), {
          id: petId,
          ownerId: uid,
          name: i % 2 === 0 ? 'Neko' : 'Rex',
          type: i % 2 === 0 ? 'cat' : 'dog',
          breed: i % 2 === 0 ? 'Européen' : 'Berger',
          gender: i % 2 === 0 ? 'female' : 'male',
          dateOfBirth: new Date(2020, 1, 1).toISOString().split('T')[0],
          color: i % 2 === 0 ? 'tigré' : 'noir',
          character: ['joueur','doux'],
          mainPhoto: photo,
          galleryPhotos: [photo],
          isPrimary: true,
          location: geo ? { latitude: geo.latitude, longitude: geo.longitude } : undefined,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });

        await updateDoc(doc(usersCol, uid), {
          pets: [{ id: petId, ownerId: uid, name: i % 2 === 0 ? 'Neko' : 'Rex', type: i % 2 === 0 ? 'cat' : 'dog', breed: i % 2 === 0 ? 'Européen' : 'Berger', gender: i % 2 === 0 ? 'female' : 'male', dateOfBirth: new Date(2020,1,1).toISOString().split('T')[0], color: i % 2 === 0 ? 'tigré' : 'noir', character: ['joueur','doux'], mainPhoto: photo, galleryPhotos: [photo], isPrimary: true, location: geo ? { latitude: geo.latitude, longitude: geo.longitude } : undefined }]
        });

        if (isCatSitter) {
          await setDoc(doc(petSitterCol, uid), { userId: uid, displayName: `${firstName} ${lastName}`, radiusKm: 5, hourlyRate: 12 + i, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
        }

        createdIds.push(uid);
      }

      if (createdIds.length >= 2) {
        const [u1, u2] = createdIds;
        const conv = await messagingService.createConversation([u1, u2]);
        await messagingService.sendMessage({ senderId: u1, receiverId: u2, content: 'Hello Marseille 👋', conversationId: conv });
      }

      setLastGeneratedIds(prev => [...prev, ...createdIds]);
      setStatusMsg(`Créés: ${createdIds.length} utilisateurs (Marseille).`);
      await qc.invalidateQueries();
    } catch (e) {
      console.log('Seed Marseille error', e);
      setStatusMsg('Erreur lors de la création du lot Marseille');
    } finally {
      setBusyAction('');
    }
  }, [qc]);

  const validateAndFixUsers = useCallback(async () => {
    if (!db) return;
    setBusyAction('validate');
    setValidationLog([]);
    setValidationStats({ checked: 0, fixed: 0, errors: 0 });
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const petsCol = collection(db, 'pets');
      let checked = 0;
      let fixed = 0;

      const cityZipMap: Record<string, string> = {
        Paris: '75001',
        Lyon: '69001',
        Marseille: '13001',
        Toulouse: '31000',
        Nice: '06000',
      };

      const randomFrMobile = () => {
        const two = () => Math.floor(Math.random() * 90 + 10).toString();
        return `+336 ${two()} ${two()} ${two()} ${two()}`;
      };

      for (const d of usersSnap.docs) {
        try {
          const u: any = { id: d.id, ...d.data() };
          checked += 1;
          const updates: Record<string, any> = { updatedAt: serverTimestamp() };
          let didFix = false;

          const reqFields = ['firstName','lastName','email','city','countryCode'] as const;
          reqFields.forEach(f => {
            if (!u?.[f]) {
              updates[f] = f === 'countryCode' ? 'FR' : (f === 'city' ? 'Paris' : `Test-${f}`);
              didFix = true;
            }
          });

          if (!u?.zipCode || String(u.zipCode).length < 4) {
            const city = (updates.city ?? u.city ?? 'Paris') as string;
            const zip = cityZipMap[city] ?? '75001';
            updates.zipCode = zip;
            didFix = true;
            setValidationLog(prev => [...prev, `User ${u.id}: zip complété → ${zip}`]);
          }

          if (!u?.address || String(u.address).trim().length < 3) {
            const city = (updates.city ?? u.city ?? 'Paris') as string;
            const zip = (updates.zipCode ?? u.zipCode ?? cityZipMap[city] ?? '75001') as string;
            const entry: AddressEntry = { address: `${zip} ${city}`, city, zipCode: zip, countryCode: 'FR' };
            updates.address = entry.address;
            didFix = true;
            setValidationLog(prev => [...prev, `User ${u.id}: adresse complétée`]);
          }

          if (!u?.location || !u?.location?.latitude || !u?.location?.longitude) {
            try {
              const city = (updates.city ?? u.city ?? 'Paris') as string;
              const zip = (updates.zipCode ?? u.zipCode ?? cityZipMap[city] ?? '75001') as string;
              const addr = (updates.address ?? u.address ?? `${zip} ${city}`) as string;
              const res = await geocode({ address: addr, city, zipCode: zip, countryCode: 'FR' });
              const fallback = res ?? fallbackGeocode({ address: addr, city, zipCode: zip, countryCode: 'FR' });
              if (fallback) {
                updates.location = { latitude: fallback.latitude, longitude: fallback.longitude };
                updates.normalizedAddress = fallback.normalizedAddress ?? addr;
                updates.addressVerified = Boolean(res);
                didFix = true;
                setValidationLog(prev => [...prev, `User ${u.id}: géolocalisé (${fallback.latitude.toFixed(4)}, ${fallback.longitude.toFixed(4)})`]);
              }
            } catch (geoErr) {
              setValidationLog(prev => [...prev, `User ${u.id}: échec géocodage`]);
            }
          }

          if (!u?.phoneNumber || String(u.phoneNumber).trim().length < 6) {
            const cc = (updates.countryCode ?? u.countryCode ?? 'FR') as string;
            updates.phoneNumber = cc === 'FR' ? randomFrMobile() : randomFrMobile();
            didFix = true;
            setValidationLog(prev => [...prev, `User ${u.id}: téléphone ajouté`]);
          }

          if (u?.email && (!u?.emailLower || u.emailLower !== String(u.email).toLowerCase())) {
            updates.emailLower = String(u.email).toLowerCase();
            didFix = true;
          }
          if (u?.pseudo && (!u?.pseudoLower || u.pseudoLower !== String(u.pseudo).toLowerCase())) {
            updates.pseudoLower = String(u.pseudo).toLowerCase();
            didFix = true;
          }

          if (!u?.photo) {
            const photo = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random()*10000000)}?auto=format&fit=crop&w=600&q=60`;
            updates.photo = photo;
            didFix = true;
            setValidationLog(prev => [...prev, `User ${u.id}: photo manquante – ajoutée`]);
          }

          const userPets: any[] = Array.isArray(u?.pets) ? u.pets : [];
          if (!userPets || userPets.length === 0) {
            const petId = `pet-${u.id}`;
            const petType = 'cat';
            const petPhoto = updates.photo ?? u.photo ?? `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random()*10000000)}?auto=format&fit=crop&w=600&q=60`;
            await setDoc(doc(petsCol, petId), {
              id: petId,
              ownerId: u.id,
              name: 'Neko',
              type: petType,
              breed: 'Européen',
              gender: 'female',
              dateOfBirth: new Date(2020,1,1).toISOString().split('T')[0],
              color: 'tigré',
              character: 'joueur',
              mainPhoto: petPhoto,
              galleryPhotos: [petPhoto],
              isPrimary: true,
              location: (updates.location ?? u.location) ? { latitude: (updates.location ?? u.location).latitude, longitude: (updates.location ?? u.location).longitude } : undefined,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }, { merge: true });
            updates.pets = [{ id: petId, ownerId: u.id, name: 'Neko', type: petType, breed: 'Européen', gender: 'female', dateOfBirth: new Date(2020,1,1).toISOString().split('T')[0], color: 'tigré', character: 'joueur', mainPhoto: petPhoto, galleryPhotos: [petPhoto], isPrimary: true, location: (updates.location ?? u.location) ? { latitude: (updates.location ?? u.location).latitude, longitude: (updates.location ?? u.location).longitude } : undefined }];
            didFix = true;
            setValidationLog(prev => [...prev, `User ${u.id}: aucun pet – créé ${petId}`]);
          } else {
            const fixedPets = userPets.map((p: any) => ({
              ...p,
              mainPhoto: p?.mainPhoto ?? u?.photo ?? `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random()*10000000)}?auto=format&fit=crop&w=600&q=60`,
              galleryPhotos: (p?.galleryPhotos && p.galleryPhotos.length > 0) ? p.galleryPhotos : [p?.mainPhoto ?? u?.photo ?? `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random()*10000000)}?auto=format&fit=crop&w=600&q=60`],
              breed: p?.breed ?? (p?.type === 'dog' ? 'Berger' : 'Européen'),
              gender: p?.gender ?? 'female',
              name: p?.name ?? (p?.type === 'dog' ? 'Rex' : 'Neko'),
              type: p?.type ?? 'cat',
              isPrimary: p?.isPrimary ?? true,
              location: p?.location ?? (u?.location ? { latitude: u.location.latitude, longitude: u.location.longitude } : undefined),
            }));
            if (JSON.stringify(fixedPets) !== JSON.stringify(userPets)) {
              updates.pets = fixedPets;
              didFix = true;
              setValidationLog(prev => [...prev, `User ${u.id}: complété la fiche pet`]);
            }
          }

          if (!u?.profileComplete) {
            const requiredOk = Boolean((updates.firstName ?? u.firstName) && (updates.lastName ?? u.lastName) && (updates.email ?? u.email) && (updates.city ?? u.city) && (updates.countryCode ?? u.countryCode) && (updates.address ?? u.address) && (updates.zipCode ?? u.zipCode) && (updates.phoneNumber ?? u.phoneNumber));
            if (requiredOk) {
              updates.profileComplete = true;
              didFix = true;
            }
          }

          if (didFix) {
            await setDoc(doc(db, 'users', u.id), updates as any, { merge: true });
            fixed += 1;
          }
        } catch (inner) {
          console.log('Validation error for user', d.id, inner);
          setValidationLog(prev => [...prev, `Erreur utilisateur ${d.id}: ${(inner as any)?.message ?? 'inconnue'}`]);
          setValidationStats(prev => ({ ...prev, errors: prev.errors + 1 }));
        }
      }
      setValidationStats(prev => ({ ...prev, checked, fixed }));
      await qc.invalidateQueries();
    } catch (e) {
      console.log('Validate users error', e);
      setValidationLog(prev => [...prev, 'Erreur générale lors de la validation']);
    } finally {
      setBusyAction('');
    }
  }, [qc]);

  const purge = useCallback(async () => {
    if (!db) return;
    setBusyAction('purge');
    try {
      const col = collection(db, purgeCollection);
      const snap = await getDocs(col);
      const limitCount = Math.max(1, Math.min(Number(purgeLimit) || 50, snap.size));
      let i = 0;
      for (const d of snap.docs) {
        await deleteDoc(doc(db, purgeCollection, d.id));
        i += 1;
        if (i >= limitCount) break;
      }
      await qc.invalidateQueries();
    } catch (e) {
      console.log('Purge error', e);
    } finally {
      setBusyAction('');
    }
  }, [purgeCollection, purgeLimit, qc]);

  const toggleFlag = useCallback(async (flag: 'isPremium' | 'isProfessional' | 'isCatSitter') => {
    if (!db || !toggleUserId) return;
    setBusyAction(`toggle-${flag}`);
    try {
      const uRef = doc(db, 'users', toggleUserId);
      const newVal = Math.random() > 0.5;
      await setDoc(uRef, { [flag]: newVal, updatedAt: serverTimestamp() } as any, { merge: true });
      if (flag === 'isCatSitter' && newVal) {
        await setDoc(doc(db, 'petSitterProfiles', toggleUserId), { userId: toggleUserId, displayName: toggleUserId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
      }
      await qc.invalidateQueries();
    } catch (e) {
      console.log('Toggle flag error', e);
    } finally {
      setBusyAction('');
    }
  }, [toggleUserId, qc]);

  const impersonate = useCallback(async () => {
    try {
      setBusyAction('impersonate');
      const mod = await import('@/hooks/auth-store');
      (mod as any)?.impersonateUser?.(impersonateId);
    } catch (e) {
      console.log('Impersonate error', e);
    } finally {
      setBusyAction('');
    }
  }, [impersonateId]);

  const stopImpersonate = useCallback(async () => {
    try {
      setBusyAction('stop-impersonate');
      const mod = await import('@/hooks/auth-store');
      (mod as any)?.stopImpersonation?.();
    } catch (e) {
      console.log('Stop impersonate error', e);
    } finally {
      setBusyAction('');
    }
  }, []);

  const openSeed = useCallback(() => router.push('/firebase-seed'), [router]);
  const openSeedIds = useCallback(() => router.push('/firebase-seed-ids'), [router]);
  const openFirebaseTest = useCallback(() => router.push('/firebase-test'), [router]);

  const createSuperAdmin = useCallback(async () => {
    try {
      setBusyAction('super-admin');
      const email = 'ckartier@gmail.com';
      const password = '123456';
      const fullAddress = '120 boulevard de clichy, 75018 Paris, France';
      const firstName = 'Cédric';
      const lastName = 'Kartier';
      const displayName = `${firstName} ${lastName}`;
      let uid: string | null = null;
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
        await updateProfile(cred.user, { displayName });
      } catch (e: any) {
        const code: string = e?.code ?? '';
        if (code === 'auth/email-already-in-use') {
          const users = await userService.searchUsers(email.toLowerCase(), 1);
          uid = users[0]?.id ?? null;
        } else {
          throw e;
        }
      }
      if (!uid) throw new Error('Impossible de déterminer l’UID');
      const geo = await geocode({ address: '120 boulevard de clichy', city: 'Paris', zipCode: '75018', countryCode: 'FR' });
      const loc = geo ?? fallbackGeocode({ address: '120 boulevard de clichy', city: 'Paris', zipCode: '75018', countryCode: 'FR' });
      const userDoc: User = {
        id: uid,
        firstName,
        lastName,
        name: displayName,
        pseudo: 'cedrick',
        pseudoLower: 'cedrick',
        photo: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&h=600&fit=crop',
        email,
        emailLower: email.toLowerCase(),
        phoneNumber: '+33612345678',
        countryCode: 'FR',
        address: '120 Boulevard de Clichy',
        zipCode: '75018',
        city: 'Paris',
        location: loc ? { latitude: loc.latitude, longitude: loc.longitude } : undefined,
        addressVerified: Boolean(geo),
        normalizedAddress: loc?.normalizedAddress ?? fullAddress,
        isCatSitter: false,
        catSitterRadiusKm: 5,
        referralCode: undefined,
        isPremium: true,
        createdAt: Date.now(),
        pets: [],
        animalType: undefined,
        animalName: undefined,
        animalGender: undefined,
        animalPhoto: undefined,
        isProfessional: false,
        professionalData: undefined,
        isActive: true,
        profileComplete: true,
        isAdmin: true,
        isSuperAdmin: true,
      };
      await setDoc(doc(db, 'users', uid), { ...userDoc, updatedAt: serverTimestamp(), createdAt: serverTimestamp() } as any, { merge: true });
      const petId = `pet-${uid}-nana`;
      const pet: Pet = {
        id: petId,
        ownerId: uid,
        name: 'Nana',
        type: 'cat',
        breed: 'Européen',
        gender: 'female',
        dateOfBirth: '2021-05-10',
        color: 'tigré',
        character: ['joueuse','doucereuse','curieuse'],
        distinctiveSign: 'Tache blanche sous le cou',
        vaccinationDates: [],
        microchipNumber: 'FR-123-456-789',
        mainPhoto: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&h=800&fit=crop',
        galleryPhotos: [
          'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=800&h=800&fit=crop'
        ],
        vet: undefined,
        walkTimes: [],
        isPrimary: true,
        location: userDoc.location,
        addressVerified: userDoc.addressVerified,
        normalizedAddress: userDoc.normalizedAddress,
      };
      await setDoc(doc(db, 'pets', petId), { ...pet, createdAt: serverTimestamp(), updatedAt: serverTimestamp() } as any, { merge: true });
      await setDoc(doc(db, 'users', uid), { pets: [pet], updatedAt: serverTimestamp() } as any, { merge: true });
      setStatusMsg('Super admin créé/mis à jour. Vous pouvez vous connecter.');
      await qc.invalidateQueries();
    } catch (e) {
      console.log('Create super admin error', e);
      setStatusMsg('Erreur: création super admin');
    } finally {
      setBusyAction('');
    }
  }, [qc]);

  return (
    <SimpleErrorBoundary>
      <Stack.Screen options={{
        title: 'Outils Firebase',
        headerRight: () => (
          <TouchableOpacity
            onPress={async () => {
              try {
                const res = await signOut();
                if ((res as any)?.success) {
                  try { stopImpersonation(); } catch {}
                  router.replace('/splash');
                }
              } catch (e) {
                console.log('Logout error', e);
              }
            }}
            style={{ paddingHorizontal: 12 }}
            testID="btn-logout"
          >
            <LogOut size={18} color={COLORS.error} />
          </TouchableOpacity>
        )
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="admin-tools-screen">
        <View style={styles.headerBox}>
          <View style={styles.headerIcon}><Wrench size={22} color={COLORS.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Outils Firebase / Firestore</Text>
            <Text style={styles.subtitle}>Diagnostics, seeds et raccourcis admin</Text>
          </View>
          <View style={styles.row}>
            <TouchableOpacity onPress={reconnect} style={styles.iconButton} testID="btn-reconnect">
              <RefreshCw size={18} color={COLORS.primary} />
              <Text style={styles.iconButtonText}>Reconnect</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={disconnect} style={[styles.iconButton, { marginLeft: 8 }]} testID="btn-disconnect">
              <Database size={18} color={COLORS.error} />
              <Text style={[styles.iconButtonText, { color: COLORS.error }]}>Offline</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Section title="Statistiques rapides" right={statsQuery.isFetching ? <ActivityIndicator /> : undefined}>
          <View style={styles.statsGrid}>
            {collections.map(c => (
              <StatCard
                key={c.key}
                label={c.label}
                value={statsQuery.data?.[c.key] ?? '-'}
                icon={c.icon}
                onPress={() => router.push({ pathname: '/admin-dashboard', params: { collection: c.key } })}
              />
            ))}
          </View>
        </Section>

        <Section title="Actions rapides">
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={openSeed} style={styles.actionBtn} testID="open-seed">
              <Rocket size={18} color={COLORS.white} />
              <Text style={styles.actionBtnText}>Ouvrir firebase-seed</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openSeedIds} style={styles.actionBtn} testID="open-seed-ids">
              <Rocket size={18} color={COLORS.white} />
              <Text style={styles.actionBtnText}>Ouvrir seed-ids</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.actionsRow, { marginTop: DIMENSIONS.SPACING.sm }]}> 
            <TouchableOpacity onPress={createSuperAdmin} style={[styles.actionBtn, { backgroundColor: '#0ea5e9' }]} testID="btn-create-super-admin" disabled={busyAction==='super-admin'}>
              {busyAction==='super-admin' ? <ActivityIndicator color={COLORS.white} /> : <ShieldCheck size={18} color={COLORS.white} />}
              <Text style={styles.actionBtnText}>Créer Super Admin (ckartier@gmail.com)</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.actionsRow, { marginTop: DIMENSIONS.SPACING.sm }]}>
            <TouchableOpacity onPress={openFirebaseTest} style={[styles.actionBtn, styles.actionBtnSecondary]} testID="open-firebase-test">
              <ShieldCheck size={18} color={COLORS.primary} />
              <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Test de connexion</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={seedParisUsers} style={[styles.actionBtn, { marginLeft: 8 }]} testID="btn-seed-paris" disabled={busyAction==='seed-paris'}>
              {busyAction==='seed-paris' ? <ActivityIndicator color={COLORS.white} /> : <MapPin size={18} color={COLORS.white} />}
              <Text style={styles.actionBtnText}>Créer 10 utilisateurs (Paris)</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.actionsRow, { marginTop: DIMENSIONS.SPACING.sm }]}>
            <TouchableOpacity onPress={async () => {
              if (!db) return;
              setBusyAction('add-pet-all');
              setStatusMsg('');
              try {
                const usersSnap = await getDocs(collection(db, 'users'));
                const petsCol = collection(db, 'pets');
                let processed = 0;
                for (const d of usersSnap.docs) {
                  const u: any = { id: d.id, ...d.data() };
                  const petId = `pet-${u.id}`;
                  const gender = globalPetGender === 'random' ? (Math.random() > 0.5 ? 'male' : 'female') : globalPetGender;
                  const color = globalPetColor || 'tigré';
                  const characters = globalPetCharacters.split(',').map(s => s.trim()).filter(Boolean);
                  const photo = u?.photo || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random()*10000000)}?auto=format&fit=crop&w=600&q=60`;
                  await setDoc(doc(petsCol, petId), {
                    id: petId,
                    ownerId: u.id,
                    name: 'Moka',
                    type: 'cat',
                    breed: 'Européen',
                    gender,
                    dateOfBirth: new Date(2020,1,1).toISOString().split('T')[0],
                    color,
                    character: characters,
                    mainPhoto: photo,
                    galleryPhotos: [photo],
                    isPrimary: true,
                    location: u?.location ? { latitude: u.location.latitude, longitude: u.location.longitude } : undefined,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  }, { merge: true });
                  const newPet = { id: petId, ownerId: u.id, name: 'Moka', type: 'cat', breed: 'Européen', gender, dateOfBirth: new Date(2020,1,1).toISOString().split('T')[0], color, character: characters, mainPhoto: photo, galleryPhotos: [photo], isPrimary: true, location: u?.location ? { latitude: u.location.latitude, longitude: u.location.longitude } : undefined } as any;
                  const currentPets: any[] = Array.isArray(u?.pets) ? u.pets : [];
                  const hasPet = currentPets.some(p => p?.id === petId);
                  const updatedPets = hasPet ? currentPets.map(p => (p.id === petId ? newPet : p)) : [...currentPets, newPet];
                  await setDoc(doc(db, 'users', u.id), { pets: updatedPets, updatedAt: serverTimestamp() } as any, { merge: true });
                  processed += 1;
                }
                setStatusMsg(`Animal ajouté/mis à jour pour ${processed} utilisateurs.`);
                await qc.invalidateQueries();
              } catch (e) {
                console.log('Add pet to all users error', e);
                setStatusMsg('Erreur lors de l\'ajout des animaux');
              } finally {
                setBusyAction('');
              }
            }} style={[styles.actionBtn, { backgroundColor: COLORS.accent }]} testID="btn-add-pet-all" disabled={busyAction==='add-pet-all'}>
              {busyAction==='add-pet-all' ? <ActivityIndicator color={COLORS.white} /> : <Dog size={18} color={COLORS.white} />}
              <Text style={styles.actionBtnText}>Ajouter un animal à tous</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={async () => {
              setBusyAction('create-lost-placeholder');
              try {
                const id = await lostFoundService.createReport({
                  status: 'lost',
                  petName: 'Moka',
                  species: 'cat',
                  color: 'tigré',
                  description: 'Chat perdu près du parc. Très joueur et doux.',
                  city: 'Paris',
                  address: '75001 Paris',
                  location: { latitude: 48.86, longitude: 2.35 },
                });
                setStatusMsg(`Placeholder Lost&Found créé: ${id}`);
                await qc.invalidateQueries();
              } catch (e) {
                console.log('Create lost placeholder error', e);
                setStatusMsg('Erreur lors de la création du placeholder Lost&Found');
              } finally {
                setBusyAction('');
              }
            }} style={[styles.actionBtn, { marginLeft: 8, backgroundColor: '#6b7280' }]} testID="btn-create-lost-placeholder" disabled={busyAction==='create-lost-placeholder'}>
              {busyAction==='create-lost-placeholder' ? <ActivityIndicator color={COLORS.white} /> : <AlertTriangle size={18} color={COLORS.white} />}
              <Text style={styles.actionBtnText}>Créer Lost&Found</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.formRow, { marginTop: DIMENSIONS.SPACING.sm }]}> 
            <TextInput
              placeholder="Sexe global (male, female, random)"
              value={globalPetGender}
              onChangeText={(v) => setGlobalPetGender((v as any) === 'male' || (v as any) === 'female' ? (v as any) : 'random')}
              style={[styles.input, { flex: 0.8 }]}
              autoCapitalize="none"
              testID="input-global-pet-gender"
            />
            <TextInput
              placeholder="Couleur (ex: tigré)"
              value={globalPetColor}
              onChangeText={setGlobalPetColor}
              style={[styles.input, { flex: 1 }]}
              autoCapitalize="none"
              testID="input-global-pet-color"
            />
            <TextInput
              placeholder="Caractères (séparés par des virgules)"
              value={globalPetCharacters}
              onChangeText={setGlobalPetCharacters}
              style={[styles.input, { flex: 1.4 }]}
              autoCapitalize="none"
              testID="input-global-pet-characters"
            />
          </View>
          <View style={[styles.actionsRow, { marginTop: DIMENSIONS.SPACING.sm }]}>
            <TouchableOpacity onPress={seedLyonUsers} style={[styles.actionBtn, { marginRight: 8 }]} testID="btn-seed-lyon" disabled={busyAction==='seed-lyon'}>
              {busyAction==='seed-lyon' ? <ActivityIndicator color={COLORS.white} /> : <MapPin size={18} color={COLORS.white} />}
              <Text style={styles.actionBtnText}>Créer 10 utilisateurs (Lyon)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={seedMarseilleUsers} style={styles.actionBtn} testID="btn-seed-marseille" disabled={busyAction==='seed-marseille'}>
              {busyAction==='seed-marseille' ? <ActivityIndicator color={COLORS.white} /> : <MapPin size={18} color={COLORS.white} />}
              <Text style={styles.actionBtnText}>Créer 10 utilisateurs (Marseille)</Text>
            </TouchableOpacity>
          </View>
          {statusMsg ? (<Text style={styles.hint}>{statusMsg}</Text>) : null}
        </Section>

        <Section title="Création rapide d’utilisateurs & pets">
          <View style={styles.formRow}>
            <TextInput
              placeholder="Nombre à créer"
              keyboardType="number-pad"
              value={genCount}
              onChangeText={setGenCount}
              style={styles.input}
              testID="input-gen-count"
            />
            <TouchableOpacity onPress={quickGenerate} style={styles.smallBtn} testID="btn-quick-generate" disabled={busyAction==='gen'}>
              {busyAction==='gen' ? <ActivityIndicator color={COLORS.white} /> : <PlusCircle size={18} color={COLORS.white} />}
              <Text style={styles.smallBtnText}>Générer</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Crée des users test-xxxx avec adresse réelle géocodée et 1 pet associé</Text>
        </Section>

        <Section title="Validation des profils (photos + champs requis)">
          <View style={styles.formRow}>
            <TouchableOpacity onPress={validateAndFixUsers} style={styles.actionBtn} testID="btn-validate-users" disabled={busyAction==='validate'}>
              {busyAction==='validate' ? <ActivityIndicator color={COLORS.white} /> : <ShieldCheck size={18} color={COLORS.white} />}
              <Text style={styles.actionBtnText}>Vérifier et compléter</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Résultat: vérifiés {validationStats.checked} • corrigés {validationStats.fixed} • erreurs {validationStats.errors}</Text>
          {validationLog.length > 0 && (
            <View style={styles.listBox}>
              {validationLog.slice(-50).map((ln, idx) => (
                <View key={`vlog-${idx}`} style={styles.listItem} testID={`validation-log-${idx}`}>
                  <Text style={styles.itemSubtitle}>{ln}</Text>
                </View>
              ))}
            </View>
          )}
        </Section>

        <Section title="Purge de collections spécifiques">
          <View style={styles.formRow}>
            <TextInput
              placeholder="Collection (ex: users, pets)"
              value={purgeCollection}
              onChangeText={setPurgeCollection}
              style={styles.input}
              testID="input-purge-collection"
              autoCapitalize="none"
            />
            <TextInput
              placeholder="Max docs"
              keyboardType="number-pad"
              value={purgeLimit}
              onChangeText={setPurgeLimit}
              style={[styles.input, { flex: 0.6 }]}
              testID="input-purge-limit"
            />
            <TouchableOpacity onPress={purge} style={[styles.smallBtn, { marginLeft: 8 }]} testID="btn-purge" disabled={busyAction==='purge'}>
              {busyAction==='purge' ? <ActivityIndicator color={COLORS.white} /> : <Trash2 size={18} color={COLORS.white} />}
              <Text style={styles.smallBtnText}>Purger</Text>
            </TouchableOpacity>
          </View>
        </Section>

        <Section title="Bascule Premium / Pro / Cat-sitter">
          <View style={styles.formRow}>
            <TextInput
              placeholder="ID utilisateur"
              value={toggleUserId}
              onChangeText={setToggleUserId}
              style={styles.input}
              testID="input-toggle-user"
              autoCapitalize="none"
            />
          </View>
          <View style={[styles.actionsRow, { marginTop: 10 }]}>
            <TouchableOpacity onPress={() => toggleFlag('isPremium')} style={styles.smallBtn} testID="btn-toggle-premium" disabled={busyAction==='toggle-isPremium'}>
              {busyAction==='toggle-isPremium' ? <ActivityIndicator color={COLORS.white} /> : <Star size={18} color={COLORS.white} />}
              <Text style={styles.smallBtnText}>Premium</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleFlag('isProfessional')} style={[styles.smallBtn, { marginLeft: 8 }]} testID="btn-toggle-pro" disabled={busyAction==='toggle-isProfessional'}>
              {busyAction==='toggle-isProfessional' ? <ActivityIndicator color={COLORS.white} /> : <UserCog size={18} color={COLORS.white} />}
              <Text style={styles.smallBtnText}>Pro</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleFlag('isCatSitter')} style={[styles.smallBtn, { marginLeft: 8 }]} testID="btn-toggle-sitter" disabled={busyAction==='toggle-isCatSitter'}>
              {busyAction==='toggle-isCatSitter' ? <ActivityIndicator color={COLORS.white} /> : <UserCheck size={18} color={COLORS.white} />}
              <Text style={styles.smallBtnText}>Cat-sitter</Text>
            </TouchableOpacity>
          </View>
        </Section>

        <Section title="Impersonate (ouvrir l’app en tant qu’utilisateur)">
          <View style={styles.formRow}>
            <TextInput
              placeholder="ID utilisateur"
              value={impersonateId}
              onChangeText={setImpersonateId}
              style={styles.input}
              testID="input-impersonate-id"
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={impersonate} style={styles.smallBtn} testID="btn-impersonate" disabled={busyAction==='impersonate'}>
              {busyAction==='impersonate' ? <ActivityIndicator color={COLORS.white} /> : <LogIn size={18} color={COLORS.white} />}
              <Text style={styles.smallBtnText}>Impersonate</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={stopImpersonate} style={[styles.smallBtn, { marginLeft: 8, backgroundColor: COLORS.error }]} testID="btn-stop-impersonate" disabled={busyAction==='stop-impersonate'}>
              {busyAction==='stop-impersonate' ? <ActivityIndicator color={COLORS.white} /> : <LogOut size={18} color={COLORS.white} />}
              <Text style={styles.smallBtnText}>Stop</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Fonctionne sans changer l’auth Firebase. À utiliser en démo.</Text>
          {lastGeneratedIds.length > 0 && (
            <View style={styles.listBox}>
              {lastGeneratedIds.map(id => (
                <TouchableOpacity key={id} style={styles.listItem} onPress={() => setImpersonateId(id)} testID={`seed-id-${id}`}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Copy size={14} color={COLORS.darkGray} />
                    <Text style={[styles.itemSubtitle, { marginLeft: 6 }]}>{id}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Section>

        <Section title="Recherche utilisateur">
          <View style={styles.formRow}>
            <TextInput
              placeholder="ID utilisateur"
              value={lookupUserId}
              onChangeText={setLookupUserId}
              style={styles.input}
              autoCapitalize="none"
              testID="input-user-id"
            />
            <TouchableOpacity onPress={() => qc.invalidateQueries({ queryKey: ['admin-tools', 'user', lookupUserId] })} style={styles.smallBtn} testID="btn-load-user">
              <UserIcon size={18} color={COLORS.white} />
              <Text style={styles.smallBtnText}>Charger</Text>
            </TouchableOpacity>
          </View>
          {userDetailsQuery.isLoading && <ActivityIndicator />}
          {userDetailsQuery.error && (
            <Text style={styles.errorText} testID="user-error">{(userDetailsQuery.error as any)?.message ?? 'Erreur'}</Text>
          )}
          {userDetailsQuery.data && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{userDetailsQuery.data.user?.name ?? userDetailsQuery.data.user?.email ?? userDetailsQuery.data.user?.id}</Text>
              <Text style={styles.cardSubtitle}>Pets: {userDetailsQuery.data.pets.length} • Convos: {userDetailsQuery.data.convs.length} • Commandes: {userDetailsQuery.data.orders.length}</Text>
            </View>
          )}
        </Section>

        <Section title="Bookings (Cat-sitter)">
          <View style={styles.formRow}>
            <TextInput
              placeholder="ID cat-sitter (userId)"
              value={sitterId}
              onChangeText={setSitterId}
              style={styles.input}
              autoCapitalize="none"
              testID="input-sitter-id"
            />
            <TouchableOpacity onPress={() => qc.invalidateQueries({ queryKey: ['admin-tools', 'sitterBookings', sitterId] })} style={styles.smallBtn} testID="btn-load-sitter">
              <CalendarDays size={18} color={COLORS.white} />
              <Text style={styles.smallBtnText}>Charger</Text>
            </TouchableOpacity>
          </View>
          {sitterBookingsQuery.isLoading && <ActivityIndicator />}
          {sitterBookingsQuery.data && sitterBookingsQuery.data.length > 0 && (
            <View style={styles.listBox}>
              {sitterBookingsQuery.data.slice(0, 10).map((b: any) => (
                <View key={b.id} style={styles.listItem} testID={`booking-${b.id}`}>
                  <Text style={styles.itemTitle}>{b.status ?? 'pending'}</Text>
                  <Text style={styles.itemSubtitle}>Client: {b.customerId ?? '-'} • Début: {String((b.startDate as any)?.toDate?.()?.toLocaleString?.() ?? b.startDate ?? '-') }</Text>
                </View>
              ))}
            </View>
          )}
        </Section>

        <Section title="Messages">
          <View style={styles.formRow}>
            <TextInput
              placeholder="ID conversation"
              value={conversationId}
              onChangeText={setConversationId}
              style={styles.input}
              autoCapitalize="none"
              testID="input-conv-id"
            />
            <TouchableOpacity onPress={() => qc.invalidateQueries({ queryKey: ['admin-tools', 'conv', conversationId] })} style={styles.smallBtn} testID="btn-load-conv">
              <MessagesSquare size={18} color={COLORS.white} />
              <Text style={styles.smallBtnText}>Charger</Text>
            </TouchableOpacity>
          </View>
          {conversationMessagesQuery.isLoading && <ActivityIndicator />}
          {conversationMessagesQuery.data && conversationMessagesQuery.data.length > 0 && (
            <View style={styles.listBox}>
              {conversationMessagesQuery.data.slice(0, 20).map((m: any) => (
                <View key={m.id} style={styles.listItem} testID={`message-${m.id}`}>
                  <Text style={styles.itemTitle}>{m.senderId ?? '—'}</Text>
                  <Text style={styles.itemSubtitle}>{m.content ?? ''}</Text>
                </View>
              ))}
            </View>
          )}
        </Section>

        <View style={{ height: DIMENSIONS.SPACING.xl }} />
      </ScrollView>
    </SimpleErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  content: {
    padding: DIMENSIONS.SPACING.lg,
  },
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.SPACING.lg,
    padding: DIMENSIONS.SPACING.md,
    marginBottom: DIMENSIONS.SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(125,212,238,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DIMENSIONS.SPACING.md,
  },
  title: {
    fontSize: DIMENSIONS.FONT_SIZES.lg,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  subtitle: {
    marginTop: 4,
    color: COLORS.darkGray,
    fontSize: DIMENSIONS.FONT_SIZES.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(125,212,238,0.12)'
  },
  iconButtonText: {
    marginLeft: 6,
    color: COLORS.primary,
    fontWeight: '600' as const,
    fontSize: DIMENSIONS.FONT_SIZES.xs,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.SPACING.lg,
    padding: DIMENSIONS.SPACING.md,
    marginBottom: DIMENSIONS.SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DIMENSIONS.SPACING.sm,
  },
  sectionTitle: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(125,212,238,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statValue: {
    fontSize: DIMENSIONS.FONT_SIZES.lg,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  statLabel: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    color: COLORS.darkGray,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
  },
  actionBtnSecondary: {
    backgroundColor: 'rgba(125,212,238,0.12)',
  },
  actionBtnText: {
    marginLeft: 8,
    color: COLORS.white,
    fontWeight: '700' as const,
    fontSize: DIMENSIONS.FONT_SIZES.xs,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  smallBtnText: {
    marginLeft: 8,
    color: COLORS.white,
    fontWeight: '700' as const,
    fontSize: DIMENSIONS.FONT_SIZES.xs,
  },
  listBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 12,
  },
  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)'
  },
  itemTitle: {
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 2,
  },
  itemSubtitle: {
    color: COLORS.darkGray,
    fontSize: DIMENSIONS.FONT_SIZES.xs,
  },
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginTop: 8,
  },
  cardTitle: {
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  cardSubtitle: {
    color: COLORS.darkGray,
    marginTop: 4,
    fontSize: DIMENSIONS.FONT_SIZES.xs,
  },
  errorBox: {
    margin: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#ffd6d6',
  },
  errorTitle: {
    fontWeight: '700' as const,
    color: COLORS.error,
    marginBottom: 6,
  },
  errorText: {
    color: COLORS.error,
  },
  hint: {
    marginTop: 6,
    color: COLORS.darkGray,
    fontSize: DIMENSIONS.FONT_SIZES.xs,
  }
});
