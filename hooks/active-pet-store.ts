import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import { Pet } from '@/types';
import { useUserPets } from './useUserPets';

const ACTIVE_PET_KEY = 'activePetId';

export const [ActivePetContext, useActivePet] = createContextHook(() => {
  const [activePetId, setActivePetIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load active pet from AsyncStorage on mount
  useEffect(() => {
    const loadActivePet = async () => {
      try {
        const stored = await AsyncStorage.getItem(ACTIVE_PET_KEY);
        if (stored) {
          console.log('[ActivePetStore] Loaded active pet from storage:', stored);
          setActivePetIdState(stored);
        }
      } catch (err) {
        console.error('[ActivePetStore] Error loading active pet:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivePet();
  }, []);

  const setActivePet = useCallback(async (petId: string | null) => {
    try {
      console.log('[ActivePetStore] Setting active pet:', petId);
      setActivePetIdState(petId);
      
      // Save to AsyncStorage
      if (petId) {
        await AsyncStorage.setItem(ACTIVE_PET_KEY, petId);
      } else {
        await AsyncStorage.removeItem(ACTIVE_PET_KEY);
      }
      
      // Sync to Firestore user document
      const userId = auth.currentUser?.uid;
      if (userId) {
        try {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            activePetId: petId ?? null,
            updatedAt: serverTimestamp(),
          });
          console.log('[ActivePetStore] Synced activePetId to Firestore');
        } catch (firestoreErr) {
          console.warn('[ActivePetStore] Could not sync to Firestore:', firestoreErr);
        }
      }
    } catch (err) {
      console.error('[ActivePetStore] Error saving active pet:', err);
    }
  }, []);

  return {
    activePetId,
    setActivePet,
    isLoading,
  };
});

// Helper hook to get the active pet with pets data - use this in components
export function useActivePetWithData() {
  const { activePetId, setActivePet, isLoading: activePetLoading } = useActivePet();
  const { pets: userPets, isLoading: petsLoading } = useUserPets();

  // Auto-select first pet if no active pet is set
  useEffect(() => {
    if (petsLoading || activePetLoading) return;
    
    const petExists = userPets.some(p => p.id === activePetId);
    
    if (userPets.length > 0 && (!activePetId || !petExists)) {
      console.log('[useActivePetWithData] Auto-selecting first pet');
      setActivePet(userPets[0].id);
    } else if (userPets.length === 0 && activePetId) {
      console.log('[useActivePetWithData] No pets, clearing active pet');
      setActivePet(null);
    }
  }, [userPets, activePetId, petsLoading, activePetLoading, setActivePet]);

  const activePet: Pet | undefined = userPets.find(p => p.id === activePetId);

  return {
    activePetId,
    activePet,
    setActivePet,
    isLoading: activePetLoading || petsLoading,
    userPets,
  };
}
