import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '@/services/firebase';
import { Pet } from '@/types';
import { sanitizeForFirestore } from '@/lib/firestore-sanitizer';

interface UseUserPetsReturn {
  pets: Pet[];
  isLoading: boolean;
  error: string | null;
  addPet: (petData: Omit<Pet, 'id' | 'ownerId'>) => Promise<{ success: boolean; petId?: string; error?: string }>;
  updatePet: (petId: string, petData: Partial<Pet>) => Promise<{ success: boolean; error?: string }>;
  deletePet: (petId: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => void;
  isAddingPet: boolean;
  isUpdatingPet: boolean;
  isDeletingPet: boolean;
}

export function useUserPets(): UseUserPetsReturn {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      console.log('[useUserPets] No user authenticated, clearing pets');
      setPets([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    console.log('[useUserPets] Setting up real-time listener for user:', userId);
    setIsLoading(true);
    setError(null);

    const petsRef = collection(db, 'pets');
    const q = query(
      petsRef,
      where('ownerId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const petsData: Pet[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ownerId: String(data.ownerId ?? ''),
            name: String(data.name ?? 'Animal'),
            type: String(data.type ?? data.species ?? 'cat'),
            breed: String(data.breed ?? ''),
            gender: data.gender === 'male' || data.gender === 'female' ? data.gender : 'male',
            dateOfBirth: String(data.dateOfBirth ?? ''),
            color: String(data.color ?? ''),
            character: Array.isArray(data.character) ? data.character : [],
            distinctiveSign: data.distinctiveSign ?? undefined,
            vaccinationDates: Array.isArray(data.vaccinationDates) ? data.vaccinationDates : [],
            microchipNumber: data.microchipNumber ?? undefined,
            mainPhoto: String(data.mainPhoto ?? data.photoURL ?? ''),
            galleryPhotos: Array.isArray(data.galleryPhotos) ? data.galleryPhotos : [],
            vet: data.vet ?? undefined,
            walkTimes: Array.isArray(data.walkTimes) ? data.walkTimes : [],
            isPrimary: Boolean(data.isPrimary ?? false),
            location: data.location ?? undefined,
          } as Pet;
        });

        console.log(`[useUserPets] Loaded ${petsData.length} pets for user ${userId}`);
        setPets(petsData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[useUserPets] Error listening to pets:', err);
        const errorMessage = err?.message?.includes('permission-denied')
          ? 'Accès refusé. Vérifiez vos permissions.'
          : 'Erreur lors du chargement des animaux.';
        setError(errorMessage);
        setIsLoading(false);
        setPets([]);
      }
    );

    return () => {
      console.log('[useUserPets] Cleaning up listener');
      unsubscribe();
    };
  }, [refetchTrigger]);

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  const addPetMutation = useMutation({
    mutationFn: async (petData: Omit<Pet, 'id' | 'ownerId'>) => {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('Utilisateur non connecté');
      }

      const petId = `pet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const petRef = doc(db, 'pets', petId);

      // Ensure compatibility fields are written (species/photoURL alongside type/mainPhoto)
      const compatiblePetData = {
        ...petData,
        // Write both field names for compatibility
        type: petData.type || 'cat',
        species: petData.type || 'cat', // Alias for type
        mainPhoto: petData.mainPhoto || '',
        photoURL: petData.mainPhoto || '', // Alias for mainPhoto
      };

      const newPet = sanitizeForFirestore({
        ...compatiblePetData,
        id: petId,
        ownerId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('[useUserPets] Creating pet with compat fields:', petId);
      await setDoc(petRef, newPet);
      console.log('[useUserPets] Pet created successfully:', petId);

      return { petId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPets'] });
    },
    onError: (err) => {
      console.error('[useUserPets] Error adding pet:', err);
    },
  });

  const updatePetMutation = useMutation({
    mutationFn: async ({ petId, petData }: { petId: string; petData: Partial<Pet> }) => {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('Utilisateur non connecté');
      }

      const petRef = doc(db, 'pets', petId);
      
      // Ensure compatibility fields are updated (species/photoURL alongside type/mainPhoto)
      const compatiblePetData: Record<string, unknown> = { ...petData };
      if (petData.type !== undefined) {
        compatiblePetData.species = petData.type; // Keep species in sync
      }
      if (petData.mainPhoto !== undefined) {
        compatiblePetData.photoURL = petData.mainPhoto; // Keep photoURL in sync
      }
      
      const updateData = sanitizeForFirestore({
        ...compatiblePetData,
        updatedAt: serverTimestamp(),
      });

      console.log('[useUserPets] Updating pet with compat fields:', petId);
      await updateDoc(petRef, updateData);
      console.log('[useUserPets] Pet updated successfully:', petId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPets'] });
    },
    onError: (err) => {
      console.error('[useUserPets] Error updating pet:', err);
    },
  });

  const deletePetMutation = useMutation({
    mutationFn: async (petId: string) => {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('Utilisateur non connecté');
      }

      const petToDelete = pets.find((p) => p.id === petId);
      
      console.log('[useUserPets] Deleting pet:', petId);
      
      // Delete pet document
      const petRef = doc(db, 'pets', petId);
      await deleteDoc(petRef);
      console.log('[useUserPets] Pet document deleted:', petId);

      // Try to delete associated images from Storage (best effort)
      if (petToDelete) {
        const imagesToDelete: string[] = [];
        
        if (petToDelete.mainPhoto && petToDelete.mainPhoto.includes('firebase')) {
          imagesToDelete.push(petToDelete.mainPhoto);
        }
        
        if (petToDelete.galleryPhotos) {
          imagesToDelete.push(
            ...petToDelete.galleryPhotos.filter((url) => url.includes('firebase'))
          );
        }

        for (const imageUrl of imagesToDelete) {
          try {
            // Extract path from URL
            const urlObj = new URL(imageUrl);
            const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
            if (pathMatch) {
              const storagePath = decodeURIComponent(pathMatch[1]);
              const imageRef = ref(storage, storagePath);
              await deleteObject(imageRef);
              console.log('[useUserPets] Deleted image:', storagePath);
            }
          } catch (imgErr) {
            console.warn('[useUserPets] Could not delete image (non-blocking):', imgErr);
          }
        }
      }

      return { deletedPetId: petId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPets'] });
      queryClient.invalidateQueries({ queryKey: ['activePet'] });
    },
    onError: (err) => {
      console.error('[useUserPets] Error deleting pet:', err);
    },
  });

  const addPet = useCallback(
    async (petData: Omit<Pet, 'id' | 'ownerId'>) => {
      try {
        const result = await addPetMutation.mutateAsync(petData);
        return { success: true, petId: result.petId };
      } catch (err: any) {
        return { success: false, error: err?.message ?? 'Erreur lors de la création' };
      }
    },
    [addPetMutation]
  );

  const updatePet = useCallback(
    async (petId: string, petData: Partial<Pet>) => {
      try {
        await updatePetMutation.mutateAsync({ petId, petData });
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message ?? 'Erreur lors de la mise à jour' };
      }
    },
    [updatePetMutation]
  );

  const deletePet = useCallback(
    async (petId: string) => {
      try {
        await deletePetMutation.mutateAsync(petId);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message ?? 'Erreur lors de la suppression' };
      }
    },
    [deletePetMutation]
  );

  return {
    pets,
    isLoading,
    error,
    addPet,
    updatePet,
    deletePet,
    refetch,
    isAddingPet: addPetMutation.isPending,
    isUpdatingPet: updatePetMutation.isPending,
    isDeletingPet: deletePetMutation.isPending,
  };
}
