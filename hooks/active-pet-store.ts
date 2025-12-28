import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pet } from '@/types';
import { usePets } from './pets-store';

const ACTIVE_PET_KEY = 'activePetId';

export const [ActivePetContext, useActivePet] = createContextHook(() => {
  const { userPets } = usePets();
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadActivePet = async () => {
      try {
        const stored = await AsyncStorage.getItem(ACTIVE_PET_KEY);
        if (stored) {
          setActivePetId(stored);
        } else if (userPets.length > 0) {
          setActivePetId(userPets[0].id);
        }
      } catch (err) {
        console.error('❌ Error loading active pet:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivePet();
  }, [userPets]);

  useEffect(() => {
    if (userPets.length > 0 && !activePetId) {
      setActivePetId(userPets[0].id);
    }
  }, [userPets, activePetId]);

  const setActivePet = useCallback(async (petId: string | null) => {
    try {
      setActivePetId(petId);
      if (petId) {
        await AsyncStorage.setItem(ACTIVE_PET_KEY, petId);
      } else {
        await AsyncStorage.removeItem(ACTIVE_PET_KEY);
      }
    } catch (err) {
      console.error('❌ Error saving active pet:', err);
    }
  }, []);

  const activePet: Pet | undefined = userPets.find(p => p.id === activePetId);

  return {
    activePetId,
    activePet,
    setActivePet,
    isLoading,
  };
});
