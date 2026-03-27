# Règles Firestore pour les Favoris

## ⚠️ Action requise

La collection `favorites` n'a actuellement **aucune règle de sécurité** dans Firestore, ce qui bloque toutes les opérations.

## 📋 Règles à ajouter

Allez dans la **Console Firebase** > **Firestore Database** > **Rules** et ajoutez cette section :

```javascript
// Favorites Collection
match /favorites/{favoriteId} {
  // Un utilisateur peut lire ses propres favoris
  allow read: if isAuthenticated() && 
                 resource.data.userId == request.auth.uid;
  
  // Un utilisateur peut créer ses propres favoris
  allow create: if isAuthenticated() && 
                   request.resource.data.userId == request.auth.uid &&
                   request.resource.data.keys().hasAll(['userId', 'petId', 'createdAt']);
  
  // Un utilisateur peut supprimer ses propres favoris
  allow delete: if isAuthenticated() && 
                   resource.data.userId == request.auth.uid;
  
  // Pas de modification
  allow update: if false;
}
```

## 🔧 Où ajouter ces règles

Dans votre fichier de règles Firestore existant, ajoutez cette section **avant** la dernière accolade fermante `}`.

Par exemple, ajoutez-la après la section `Emergency Contacts Collection` (ligne ~403 dans FIRESTORE_SECURITY_RULES.md).

## ✅ Règles complètes pour votre projet

Voici la version complète mise à jour avec la section favorites incluse. Copiez-collez ceci dans **Console Firebase > Firestore Database > Rules** :

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
    
    function isParticipant(participants) {
      return isAuthenticated() && request.auth.uid in participants;
    }
    
    function isValidUser() {
      return isAuthenticated() && 
             request.resource.data.keys().hasAll(['firstName', 'lastName', 'email']) &&
             request.resource.data.firstName is string &&
             request.resource.data.lastName is string &&
             request.resource.data.email is string;
    }
    
    function isValidPet() {
      return isAuthenticated() && 
             request.resource.data.keys().hasAll(['name', 'type', 'ownerId']) &&
             request.resource.data.name is string &&
             request.resource.data.type is string &&
             request.resource.data.ownerId == request.auth.uid;
    }
    
    // Users Collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId) && isValidUser();
      allow update: if isOwner(userId) && isValidUser();
      allow delete: if isOwner(userId);
    }
    
    // Pets Collection
    match /pets/{petId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isValidPet();
      allow update: if isAuthenticated() && 
                       resource.data.ownerId == request.auth.uid &&
                       request.resource.data.ownerId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.ownerId == request.auth.uid;
    }
    
    // Posts Collection
    match /posts/{postId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                       request.resource.data.authorId == request.auth.uid;
      allow update, delete: if isAuthenticated() && 
                               resource.data.authorId == request.auth.uid;
    }
    
    // Comments Collection
    match /comments/{commentId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                       request.resource.data.authorId == request.auth.uid;
      allow update, delete: if isAuthenticated() && 
                               resource.data.authorId == request.auth.uid;
    }
    
    // Likes Collection
    match /likes/{likeId} {
      allow read: if isAuthenticated();
      allow create, delete: if isAuthenticated() && 
                               request.resource.data.userId == request.auth.uid;
    }
    
    // Favorites Collection
    match /favorites/{favoriteId} {
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && 
                       request.resource.data.userId == request.auth.uid &&
                       request.resource.data.keys().hasAll(['userId', 'petId', 'createdAt']);
      allow delete: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid;
      allow update: if false;
    }
    
    // Conversations Collection
    match /conversations/{conversationId} {
      allow read: if isAuthenticated() && 
                     isParticipant(resource.data.participants);
      allow create: if isAuthenticated() && 
                       isParticipant(request.resource.data.participants);
      allow update: if isAuthenticated() && 
                       isParticipant(resource.data.participants);
      allow delete: if false;
    }
    
    // Messages Collection
    match /messages/{messageId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                       request.resource.data.senderId == request.auth.uid;
      allow update, delete: if false;
    }
    
    // Products Collection
    match /products/{productId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    
    // Professional Products Collection
    match /professionalProducts/{productId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                       request.resource.data.sellerId == request.auth.uid;
      allow update: if isAuthenticated() && 
                       resource.data.sellerId == request.auth.uid;
      allow delete: if isAuthenticated() && 
                       resource.data.sellerId == request.auth.uid;
    }
    
    // Orders Collection
    match /orders/{orderId} {
      allow read: if isAuthenticated() && 
                     resource.data.customerId == request.auth.uid;
      allow create: if isAuthenticated() && 
                       request.resource.data.customerId == request.auth.uid;
      allow update, delete: if false;
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
    
    // Reviews Collection
    match /reviews/{reviewId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                       request.resource.data.authorId == request.auth.uid;
      allow update: if isAuthenticated() && 
                       resource.data.authorId == request.auth.uid;
      allow delete: if false;
    }
    
    // Lost & Found Reports Collection
    match /lostFoundReports/{reportId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                       request.resource.data.reporterId == request.auth.uid;
      allow update: if isAuthenticated() && 
                       resource.data.reporterId == request.auth.uid;
      allow delete: if isAuthenticated() && 
                       resource.data.reporterId == request.auth.uid;
    }
    
    // Challenges Collection
    match /challenges/{challengeId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    
    // User Challenges Collection
    match /userChallenges/{userChallengeId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated() && 
                               request.resource.data.userId == request.auth.uid;
      allow delete: if false;
    }
    
    // Challenge Participations Collection
    match /challengeParticipations/{participationId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                       request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated();
      allow delete: if false;
    }
    
    // Challenge Submissions Collection
    match /challengeSubmissions/{submissionId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                       request.resource.data.userId == request.auth.uid;
      allow update, delete: if false;
    }
    
    // Badges Collection
    match /badges/{badgeId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    
    // User Badges Collection
    match /userBadges/{userBadgeId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    
    // Notifications Collection
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid &&
                       request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);
      allow create, delete: if false;
    }
    
    // Friend Requests Collection
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
    
    // Professionals Collection
    match /professionals/{professionalId} {
      allow read: if isAuthenticated();
      allow create, update: if isOwner(professionalId);
      allow delete: if false;
    }
    
    // Pet Sitter Profiles Collection
    match /petSitterProfiles/{sitterId} {
      allow read: if isAuthenticated();
      allow create, update: if isOwner(sitterId);
      allow delete: if isOwner(sitterId);
    }
    
    // Health Records Collection
    match /healthRecords/{recordId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // Vaccinations Collection
    match /vaccinations/{vaccinationId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // Emergency Contacts Collection
    match /emergencyContacts/{contactId} {
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      allow create, update: if isAuthenticated() && 
                               request.resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid;
    }
    
    // Animal Species Collection
    match /animalSpecies/{speciesId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    
    // Animal Breeds Collection
    match /animalBreeds/{breedId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
  }
}
```

## 📱 Étapes à suivre

1. **Ouvrez la Console Firebase** : https://console.firebase.google.com
2. Sélectionnez votre projet
3. Allez dans **Firestore Database**
4. Cliquez sur l'onglet **Rules**
5. **Remplacez tout le contenu** par les règles ci-dessus
6. Cliquez sur **Publier**

## ✅ Vérification

Après avoir publié les règles, testez dans votre app :
- Ajouter un favori → devrait fonctionner ✅
- Supprimer un favori → devrait fonctionner ✅
- Voir mes favoris → devrait fonctionner ✅

L'erreur "Missing or insufficient permissions" devrait disparaître.
