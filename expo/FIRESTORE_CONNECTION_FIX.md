# Fix Firestore Connection Timeout

## ✅ Correctifs appliqués

### 1. Configuration Firestore optimisée
- ❌ Supprimé `experimentalForceLongPolling` qui causait des timeouts
- ✅ Configuration simplifiée avec cache persistant uniquement
- ✅ Détection automatique du meilleur mode de connexion

## 🔧 Étapes à suivre dans Firebase Console

### 1. Vérifier les règles Firestore

Allez dans **Firebase Console > Firestore Database > Rules** et assurez-vous que les règles sont publiées:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users Collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create, update: if isOwner(userId);
      allow delete: if isOwner(userId);
    }
    
    // Pets Collection
    match /pets/{petId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                       request.resource.data.ownerId == request.auth.uid;
      allow update: if isAuthenticated() && 
                       resource.data.ownerId == request.auth.uid;
      allow delete: if isAuthenticated() && 
                       resource.data.ownerId == request.auth.uid;
    }
    
    // Posts Collection
    match /posts/{postId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                       request.resource.data.authorId == request.auth.uid;
      allow update, delete: if isAuthenticated() && 
                               resource.data.authorId == request.auth.uid;
    }
    
    // Messages Collection
    match /messages/{messageId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                       request.resource.data.senderId == request.auth.uid;
      allow update, delete: if false;
    }
    
    // Conversations Collection
    match /conversations/{conversationId} {
      allow read: if isAuthenticated() && 
                     request.auth.uid in resource.data.participants;
      allow create: if isAuthenticated() && 
                       request.auth.uid in request.resource.data.participants;
      allow update: if isAuthenticated() && 
                       request.auth.uid in resource.data.participants;
      allow delete: if false;
    }
    
    // Lost & Found Reports
    match /lostFoundReports/{reportId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                       request.resource.data.reporterId == request.auth.uid;
      allow update: if isAuthenticated() && 
                       resource.data.reporterId == request.auth.uid;
      allow delete: if isAuthenticated() && 
                       resource.data.reporterId == request.auth.uid;
    }
    
    // Bookings Collection
    match /bookings/{bookingId} {
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid || 
                      resource.data.catSitterId == request.auth.uid);
      allow create: if isAuthenticated() && 
                       request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && 
                       (resource.data.userId == request.auth.uid || 
                        resource.data.catSitterId == request.auth.uid);
      allow delete: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid;
    }
    
    // Challenges Collection
    match /challenges/{challengeId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    
    // User Challenges
    match /userChallenges/{userChallengeId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated() && 
                               request.resource.data.userId == request.auth.uid;
      allow delete: if false;
    }
    
    // Badges Collection
    match /badges/{badgeId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    
    // User Badges
    match /userBadges/{userBadgeId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid;
      allow create, delete: if false;
    }
    
    // Friend Requests
    match /friendRequests/{requestId} {
      allow read: if isAuthenticated() && 
                     (resource.data.senderId == request.auth.uid || 
                      resource.data.receiverId == request.auth.uid);
      allow create: if isAuthenticated() && 
                       request.resource.data.senderId == request.auth.uid;
      allow update: if isAuthenticated() && 
                       resource.data.receiverId == request.auth.uid;
      allow delete: if false;
    }
    
    // Pet Sitter Profiles
    match /petSitterProfiles/{sitterId} {
      allow read: if isAuthenticated();
      allow create, update: if isOwner(sitterId);
      allow delete: if isOwner(sitterId);
    }
    
    // Reviews
    match /reviews/{reviewId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                       request.resource.data.authorId == request.auth.uid;
      allow update: if isAuthenticated() && 
                       resource.data.authorId == request.auth.uid;
      allow delete: if false;
    }
  }
}
```

### 2. Vérifier les règles Storage

Allez dans **Firebase Console > Storage > Rules**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    function isValidSize() {
      return request.resource.size < 10 * 1024 * 1024;
    }
    
    // User Profile Photos
    match /users/{userId}/profile/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) && isImage() && isValidSize();
      allow delete: if isOwner(userId);
    }
    
    // Pet Photos
    match /pets/{petId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isImage() && isValidSize();
      allow delete: if isAuthenticated();
    }
    
    // Post Media
    match /posts/{postId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isImage() && isValidSize();
      allow delete: if isAuthenticated();
    }
    
    // Lost & Found Photos
    match /lostFound/{reportId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isImage() && isValidSize();
      allow delete: if isAuthenticated();
    }
    
    // Message Media
    match /messages/{conversationId}/{messageId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isImage() && isValidSize();
      allow delete: if false;
    }
  }
}
```

### 3. Vérifier la configuration réseau

1. **Vérifier que Firestore est activé**:
   - Firebase Console > Firestore Database
   - Assurez-vous que la base de données est créée en mode "production"

2. **Vérifier les quotas**:
   - Firebase Console > Usage
   - Vérifiez que vous n'avez pas dépassé les quotas gratuits

3. **Vérifier la région**:
   - La base de données doit être dans une région proche (ex: europe-west1)

### 4. Test de connexion

Après avoir appliqué les règles, testez la connexion:

```typescript
// Dans votre app, ajoutez ce test
import { db } from '@/services/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function testConnection() {
  try {
    console.log('🔍 Testing Firestore connection...');
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    console.log('✅ Firestore connected! Users count:', snapshot.size);
    return true;
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
    return false;
  }
}
```

## 🐛 Debugging

Si le problème persiste:

1. **Vérifier les logs Firebase**:
   ```
   Firebase Console > Firestore Database > Usage
   ```

2. **Vérifier l'authentification**:
   - L'utilisateur doit être authentifié avant d'accéder à Firestore
   - Vérifiez que `auth.currentUser` n'est pas null

3. **Vérifier la connexion internet**:
   - Le message d'erreur indique souvent un problème de réseau
   - Testez sur un autre réseau

4. **Vérifier les index**:
   - Firebase Console > Firestore Database > Indexes
   - Créez les index manquants si demandé

## 📱 Test sur mobile

Pour tester sur mobile:
1. Scannez le QR code avec Expo Go
2. Vérifiez les logs dans la console
3. Assurez-vous d'avoir une connexion internet stable

## 🔄 Redémarrage

Après avoir appliqué les correctifs:
1. Arrêtez le serveur de développement
2. Effacez le cache: `npx expo start -c`
3. Redémarrez l'application

## ⚠️ Points importants

1. **Les règles doivent être publiées** dans Firebase Console
2. **L'utilisateur doit être authentifié** avant d'accéder aux données
3. **La connexion internet doit être stable**
4. **Les quotas Firebase ne doivent pas être dépassés**

## 📞 Support

Si le problème persiste après avoir suivi ces étapes:
1. Vérifiez les logs détaillés dans Firebase Console
2. Vérifiez que votre projet Firebase est bien configuré
3. Assurez-vous que les clés API dans .env sont correctes
