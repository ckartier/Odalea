import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFirebaseUser } from './firebase-user-store';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';

export const [FavoritesContext, useFavorites] = createContextHook(() => {
  const { user } = useFirebaseUser();
  const queryClient = useQueryClient();
  const [favorites, setFavorites] = useState<string[]>([]);

  const favoritesQuery = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('[Favorites] No user ID, returning empty favorites');
        return [];
      }
      
      console.log('[Favorites] Fetching favorites for user:', user.id);
      const favoritesRef = collection(db, 'users', user.id, 'favorites');
      const snapshot = await getDocs(favoritesRef);
      const petIds = snapshot.docs.map(docSnap => docSnap.id);
      console.log('[Favorites] Loaded', petIds.length, 'favorites');
      return petIds;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (favoritesQuery.data) {
      setFavorites(favoritesQuery.data);
    }
  }, [favoritesQuery.data]);

  const addFavoriteMutation = useMutation({
    mutationFn: async (petId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      console.log('[Favorites] Adding favorite:', petId);
      const favoriteRef = doc(db, 'users', user.id, 'favorites', petId);
      await setDoc(favoriteRef, {
        petId,
        createdAt: new Date(),
      });
    },
    onSuccess: (_, petId) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      setFavorites(prev => [...prev, petId]);
      console.log('✅ Favorite added successfully');
    },
    onError: (error) => {
      console.error('❌ Error adding favorite:', error);
    }
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (petId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      console.log('[Favorites] Removing favorite:', petId);
      const favoriteRef = doc(db, 'users', user.id, 'favorites', petId);
      await deleteDoc(favoriteRef);
    },
    onSuccess: (_, petId) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      setFavorites(prev => prev.filter(id => id !== petId));
      console.log('✅ Favorite removed successfully');
    },
    onError: (error) => {
      console.error('❌ Error removing favorite:', error);
    }
  });

  const toggleFavorite = async (petId: string) => {
    if (favorites.includes(petId)) {
      return removeFavoriteMutation.mutateAsync(petId);
    } else {
      return addFavoriteMutation.mutateAsync(petId);
    }
  };

  const isFavorite = (petId: string): boolean => {
    return favorites.includes(petId);
  };

  const refreshFavorites = () => {
    queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
  };

  return {
    favorites,
    isLoading: favoritesQuery.isLoading,
    isError: favoritesQuery.isError,
    toggleFavorite,
    isFavorite,
    refreshFavorites,
    isTogglingFavorite: addFavoriteMutation.isPending || removeFavoriteMutation.isPending,
  };
});
