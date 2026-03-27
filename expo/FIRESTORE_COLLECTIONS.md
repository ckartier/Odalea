# Firestore Collections Documentation

This document describes all the Firestore collections used in the Coppet pet care application.

## Collection Structure Overview

### Core Entities
- `users` - User profiles and account information
- `pets` - Pet profiles and information
- `professionals` - Professional service provider data
- `petSitters` - Pet sitter specific information

### Social Features
- `posts` - Community posts and content
- `comments` - Comments on posts
- `likes` - Like interactions on posts
- `friendRequests` - Friend request system

### Messaging
- `conversations` - Chat conversations between users
- `messages` - Individual messages within conversations

### Commerce
- `products` - General marketplace products
- `professionalProducts` - Products from professional sellers
- `orders` - Purchase orders and transactions
- `promoSubmissions` - Promotional content submissions

### Services & Bookings
- `bookings` - Service bookings and appointments
- `reviews` - Reviews and ratings for services

### Lost & Found
- `lostFoundReports` - Lost and found pet reports

### Community & Challenges
- `challenges` - Community challenges and contests
- `challengeSubmissions` - User submissions to challenges
- `badges` - Available badges and achievements
- `userBadges` - Badges earned by users

### Health & Care
- `healthRecords` - Pet health records
- `vaccinations` - Vaccination records
- `treatments` - Medical treatments
- `medications` - Medication schedules
- `healthDocuments` - Health-related documents
- `healthReminders` - Health reminders and alerts

### System
- `notifications` - User notifications
- `emergencyContacts` - Emergency contact information
- `animalSpecies` - Animal species data
- `animalBreeds` - Animal breed information

## Detailed Collection Schemas

### Users Collection (`users`)
```typescript
{
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  pseudo: string;
  photo?: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  address: string;
  zipCode: string;
  city: string;
  isCatSitter: boolean;
  referralCode?: string;
  isPremium: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  pets: Pet[];
  animalType?: string;
  animalName?: string;
  isProfessional?: boolean;
  professionalData?: ProfessionalData;
}
```

### Pets Collection (`pets`)
```typescript
{
  id: string;
  ownerId: string;
  name: string;
  type: string;
  breed: string;
  gender: 'male' | 'female';
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Posts Collection (`posts`)
```typescript
{
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tags?: string[];
  type: 'text' | 'photo' | 'video' | 'lost' | 'found';
}
```

### Comments Collection (`comments`)
```typescript
{
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  parentCommentId?: string;
  likesCount?: number;
}
```

### Likes Collection (`likes`)
```typescript
{
  id: string; // Format: "{postId}_{userId}"
  userId: string;
  postId?: string;
  commentId?: string;
  createdAt: Timestamp;
}
```

### Conversations Collection (`conversations`)
```typescript
{
  id: string;
  participants: string[];
  type: 'direct' | 'group';
  title?: string;
  lastMessage?: Message;
  unreadCount: { [userId: string]: number };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Messages Collection (`messages`)
```typescript
{
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'location' | 'booking' | 'system';
  media?: MediaItem;
  metadata?: { [key: string]: any };
  isRead: boolean;
  timestamp: Timestamp;
}
```

### Products Collection (`products`)
```typescript
{
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Professional Products Collection (`professionalProducts`)
```typescript
{
  id: string;
  sellerId: string;
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Orders Collection (`orders`)
```typescript
{
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
  trackingNumber?: string;
  notes?: string;
}
```

### Friend Requests Collection (`friendRequests`)
```typescript
{
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: Timestamp;
  respondedAt?: Timestamp;
}
```

### Badges Collection (`badges`)
```typescript
{
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  requirement: number;
}
```

### User Badges Collection (`userBadges`)
```typescript
{
  id: string; // Format: "{userId}_{badgeId}"
  userId: string;
  badgeId: string;
  earnedAt: Timestamp;
  progress?: number;
}
```

### Challenges Collection (`challenges`)
```typescript
{
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  startDate: Timestamp;
  endDate: Timestamp;
  reward: string;
  completed: boolean;
  isActive: boolean;
  createdAt: Timestamp;
}
```

### Challenge Submissions Collection (`challengeSubmissions`)
```typescript
{
  id: string;
  challengeId: string;
  userId: string;
  petId: string;
  content: string;
  media: MediaItem[];
  votes: number;
  createdAt: Timestamp;
}
```

### Notifications Collection (`notifications`)
```typescript
{
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'friend_request' | 'post_mention';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Timestamp;
  actionUserId?: string;
  actionUserName?: string;
  actionUserPhoto?: string;
}
```

### Professionals Collection (`professionals`)
```typescript
{
  userId: string;
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
  subscriptionExpiry?: Timestamp;
  products: ProfessionalProduct[];
  orders: Order[];
  analytics: BusinessAnalytics;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Animal Species Collection (`animalSpecies`)
```typescript
{
  id: string;
  name: {
    en: string;
    fr: string;
  };
  emoji: string;
  category: string;
  breeds: AnimalBreed[];
}
```

### Animal Breeds Collection (`animalBreeds`)
```typescript
{
  id: string;
  speciesId: string;
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
```

## Security Rules Considerations

### User Data Protection
- Users can only read/write their own user document
- Public profile information is readable by all authenticated users
- Private information (email, phone) is only accessible to the user

### Pet Data Access
- Pet owners have full read/write access to their pets
- Other users can read basic pet information for social features
- Sensitive health data requires owner permission

### Social Features
- Posts are publicly readable by authenticated users
- Users can only edit/delete their own posts and comments
- Like operations are restricted to authenticated users

### Professional Features
- Professional data requires verification before public visibility
- Product management restricted to verified professionals
- Order data is only accessible to involved parties

### Messaging Privacy
- Conversation participants have full access to messages
- Non-participants cannot access conversation data
- Message encryption should be considered for sensitive communications

## Indexing Strategy

### Composite Indexes Required
1. `posts`: `(authorId, createdAt desc)`
2. `comments`: `(postId, createdAt asc)`
3. `messages`: `(conversationId, timestamp asc)`
4. `conversations`: `(participants array, updatedAt desc)`
5. `products`: `(category, inStock, createdAt desc)`
6. `orders`: `(customerId, createdAt desc)`
7. `notifications`: `(userId, createdAt desc)`
8. `friendRequests`: `(receiverId, status, timestamp desc)`
9. `userBadges`: `(userId, earnedAt desc)`
10. `challengeSubmissions`: `(challengeId, votes desc)`

### Single Field Indexes
- All timestamp fields for sorting
- All ID fields for lookups
- Status fields for filtering
- Boolean fields for filtering

## Data Migration Strategy

### Initial Setup
1. Create collections with proper security rules
2. Set up composite indexes
3. Initialize system data (badges, animal species/breeds)
4. Migrate existing user data if applicable

### Ongoing Maintenance
- Regular cleanup of expired data
- Archive old messages and posts
- Update animal breed data as needed
- Monitor and optimize query performance

## Backup and Recovery

### Automated Backups
- Daily backups of all collections
- Point-in-time recovery capability
- Cross-region backup storage

### Critical Data Priority
1. User accounts and profiles
2. Pet information and health records
3. Financial transactions (orders, payments)
4. Professional verification data
5. Social content and relationships

This comprehensive Firestore structure supports all features of the Coppet pet care application while maintaining data integrity, security, and performance.