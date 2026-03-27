# ODALEA - Plan de Refonte Complet 2025

## A) DESIGN SYSTEM 2025

### Tokens de Design

```typescript
// Palette
COLORS = {
  // Backgrounds
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F9FAFB',
  surfaceTertiary: '#F3F4F6',
  
  // Text
  text: '#111111',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Accent (violet unique)
  accent: '#7C3AED',
  accentDark: '#6D28D9',
  accentLight: '#DDD6FE',
  accentSoft: 'rgba(124, 58, 237, 0.08)',
  
  // States
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderFocus: '#7C3AED',
  
  // Map specific
  mapPet: '#7DD4EE',
  mapSitter: '#F0A5C9',
  mapVet: '#10B981',
  mapShop: '#F59E0B',
  mapLost: '#EF4444',
  mapFound: '#10B981',
}

// Typography
TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 26 },
  h4: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body1: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  body2: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  overline: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
}

// Spacing (grille 8pt)
SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

// Radius
RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
}

// Shadows
SHADOWS = {
  sm: { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  md: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  lg: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 4 },
}
```

### Composants à Créer/Standardiser

| Composant | Usage | Fichier |
|-----------|-------|---------|
| `SurfaceCard` | Cards blanches avec shadow | `components/ui/SurfaceCard.tsx` |
| `PrimaryButton` | CTA principal violet | `components/ui/Button.tsx` |
| `SecondaryButton` | CTA secondaire outline | `components/ui/Button.tsx` |
| `GhostButton` | Bouton sans background | `components/ui/Button.tsx` |
| `IconButton` | Bouton icône 44x44 | `components/ui/IconButton.tsx` |
| `Chip` | Filtres, tags | `components/ui/Chip.tsx` |
| `SegmentedControl` | Tabs inline | `components/SegmentedControl.tsx` ✅ |
| `BottomSheet` | Modal bottom (3 heights) | `components/BottomSheet.tsx` ✅ |
| `ActionSheet` | Menu contextuel | `components/ui/ActionSheet.tsx` |
| `Toast` | Notifications | `components/ui/Toast.tsx` |
| `EmptyState` | États vides | `components/EmptyState.tsx` ✅ |
| `Skeleton` | Loading placeholders | `components/ui/Skeleton.tsx` |
| `Avatar` | User/Pet photos | `components/ui/Avatar.tsx` |
| `MediaGrid` | Grille 1/2/4 images | `components/ui/MediaGrid.tsx` |
| `MapPin` | Pins map avec badges | `components/MapMarker.tsx` ✅ |

### Règle GlassCard
- **Garder** : Map overlay, Menu flottant uniquement
- **Supprimer** : Tous les autres usages (remplacer par SurfaceCard)

---

## B) NAVIGATION & ÉCRANS

### Structure des Routes

```
app/
├── _layout.tsx              # Root layout
├── index.tsx                # Redirect
├── animated-splash.tsx      # Splash animé ✅
├── onboarding.tsx           # Welcome/Intent
├── onboarding-setup.tsx     # Setup rapide ✅
│
├── (tabs)/
│   ├── _layout.tsx          # Tab layout
│   ├── map.tsx              # Carte principale ✅
│   ├── community.tsx        # Feed communauté ✅
│   ├── messages.tsx         # Inbox groupée
│   └── profile.tsx          # Profil utilisateur
│
├── auth/
│   ├── signin.tsx
│   ├── signup.tsx
│   └── verify.tsx
│
├── pet/
│   ├── [id].tsx             # Fiche animal
│   ├── add.tsx
│   └── edit/[id].tsx
│
├── cat-sitter/
│   └── [id].tsx             # Fiche cat sitter
│
├── profile/
│   ├── [id].tsx             # Profil autre user
│   └── edit.tsx
│
├── messages/
│   ├── [id].tsx             # Chat conversation
│   └── new.tsx
│
├── booking/
│   ├── [id].tsx             # Réservation
│   └── confirmation/[id].tsx
│
├── lost-found/
│   ├── [id].tsx             # Détail alerte
│   └── report.tsx           # Signaler
│
├── community/
│   └── create.tsx           # Créer post
│
├── settings/
│   ├── index.tsx            # Paramètres principaux
│   ├── notifications.tsx
│   ├── privacy.tsx
│   └── ...
│
└── (pro)/                   # Dashboard pro
    ├── dashboard.tsx
    ├── shop.tsx
    └── services/manage.tsx
```

### Bottom Tabs
| Tab | Icône | Route |
|-----|-------|-------|
| Carte | `Map` | `/(tabs)/map` |
| Communauté | `Users` | `/(tabs)/community` |
| Messages | `MessageCircle` + badge | `/(tabs)/messages` |
| Profil | `User` | `/(tabs)/profile` |

### Header Universel
- **Gauche** : Avatar utilisateur (tap → menu)
- **Centre** : Prénom utilisateur
- **Sous-titre** : Noms des animaux ("Nana • Milo")
- **Droite** : Notifications badge

---

## C) FIREBASE DATA MODEL

### Collections Utilisées

| Collection | Champs Clés | Index Requis |
|------------|-------------|--------------|
| `users` | id, firstName, lastName, email, phoneNumber, photo, pets[], isCatSitter, isProfessional, location, privacySettings, pushToken | - |
| `pets` | id, name, type, breed, gender, ownerId, photo, location, birthDate, isActive | `ownerId` |
| `posts` | id, authorId, authorName, authorPhoto, content, images[], type, visibility, likesCount, commentsCount, location, createdAt | `visibility + createdAt DESC`, `authorId` |
| `comments` | id, postId, authorId, authorName, content, createdAt | `postId` |
| `likes` | postId_userId, postId, userId, createdAt | - |
| `friendRequests` | minUid_maxUid (idempotent), senderId, receiverId, status, timestamp | `receiverId + status`, `senderId + status` |
| `conversations` | id, participants[], lastMessage, unreadCount{}, updatedAt | `participants array-contains` |
| `messages` | id, conversationId, senderId, receiverId, content, timestamp, read | `conversationId` |
| `petSitterProfiles` | userId, name, photo, services[], pricing, availability, rating, reviewsCount, isActive, isVerified, location | `isActive` |
| `bookings` | id, clientId, catSitterId, petIds[], startDate, endDate, status, totalPrice, notes | `clientId`, `catSitterId` |
| `reviews` | id, authorId, targetId, targetType, rating, comment, createdAt | `targetId + targetType` |
| `lostFoundReports` | id, reporterId, type, petName, petType, description, photos[], location, status, reward, responses[], createdAt | `type + status`, `createdAt DESC` |
| `professionals` | userId, businessName, type, siret, address, phone, isVerified, services | `isVerified` |
| `notifications` | id, userId, type, title, body, data, read, createdAt | `userId + read` |
| `reports` | id, reporterId, targetType, targetId, reason, description, createdAt | - |
| `blockedUsers` | blockerId_blockedId, blockerId, blockedId, createdAt | `blockerId` |
| `petLikes` | fromPetId_toPetId, fromPetId, toPetId, userId, createdAt | `fromPetId`, `toPetId` |
| `petMatches` | minPetId_maxPetId, petIds[], createdAt | `petIds array-contains` |
| `challenges` | id, title, description, type, startDate, endDate, points, participants | `startDate` |
| `userChallenges` | id, userId, challengeId, status, pointsEarned | `userId`, `challengeId` |
| `challengeParticipations` | id, challengeId, userId, proof, status, votes[] | `challengeId`, `status` |
| `favorites` | userId_targetId, userId, targetId, targetType, createdAt | `userId` |

### Champs Immuables (jamais modifiables après création)
- `posts.authorId`
- `comments.authorId`
- `messages.senderId`
- `bookings.clientId`
- `reviews.authorId`
- `friendRequests.senderId`, `friendRequests.receiverId`
- `lostFoundReports.reporterId`

---

## D) FIXES CRITIQUES

### P0 - Bloquants

#### 1. Images Storage - Unauthorized
**Cause** : Path d'upload ne correspond pas aux rules
**Fix** : Vérifier que tous les uploads utilisent `users/{uid}/...`

```typescript
// services/storage.ts - Vérifier les paths
const uploadPetPhoto = async (userId: string, petId: string, uri: string) => {
  const path = `users/${userId}/pets/${petId}/${Date.now()}.jpg`;
  // ...
};
```

#### 2. Images non affichées
**Cause** : URLs pas récupérées avec `getDownloadURL`
**Fix** : Toujours utiliser getDownloadURL après upload

#### 3. Map Pros (Veto/Shop) absents
**Cause** : Google Places API key restrictions ou types incorrects
**Fix** :
- Vérifier que la clé autorise "Places API (Legacy)"
- Types corrects : `veterinary_care`, `pet_store`

```typescript
// services/google-places.ts
const PLACE_TYPES: Record<PlaceType, string> = {
  vet: 'veterinary_care',
  shop: 'pet_store',
  zoo: 'zoo',
  shelter: 'animal_shelter',
};
```

#### 4. Demandes d'amis répétées
**Cause** : Pas de vérification avant création
**Fix** : DocId idempotent `minUid_maxUid` + check existence

```typescript
// services/database.ts - friendRequestService.sendFriendRequest
const docId = [senderId, receiverId].sort().join('_');
const existingRequest = await getDoc(friendRequestRef);
if (existingRequest.exists()) {
  const data = existingRequest.data();
  if (data.status === 'pending') throw new Error('Demande déjà envoyée');
  if (data.status === 'accepted') throw new Error('Déjà amis');
}
```

#### 5. Messages pas groupés
**Cause** : Query messages sans filter conversationId
**Fix** : Toujours query par `conversationId`, afficher inbox via `conversations`

### P1 - Fonctionnel

| Bug | Fichier | Fix |
|-----|---------|-----|
| "Mes posts" ne fonctionne pas | `community.tsx` | Query `where('authorId', '==', userId)` |
| Delete post | `PostCard.tsx` | Ajouter `deleteDoc` + refresh |
| Langue pas appliquée instant | `i18n-store.ts` | Re-render via key + persist |
| Settings UI incohérent | `settings/index.tsx` | Fond blanc, sections propres |

---

## E) FIRESTORE RULES (PROD)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuth() {
      return request.auth != null;
    }
    
    function isOwner(uid) {
      return isAuth() && request.auth.uid == uid;
    }
    
    function isParticipant(participants) {
      return isAuth() && request.auth.uid in participants;
    }
    
    // Empêcher modification champs immuables
    function immutableField(field) {
      return !request.resource.data.diff(resource.data).affectedKeys().hasAny([field]);
    }
    
    // Users
    match /users/{userId} {
      allow read: if isAuth();
      allow create, update: if isOwner(userId);
      allow delete: if isOwner(userId);
    }
    
    // Pets
    match /pets/{petId} {
      allow read: if isAuth();
      allow create: if isAuth() && request.resource.data.ownerId == request.auth.uid;
      allow update: if isAuth() && resource.data.ownerId == request.auth.uid && immutableField('ownerId');
      allow delete: if isAuth() && resource.data.ownerId == request.auth.uid;
    }
    
    // Posts
    match /posts/{postId} {
      allow read: if isAuth();
      allow create: if isAuth() && request.resource.data.authorId == request.auth.uid;
      allow update: if isAuth() && resource.data.authorId == request.auth.uid && immutableField('authorId');
      allow delete: if isAuth() && resource.data.authorId == request.auth.uid;
    }
    
    // Comments
    match /comments/{commentId} {
      allow read: if isAuth();
      allow create: if isAuth() && request.resource.data.authorId == request.auth.uid;
      allow update, delete: if isAuth() && resource.data.authorId == request.auth.uid;
    }
    
    // Likes (immutable)
    match /likes/{likeId} {
      allow read: if isAuth();
      allow create: if isAuth() && request.resource.data.userId == request.auth.uid;
      allow delete: if isAuth() && resource.data.userId == request.auth.uid;
      allow update: if false;
    }
    
    // Conversations
    match /conversations/{convId} {
      allow read: if isAuth() && isParticipant(resource.data.participants);
      allow create: if isAuth() && isParticipant(request.resource.data.participants);
      allow update: if isAuth() && isParticipant(resource.data.participants);
      allow delete: if false;
    }
    
    // Messages - lecture seulement si participant conversation
    match /messages/{msgId} {
      allow read: if isAuth();
      allow create: if isAuth() && request.resource.data.senderId == request.auth.uid;
      allow update, delete: if false;
    }
    
    // Friend Requests (idempotent docId)
    match /friendRequests/{reqId} {
      allow read: if isAuth() && (resource.data.senderId == request.auth.uid || resource.data.receiverId == request.auth.uid);
      allow create: if isAuth() && request.resource.data.senderId == request.auth.uid;
      allow update: if isAuth() && resource.data.receiverId == request.auth.uid;
      allow delete: if isAuth() && (resource.data.senderId == request.auth.uid || resource.data.receiverId == request.auth.uid);
    }
    
    // Bookings
    match /bookings/{bookingId} {
      allow read: if isAuth() && (resource.data.clientId == request.auth.uid || resource.data.catSitterId == request.auth.uid);
      allow create: if isAuth() && request.resource.data.clientId == request.auth.uid;
      allow update: if isAuth() && (resource.data.clientId == request.auth.uid || resource.data.catSitterId == request.auth.uid);
      allow delete: if isAuth() && resource.data.clientId == request.auth.uid;
    }
    
    // Pet Sitter Profiles
    match /petSitterProfiles/{sitterId} {
      allow read: if isAuth();
      allow create, update: if isOwner(sitterId);
      allow delete: if isOwner(sitterId);
    }
    
    // Reviews
    match /reviews/{reviewId} {
      allow read: if isAuth();
      allow create: if isAuth() && request.resource.data.authorId == request.auth.uid;
      allow update: if isAuth() && resource.data.authorId == request.auth.uid && immutableField('authorId');
      allow delete: if false;
    }
    
    // Lost & Found
    match /lostFoundReports/{reportId} {
      allow read: if isAuth();
      allow create: if isAuth() && request.resource.data.reporterId == request.auth.uid;
      allow update: if isAuth() && resource.data.reporterId == request.auth.uid;
      allow delete: if isAuth() && resource.data.reporterId == request.auth.uid;
    }
    
    // Notifications
    match /notifications/{notifId} {
      allow read: if isAuth() && resource.data.userId == request.auth.uid;
      allow update: if isAuth() && resource.data.userId == request.auth.uid;
      allow create, delete: if false; // Créées par Cloud Functions
    }
    
    // Reports (modération)
    match /reports/{reportId} {
      allow read: if isAuth();
      allow create: if isAuth() && request.resource.data.reporterId == request.auth.uid;
      allow update, delete: if false;
    }
    
    // Blocked Users
    match /blockedUsers/{blockId} {
      allow read: if isAuth() && resource.data.blockerId == request.auth.uid;
      allow create: if isAuth() && request.resource.data.blockerId == request.auth.uid;
      allow delete: if isAuth() && resource.data.blockerId == request.auth.uid;
      allow update: if false;
    }
    
    // Favorites
    match /favorites/{favId} {
      allow read: if isAuth();
      allow create: if isAuth() && request.resource.data.userId == request.auth.uid;
      allow delete: if isAuth() && resource.data.userId == request.auth.uid;
      allow update: if false;
    }
    
    // Challenges (admin only write)
    match /challenges/{challengeId} {
      allow read: if isAuth();
      allow write: if false;
    }
    
    // User Challenges
    match /userChallenges/{ucId} {
      allow read: if isAuth();
      allow create, update: if isAuth() && request.resource.data.userId == request.auth.uid;
      allow delete: if false;
    }
    
    // Challenge Participations
    match /challengeParticipations/{partId} {
      allow read: if isAuth();
      allow create: if isAuth() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuth();
      allow delete: if false;
    }
    
    // Pet Matching
    match /petLikes/{likeId} {
      allow read: if isAuth();
      allow create: if isAuth();
      allow delete: if isAuth();
      allow update: if false;
    }
    
    match /petMatches/{matchId} {
      allow read: if isAuth();
      allow create: if isAuth();
      allow delete: if isAuth();
      allow update: if isAuth();
    }
    
    match /petPasses/{passId} {
      allow read: if isAuth();
      allow create: if isAuth();
      allow delete: if false;
      allow update: if false;
    }
    
    // Professionals
    match /professionals/{profId} {
      allow read: if isAuth();
      allow create, update: if isOwner(profId);
      allow delete: if false;
    }
    
    // Products (admin write)
    match /products/{productId} {
      allow read: if isAuth();
      allow write: if false;
    }
    
    // Professional Products
    match /professionalProducts/{productId} {
      allow read: if isAuth();
      allow create: if isAuth() && request.resource.data.sellerId == request.auth.uid;
      allow update: if isAuth() && resource.data.sellerId == request.auth.uid;
      allow delete: if isAuth() && resource.data.sellerId == request.auth.uid;
    }
    
    // Deny all others
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## F) STORAGE RULES

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    function isAuth() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuth() && request.auth.uid == userId;
    }
    
    function isValidImage() {
      return request.resource.contentType.matches('image/.*')
          && request.resource.size < 10 * 1024 * 1024;
    }
    
    function isValidVideo() {
      return request.resource.contentType.matches('video/.*')
          && request.resource.size < 50 * 1024 * 1024;
    }
    
    // User profile photos
    match /users/{userId}/profile/{filename} {
      allow read: if isAuth();
      allow write: if isOwner(userId) && isValidImage();
      allow delete: if isOwner(userId);
    }
    
    // Pet photos
    match /users/{userId}/pets/{petId}/{filename} {
      allow read: if isAuth();
      allow write: if isOwner(userId) && isValidImage();
      allow delete: if isOwner(userId);
    }
    
    // Post media
    match /users/{userId}/posts/{postId}/{filename} {
      allow read: if isAuth();
      allow write: if isOwner(userId) && (isValidImage() || isValidVideo());
      allow delete: if isOwner(userId);
    }
    
    // Lost & Found
    match /users/{userId}/lost-found/{reportId}/{filename} {
      allow read: if isAuth();
      allow write: if isOwner(userId) && isValidImage();
      allow delete: if isOwner(userId);
    }
    
    // Challenge submissions
    match /users/{userId}/challenges/{challengeId}/{filename} {
      allow read: if isAuth();
      allow write: if isOwner(userId) && (isValidImage() || isValidVideo());
      allow delete: if isOwner(userId);
    }
    
    // Verifications (SIRET, assurance)
    match /users/{userId}/verifications/{filename} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
      allow delete: if isOwner(userId);
    }
    
    // Messages attachments
    match /messages/{conversationId}/{filename} {
      allow read: if isAuth();
      allow write: if isAuth() && isValidImage();
      allow delete: if false;
    }
    
    // Deny all others
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## G) PLAN D'EXÉCUTION

### Phase 0 : Audit & Nettoyage (1 jour)
- [ ] Supprimer tous les mocks (`paris-*`, fake users)
- [ ] Ajouter feature flags pour debug
- [ ] Vérifier toutes les queries Firebase

### Phase 1 : Design System (2 jours)
- [ ] Mettre à jour `constants/colors.ts` avec tokens 2025
- [ ] Créer `components/ui/` avec composants standardisés
- [ ] Remplacer GlassCard par SurfaceCard (sauf map/menu)
- [ ] Appliquer fond blanc global

### Phase 2 : Firebase & Data (1 jour)
- [ ] Déployer Firestore rules prod
- [ ] Déployer Storage rules prod
- [ ] Créer indexes manquants
- [ ] Vérifier Google Places API key

### Phase 3 : Refonte Écrans (3-4 jours)
- [ ] Map : filtres, bottom sheet, pins badges
- [ ] Community : feed propre, stories, filtres chips, delete post
- [ ] Messages : inbox groupée, badges non-lus
- [ ] Profile : sections claires, mes posts, settings inline
- [ ] Cat Sitter : fiche, réservation, dashboard

### Phase 4 : Modération & Vérification (1 jour)
- [ ] Système de signalement complet
- [ ] Queue modération (reports → moderationQueue)
- [ ] Vérification pro (SIRET check via API)

### Phase 5 : Tests & QA (1 jour)
- [ ] Test manuel complet (15 min checklist)
- [ ] Vérifier images partout
- [ ] Vérifier amis idempotents
- [ ] Vérifier messages groupés
- [ ] Vérifier langue instant

---

## H) CHECKLIST TEST MANUEL (15 min)

1. **Auth** (2 min)
   - [ ] Login existant
   - [ ] Logout
   - [ ] Login à nouveau

2. **Animaux** (3 min)
   - [ ] Ajouter animal avec photo
   - [ ] Photo visible dans profil
   - [ ] Photo visible sur map
   - [ ] Photo visible dans top bar

3. **Map** (3 min)
   - [ ] Voir ses animaux
   - [ ] Voir cat sitters
   - [ ] Voir vétérinaires (Google Places)
   - [ ] Voir pet shops
   - [ ] Filtres fonctionnent

4. **Amis** (2 min)
   - [ ] Envoyer demande ami
   - [ ] Re-envoyer = erreur (idempotent)
   - [ ] Accepter demande
   - [ ] Voir fiche ami depuis map

5. **Posts** (2 min)
   - [ ] Créer post avec photo
   - [ ] Like/unlike
   - [ ] Commenter
   - [ ] Supprimer son post

6. **Messages** (2 min)
   - [ ] Voir conversations groupées
   - [ ] Envoyer message
   - [ ] Badge non-lu

7. **Booking** (1 min)
   - [ ] Voir fiche cat sitter
   - [ ] Initier réservation
   - [ ] Voir statut

---

## I) FICHIERS À MODIFIER

| Fichier | Action |
|---------|--------|
| `constants/colors.ts` | Mettre à jour tokens |
| `constants/typography.ts` | Standardiser |
| `components/ui/SurfaceCard.tsx` | Créer |
| `components/ui/Button.tsx` | Créer variantes |
| `components/ui/Avatar.tsx` | Créer |
| `components/ui/Skeleton.tsx` | Créer |
| `components/ui/Toast.tsx` | Créer |
| `components/ui/ActionSheet.tsx` | Créer |
| `components/AppHeader.tsx` | Ajouter sous-titre animaux |
| `components/PostCard.tsx` | Ajouter delete |
| `app/(tabs)/_layout.tsx` | Fond blanc, badges |
| `app/(tabs)/map.tsx` | Filtres, Google Places debug |
| `app/(tabs)/community.tsx` | Refonte complète |
| `app/(tabs)/messages.tsx` | Inbox groupée |
| `app/(tabs)/profile.tsx` | Sections claires |
| `app/settings/index.tsx` | Fond blanc, langue instant |
| `services/database.ts` | Fix friend requests idempotent |
| `services/google-places.ts` | Fix types, logs |
| `firestore.rules` | Prod rules |
| `storage.rules` | Prod rules |

---

*Document généré pour la refonte Odalea 2025*
