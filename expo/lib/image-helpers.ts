import { Pet, User } from '@/types';

export const getPetImageUrl = (pet: Pet | null | undefined): string | undefined => {
  if (!pet) return undefined;
  
  const url = pet.mainPhoto || pet.galleryPhotos?.[0];
  
  if (!url) return undefined;
  
  if (url.startsWith('gs://')) {
    console.warn('⚠️ Pet image URL is gs:// instead of https:', url);
    return undefined;
  }
  
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    console.warn('⚠️ Pet image URL is not a valid URL:', url);
    return undefined;
  }
  
  return url;
};

export const getUserAvatarUrl = (user: User | null | undefined): string | undefined => {
  if (!user) return undefined;
  
  const url = user.photo || user.animalPhoto;
  
  if (!url) return undefined;
  
  if (url.startsWith('gs://')) {
    console.warn('⚠️ User avatar URL is gs:// instead of https:', url);
    return undefined;
  }
  
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    console.warn('⚠️ User avatar URL is not a valid URL:', url);
    return undefined;
  }
  
  return url;
};

export const getPostImageUrls = (post: any): string[] => {
  if (!post?.images || !Array.isArray(post.images)) return [];
  
  return post.images.filter((url: string) => {
    if (!url) return false;
    
    if (url.startsWith('gs://')) {
      console.warn('⚠️ Post image URL is gs:// instead of https:', url);
      return false;
    }
    
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      console.warn('⚠️ Post image URL is not a valid URL:', url);
      return false;
    }
    
    return true;
  });
};

export const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return (url.startsWith('https://') || url.startsWith('http://')) && !url.startsWith('gs://');
};

export const DEFAULT_PET_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&crop=face';
export const DEFAULT_USER_PLACEHOLDER = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face';
