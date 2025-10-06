# 🔒 Règles de Sécurité Firestore Temporaires (Pour Tests)

## ⚠️ IMPORTANT
Ces règles sont **TEMPORAIRES** et permettent l'accès en lecture sans authentification pour faciliter les tests.
**NE PAS UTILISER EN PRODUCTION** - Vous devez implémenter Firebase Authentication avant de déployer.

## 📋 Règles Firestore Temporaires

Copiez ces règles dans la console Firebase > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users Collection - Allow read for all, write for authenticated
    match /users/{userId} {
      allow read: if true;  // Temporary: Allow all reads
      allow create: if isAuthenticated() || true;  // Temporary: Allow all creates
      allow update: if isOwner(userId) || true;  // Temporary: Allow all updates
      allow delete: if isOwner(userId);
    }
    
    // Pets Collection - Allow read for all
    match /pets/{petId} {
      allow read: if true;  // Temporary: Allow all reads
      allow create: if isAuthenticated() || true;  // Temporary: Allow all creates
      allow update: if isAuthenticated() || true;  // Temporary: Allow all updates
      allow delete: if isAuthenticated() || true;  // Temporary: Allow all deletes
    }
    
    // Posts Collection - Allow read for all
    match /posts/{postId} {
      allow read: if true;  // Temporary: Allow all reads
      allow create: if isAuthenticated() || true;
      allow update, delete: if isAuthenticated() || true;
    }
    
    // Comments Collection - Allow read for all
    match /comments/{commentId} {
      allow read: if true;  // Temporary: Allow all reads
      allow create: if isAuthenticated() || true;
      allow update, delete: if isAuthenticated() || true;
    }
    
    // Likes Collection - Allow read for all
    match /likes/{likeId} {
      allow read: if true;  // Temporary: Allow all reads
      allow create, delete: if isAuthenticated() || true;
    }
    
    // Conversations Collection
    match /conversations/{conversationId} {
      allow read: if isAuthenticated() || true;
      allow create: if isAuthenticated() || true;
      allow update: if isAuthenticated() || true;
      allow delete: if false;
    }
    
    // Messages Collection
    match /messages/{messageId} {
      allow read: if isAuthenticated() || true;
      allow create: if isAuthenticated() || true;
      allow update, delete: if false;
    }
    
    // Products Collection - Allow read for all
    match /products/{productId} {
      allow read: if true;  // Temporary: Allow all reads
      allow write: if false;  // Admin only
    }
    
    // Professional Products Collection
    match /professionalProducts/{productId} {
      allow read: if true;  // Temporary: Allow all reads
      allow create: if isAuthenticated() || true;
      allow update: if isAuthenticated() || true;
      allow delete: if isAuthenticated() || true;
    }
    
    // Orders Collection
    match /orders/{orderId} {
      allow read: if isAuthenticated() || true;
      allow create: if isAuthenticated() || true;
      allow update, delete: if false;
    }
    
    // Bookings Collection
    match /bookings/{bookingId} {
      allow read: if isAuthenticated() || true;
      allow create: if isAuthenticated() || true;
      allow update: if isAuthenticated() || true;
      allow delete: if isAuthenticated() || true;
    }
    
    // Reviews Collection - Allow read for all
    match /reviews/{reviewId} {
      allow read: if true;  // Temporary: Allow all reads
      allow create: if isAuthenticated() || true;
      allow update: if isAuthenticated() || true;
      allow delete: if false;
    }
    
    // Lost & Found Reports Collection - Allow read for all
    match /lostFoundReports/{reportId} {
      allow read: if true;  // Temporary: Allow all reads
      allow create: if isAuthenticated() || true;
      allow update: if isAuthenticated() || true;
      allow delete: if isAuthenticated() || true;
    }
    
    // Challenges Collection - Allow read for all
    match /challenges/{challengeId} {
      allow read: if true;  // Temporary: Allow all reads
      allow write: if false;  // Admin only
    }
    
    // User Challenges Collection
    match /userChallenges/{userChallengeId} {
      allow read: if true;  // Temporary: Allow all reads
      allow create, update: if isAuthenticated() || true;
      allow delete: if false;
    }
    
    // Challenge Participations Collection
    match /challengeParticipations/{participationId} {
      allow read: if true;  // Temporary: Allow all reads
      allow create: if isAuthenticated() || true;
      allow update: if isAuthenticated() || true;
      allow delete: if false;
    }
    
    // Challenge Submissions Collection
    match /challengeSubmissions/{submissionId} {
      allow read: if true;  // Temporary: Allow all reads
      allow create: if isAuthenticated() || true;
      allow update, delete: if false;
    }
    
    // Badges Collection - Allow read for all
    match /badges/{badgeId} {
      allow read: if true;  // Temporary: Allow all reads
      allow write: if false;  // Admin only
    }
    
    // User Badges Collection
    match /userBadges/{userBadgeId} {
      allow read: if true;  // Temporary: Allow all reads
      allow write: if false;  // Admin only
    }
    
    // Notifications Collection
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() || true;
      allow update: if isAuthenticated() || true;
      allow create, delete: if false;
    }
    
    // Friend Requests Collection
    match /friendRequests/{requestId} {
      allow read: if isAuthenticated() || true;
      allow create: if isAuthenticated() || true;
      allow update: if isAuthenticated() || true;
      allow delete: if false;
    }
    
    // Professionals Collection
    match /professionals/{professionalId} {
      allow read: if true;  // Temporary: Allow all reads
      allow create, update: if isAuthenticated() || true;
      allow delete: if false;
    }
    
    // Pet Sitter Profiles Collection
    match /petSitterProfiles/{sitterId} {
      allow read: if true;  // Temporary: Allow all reads
      allow create, update: if isAuthenticated() || true;
      allow delete: if isAuthenticated() || true;
    }
    
    // Health Records Collection
    match /healthRecords/{recordId} {
      allow read: if isAuthenticated() || true;
      allow create, update: if isAuthenticated() || true;
      allow delete: if isAuthenticated() || true;
    }
    
    // Vaccinations Collection
    match /vaccinations/{vaccinationId} {
      allow read: if isAuthenticated() || true;
      allow create, update: if isAuthenticated() || true;
      allow delete: if isAuthenticated() || true;
    }
    
    // Emergency Contacts Collection
    match /emergencyContacts/{contactId} {
      allow read: if isAuthenticated() || true;
      allow create, update: if isAuthenticated() || true;
      allow delete: if isAuthenticated() || true;
    }
    
    // Animal Species Collection - Allow read for all
    match /animalSpecies/{speciesId} {
      allow read: if true;  // Temporary: Allow all reads
      allow write: if false;  // Admin only
    }
    
    // Animal Breeds Collection - Allow read for all
    match /animalBreeds/{breedId} {
      allow read: if true;  // Temporary: Allow all reads
      allow write: if false;  // Admin only
    }
  }
}
```

## 📦 Règles Firebase Storage Temporaires

Copiez ces règles dans la console Firebase > Storage > Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    function isVideo() {
      return request.resource.contentType.matches('video/.*');
    }
    
    function isValidSize() {
      return (isImage() && request.resource.size < 10 * 1024 * 1024) ||
             (isVideo() && request.resource.size < 50 * 1024 * 1024);
    }
    
    // User Profile Photos - Allow read for all
    match /users/{userId}/profile/{fileName} {
      allow read: if true;  // Temporary: Allow all reads
      allow write: if isAuthenticated() || true;  // Temporary: Allow all writes
      allow delete: if isOwner(userId) || true;
    }
    
    // Pet Photos - Allow read for all
    match /pets/{petId}/{fileName} {
      allow read: if true;  // Temporary: Allow all reads
      allow write: if isAuthenticated() || true;  // Temporary: Allow all writes
      allow delete: if isAuthenticated() || true;
    }
    
    // Post Media - Allow read for all
    match /posts/{postId}/{fileName} {
      allow read: if true;  // Temporary: Allow all reads
      allow write: if isAuthenticated() || true;
      allow delete: if isAuthenticated() || true;
    }
    
    // Challenge Submissions Media
    match /challenges/{challengeId}/submissions/{userId}/{fileName} {
      allow read: if true;  // Temporary: Allow all reads
      allow write: if isAuthenticated() || true;
      allow delete: if isOwner(userId) || true;
    }
    
    // Lost & Found Report Photos
    match /lostFound/{reportId}/{fileName} {
      allow read: if true;  // Temporary: Allow all reads
      allow write: if isAuthenticated() || true;
      allow delete: if isAuthenticated() || true;
    }
    
    // Professional Product Photos
    match /products/{sellerId}/{productId}/{fileName} {
      allow read: if true;  // Temporary: Allow all reads
      allow write: if isAuthenticated() || true;
      allow delete: if isOwner(sellerId) || true;
    }
    
    // Professional Company Logos
    match /professionals/{userId}/logo/{fileName} {
      allow read: if true;  // Temporary: Allow all reads
      allow write: if isAuthenticated() || true;
      allow delete: if isOwner(userId) || true;
    }
    
    // Health Documents
    match /health/{petId}/{documentId}/{fileName} {
      allow read: if isAuthenticated() || true;
      allow write: if isAuthenticated() || true;
      allow delete: if isAuthenticated() || true;
    }
    
    // Message Media
    match /messages/{conversationId}/{messageId}/{fileName} {
      allow read: if isAuthenticated() || true;
      allow write: if isAuthenticated() || true;
      allow delete: if false;
    }
  }
}
```

## 🚀 Instructions d'Application

### 1. Appliquer les Règles Firestore

1. Allez dans [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet "copattes"
3. Allez dans **Firestore Database** > **Rules**
4. Copiez les règles Firestore ci-dessus
5. Cliquez sur **Publier**

### 2. Appliquer les Règles Storage

1. Dans la même console Firebase
2. Allez dans **Storage** > **Rules**
3. Copiez les règles Storage ci-dessus
4. Cliquez sur **Publier**

## ⚠️ Avertissements de Sécurité

Ces règles sont **TEMPORAIRES** et permettent:
- ✅ Lecture publique de la plupart des collections
- ✅ Écriture sans authentification stricte
- ❌ **PAS SÉCURISÉ POUR LA PRODUCTION**

### Avant de déployer en production, vous DEVEZ:

1. **Implémenter Firebase Authentication**
   - Remplacer le mock user store par Firebase Auth
   - Utiliser `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, etc.
   - Synchroniser l'état d'authentification avec Firestore

2. **Restaurer les Règles de Sécurité Strictes**
   - Utiliser les règles du fichier `FIRESTORE_SECURITY_RULES.md`
   - Supprimer tous les `|| true` des règles
   - Tester toutes les opérations avec des utilisateurs authentifiés

3. **Tester les Permissions**
   - Vérifier que les utilisateurs non authentifiés ne peuvent pas écrire
   - Vérifier que les utilisateurs ne peuvent modifier que leurs propres données
   - Tester tous les cas d'usage critiques

## 📝 Prochaines Étapes

1. Appliquer ces règles temporaires pour débloquer le développement
2. Implémenter Firebase Authentication dans `hooks/firebase-user-store.ts`
3. Migrer de `hooks/user-store.ts` vers `hooks/firebase-user-store.ts`
4. Restaurer les règles de sécurité strictes
5. Tester en profondeur avant le déploiement

Date de création: 2025-10-06
