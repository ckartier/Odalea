import createContextHook from '@nkzw/create-context-hook';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pet, User } from '@/types';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/services/firebase';

export const [PetsContext, usePets] = createContextHook(() => {
  const [nearbyPets, setNearbyPets] = useState<Pet[]>([]);
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [isLoadingUserPets, setIsLoadingUserPets] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserPets = async () => {
      try {
        setIsLoadingUserPets(true);
        const storedPets = await AsyncStorage.getItem('userPets');
        if (storedPets) {
          const parsed: Pet[] = JSON.parse(storedPets);
          setUserPets(Array.isArray(parsed) ? parsed : []);
        }
      } catch (err) {
        setError('Failed to load pets data');
        console.error('Error loading pets:', err);
      } finally {
        setIsLoadingUserPets(false);
      }
    };

    loadUserPets();
  }, []);

  const allPetsQuery = useQuery({
    queryKey: ['allPets-firestore'],
    queryFn: async () => {
      const petsRef = collection(db, 'pets');
      const q = query(petsRef, limit(50));
      const snap = await getDocs(q);
      const items: Pet[] = snap.docs.map(d => {
        const data: any = d.data();
        const pet: Pet = {
          id: String(d.id),
          ownerId: String(data?.ownerId ?? ''),
          name: String(data?.name ?? 'Animal'),
          type: String(data?.type ?? data?.species ?? 'cat'),
          breed: String(data?.breed ?? ''),
          gender: (data?.gender === 'male' || data?.gender === 'female') ? data.gender : 'male',
          dateOfBirth: String(data?.dateOfBirth ?? '2018-01-01'),
          color: String(data?.color ?? ''),
          character: Array.isArray(data?.character) ? data.character : [],
          distinctiveSign: data?.distinctiveSign,
          vaccinationDates: Array.isArray(data?.vaccinationDates) ? data.vaccinationDates : [],
          microchipNumber: data?.microchipNumber,
          mainPhoto: String(data?.mainPhoto ?? data?.photoURL ?? 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131'),
          galleryPhotos: Array.isArray(data?.galleryPhotos) ? data.galleryPhotos : [],
          vet: data?.vet,
          walkTimes: Array.isArray(data?.walkTimes) ? data.walkTimes : [],
          isPrimary: Boolean(data?.isPrimary ?? false),
          location: data?.location && typeof data.location.latitude === 'number' && typeof data.location.longitude === 'number'
            ? { latitude: data.location.latitude, longitude: data.location.longitude }
            : undefined,
        };
        return pet;
      });
      return items;
    },
  });

  useEffect(() => {
    if (allPetsQuery.data) {
      setNearbyPets(allPetsQuery.data);
    }
  }, [allPetsQuery.data]);

  const savePets = async (pets: Pet[]) => {
    try {
      setUserPets(pets);
      await AsyncStorage.setItem('userPets', JSON.stringify(pets));
    } catch (err) {
      setError('Failed to save pets data');
      console.error('Error saving pets:', err);
    }
  };

  const addPet = (pet: Pet) => {
    const updatedPets = [...userPets, pet];
    void savePets(updatedPets);
  };

  const updatePet = (id: string, updatedPet: Partial<Pet>) => {
    const updatedPets = userPets.map(p => (p.id === id ? { ...p, ...updatedPet } : p));
    void savePets(updatedPets);
  };

  const deletePet = (id: string) => {
    const updatedPets = userPets.filter(p => p.id !== id);
    void savePets(updatedPets);
  };

  const syncUserPets = (pets: Pet[]) => {
    setUserPets(pets);
  };

  const getPet = (petId: string): Pet | undefined => {
    const userPet = userPets.find(pet => pet.id === petId);
    if (userPet) return userPet;
    if (allPetsQuery.data) {
      return allPetsQuery.data.find(pet => pet.id === petId);
    }
    return nearbyPets.find(pet => pet.id === petId);
  };

  const ownersMap = useMemo(() => {
    const map = new Map<string, User>();
    return map;
  }, []);

  const getPetOwner = (_petId: string): User | undefined => {
    return undefined;
  };

  return {
    userPets: userPets || [],
    nearbyPets: nearbyPets || [],
    allPets: allPetsQuery.data || [],
    isLoading: allPetsQuery.isLoading || isLoadingUserPets,
    addPet,
    updatePet,
    deletePet,
    syncUserPets,
    getPet,
    getPetOwner,
    error,
  };
});