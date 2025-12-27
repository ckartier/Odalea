export type Gender = 'male' | 'female';

export interface PrivacySettings {
  showLocation: boolean;
  showPhone: boolean;
  showEmail: boolean;
  allowMessages: boolean;
  showOnlineStatus: boolean;
  shareActivity: boolean;
  allowPhotoTagging: boolean;
  publicProfile: boolean;
}

export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  reminders: boolean;
  socialActivity: boolean;
  emergencyAlerts: boolean;
  messageNotifications: boolean;
  challengeUpdates: boolean;
  shopOffers: boolean;
  lostFoundAlerts: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  pseudo: string;
  pseudoLower?: string;
  photo?: string;
  email: string;
  emailLower?: string;
  phoneNumber: string;
  countryCode: string;
  address: string;
  zipCode: string;
  city: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  addressVerified?: boolean;
  normalizedAddress?: string;
  isCatSitter: boolean;
  catSitterRadiusKm?: number;
  referralCode?: string;
  isPremium: boolean;
  role?: 'user' | 'admin';
  createdAt: number;
  pets: Pet[];
  animalType?: string;
  animalName?: string;
  animalGender?: Gender;
  animalPhoto?: string;
  isProfessional?: boolean;
  professionalData?: ProfessionalData;
  isActive: boolean;
  profileComplete: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  friends?: string[];
  language?: 'en' | 'fr' | 'es' | 'de' | 'it';
  theme?: 'light' | 'dark' | 'system';
  privacySettings?: PrivacySettings;
  notificationSettings?: NotificationSettings;
  pushToken?: string;
  pushTokenUpdatedAt?: string;
}

export type ProfessionalActivityType = 'vet' | 'shelter' | 'breeder' | 'boutique';

export interface ProfessionalCommonInfo {
  displayName: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    street: string;
    postcode: string;
    city: string;
    country: string;
  };
  description: string;
  identityProofUrl: string;
}

export interface ProfessionalDocument {
  type: string;
  label: string;
  url: string;
  uploadedAt: number;
}

export interface VetProfile {
  fullName: string;
  ordinalNumber: string;
  clinicName: string;
  clinicPhone: string;
  clinicEmail: string;
  specialties: string[];
  services: string[];
  accreditationDocumentUrl: string;
}

export interface ShelterProfile {
  structureName: string;
  siren: string;
  prefecturalApproval: string;
  shelterAddress: string;
  capacity: string;
  coverageArea: string;
  referentName: string;
  referentPhone: string;
  justificationDocumentUrl: string;
}

export interface BreederProfile {
  affix: string;
  breeds: string[];
  breederNumber: string;
  healthCertificatesUrl: string;
  transferConditions: string;
  farmWebsite: string;
  activityProofUrl: string;
}

export interface BoutiqueProfile {
  tradeName: string;
  siret: string;
  boutiqueAddress: string;
  animalLicenseNumber: string;
  catalogCategories: string[];
  openingHours: string;
  registrationProofUrl: string;
}

export interface ProfessionalData {
  companyName: string;
  siret: string;
  businessAddress: string;
  businessEmail: string;
  businessPhone: string;
  businessDescription: string;
  companyLogo?: string;
  iban: string;
  acceptedTerms: boolean;
  language: 'fr' | 'en';
  isVerified: boolean;
  subscriptionType: 'basic' | 'premium';
  subscriptionExpiry?: number;
  products: ProfessionalProduct[];
  orders: Order[];
  analytics: BusinessAnalytics;
  activityType?: ProfessionalActivityType;
  commonInfo?: ProfessionalCommonInfo;
  vetProfile?: VetProfile;
  shelterProfile?: ShelterProfile;
  breederProfile?: BreederProfile;
  boutiqueProfile?: BoutiqueProfile;
  documents?: ProfessionalDocument[];
}

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  type: string;
  breed: string;
  gender: Gender;
  dateOfBirth: string;
  color: string;
  character: string[];
  distinctiveSign?: string;
  vaccinationDates: VaccinationDate[];
  microchipNumber?: string;
  mainPhoto: string;
  galleryPhotos: string[];
  vet?: Vet;
  walkTimes: string[];
  isPrimary?: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
  addressVerified?: boolean;
  normalizedAddress?: string;
}

export interface VaccinationDate {
  id: string;
  name: string;
  date: string;
  reminderDate: string;
}

export interface Vet {
  name: string;
  address: string;
  phoneNumber: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  read: boolean;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  rating: number;
  inStock: boolean;
  sellerId?: string;
  sellerName?: string;
  sellerLogo?: string;
  isVerified?: boolean;
}

export interface ProfessionalProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  photos: string[];
  category: string;
  subcategory: string;
  stock: number;
  isActive: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: number;
  updatedAt: number;
  trackingNumber?: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  zipCode: string;
  city: string;
  country: string;
  phone: string;
}

export interface BusinessAnalytics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: { productId: string; sales: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  customerRetention: number;
}

export interface PromoSubmission {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  images: string[];
  productIds: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: number;
  reviewedAt?: number;
  rejectionReason?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  unlocked: boolean;
  category: string;
  requirement: number;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  progress: number;
  total: number;
  reward: string;
  completed: boolean;
}

export interface Breed {
  id: string;
  name: string;
  type: 'domestic' | 'exotic';
}

export interface AnimalBreed {
  id: string;
  name: {
    en: string;
    fr: string;
  };
  characteristics: {
    size: string;
    energy: string;
    grooming: string;
    training: string;
  };
}

export interface AnimalSpecies {
  id: string;
  name: {
    en: string;
    fr: string;
  };
  emoji: string;
  category: string;
  breeds: AnimalBreed[];
}

// Social Media Types
export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  images?: string[];
  petId?: string;
  location?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  type: 'text' | 'photo' | 'video' | 'lost' | 'found' | 'challenge' | 'professional';
  challengeId?: string;
  shareInCommunity?: boolean;
  isPremiumContent?: boolean;
  isProPost?: boolean;
  professionalData?: {
    businessName: string;
    activityType?: string;
    productIds?: string[];
  };
  status?: 'lost' | 'found' | 'reunited';
  reward?: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  parentCommentId?: string;
  likesCount?: number;
}

export interface Like {
  id: string;
  userId: string;
  postId?: string;
  commentId?: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'friend_request' | 'post_mention';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  actionUserId?: string;
  actionUserName?: string;
  actionUserPhoto?: string;
}
