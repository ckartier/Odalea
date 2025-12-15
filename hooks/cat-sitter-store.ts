import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { petSitterService, userService } from '@/services/database';

export interface CustomService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  icon: string;
  isActive: boolean;
}

export interface CatSitterProfile {
  id: string;
  userId: string;
  isActive: boolean;
  hourlyRate: number;
  description: string;
  services: string[];
  customServices?: CustomService[];
  availability: {
    [key: string]: { start: string; end: string; available: boolean };
  };
  photos: string[];
  experience: string;
  petTypes: string[];
  languages: string[];
  insurance: boolean;
  emergencyContact: boolean;
  responseTime: string;
  totalBookings: number;
  rating: number;
  reviewCount: number;
  radiusKm: number;
  createdAt: number;
  updatedAt: number;
}

export interface BookingRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  petName: string;
  petType: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  totalPrice: number;
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  services: string[];
  createdAt: number;
}

export interface CatSitterMessage {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatar?: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  bookingId?: string;
}

const defaultAvailability = {
  monday: { start: '08:00', end: '18:00', available: true },
  tuesday: { start: '08:00', end: '18:00', available: true },
  wednesday: { start: '08:00', end: '18:00', available: true },
  thursday: { start: '08:00', end: '18:00', available: true },
  friday: { start: '08:00', end: '18:00', available: true },
  saturday: { start: '09:00', end: '17:00', available: true },
  sunday: { start: '10:00', end: '16:00', available: false },
};

const mockBookingRequests: BookingRequest[] = [
  {
    id: 'booking-1',
    clientId: 'client-1',
    clientName: 'Sophie Martin',
    clientAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100',
    petName: 'Luna',
    petType: 'Chat',
    startDate: '2024-02-15',
    endDate: '2024-02-17',
    totalHours: 6,
    totalPrice: 90,
    message: 'Bonjour, j\'aimerais réserver vos services pour garder Luna pendant mon week-end. Elle est très calme et sociable.',
    status: 'pending',
    services: ['Pet Sitting', 'Feeding'],
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'booking-2',
    clientId: 'client-2',
    clientName: 'Pierre Durand',
    clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100',
    petName: 'Max',
    petType: 'Chien',
    startDate: '2024-02-20',
    endDate: '2024-02-22',
    totalHours: 8,
    totalPrice: 120,
    message: 'Salut ! Max a besoin d\'une promenade quotidienne et de compagnie. Il adore jouer !',
    status: 'accepted',
    services: ['Pet Sitting', 'Dog Walking'],
    createdAt: Date.now() - 7200000,
  },
];

const mockMessages: CatSitterMessage[] = [
  {
    id: 'msg-1',
    fromId: 'client-1',
    fromName: 'Sophie Martin',
    fromAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100',
    message: 'Bonjour, êtes-vous disponible ce week-end pour garder Luna ?',
    timestamp: Date.now() - 1800000,
    isRead: false,
    bookingId: 'booking-1',
  },
  {
    id: 'msg-2',
    fromId: 'client-3',
    fromName: 'Claire Rousseau',
    fromAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100',
    message: 'Merci pour l\'excellent service la semaine dernière ! Milo était très heureux.',
    timestamp: Date.now() - 86400000,
    isRead: true,
  },
];

export const [CatSitterContext, useCatSitter] = createContextHook(() => {
  const [profile, setProfile] = useState<CatSitterProfile | null>(null);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>(mockBookingRequests);
  const [messages, setMessages] = useState<CatSitterMessage[]>(mockMessages);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Load cat-sitter profile
  const loadProfile = async (userId: string) => {
    try {
      console.log('🔄 Loading cat sitter profile from Firebase for user:', userId);
      const firebaseProfile = await petSitterService.getProfile(userId);
      
      if (firebaseProfile) {
        console.log('✅ Cat sitter profile loaded from Firebase');
        setProfile(firebaseProfile as CatSitterProfile);
        return firebaseProfile;
      } else {
        console.log('ℹ️ No cat sitter profile found in Firebase');
        // Try AsyncStorage as fallback
        const storedProfile = await AsyncStorage.getItem('catSitterProfile');
        if (storedProfile) {
          console.log('✅ Cat sitter profile loaded from AsyncStorage');
          const parsed = JSON.parse(storedProfile);
          setProfile(parsed);
          return parsed;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to load cat-sitter data:', error);
      return null;
    }
  };

  useEffect(() => {
    setInitializing(false);
  }, []);

  // Save profile to storage when it changes
  useEffect(() => {
    const saveProfile = async () => {
      try {
        if (profile) {
          await AsyncStorage.setItem('catSitterProfile', JSON.stringify(profile));
        } else {
          await AsyncStorage.removeItem('catSitterProfile');
        }
      } catch (error) {
        console.error('Failed to save cat-sitter profile:', error);
      }
    };

    if (!initializing) {
      saveProfile();
    }
  }, [profile, initializing]);

  const createProfile = async (userId: string, profileData: Partial<CatSitterProfile>) => {
    setLoading(true);
    try {
      const newProfile: CatSitterProfile = {
        id: userId,
        userId,
        isActive: true,
        hourlyRate: profileData.hourlyRate ?? 15,
        description: profileData.description ?? '',
        services: profileData.services ?? ['Pet Sitting'],
        customServices: profileData.customServices ?? [],
        availability: profileData.availability ?? defaultAvailability,
        photos: profileData.photos ?? [],
        experience: profileData.experience ?? '1 year',
        petTypes: profileData.petTypes ?? ['Cats'],
        languages: profileData.languages ?? ['French'],
        insurance: profileData.insurance ?? false,
        emergencyContact: profileData.emergencyContact ?? false,
        responseTime: '< 2 hours',
        totalBookings: 0,
        rating: 5.0,
        reviewCount: 0,
        radiusKm: profileData.radiusKm ?? 5,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      // Save to Firebase
      await petSitterService.saveProfile(userId, newProfile);
      console.log('✅ Cat sitter profile saved to Firebase');
      
      // Update user to mark as cat sitter
      const user = await userService.getUser(userId);
      if (user && !user.isCatSitter) {
        await userService.saveUser({ ...user, isCatSitter: true });
        console.log('✅ User marked as cat sitter');
      }
      
      setProfile(newProfile);
      return { success: true, profile: newProfile };
    } catch (error) {
      console.error('❌ Failed to create cat-sitter profile:', error);
      return { success: false, error: 'Failed to create cat-sitter profile' };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<CatSitterProfile>) => {
    if (!profile) return { success: false, error: 'No profile found' };
    setLoading(true);
    try {
      const updatedProfile = {
        ...profile,
        ...updates,
        updatedAt: Date.now(),
      };
      
      // Save to Firebase
      await petSitterService.saveProfile(profile.userId, updatedProfile);
      console.log('✅ Cat sitter profile updated in Firebase');
      
      setProfile(updatedProfile);
      return { success: true, profile: updatedProfile };
    } catch (error) {
      console.error('❌ Failed to update profile:', error);
      return { success: false, error: 'Failed to update profile' };
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    if (!profile) return { success: false, error: 'No profile found' };
    return updateProfile({ isActive: !profile.isActive });
  };

  const updateAvailability = async (day: string, schedule: { start: string; end: string; available: boolean }) => {
    if (!profile) return { success: false, error: 'No profile found' };
    const newAvailability = {
      ...profile.availability,
      [day]: schedule,
    };
    return updateProfile({ availability: newAvailability });
  };

  const respondToBooking = async (bookingId: string, response: 'accepted' | 'declined', message?: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBookingRequests(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: response }
            : booking
        )
      );
      
      // Add a response message
      if (message) {
        const responseMessage: CatSitterMessage = {
          id: `msg-${Date.now()}`,
          fromId: 'me',
          fromName: 'Moi',
          message,
          timestamp: Date.now(),
          isRead: true,
          bookingId,
        };
        setMessages(prev => [responseMessage, ...prev]);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to respond to booking' };
    } finally {
      setLoading(false);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isRead: true }
          : msg
      )
    );
  };

  const sendMessage = async (toId: string, message: string, bookingId?: string) => {
    const newMessage: CatSitterMessage = {
      id: `msg-${Date.now()}`,
      fromId: 'me',
      fromName: 'Moi',
      message,
      timestamp: Date.now(),
      isRead: true,
      bookingId,
    };
    setMessages(prev => [newMessage, ...prev]);
    return { success: true };
  };

  const getUnreadMessagesCount = () => {
    return messages.filter(msg => !msg.isRead && msg.fromId !== 'me').length;
  };

  const getPendingBookingsCount = () => {
    return bookingRequests.filter(booking => booking.status === 'pending').length;
  };

  return {
    profile,
    bookingRequests,
    messages,
    loading,
    loadProfile,
    createProfile,
    updateProfile,
    toggleAvailability,
    updateAvailability,
    respondToBooking,
    markMessageAsRead,
    sendMessage,
    getUnreadMessagesCount,
    getPendingBookingsCount,
  };
});