import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseService } from '@/services/database';
import { useUser } from './user-store';

export interface CatSitter {
  id: string;
  userId: string;
  name: string;
  photo?: string;
  bio: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  services: string[];
  hourlyRate: number;
  availability: {
    [date: string]: {
      morning: boolean;
      afternoon: boolean;
      evening: boolean;
      overnight: boolean;
    };
  };
  rating: number;
  reviewCount: number;
  badges: string[];
  gallery: string[];
  isVerified: boolean;
  responseTime: string; // e.g., "Usually responds within 1 hour"
}

export interface BookingRequest {
  id: string;
  catSitterId: string;
  clientId: string;
  petIds: string[];
  date: string;
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'overnight';
  duration: number; // in hours
  totalPrice: number;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  chatId?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  clientId: string;
  catSitterId: string;
  rating: number;
  comment: string;
  photos?: string[];
  createdAt: string;
}

export const [BookingContext, useBooking] = createContextHook(() => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');

  // Query for cat sitters
  const catSittersQuery = useQuery({
    queryKey: ['catSitters'],
    queryFn: async () => {
      try {
        // Try Firebase first
        const users = await databaseService.user.getAllUsers(100);
        const catSitters: CatSitter[] = users.filter(u => u.isCatSitter).map(u => ({
          id: u.id,
          userId: u.id,
          name: u.name || `${u.firstName} ${u.lastName}`.trim(),
          photo: u.photo,
          bio: u.animalName ? `Propriétaire de ${u.animalName}` : 'Cat sitter expérimenté',
          location: {
            latitude: u.location?.latitude || 48.8566,
            longitude: u.location?.longitude || 2.3522,
            address: u.address || 'Paris, France'
          },
          services: ['Garde à domicile', 'Visite quotidienne', 'Promenade'],
          hourlyRate: 15 + Math.floor(Math.random() * 20),
          availability: {},
          rating: 4 + Math.random(),
          reviewCount: Math.floor(Math.random() * 50),
          badges: [],
          gallery: [],
          isVerified: true,
          responseTime: 'Répond généralement en moins d\'1 heure'
        }));
        return catSitters;
      } catch (error) {
        console.error('Error fetching cat sitters from Firebase:', error);
        // Fallback to AsyncStorage
        const stored = await AsyncStorage.getItem('catSitters');
        const sitters: CatSitter[] = stored ? JSON.parse(stored) : [];
        return sitters;
      }
    },
  });

  // Query for user's bookings
  const bookingsQuery = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const bookings = await databaseService.booking.getBookingsByUser(user.id);
        return bookings.map(b => ({
          id: b.id,
          catSitterId: b.catSitterId || '',
          clientId: b.userId || user.id,
          petIds: b.petIds || [],
          date: b.date || '',
          timeSlot: b.timeSlot || 'morning',
          duration: b.duration || 2,
          totalPrice: b.totalPrice || 0,
          message: b.message,
          status: b.status || 'pending',
          createdAt: b.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: b.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          chatId: b.chatId
        })) as BookingRequest[];
      } catch (error) {
        console.error('Error fetching bookings from Firebase:', error);
        const stored = await AsyncStorage.getItem('bookings');
        const bookings: BookingRequest[] = stored ? JSON.parse(stored) : [];
        return bookings;
      }
    },
    enabled: !!user?.id,
  });

  // Query for reviews
  const reviewsQuery = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      try {
        const reviews = await databaseService.review.getReviewsByTarget('all', 'catSitter');
        return reviews.map(r => ({
          id: r.id,
          bookingId: r.bookingId || '',
          clientId: r.clientId || '',
          catSitterId: r.targetId || '',
          rating: r.rating || 5,
          comment: r.comment || '',
          photos: r.photos || [],
          createdAt: r.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        })) as Review[];
      } catch (error) {
        console.error('Error fetching reviews from Firebase:', error);
        const stored = await AsyncStorage.getItem('reviews');
        const reviews: Review[] = stored ? JSON.parse(stored) : [];
        return reviews;
      }
    },
  });

  // Mutation to create a booking request
  const createBookingMutation = useMutation({
    mutationFn: async (booking: Omit<BookingRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      try {
        const bookingData = {
          userId: user.id,
          catSitterId: booking.catSitterId,
          petIds: booking.petIds,
          date: booking.date,
          timeSlot: booking.timeSlot,
          duration: booking.duration,
          totalPrice: booking.totalPrice,
          message: booking.message,
        };
        
        const bookingId = await databaseService.booking.createBooking(bookingData);
        
        const newBooking: BookingRequest = {
          ...booking,
          id: bookingId,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        return newBooking;
      } catch (error) {
        console.error('Error creating booking in Firebase:', error);
        // Fallback to AsyncStorage
        const stored = await AsyncStorage.getItem('bookings');
        const bookings: BookingRequest[] = stored ? JSON.parse(stored) : [];
        
        const newBooking: BookingRequest = {
          ...booking,
          id: Date.now().toString(),
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        bookings.push(newBooking);
        await AsyncStorage.setItem('bookings', JSON.stringify(bookings));
        
        return newBooking;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', user?.id] });
    },
  });

  // Mutation to update booking status
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ 
      bookingId, 
      status, 
      chatId 
    }: { 
      bookingId: string; 
      status: BookingRequest['status'];
      chatId?: string;
    }) => {
      try {
        await databaseService.booking.updateBookingStatus(bookingId, status);
        
        const updatedBooking = await databaseService.booking.getBooking(bookingId);
        return {
          ...updatedBooking,
          status,
          chatId: chatId || updatedBooking?.chatId,
          updatedAt: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error updating booking in Firebase:', error);
        // Fallback to AsyncStorage
        const stored = await AsyncStorage.getItem('bookings');
        const bookings: BookingRequest[] = stored ? JSON.parse(stored) : [];
        
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);
        if (bookingIndex === -1) throw new Error('Booking not found');
        
        bookings[bookingIndex].status = status;
        bookings[bookingIndex].updatedAt = new Date().toISOString();
        
        if (chatId) {
          bookings[bookingIndex].chatId = chatId;
        }
        
        await AsyncStorage.setItem('bookings', JSON.stringify(bookings));
        
        return bookings[bookingIndex];
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', user?.id] });
    },
  });

  // Mutation to create a review
  const createReviewMutation = useMutation({
    mutationFn: async (review: Omit<Review, 'id' | 'createdAt'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      try {
        const reviewData = {
          targetId: review.catSitterId,
          targetType: 'catSitter',
          bookingId: review.bookingId,
          clientId: user.id,
          rating: review.rating,
          comment: review.comment,
          photos: review.photos || []
        };
        
        const reviewId = await databaseService.review.createReview(reviewData);
        
        const newReview: Review = {
          ...review,
          id: reviewId,
          createdAt: new Date().toISOString(),
        };
        
        return newReview;
      } catch (error) {
        console.error('Error creating review in Firebase:', error);
        // Fallback to AsyncStorage
        const stored = await AsyncStorage.getItem('reviews');
        const reviews: Review[] = stored ? JSON.parse(stored) : [];
        
        const newReview: Review = {
          ...review,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        
        reviews.push(newReview);
        await AsyncStorage.setItem('reviews', JSON.stringify(reviews));
        
        // Update cat sitter's rating
        await updateCatSitterRating(review.catSitterId);
        
        return newReview;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['catSitters'] });
    },
  });

  // Helper function to update cat sitter rating
  const updateCatSitterRating = async (catSitterId: string) => {
    const reviewsStored = await AsyncStorage.getItem('reviews');
    const reviews: Review[] = reviewsStored ? JSON.parse(reviewsStored) : [];
    
    const sitterReviews = reviews.filter(r => r.catSitterId === catSitterId);
    const averageRating = sitterReviews.reduce((sum, r) => sum + r.rating, 0) / sitterReviews.length;
    
    const sittersStored = await AsyncStorage.getItem('catSitters');
    const sitters: CatSitter[] = sittersStored ? JSON.parse(sittersStored) : [];
    
    const sitterIndex = sitters.findIndex(s => s.id === catSitterId);
    if (sitterIndex !== -1) {
      sitters[sitterIndex].rating = averageRating;
      sitters[sitterIndex].reviewCount = sitterReviews.length;
      await AsyncStorage.setItem('catSitters', JSON.stringify(sitters));
    }
  };

  // Helper functions
  const createBooking = (booking: Omit<BookingRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    return createBookingMutation.mutateAsync(booking);
  };

  const updateBookingStatus = (
    bookingId: string, 
    status: BookingRequest['status'], 
    chatId?: string
  ) => {
    return updateBookingStatusMutation.mutateAsync({ bookingId, status, chatId });
  };

  const createReview = (review: Omit<Review, 'id' | 'createdAt'>) => {
    return createReviewMutation.mutateAsync(review);
  };

  // Get available time slots for a cat sitter on a specific date
  const getAvailableTimeSlots = (catSitterId: string, date: string) => {
    const sitter = catSittersQuery.data?.find(s => s.id === catSitterId);
    if (!sitter || !sitter.availability[date]) return [];
    
    const dayAvailability = sitter.availability[date];
    if (!dayAvailability) return [];
    
    const availableSlots: string[] = [];
    
    if (dayAvailability.morning) availableSlots.push('morning');
    if (dayAvailability.afternoon) availableSlots.push('afternoon');
    if (dayAvailability.evening) availableSlots.push('evening');
    if (dayAvailability.overnight) availableSlots.push('overnight');
    
    return availableSlots;
  };

  // Calculate booking price
  const calculatePrice = (catSitterId: string, timeSlot: string, duration: number) => {
    const sitter = catSittersQuery.data?.find(s => s.id === catSitterId);
    if (!sitter) return 0;
    
    let multiplier = 1;
    switch (timeSlot) {
      case 'morning':
      case 'afternoon':
        multiplier = 1;
        break;
      case 'evening':
        multiplier = 1.2;
        break;
      case 'overnight':
        multiplier = 1.5;
        break;
    }
    
    return sitter.hourlyRate * duration * multiplier;
  };

  // Get reviews for a specific cat sitter
  const getCatSitterReviews = (catSitterId: string) => {
    return reviewsQuery.data?.filter(r => r.catSitterId === catSitterId) || [];
  };

  // Get user's booking history
  const getUserBookings = (userId: string) => {
    return bookingsQuery.data?.filter(b => b.clientId === userId) || [];
  };

  return {
    // Data
    catSitters: catSittersQuery.data || [],
    bookings: bookingsQuery.data || [],
    reviews: reviewsQuery.data || [],
    selectedDate,
    selectedTimeSlot,
    
    // Loading states
    isLoadingSitters: catSittersQuery.isLoading,
    isLoadingBookings: bookingsQuery.isLoading,
    isLoadingReviews: reviewsQuery.isLoading,
    
    // Actions
    createBooking,
    updateBookingStatus,
    createReview,
    setSelectedDate,
    setSelectedTimeSlot,
    getAvailableTimeSlots,
    calculatePrice,
    getCatSitterReviews,
    getUserBookings,
    
    // Mutations
    isCreatingBooking: createBookingMutation.isPending,
    isUpdatingBooking: updateBookingStatusMutation.isPending,
    isCreatingReview: createReviewMutation.isPending,
  };
});