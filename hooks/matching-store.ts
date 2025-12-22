import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { databaseService } from '@/services/database';
import { sendPushNotification } from '@/services/notifications';
import { Pet } from '@/types';

export const [MatchingContext, useMatching] = createContextHook(() => {
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [showMatchModal, setShowMatchModal] = useState<boolean>(false);
  const [matchedPet, setMatchedPet] = useState<Pet | null>(null);

  const discoveryQuery = useQuery({
    queryKey: ['discovery-pets', selectedPetId],
    queryFn: async () => {
      if (!selectedPetId) return [];
      return await databaseService.petMatching.getDiscoveryPets(selectedPetId, 20);
    },
    enabled: !!selectedPetId,
  });

  const matchesQuery = useQuery({
    queryKey: ['pet-matches', selectedPetId],
    queryFn: async () => {
      if (!selectedPetId) return [];
      return await databaseService.petMatching.getPetMatches(selectedPetId);
    },
    enabled: !!selectedPetId,
  });

  const likeMutation = useMutation({
    mutationFn: async ({ 
      fromPetId, 
      toPet, 
      userId 
    }: { 
      fromPetId: string; 
      toPet: Pet; 
      userId: string;
    }) => {
      console.log('🐾 Liking pet:', { fromPetId, toPetId: toPet.id, userId });
      const result = await databaseService.petMatching.likePet(fromPetId, toPet.id, userId);
      
      if (result.matched) {
        console.log('🎉 It\'s a match!', result.matchId);
        setMatchedPet(toPet);
        setShowMatchModal(true);

        try {
          const toPetOwner = await databaseService.user.getUser(toPet.ownerId);
          if (toPetOwner?.pushToken) {
            const fromPet = await databaseService.pet.getPetsByOwner(userId);
            const fromPetName = fromPet.find(p => p.id === fromPetId)?.name || 'Un animal';
            
            await sendPushNotification(
              toPetOwner.pushToken,
              '🎉 Nouveau match!',
              `${fromPetName} et ${toPet.name} se sont likés mutuellement!`,
              {
                type: 'pet_match',
                matchId: result.matchId,
                petId: toPet.id,
              }
            );
            console.log('✅ Match notification sent');
          }
        } catch (notifError) {
          console.warn('⚠️ Failed to send match notification:', notifError);
        }
      }
      
      return result;
    },
    onSuccess: () => {
      discoveryQuery.refetch();
      matchesQuery.refetch();
    },
  });

  const passMutation = useMutation({
    mutationFn: async ({ fromPetId, toPetId }: { fromPetId: string; toPetId: string }) => {
      console.log('👎 Passing pet:', { fromPetId, toPetId });
      await databaseService.petMatching.passPet(fromPetId, toPetId);
    },
    onSuccess: () => {
      discoveryQuery.refetch();
    },
  });

  const unmatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      await databaseService.petMatching.unmatchPets(matchId);
    },
    onSuccess: () => {
      matchesQuery.refetch();
    },
  });

  const { mutate: mutateLike } = likeMutation;
  const { mutate: mutatePass } = passMutation;
  const { mutate: mutateUnmatch } = unmatchMutation;

  const likePet = useCallback((fromPetId: string, toPet: Pet, userId: string) => {
    mutateLike({ fromPetId, toPet, userId });
  }, [mutateLike]);

  const passPet = useCallback((fromPetId: string, toPetId: string) => {
    mutatePass({ fromPetId, toPetId });
  }, [mutatePass]);

  const unmatchPets = useCallback((matchId: string) => {
    mutateUnmatch(matchId);
  }, [mutateUnmatch]);

  const closeMatchModal = useCallback(() => {
    setShowMatchModal(false);
    setMatchedPet(null);
  }, []);

  return {
    selectedPetId,
    setSelectedPetId,
    discoveryPets: discoveryQuery.data || [],
    matches: matchesQuery.data || [],
    isLoadingDiscovery: discoveryQuery.isLoading,
    isLoadingMatches: matchesQuery.isLoading,
    likePet,
    passPet,
    unmatchPets,
    isLiking: likeMutation.isPending,
    isPassing: passMutation.isPending,
    showMatchModal,
    matchedPet,
    closeMatchModal,
    refetchDiscovery: discoveryQuery.refetch,
    refetchMatches: matchesQuery.refetch,
  };
});
