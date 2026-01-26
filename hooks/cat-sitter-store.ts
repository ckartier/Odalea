import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { petSitterService, userService } from '@/services/database';
import { safeJsonParse } from '@/lib/safe-json';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/services/firebase';

export interface CustomService {
  id: string;
  name: string;
  description: string;
  price: number; // en €
  duration: number; // en minutes
  icon: string; // ex: "walk", "home", "food" (au choix pour ton UI)
  isActive: boolean;
}

export type ProVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface ProVerification {
  status: ProVerificationStatus;
  siret?: string; // 14 digits
  companyName?: string;
  checkedAt?: number; // millis
  reason?: string;
  // URLs Storage (ou autre)
  documents?: {
    idCardUrl?: string;
    insuranceProofUrl?: string;
    siretExtractUrl?: string;
  };
}

export interface CatSitterProfile {
  id: string;
  userId: string;

  isActive: boolean;
  hourlyRate: number;
  description: string;

  // legacy
  services: string[];

  // ✅ new
  customServices: CustomService[];

  availability: {
    [key: string]: { start: string; end: string; available: boolean };
  };

  photos: string[];
  experience: string;
  petTypes: string[];
  languages: string[];

  // assurance
  insurance: boolean;
  insuranceNumber?: string;
  insuranceCompany?: string;
  insuranceExpiryDate?: string;

  emergencyContact: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;

  certifications?: string[];
  firstAidCertified?: boolean;
  backgroundCheckVerified?: boolean;

  maxPetsAtOnce?: number;
  homeType?: string;

  responseTime: string;
  totalBookings: number;
  rating: number;
  reviewCount: number;
  radiusKm: number;

  // ✅ pro verification
  verification?: ProVerification;

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

const defaultAvailability: CatSitterProfile['availability'] = {
  monday: { start: '08:00', end: '18:00', available: true },
  tuesday: { start: '08:00', end: '18:00', available: true },
  wednesday: { start: '08:00', end: '18:00', available: true },
  thursday: { start: '08:00', end: '18:00', available: true },
  friday: { start: '08:00', end: '18:00', available: true },
  saturday: { start: '09:00', end: '17:00', available: true },
  sunday: { start: '10:00', end: '16:00', available: false },
};

const STORAGE_PROFILE_KEY = 'catSitterProfile';
const COLLECTION_NAME = 'petSitterProfiles';

function sanitizeCustomService(s: any): CustomService {
  return {
    id: String(s?.id ?? makeId('svc')),
    name: String(s?.name ?? 'Prestation'),
    description: String(s?.description ?? ''),
    price: Number(s?.price ?? 0),
    duration: Number(s?.duration ?? 60),
    icon: String(s?.icon ?? 'service'),
    isActive: Boolean(s?.isActive ?? true),
  };
}

function sanitizeProfileForFirestore(profile: CatSitterProfile): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(profile)) {
    if (value === undefined) continue;
    
    if (key === 'customServices' && Array.isArray(value)) {
      sanitized[key] = value.map(sanitizeCustomService);
    } else if (key === 'verification' && value) {
      const v = value as ProVerification;
      sanitized[key] = {
        status: v.status ?? 'unverified',
        ...(v.siret !== undefined && { siret: v.siret }),
        ...(v.companyName !== undefined && { companyName: v.companyName }),
        ...(v.checkedAt !== undefined && { checkedAt: v.checkedAt }),
        ...(v.reason !== undefined && { reason: v.reason }),
        ...(v.documents !== undefined && { documents: v.documents }),
      };
    } else if (key === 'availability' && value && typeof value === 'object') {
      const avail: Record<string, any> = {};
      for (const [day, schedule] of Object.entries(value)) {
        if (schedule && typeof schedule === 'object') {
          avail[day] = {
            start: String((schedule as any).start ?? '08:00'),
            end: String((schedule as any).end ?? '18:00'),
            available: Boolean((schedule as any).available ?? false),
          };
        }
      }
      sanitized[key] = avail;
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

function toMillisSafe(v: any): number {
  if (!v) return Date.now();
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const t = Date.parse(v);
    return Number.isNaN(t) ? Date.now() : t;
  }
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (typeof v?.seconds === 'number') return v.seconds * 1000;
  return Date.now();
}

function mapBooking(b: any): BookingRequest {
  return {
    id: b.id,
    clientId: b.userId || b.clientId || '',
    clientName: b.clientName || 'Client',
    clientAvatar: b.clientAvatar,
    petName: b.petName || 'Animal',
    petType: b.petType || 'Chat',
    startDate: b.startDate || b.date || '',
    endDate: b.endDate || b.date || '',
    totalHours: b.totalHours || b.duration || 2,
    totalPrice: b.totalPrice || 0,
    message: b.message || '',
    status: (b.status as BookingRequest['status']) || 'pending',
    services: Array.isArray(b.services) ? b.services : [],
    createdAt: toMillisSafe(b.createdAt),
  };
}

function makeId(prefix = 'svc') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeProfile(p: any): CatSitterProfile {
  const hourlyRate = Number(p?.hourlyRate ?? 15);
  const now = Date.now();

  const customServices: CustomService[] = Array.isArray(p?.customServices)
    ? p.customServices.map((s: any) => ({
        id: String(s?.id ?? makeId('svc')),
        name: String(s?.name ?? 'Prestation'),
        description: String(s?.description ?? ''),
        price: Number(s?.price ?? 0),
        duration: Number(s?.duration ?? 60),
        icon: String(s?.icon ?? 'service'),
        isActive: Boolean(s?.isActive ?? true),
      }))
    : [];

  const verification: ProVerification | undefined = p?.verification
    ? {
        status: (p.verification.status as ProVerificationStatus) ?? 'unverified',
        siret: p.verification.siret,
        companyName: p.verification.companyName,
        checkedAt: toMillisSafe(p.verification.checkedAt),
        reason: p.verification.reason,
        documents: p.verification.documents ?? {},
      }
    : undefined;

  return {
    id: String(p?.id ?? p?.userId ?? ''),
    userId: String(p?.userId ?? ''),
    isActive: Boolean(p?.isActive ?? true),
    hourlyRate,
    description: String(p?.description ?? ''),
    services: Array.isArray(p?.services) ? p.services : ['Pet Sitting'],
    customServices,
    availability: p?.availability ?? defaultAvailability,
    photos: Array.isArray(p?.photos) ? p.photos : [],
    experience: String(p?.experience ?? '1 year'),
    petTypes: Array.isArray(p?.petTypes) ? p.petTypes : ['Cats'],
    languages: Array.isArray(p?.languages) ? p.languages : ['French'],
    insurance: Boolean(p?.insurance ?? false),
    insuranceNumber: p?.insuranceNumber,
    insuranceCompany: p?.insuranceCompany,
    insuranceExpiryDate: p?.insuranceExpiryDate,
    emergencyContact: Boolean(p?.emergencyContact ?? false),
    emergencyContactName: p?.emergencyContactName,
    emergencyContactPhone: p?.emergencyContactPhone,
    certifications: Array.isArray(p?.certifications) ? p.certifications : [],
    firstAidCertified: Boolean(p?.firstAidCertified ?? false),
    backgroundCheckVerified: Boolean(p?.backgroundCheckVerified ?? false),
    maxPetsAtOnce: p?.maxPetsAtOnce,
    homeType: p?.homeType,
    responseTime: String(p?.responseTime ?? '< 2 hours'),
    totalBookings: Number(p?.totalBookings ?? 0),
    rating: Number(p?.rating ?? 5),
    reviewCount: Number(p?.reviewCount ?? 0),
    radiusKm: Number(p?.radiusKm ?? 5),
    verification,
    createdAt: toMillisSafe(p?.createdAt ?? now),
    updatedAt: toMillisSafe(p?.updatedAt ?? now),
  };
}

function defaultServicesFor(hourlyRate: number): CustomService[] {
  const halfHourPrice = Math.max(5, Math.round((hourlyRate * 0.5) * 100) / 100);

  return [
    {
      id: makeId('svc'),
      name: 'Visite (30 min)',
      description: 'Passage à domicile, eau/nourriture, litière, nouvelles.',
      price: halfHourPrice,
      duration: 30,
      icon: 'visit',
      isActive: true,
    },
    {
      id: makeId('svc'),
      name: 'Garde (1 h)',
      description: 'Présence + soins de base + jeux.',
      price: Math.round(hourlyRate * 100) / 100,
      duration: 60,
      icon: 'home',
      isActive: true,
    },
    {
      id: makeId('svc'),
      name: 'Promenade (30 min)',
      description: 'Sortie + dépense + retour au calme.',
      price: halfHourPrice,
      duration: 30,
      icon: 'walk',
      isActive: true,
    },
  ];
}

function ensureDefaults(profile: CatSitterProfile): { profile: CatSitterProfile; changed: boolean } {
  let changed = false;

  const hasCustom = Array.isArray(profile.customServices) && profile.customServices.length > 0;
  if (!hasCustom) {
    profile = {
      ...profile,
      customServices: defaultServicesFor(profile.hourlyRate),
      updatedAt: Date.now(),
    };
    changed = true;
  } else {
    // Ajoute "Promenade (30 min)" si elle n’existe pas
    const existsWalk = profile.customServices.some(s => s.name.toLowerCase().includes('promenade'));
    if (!existsWalk) {
      profile = {
        ...profile,
        customServices: [
          ...profile.customServices,
          {
            id: makeId('svc'),
            name: 'Promenade (30 min)',
            description: 'Sortie + dépense + retour au calme.',
            price: Math.max(5, Math.round((profile.hourlyRate * 0.5) * 100) / 100),
            duration: 30,
            icon: 'walk',
            isActive: true,
          },
        ],
        updatedAt: Date.now(),
      };
      changed = true;
    }
  }

  // verification default
  if (!profile.verification) {
    profile = {
      ...profile,
      verification: { status: 'unverified' },
    };
    changed = true;
  }

  return { profile, changed };
}

export const [CatSitterContext, useCatSitter] = createContextHook(() => {
  const [profile, setProfile] = useState<CatSitterProfile | null>(null);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [messages, setMessages] = useState<CatSitterMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load cached profile early (fast UI)
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_PROFILE_KEY);
        if (stored) {
          const parsed = normalizeProfile(safeJsonParse(stored, null));
          const { profile: next } = ensureDefaults(parsed);
          setProfile(next);
        }
      } catch (e) {
        console.error('❌ Failed to read cached cat-sitter profile:', e);
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  // Persist profile locally
  useEffect(() => {
    if (initializing) return;
    (async () => {
      try {
        if (profile) await AsyncStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
        else await AsyncStorage.removeItem(STORAGE_PROFILE_KEY);
      } catch (e) {
        console.error('❌ Failed to cache cat-sitter profile:', e);
      }
    })();
  }, [profile, initializing]);

  // Setup real-time listener for profile changes
  const setupProfileListener = useCallback((userId: string) => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    
    try {
      const profileRef = doc(db, COLLECTION_NAME, userId);
      const unsubscribe = onSnapshot(profileRef, (snapshot) => {
        if (snapshot.exists()) {
          console.log('📡 Real-time profile update received');
          const data = snapshot.data();
          const normalized = normalizeProfile({ id: snapshot.id, ...data });
          const { profile: withDefaults } = ensureDefaults(normalized);
          setProfile(withDefaults);
        }
      }, (error) => {
        console.error('❌ Profile listener error:', error);
      });
      
      unsubscribeRef.current = unsubscribe;
    } catch (e) {
      console.error('❌ Failed to setup profile listener:', e);
    }
  }, []);

  // Cleanup listener on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const refreshBookings = async (sitterUserId: string) => {
    const firebaseBookings = await petSitterService.listBookingsForSitter(sitterUserId);
    const mapped = Array.isArray(firebaseBookings) ? firebaseBookings.map(mapBooking) : [];
    setBookingRequests(mapped);
    return mapped;
  };

  const loadProfile = async (userId: string) => {
    console.log('🔄 Loading cat-sitter profile for:', userId);
    setLoading(true);
    try {
      const firebaseProfileRaw = await petSitterService.getProfile(userId);

      if (firebaseProfileRaw) {
        console.log('✅ Profile loaded from Firestore');
        const normalized = normalizeProfile(firebaseProfileRaw);
        const { profile: withDefaults, changed } = ensureDefaults(normalized);

        setProfile(withDefaults);
        
        // Setup real-time listener
        setupProfileListener(userId);

        // mini-migration en base si on a ajouté des defaults
        if (changed) {
          console.log('🔄 Migrating profile with defaults...');
          const sanitized = sanitizeProfileForFirestore(withDefaults);
          await petSitterService.saveProfile(userId, sanitized);
        }

        await refreshBookings(userId);
        return withDefaults;
      }

      // fallback cache
      const stored = await AsyncStorage.getItem(STORAGE_PROFILE_KEY);
      if (stored) {
        console.log('📦 Using cached profile');
        const parsed = normalizeProfile(safeJsonParse(stored, null));
        const { profile: next } = ensureDefaults(parsed);
        setProfile(next);
        return next;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to load cat-sitter data:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (userId: string, profileData: Partial<CatSitterProfile>) => {
    setLoading(true);
    try {
      const now = Date.now();
      const hourlyRate = profileData.hourlyRate ?? 15;

      const newProfile: CatSitterProfile = {
        id: userId,
        userId,
        isActive: true,
        hourlyRate,
        description: profileData.description ?? '',
        services: profileData.services ?? ['Pet Sitting'],
        customServices: Array.isArray(profileData.customServices) && profileData.customServices.length
          ? profileData.customServices
          : defaultServicesFor(hourlyRate),
        availability: profileData.availability ?? defaultAvailability,
        photos: profileData.photos ?? [],
        experience: profileData.experience ?? '1 year',
        petTypes: profileData.petTypes ?? ['Cats'],
        languages: profileData.languages ?? ['French'],
        insurance: profileData.insurance ?? false,
        insuranceNumber: profileData.insuranceNumber,
        insuranceCompany: profileData.insuranceCompany,
        insuranceExpiryDate: profileData.insuranceExpiryDate,
        emergencyContact: profileData.emergencyContact ?? false,
        emergencyContactName: profileData.emergencyContactName,
        emergencyContactPhone: profileData.emergencyContactPhone,
        responseTime: '< 2 hours',
        totalBookings: 0,
        rating: 5.0,
        reviewCount: 0,
        radiusKm: profileData.radiusKm ?? 5,
        verification: { status: 'unverified' },
        createdAt: now,
        updatedAt: now,
      };

      await petSitterService.saveProfile(userId, newProfile);

      const user = await userService.getUser(userId);
      if (user && !user.isCatSitter) {
        await userService.saveUser({ ...user, isCatSitter: true });
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
    if (!profile) {
      console.error('❌ updateProfile: No profile found');
      return { success: false, error: 'No profile found' };
    }
    
    console.log('🔄 Updating profile with:', Object.keys(updates));
    setLoading(true);
    
    // Optimistic update
    const previousProfile = profile;
    const updated: CatSitterProfile = {
      ...profile,
      ...updates,
      updatedAt: Date.now(),
    };
    setProfile(updated);
    
    try {
      // Sanitize before sending to Firestore
      const sanitized = sanitizeProfileForFirestore(updated);
      console.log('📤 Sending sanitized profile to Firestore');
      
      await petSitterService.saveProfile(profile.userId, sanitized);
      console.log('✅ Profile updated successfully');
      return { success: true, profile: updated };
    } catch (error: any) {
      console.error('❌ Failed to update profile:', error);
      console.error('❌ Error code:', error?.code);
      console.error('❌ Error message:', error?.message);
      
      // Rollback on error
      setProfile(previousProfile);
      
      const errorMessage = error?.code === 'permission-denied' 
        ? 'Permission refusée. Vérifiez que vous êtes connecté.'
        : error?.message || 'Échec de la mise à jour';
      
      return { success: false, error: errorMessage };
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
    return updateProfile({
      availability: { ...profile.availability, [day]: schedule },
    });
  };

  // ---- Prestations (CRUD) ----
  const addCustomService = async (data: Omit<CustomService, 'id'>) => {
    if (!profile) {
      console.error('❌ addCustomService: No profile found');
      return { success: false, error: 'Profil non trouvé' };
    }

    console.log('➕ Adding custom service:', data.name);
    const next: CustomService = sanitizeCustomService({ ...data, id: makeId('svc') });
    const nextList = [...(profile.customServices ?? []), next];

    return updateProfile({ customServices: nextList });
  };

  const updateCustomService = async (serviceId: string, updates: Partial<Omit<CustomService, 'id'>>) => {
    if (!profile) {
      console.error('❌ updateCustomService: No profile found');
      return { success: false, error: 'Profil non trouvé' };
    }

    console.log('✏️ Updating service:', serviceId, updates);
    const nextList = (profile.customServices ?? []).map(s =>
      s.id === serviceId ? sanitizeCustomService({ ...s, ...updates }) : s
    );

    return updateProfile({ customServices: nextList });
  };

  const deleteCustomService = async (serviceId: string) => {
    if (!profile) {
      console.error('❌ deleteCustomService: No profile found');
      return { success: false, error: 'Profil non trouvé' };
    }

    console.log('🗑️ Deleting service:', serviceId);
    const nextList = (profile.customServices ?? []).filter(s => s.id !== serviceId);
    return updateProfile({ customServices: nextList });
  };

  const toggleCustomServiceActive = async (serviceId: string) => {
    if (!profile) {
      console.error('❌ toggleCustomServiceActive: No profile found');
      return { success: false, error: 'Profil non trouvé' };
    }

    const target = profile.customServices?.find(s => s.id === serviceId);
    if (!target) {
      console.error('❌ toggleCustomServiceActive: Service not found:', serviceId);
      return { success: false, error: 'Prestation non trouvée' };
    }

    console.log('🔄 Toggling service active:', serviceId, '->', !target.isActive);
    return updateCustomService(serviceId, { isActive: !target.isActive });
  };

  // ---- Pro verification request (client -> pending) ----
  const requestVerification = async (payload: {
    siret: string;
    companyName?: string;
    documents?: ProVerification['documents'];
  }) => {
    if (!profile) return { success: false, error: 'No profile found' };

    // côté client : on ne met JAMAIS verified ici
    const nextVerification: ProVerification = {
      status: 'pending',
      siret: payload.siret,
      companyName: payload.companyName,
      documents: payload.documents ?? {},
      checkedAt: Date.now(),
    };

    return updateProfile({ verification: nextVerification });
  };

  // Booking response
  const respondToBooking = async (bookingId: string, response: 'accepted' | 'declined', message?: string) => {
    if (!profile) return { success: false, error: 'No profile found' };
    setLoading(true);

    const prev = bookingRequests;
    setBookingRequests(curr => curr.map(b => (b.id === bookingId ? { ...b, status: response } : b)));

    try {
      await petSitterService.respondToBooking(bookingId, response);

      if (message?.trim()) {
        const responseMessage: CatSitterMessage = {
          id: `msg-${Date.now()}`,
          fromId: 'me',
          fromName: 'Moi',
          message: message.trim(),
          timestamp: Date.now(),
          isRead: true,
          bookingId,
        };
        setMessages(m => [responseMessage, ...m]);
      }

      await refreshBookings(profile.userId);
      return { success: true };
    } catch (err) {
      console.error('❌ Failed to respond to booking:', err);
      setBookingRequests(prev);
      return { success: false, error: 'Failed to respond to booking' };
    } finally {
      setLoading(false);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, isRead: true } : m)));
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

  const getUnreadMessagesCount = () => messages.filter(m => !m.isRead && m.fromId !== 'me').length;
  const getPendingBookingsCount = () => bookingRequests.filter(b => b.status === 'pending').length;

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

    addCustomService,
    updateCustomService,
    deleteCustomService,
    toggleCustomServiceActive,

    requestVerification,

    respondToBooking,
    markMessageAsRead,
    sendMessage,

    getUnreadMessagesCount,
    getPendingBookingsCount,
  };
});