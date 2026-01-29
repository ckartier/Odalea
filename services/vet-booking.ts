import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export type VetBookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface VetBooking {
  id: string;
  userId: string;
  petId: string;
  vetId: string;
  vetName: string;
  clinicName: string;
  date: string;
  time: string;
  reason: string;
  status: VetBookingStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVetBookingData {
  userId: string;
  petId: string;
  vetId: string;
  vetName: string;
  clinicName: string;
  date: string;
  time: string;
  reason: string;
  notes?: string;
}

const COLLECTION_NAME = 'vetBookings';

export const vetBookingService = {
  async createBooking(data: CreateVetBookingData): Promise<string> {
    try {
      console.log('[VetBooking] Creating booking:', data);
      
      const bookingData = {
        ...data,
        status: 'pending' as VetBookingStatus,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), bookingData);
      console.log('[VetBooking] Booking created with ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('[VetBooking] Error creating booking:', error);
      throw error;
    }
  },

  async getBookingsByUser(userId: string): Promise<VetBooking[]> {
    try {
      console.log('[VetBooking] Fetching bookings for user:', userId);
      
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const bookings: VetBooking[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as VetBooking[];

      console.log('[VetBooking] Found bookings:', bookings.length);
      return bookings;
    } catch (error) {
      console.error('[VetBooking] Error fetching bookings:', error);
      return [];
    }
  },

  async getBookingsByPet(petId: string): Promise<VetBooking[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('petId', '==', petId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as VetBooking[];
    } catch (error) {
      console.error('[VetBooking] Error fetching pet bookings:', error);
      return [];
    }
  },

  async getBooking(bookingId: string): Promise<VetBooking | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, bookingId);
      const snapshot = await getDoc(docRef);
      
      if (!snapshot.exists()) {
        return null;
      }

      return {
        id: snapshot.id,
        ...snapshot.data(),
        createdAt: snapshot.data().createdAt?.toDate() || new Date(),
        updatedAt: snapshot.data().updatedAt?.toDate() || new Date(),
      } as VetBooking;
    } catch (error) {
      console.error('[VetBooking] Error fetching booking:', error);
      return null;
    }
  },

  async updateBookingStatus(bookingId: string, status: VetBookingStatus): Promise<void> {
    try {
      console.log('[VetBooking] Updating booking status:', bookingId, status);
      
      const docRef = doc(db, COLLECTION_NAME, bookingId);
      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.now(),
      });

      console.log('[VetBooking] Booking status updated');
    } catch (error) {
      console.error('[VetBooking] Error updating booking status:', error);
      throw error;
    }
  },

  async cancelBooking(bookingId: string): Promise<void> {
    return this.updateBookingStatus(bookingId, 'cancelled');
  },
};
