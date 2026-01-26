import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import { Pet } from '@/types';
import { useUserPets } from './useUserPets';
import { useFirebaseUser } from './firebase-user-store';

const ACTIVE_PET_KEY = 'activePetId';

export const [ActivePetContext, useActivePet] = createContextHook(() => {
  const { pets: userPets, isLoading: petsLoading } = useUserPets();
  const { user } = useFirebaseUser();
  const [activePetId, setActivePetIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadActivePet = async () => {
      try {
        // First check user's activePetId from Firestore (via user object)
        const userActivePetId = (user as any)?.activePetId;
        
        if (userActivePetId) {
          setActivePetIdState(userActivePetId);
          await AsyncStorage.setItem(ACTIVE_PET_KEY, userActivePetId);
        } else {
          // Fallback to AsyncStorage
          const stored = await AsyncStorage.getItem(ACTIVE_PET_KEY);
          if (stored) {
            setActivePetIdState(stored);
          } else if (userPets.length > 0) {
            setActivePetIdState(userPets[0].id);
          }
        }
      } catch (err) {
        console.error('[ActivePetStore] Error loading active pet:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (!petsLoading) {
      loadActivePet();
    }
  }, [userPets, petsLoading, user]);

  // Auto-select first pet if current active pet is deleted or doesn't exist
  useEffect(() => {
    if (petsLoading) return;
    
    const petExists = userPets.some(p => p.id === activePetId);
    
    if (userPets.length > 0 && (!activePetId || !petExists)) {
      console.log('[ActivePetStore] Auto-selecting first pet');
      setActivePetIdState(userPets[0].id);
      AsyncStorage.setItem(ACTIVE_PET_KEY, userPets[0].id).catch(() => {});
    } else if (userPets.length === 0 && activePetId) {
      console.log('[ActivePetStore] No pets, clearing active pet');
      setActivePetIdState(null);
      AsyncStorage.removeItem(ACTIVE_PET_KEY).catch(() => {});
    }
  }, [userPets, activePetId, petsLoading]);

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

  const activePet: Pet | undefined = userPets.find(p => p.id === activePetId);

  return {
    activePetId,
    activePet,
    setActivePet,
    isLoading: isLoading || petsLoading,
    userPets,
  };
});
