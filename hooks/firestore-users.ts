import { useEffect, useMemo, useState, useCallback } from 'react';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/services/firebase';
import { User } from '@/types';

export interface UsersFilter {
  search: string;
  city: string | null;
  species: string | null;
}

const DEFAULT_FILTERS: UsersFilter = { search: '', city: null, species: null } as const;

function toUser(docData: any, id: string): User {
  const firstName = String(docData?.firstName ?? 'User');
  const lastName = String(docData?.lastName ?? id.slice(0, 6));
  const pseudo = String(docData?.pseudo ?? `${firstName}${lastName}`.toLowerCase());
  return {
    id,
    firstName,
    lastName,
    name: String(docData?.name ?? `${firstName} ${lastName}`),
    pseudo,
    pseudoLower: String(docData?.pseudoLower ?? pseudo.toLowerCase()),
    photo: docData?.photo ?? docData?.photoURL,
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
    pets: Array.isArray(docData?.pets) ? docData.pets : [],
    animalType: docData?.animalType,
    animalName: docData?.animalName,
    isProfessional: Boolean(docData?.isProfessional ?? false),
    professionalData: docData?.professionalData,
    isActive: Boolean(docData?.isActive ?? true),
    profileComplete: Boolean(docData?.profileComplete ?? true),
  } as User;
}

export function useUsersDirectory() {
  const [filters, setFilters] = useState<UsersFilter>(DEFAULT_FILTERS);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('usersDirectoryFilters');
        if (saved) {
          const parsed = JSON.parse(saved) as UsersFilter;
          setFilters({
            search: String(parsed?.search ?? ''),
            city: parsed?.city ?? null,
            species: parsed?.species ?? null,
          });
        }
      } catch (e) {
        console.log('[useUsersDirectory] Failed loading filters', e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('usersDirectoryFilters', JSON.stringify(filters));
      } catch (e) {
        console.log('[useUsersDirectory] Failed saving filters', e);
      }
    })();
  }, [filters]);

  const queryKey = useMemo(() => ['users-directory', filters] as const, [filters]);

  const usersQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const usersRef = collection(db, 'users');
      const clauses: any[] = [where('isActive', '==', true), where('profileComplete', '==', true)];
      if (filters.city) clauses.push(where('city', '==', filters.city));
      const q = query(usersRef, ...clauses, orderBy('name'), limit(20));
      const snap = await getDocs(q);
      let items = snap.docs.map(d => toUser(d.data(), d.id));
      if (filters.search) {
        const s = filters.search.toLowerCase();
        items = items.filter(u => (u.name?.toLowerCase?.() ?? '').includes(s) || (u.pseudoLower ?? '').includes(s));
      }
      if (filters.species) {
        items = items.filter(u => Array.isArray(u.pets) && u.pets.some(p => (p.type || (p as any)?.species) === filters.species));
      }
      items = items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      return items;
    },
  });

  const setSearch = useCallback((search: string) => setFilters(prev => ({ ...prev, search })), []);
  const setCity = useCallback((city: string | null) => setFilters(prev => ({ ...prev, city })), []);
  const setSpecies = useCallback((species: string | null) => setFilters(prev => ({ ...prev, species })), []);

  return { filters, setSearch, setCity, setSpecies, usersQuery };
}
