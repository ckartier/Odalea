import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFirebaseUser } from './firebase-user-store';
import { doc, setDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase';

interface Favorite {
  id: string;
  userId: string;
  petId: string;
  createdAt: number;
}

export const [FavoritesContext, useFavorites] = createContextHook(() => {
  const { user } = useFirebaseUser();
  const queryClient = useQueryClient();

  const favoritesQuery = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const favoritesRef = collection(db, 'favorites');
      const q = query(favoritesRef, where('userId', '==', user.id));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Favorite[];
    },
    enabled: !!user?.id,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (petId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const favoriteId = `${user.id}_${petId}`;
      const favoriteRef = doc(db, 'favorites', favoriteId);
      
      const isFavorite = favoritesQuery.data?.some(f => f.petId === petId);
      
      if (isFavorite) {
        await deleteDoc(favoriteRef);
        console.log('✅ Favorite removed');
      } else {
        await setDoc(favoriteRef, {
          userId: user.id,
          petId,
          createdAt: Date.now()
        });
        console.log('✅ Favorite added');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
    onError: (error) => {
      console.error('❌ Error toggling favorite:', error);
    }
  });

  const isFavorite = (petId: string): boolean => {
    return favoritesQuery.data?.some(f => f.petId === petId) || false;
  };

  const toggleFavorite = async (petId: string) => {
    return toggleFavoriteMutation.mutateAsync(petId);
  };

  return {
    favorites: favoritesQuery.data || [],
    isLoading: favoritesQuery.isLoading,
    isFavorite,
    toggleFavorite,
    isTogglingFavorite: toggleFavoriteMutation.isPending,
  };
});
