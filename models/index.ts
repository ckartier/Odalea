// Core Models for Coppet App

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  city: string;
  postalCode: string;
  country: string;
  language: 'en' | 'fr';
  isPremium: boolean;
  isVerified: boolean;
  trustScore: number;
  referralCode: string;
  createdAt: Date;
  updatedAt: Date;
  settings: UserSettings;
  location?: {
    latitude: number;
    longitude: number;
  };
  isActive: boolean;
  profileComplete: boolean;
}

export interface UserSettings {
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    reminders: boolean;
    social: boolean;
    emergency: boolean;
  };
  privacy: {
    showLocation: boolean;
    showPhone: boolean;
    showEmail: boolean;
    allowMessages: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'fr';
}

export interface Pet {
  id: string;
  ownerId: string;
  coOwners: string[];
  name: string;
  species: string;
  breed: string;
  gender: 'male' | 'female';
  birthDate: Date;
  weight?: number;
  color: string;
  microchipId?: string;
  photos: string[];
  mainPhoto: string;
  personality: string[];
  isNeutered: boolean;
  isSociable: boolean;
  walkHours?: string[];
  vetInfo?: VetInfo;
  healthRecord: HealthRecord;
  qrCode: string;
  isLost: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VetInfo {
  name: string;
  phone: string;
  address: string;
  email?: string;
}

export interface HealthRecord {
  vaccinations: Vaccination[];
  treatments: Treatment[];
  medications: Medication[];
  documents: HealthDocument[];
  reminders: HealthReminder[];
}

export interface Vaccination {
  id: string;
  name: string;
  date: Date;
  nextDue?: Date;
  veterinarian: string;
  batchNumber?: string;
  notes?: string;
}

export interface Treatment {
  id: string;
  name: string;
  date: Date;
  veterinarian: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
}

export interface HealthDocument {
  id: string;
  type: 'vaccination' | 'treatment' | 'prescription' | 'other';
  name: string;
  url: string;
  uploadDate: Date;
}

export interface HealthReminder {
  id: string;
  type: 'vaccination' | 'medication' | 'checkup' | 'other';
  title: string;
  description: string;
  dueDate: Date;
  isCompleted: boolean;
  petId: string;
}

export interface PetSitter {
  id: string;
  userId: string;
  isActive: boolean;
  hourlyRate: number;
  currency: string;
  availability: Availability[];
  services: SitterService[];
  experience: string;
  languages: string[];
  petTypes: string[];
  maxPets: number;
  hasInsurance: boolean;
  reviews: Review[];
  rating: number;
  totalBookings: number;
  responseTime: number; // in minutes
  location: {
    latitude: number;
    longitude: number;
    radius: number; // service radius in km
  };
}

export interface Availability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isAvailable: boolean;
}

export interface SitterService {
  type: 'walking' | 'sitting' | 'boarding' | 'grooming' | 'training';
  price: number;
  duration: number; // in minutes
  description: string;
}

export interface Booking {
  id: string;
  petId: string;
  sitterId: string;
  ownerId: string;
  service: SitterService;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  totalPrice: number;
  notes?: string;
  review?: Review;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  bookingId?: string;
  rating: number; // 1-5
  comment: string;
  photos?: string[];
  createdAt: Date;
}

export interface LostFoundReport {
  id: string;
  type: 'lost' | 'found';
  reporterId: string;
  petId?: string; // if it's the owner's pet
  petName: string;
  species: string;
  breed?: string;
  color: string;
  description: string;
  photos: string[];
  lastSeenLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  lastSeenDate: Date;
  contactInfo: {
    phone?: string;
    email?: string;
  };
  status: 'active' | 'resolved' | 'closed';
  searchRadius: number; // in km
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  type: 'story' | 'photo' | 'video' | 'event' | 'playdate' | 'advice';
  content: string;
  media: MediaItem[];
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  tags: string[];
  likes: string[]; // user IDs
  comments: Comment[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  duration?: number; // for videos
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  likes: string[];
  replies: Comment[];
  createdAt: Date;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'photo' | 'video' | 'activity' | 'knowledge';
  startDate: Date;
  endDate: Date;
  prize: string;
  rules: string[];
  submissions: ChallengeSubmission[];
  winners: string[]; // user IDs
  isActive: boolean;
  createdAt: Date;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  petId: string;
  content: string;
  media: MediaItem[];
  votes: number;
  createdAt: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'social' | 'health' | 'activity' | 'achievement' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: string[];
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  earnedAt: Date;
  progress?: number; // for progressive badges
}

export interface Professional {
  id: string;
  userId: string;
  type: 'veterinarian' | 'groomer' | 'trainer' | 'shop' | 'shelter';
  businessName: string;
  description: string;
  services: ProfessionalService[];
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  hours: BusinessHours[];
  photos: string[];
  isVerified: boolean;
  rating: number;
  reviews: Review[];
  createdAt: Date;
}

export interface ProfessionalService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: string;
  isBookable: boolean;
}

export interface BusinessHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  currency: string;
  photos: string[];
  stock: number;
  isAvailable: boolean;
  specifications: { [key: string]: string };
  shipping: ShippingInfo;
  rating: number;
  reviews: ProductReview[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingInfo {
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  freeShippingThreshold?: number;
  estimatedDelivery: number; // days
}

export interface ProductReview {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  photos?: string[];
  isVerified: boolean;
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'location' | 'booking' | 'system';
  media?: MediaItem;
  metadata?: { [key: string]: any };
  isRead: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  participants: string[];
  type: 'direct' | 'group';
  title?: string;
  lastMessage?: Message;
  unreadCount: { [userId: string]: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'reminder' | 'social' | 'booking' | 'emergency' | 'system';
  title: string;
  body: string;
  data?: { [key: string]: any };
  isRead: boolean;
  createdAt: Date;
}
