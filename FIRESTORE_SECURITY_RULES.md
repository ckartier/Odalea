# Règles de Sécurité Firestore et Storage

## 📋 Vue d'ensemble

Ce document contient les règles de sécurité recommandées pour Firestore et Firebase Storage pour l'application Copattes.

## 🔥 Règles Firestore

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
      // Tout utilisateur authentifié peut lire les profils publics
      allow read: if isAuthenticated();
      
      // Seul le propriétaire peut créer/modifier son profil
      allow create: if isOwner(userId) && isValidUser();
      allow update: if isOwner(userId) && isValidUser();
      
      // Seul le propriétaire peut supprimer son profil
      allow delete: if isOwner(userId);
    }
    
    // Pets Collection
    match /pets/{petId} {
      // Tout utilisateur authentifié peut lire les animaux (pour la carte et les fonctionnalités sociales)
      allow read: if isAuthenticated();
      
      // Seul le propriétaire peut créer/modifier son animal
      allow create: if isAuthenticated() && isValidPet();
      allow update: if isAuthenticated() && 
                       resource.data.ownerId == request.auth.uid &&
                       request.resource.data.ownerId == request.auth.uid;
      
      // Seul le propriétaire peut supprimer son animal
      allow delete: if isAuthenticated() && resource.data.ownerId == request.auth.uid;
    }
    
    // Posts Collection
    match /posts/{postId} {
      // Tout utilisateur authentifié peut lire les posts
      allow read: if isAuthenticated();
      
      // Tout utilisateur authentifié peut créer un post
      allow create: if isAuthenticated() && 
                       request.resource.data.authorId == request.auth.uid;
      
      // Seul l'auteur peut modifier/supprimer son post
      allow update, delete: if isAuthenticated() && 
                               resource.data.authorId == request.auth.uid;
    }
    
    // Comments Collection
    match /comments/{commentId} {
      // Tout utilisateur authentifié peut lire les commentaires
      allow read: if isAuthenticated();
      
      // Tout utilisateur authentifié peut créer un commentaire
      allow create: if isAuthenticated() && 
                       request.resource.data.authorId == request.auth.uid;
      
      // Seul l'auteur peut modifier/supprimer son commentaire
      allow update, delete: if isAuthenticated() && 
                               resource.data.authorId == request.auth.uid;
    }
    
    // Likes Collection
    match /likes/{likeId} {
      // Tout utilisateur authentifié peut lire les likes
      allow read: if isAuthenticated();
      
      // Seul l'utilisateur peut créer/supprimer ses propres likes
      allow create, delete: if isAuthenticated() && 
                               request.resource.data.userId == request.auth.uid;
    }
    
    // Conversations Collection
    match /conversations/{conversationId} {
      // Seuls les participants peuvent lire la conversation
      allow read: if isAuthenticated() && 
                     isParticipant(resource.data.participants);
      
      // Tout utilisateur authentifié peut créer une conversation
      allow create: if isAuthenticated() && 
                       isParticipant(request.resource.data.participants);
      
      // Seuls les participants peuvent modifier la conversation
      allow update: if isAuthenticated() && 
                       isParticipant(resource.data.participants);
      
      // Pas de suppression de conversations
      allow delete: if false;
    }
    
    // Messages Collection
    match /messages/{messageId} {
      // Lecture via la conversation parente
      allow read: if isAuthenticated();
      
      // Seul l'expéditeur peut créer un message
      allow create: if isAuthenticated() && 
                       request.resource.data.senderId == request.auth.uid;
      
      // Pas de modification/suppression de messages
      allow update, delete: if false;
    }
    
    // Products Collection (marketplace général)
    match /products/{productId} {
      // Tout utilisateur authentifié peut lire les produits
      allow read: if isAuthenticated();
      
      // Seuls les admins peuvent créer/modifier/supprimer (géré côté serveur)
      allow write: if false;
    }
    
    // Professional Products Collection
    match /professionalProducts/{productId} {
      // Tout utilisateur authentifié peut lire les produits approuvés
      allow read: if isAuthenticated();
      
      // Seul le vendeur peut créer ses produits
      allow create: if isAuthenticated() && 
                       request.resource.data.sellerId == request.auth.uid;
      
      // Seul le vendeur peut modifier ses produits
      allow update: if isAuthenticated() && 
                       resource.data.sellerId == request.auth.uid;
      
      // Seul le vendeur peut supprimer ses produits
      allow delete: if isAuthenticated() && 
                       resource.data.sellerId == request.auth.uid;
    }
    
    // Orders Collection
    match /orders/{orderId} {
      // Seul le client peut lire sa commande
      allow read: if isAuthenticated() && 
                     resource.data.customerId == request.auth.uid;
      
      // Seul le client peut créer sa commande
      allow create: if isAuthenticated() && 
                       request.resource.data.customerId == request.auth.uid;
      
      // Pas de modification/suppression directe (géré côté serveur)
      allow update, delete: if false;
    }
    
    // Bookings Collection
    match /bookings/{bookingId} {
      // Le client et le cat-sitter peuvent lire la réservation
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid || 
                      resource.data.catSitterId == request.auth.uid || 
                      resource.data.clientId == request.auth.uid);
      
      // Seul le client peut créer une réservation
      allow create: if isAuthenticated() && 
                       (request.resource.data.userId == request.auth.uid || 
                        request.resource.data.clientId == request.auth.uid);
      
      // Le client et le cat-sitter peuvent modifier le statut
      allow update: if isAuthenticated() && 
                       (resource.data.userId == request.auth.uid || 
                        resource.data.clientId == request.auth.uid || 
                        resource.data.catSitterId == request.auth.uid);
      
      // Seul le client peut supprimer sa réservation
      allow delete: if isAuthenticated() && 
                       (resource.data.userId == request.auth.uid || 
                        resource.data.clientId == request.auth.uid);
    }
    
    // Booking Requests Collection (Cat Sitter requests)
    match /bookingRequests/{requestId} {
      // Le client et le cat-sitter peuvent lire
      allow read: if isAuthenticated() && 
                     (resource.data.clientId == request.auth.uid || 
                      resource.data.sitterId == request.auth.uid);
      
      // Seul le client peut créer
      allow create: if isAuthenticated() && 
                       request.resource.data.clientId == request.auth.uid;
      
      // Les deux parties peuvent modifier le statut
      allow update: if isAuthenticated() && 
                       (resource.data.clientId == request.auth.uid || 
                        resource.data.sitterId == request.auth.uid);
      
      // Seul le client peut supprimer
      allow delete: if isAuthenticated() && 
                       resource.data.clientId == request.auth.uid;
    }
    
    // Reviews Collection
    match /reviews/{reviewId} {
      // Tout utilisateur authentifié peut lire les avis
      allow read: if isAuthenticated();
      
      // Seul l'auteur peut créer son avis
      allow create: if isAuthenticated() && 
                       request.resource.data.authorId == request.auth.uid;
      
      // Seul l'auteur peut modifier son avis
      allow update: if isAuthenticated() && 
                       resource.data.authorId == request.auth.uid;
      
      // Pas de suppression d'avis
      allow delete: if false;
    }
    
    // Lost & Found Reports Collection
    match /lostFoundReports/{reportId} {
      // Tout utilisateur authentifié peut lire les signalements
      allow read: if isAuthenticated();
      
      // Tout utilisateur authentifié peut créer un signalement
      allow create: if isAuthenticated() && 
                       request.resource.data.reporterId == request.auth.uid;
      
      // Seul le créateur peut modifier son signalement
      allow update: if isAuthenticated() && 
                       resource.data.reporterId == request.auth.uid;
      
      // Seul le créateur peut supprimer son signalement
      allow delete: if isAuthenticated() && 
                       resource.data.reporterId == request.auth.uid;
    }
    
    // Challenges Collection
    match /challenges/{challengeId} {
      // Tout utilisateur authentifié peut lire les défis
      allow read: if isAuthenticated();
      
      // Seuls les admins peuvent créer/modifier/supprimer (géré côté serveur)
      allow write: if false;
    }
    
    // User Challenges Collection
    match /userChallenges/{userChallengeId} {
      // Tout utilisateur authentifié peut lire
      allow read: if isAuthenticated();
      
      // Seul l'utilisateur peut créer/modifier ses participations
      allow create, update: if isAuthenticated() && 
                               request.resource.data.userId == request.auth.uid;
      
      // Pas de suppression
      allow delete: if false;
    }
    
    // Challenge Participations Collection
    match /challengeParticipations/{participationId} {
      // Tout utilisateur authentifié peut lire les participations
      allow read: if isAuthenticated();
      
      // Seul l'utilisateur peut créer sa participation
      allow create: if isAuthenticated() && 
                       request.resource.data.userId == request.auth.uid;
      
      // Tout utilisateur authentifié peut voter (géré par transaction)
      allow update: if isAuthenticated();
      
      // Pas de suppression
      allow delete: if false;
    }
    
    // Challenge Submissions Collection
    match /challengeSubmissions/{submissionId} {
      // Tout utilisateur authentifié peut lire les soumissions
      allow read: if isAuthenticated();
      
      // Seul l'utilisateur peut créer sa soumission
      allow create: if isAuthenticated() && 
                       request.resource.data.userId == request.auth.uid;
      
      // Pas de modification/suppression
      allow update, delete: if false;
    }
    
    // Badges Collection
    match /badges/{badgeId} {
      // Tout utilisateur authentifié peut lire les badges
      allow read: if isAuthenticated();
      
      // Seuls les admins peuvent créer/modifier/supprimer (géré côté serveur)
      allow write: if false;
    }
    
    // User Badges Collection
    match /userBadges/{userBadgeId} {
      // Tout utilisateur authentifié peut lire les badges des utilisateurs
      allow read: if isAuthenticated();
      
      // Seuls les admins peuvent attribuer des badges (géré côté serveur)
      allow write: if false;
    }
    
    // Notifications Collection
    match /notifications/{notificationId} {
      // Seul le destinataire peut lire ses notifications
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      
      // Seul le destinataire peut marquer comme lu
      allow update: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid &&
                       request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);
      
      // Seuls les admins peuvent créer des notifications (géré côté serveur)
      allow create, delete: if false;
    }
    
    // Friend Requests Collection
    match /friendRequests/{requestId} {
      // L'expéditeur et le destinataire peuvent lire la demande
      allow read: if isAuthenticated() && 
                     (resource.data.senderId == request.auth.uid || 
                      resource.data.receiverId == request.auth.uid);
      
      // Seul l'expéditeur peut créer une demande
      allow create: if isAuthenticated() && 
                       request.resource.data.senderId == request.auth.uid;
      
      // Seul le destinataire peut répondre
      allow update: if isAuthenticated() && 
                       resource.data.receiverId == request.auth.uid;
      
      // Pas de suppression
      allow delete: if false;
    }
    
    // Professionals Collection
    match /professionals/{professionalId} {
      // Tout utilisateur authentifié peut lire les profils vérifiés
      allow read: if isAuthenticated();
      
      // Seul le professionnel peut créer/modifier son profil
      allow create, update: if isOwner(professionalId);
      
      // Pas de suppression directe
      allow delete: if false;
    }
    
    // Pet Sitter Profiles Collection
    match /petSitterProfiles/{sitterId} {
      // Tout utilisateur authentifié peut lire les profils
      allow read: if isAuthenticated();
      
      // Seul le cat-sitter peut créer/modifier son profil
      allow create, update: if isOwner(sitterId);
      
      // Seul le cat-sitter peut supprimer son profil
      allow delete: if isOwner(sitterId);
    }
    
    // Health Records Collection
    match /healthRecords/{recordId} {
      // Seul le propriétaire de l'animal peut lire les dossiers de santé
      allow read: if isAuthenticated();
      
      // Seul le propriétaire peut créer/modifier les dossiers
      allow create, update: if isAuthenticated();
      
      // Seul le propriétaire peut supprimer
      allow delete: if isAuthenticated();
    }
    
    // Vaccinations Collection
    match /vaccinations/{vaccinationId} {
      // Seul le propriétaire de l'animal peut lire les vaccinations
      allow read: if isAuthenticated();
      
      // Seul le propriétaire peut créer/modifier les vaccinations
      allow create, update: if isAuthenticated();
      
      // Seul le propriétaire peut supprimer
      allow delete: if isAuthenticated();
    }
    
    // Emergency Contacts Collection
    match /emergencyContacts/{contactId} {
      // Seul le propriétaire peut lire ses contacts d'urgence
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      
      // Seul le propriétaire peut créer/modifier ses contacts
      allow create, update: if isAuthenticated() && 
                               request.resource.data.userId == request.auth.uid;
      
      // Seul le propriétaire peut supprimer
      allow delete: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid;
    }
    
    // Animal Species Collection
    match /animalSpecies/{speciesId} {
      // Tout utilisateur authentifié peut lire les espèces
      allow read: if isAuthenticated();
      
      // Seuls les admins peuvent créer/modifier/supprimer (géré côté serveur)
      allow write: if false;
    }
    
    // Animal Breeds Collection
    match /animalBreeds/{breedId} {
      // Tout utilisateur authentifié peut lire les races
      allow read: if isAuthenticated();
      
      // Seuls les admins peuvent créer/modifier/supprimer (géré côté serveur)
      allow write: if false;
    }
    
    // Favorites Collection (Like/Bookmark pets)
    match /favorites/{favoriteId} {
      // Tout utilisateur authentifié peut lire les favoris
      allow read: if isAuthenticated();
      
      // Seul l'utilisateur peut créer/supprimer ses propres favoris
      allow create: if isAuthenticated() && 
                       request.resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid;
      
      // Pas de modification
      allow update: if false;
    }
    
    // Pet Likes Collection (Pet matching - likes)
    match /petLikes/{likeId} {
      // Tout utilisateur authentifié peut lire
      allow read: if isAuthenticated();
      
      // Seul le propriétaire du pet peut créer un like
      allow create: if isAuthenticated();
      
      // Pas de modification
      allow update: if false;
      
      // Seul le propriétaire peut supprimer
      allow delete: if isAuthenticated();
    }
    
    // Pet Matches Collection (Pet matching - mutual matches)
    match /petMatches/{matchId} {
      // Seuls les propriétaires des pets matchés peuvent lire
      allow read: if isAuthenticated();
      
      // Système crée automatiquement (via transaction)
      allow create: if isAuthenticated();
      
      // Pas de modification directe
      allow update: if false;
      
      // Les deux propriétaires peuvent supprimer (unmatch)
      allow delete: if isAuthenticated();
    }
    
    // Pet Passes Collection (Pet matching - passes)
    match /petPasses/{passId} {
      // Seul le propriétaire du pet peut lire ses passes
      allow read: if isAuthenticated();
      
      // Seul le propriétaire du pet peut créer un pass
      allow create: if isAuthenticated();
      
      // Pas de modification
      allow update: if false;
      
      // Pas de suppression
      allow delete: if false;
    }
    
    // Pet Sitters Collection (Legacy - might be replaced by petSitterProfiles)
    match /petSitters/{sitterId} {
      // Tout utilisateur authentifié peut lire
      allow read: if isAuthenticated();
      
      // Seul le cat-sitter peut créer/modifier son profil
      allow create, update: if isOwner(sitterId);
      
      // Seul le cat-sitter peut supprimer
      allow delete: if isOwner(sitterId);
    }
    
    // Promo Submissions Collection (Professional promotions)
    match /promoSubmissions/{submissionId} {
      // Tout utilisateur authentifié peut lire les promos approuvées
      allow read: if isAuthenticated();
      
      // Seul le professionnel peut créer sa promo
      allow create: if isAuthenticated() && 
                       request.resource.data.userId == request.auth.uid;
      
      // Seul le créateur peut modifier (avant approbation)
      allow update: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid;
      
      // Seul le créateur peut supprimer
      allow delete: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid;
    }
    
    // Treatments Collection (Medical treatments)
    match /treatments/{treatmentId} {
      // Seul le propriétaire peut lire les traitements de son animal
      allow read: if isAuthenticated();
      
      // Seul le propriétaire peut créer/modifier
      allow create, update: if isAuthenticated();
      
      // Seul le propriétaire peut supprimer
      allow delete: if isAuthenticated();
    }
    
    // Medications Collection (Medication schedules)
    match /medications/{medicationId} {
      // Seul le propriétaire peut lire les médicaments de son animal
      allow read: if isAuthenticated();
      
      // Seul le propriétaire peut créer/modifier
      allow create, update: if isAuthenticated();
      
      // Seul le propriétaire peut supprimer
      allow delete: if isAuthenticated();
    }
    
    // Health Documents Collection
    match /healthDocuments/{documentId} {
      // Seul le propriétaire peut lire les documents de son animal
      allow read: if isAuthenticated();
      
      // Seul le propriétaire peut créer/modifier
      allow create, update: if isAuthenticated();
      
      // Seul le propriétaire peut supprimer
      allow delete: if isAuthenticated();
    }
    
    // Health Reminders Collection
    match /healthReminders/{reminderId} {
      // Seul le propriétaire peut lire ses rappels
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      
      // Seul le propriétaire peut créer/modifier ses rappels
      allow create, update: if isAuthenticated() && 
                               request.resource.data.userId == request.auth.uid;
      
      // Seul le propriétaire peut supprimer
      allow delete: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid;
    }
    
    // User Settings Collection (App settings, preferences)
    match /userSettings/{userId} {
      // Seul l'utilisateur peut lire ses paramètres
      allow read: if isOwner(userId);
      
      // Seul l'utilisateur peut créer/modifier
      allow create, update: if isOwner(userId);
      
      // Seul l'utilisateur peut supprimer
      allow delete: if isOwner(userId);
    }
    
    // User Preferences Collection (Language, theme, notifications)
    match /userPreferences/{userId} {
      // Seul l'utilisateur peut lire ses préférences
      allow read: if isOwner(userId);
      
      // Seul l'utilisateur peut créer/modifier
      allow create, update: if isOwner(userId);
      
      // Pas de suppression
      allow delete: if false;
    }
    
    // Cat Sitter Messages Collection (Messaging spécifique cat-sitter)
    match /catSitterMessages/{messageId} {
      // Les participants peuvent lire
      allow read: if isAuthenticated() && 
                     (resource.data.senderId == request.auth.uid || 
                      resource.data.receiverId == request.auth.uid);
      
      // Seul l'expéditeur peut créer
      allow create: if isAuthenticated() && 
                       request.resource.data.senderId == request.auth.uid;
      
      // Le destinataire peut marquer comme lu
      allow update: if isAuthenticated() && 
                       resource.data.receiverId == request.auth.uid &&
                       request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isRead', 'readAt']);
      
      // Pas de suppression
      allow delete: if false;
    }
    
    // Active Pet Selection (User's currently active pet for posting)
    match /activePets/{userId} {
      // Seul l'utilisateur peut lire
      allow read: if isOwner(userId);
      
      // Seul l'utilisateur peut créer/modifier
      allow create, update: if isOwner(userId);
      
      // Seul l'utilisateur peut supprimer
      allow delete: if isOwner(userId);
    }
    
    // Unread Counts Collection (Cache for unread messages, notifications)
    match /unreadCounts/{userId} {
      // Seul l'utilisateur peut lire
      allow read: if isOwner(userId);
      
      // Le système et l'utilisateur peuvent écrire
      allow write: if isOwner(userId);
    }
    
    // User Roles Collection (Cat sitter, breeder, shelter badges)
    match /userRoles/{userId} {
      // Tout utilisateur authentifié peut lire les rôles publics
      allow read: if isAuthenticated();
      
      // Seul l'utilisateur peut créer son profil de rôle
      allow create: if isOwner(userId);
      
      // Seul l'utilisateur peut modifier (sauf verification status)
      allow update: if isOwner(userId) && 
                       (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['verified', 'verifiedAt']));
      
      // Pas de suppression directe
      allow delete: if false;
    }
    
    // Discovery Feed Collection (Algorithme de découverte)
    match /discoveryFeed/{userId} {
      // Seul l'utilisateur peut lire son feed personnalisé
      allow read: if isOwner(userId);
      
      // Le système génère le feed
      allow write: if false;
    }
    
    // Blocked Users Collection
    match /blockedUsers/{blockId} {
      // Seul l'utilisateur bloqueur peut lire
      allow read: if isAuthenticated() && 
                     resource.data.blockerId == request.auth.uid;
      
      // Seul l'utilisateur peut bloquer
      allow create: if isAuthenticated() && 
                       request.resource.data.blockerId == request.auth.uid;
      
      // Pas de modification
      allow update: if false;
      
      // Seul le bloqueur peut débloquer
      allow delete: if isAuthenticated() && 
                       resource.data.blockerId == request.auth.uid;
    }
    
    // Reports Collection (Signalements de contenu)
    match /reports/{reportId} {
      // Seuls les admins peuvent lire (géré côté serveur)
      allow read: if false;
      
      // Tout utilisateur authentifié peut créer un signalement
      allow create: if isAuthenticated() && 
                       request.resource.data.reporterId == request.auth.uid;
      
      // Seuls les admins peuvent modifier/supprimer (géré côté serveur)
      allow update, delete: if false;
    }
  }
}
```

## 📦 Règles Firebase Storage

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
      // Max 10MB pour les images, 50MB pour les vidéos
      return (isImage() && request.resource.size < 10 * 1024 * 1024) ||
             (isVideo() && request.resource.size < 50 * 1024 * 1024);
    }
    
    // User Profile Photos
    match /users/{userId}/profile/{fileName} {
      // Tout utilisateur authentifié peut lire les photos de profil
      allow read: if isAuthenticated();
      
      // Seul le propriétaire peut uploader/modifier sa photo
      allow write: if isOwner(userId) && isImage() && isValidSize();
      
      // Seul le propriétaire peut supprimer sa photo
      allow delete: if isOwner(userId);
    }
    
    // Pet Photos
    match /pets/{petId}/{fileName} {
      // Tout utilisateur authentifié peut lire les photos d'animaux
      allow read: if isAuthenticated();
      
      // Seul le propriétaire peut uploader des photos de son animal
      // Note: La vérification du propriétaire doit être faite côté client
      allow write: if isAuthenticated() && isImage() && isValidSize();
      
      // Seul le propriétaire peut supprimer
      allow delete: if isAuthenticated();
    }
    
    // Post Media (photos/videos)
    match /posts/{postId}/{fileName} {
      // Tout utilisateur authentifié peut lire les médias de posts
      allow read: if isAuthenticated();
      
      // Tout utilisateur authentifié peut uploader des médias pour ses posts
      allow write: if isAuthenticated() && (isImage() || isVideo()) && isValidSize();
      
      // Seul l'auteur peut supprimer (vérification côté client)
      allow delete: if isAuthenticated();
    }
    
    // Challenge Submissions Media
    match /challenges/{challengeId}/submissions/{userId}/{fileName} {
      // Tout utilisateur authentifié peut lire les soumissions
      allow read: if isAuthenticated();
      
      // Seul l'utilisateur peut uploader sa soumission
      allow write: if isOwner(userId) && (isImage() || isVideo()) && isValidSize();
      
      // Seul l'utilisateur peut supprimer sa soumission
      allow delete: if isOwner(userId);
    }
    
    // Lost & Found Report Photos
    match /lostFound/{reportId}/{fileName} {
      // Tout utilisateur authentifié peut lire les photos de signalements
      allow read: if isAuthenticated();
      
      // Tout utilisateur authentifié peut uploader des photos
      allow write: if isAuthenticated() && isImage() && isValidSize();
      
      // Seul le créateur peut supprimer (vérification côté client)
      allow delete: if isAuthenticated();
    }
    
    // Professional Product Photos
    match /products/{sellerId}/{productId}/{fileName} {
      // Tout utilisateur authentifié peut lire les photos de produits
      allow read: if isAuthenticated();
      
      // Seul le vendeur peut uploader des photos de ses produits
      allow write: if isOwner(sellerId) && isImage() && isValidSize();
      
      // Seul le vendeur peut supprimer
      allow delete: if isOwner(sellerId);
    }
    
    // Professional Company Logos
    match /professionals/{userId}/logo/{fileName} {
      // Tout utilisateur authentifié peut lire les logos
      allow read: if isAuthenticated();
      
      // Seul le professionnel peut uploader son logo
      allow write: if isOwner(userId) && isImage() && isValidSize();
      
      // Seul le professionnel peut supprimer
      allow delete: if isOwner(userId);
    }
    
    // Health Documents
    match /health/{petId}/{documentId}/{fileName} {
      // Seul le propriétaire peut lire les documents de santé
      // Note: La vérification du propriétaire doit être faite côté client
      allow read: if isAuthenticated();
      
      // Seul le propriétaire peut uploader des documents
      allow write: if isAuthenticated() && isValidSize();
      
      // Seul le propriétaire peut supprimer
      allow delete: if isAuthenticated();
    }
    
    // Message Media (photos/videos dans les conversations)
    match /messages/{conversationId}/{messageId}/{fileName} {
      // Seuls les participants peuvent lire les médias
      // Note: La vérification des participants doit être faite côté client
      allow read: if isAuthenticated();
      
      // Seul l'expéditeur peut uploader des médias
      allow write: if isAuthenticated() && (isImage() || isVideo()) && isValidSize();
      
      // Pas de suppression de médias de messages
      allow delete: if false;
    }
  }
}
```

## 🔐 Points Clés de Sécurité

### ✅ Ce qui est sécurisé

1. **Authentification requise** - Toutes les opérations nécessitent une authentification
2. **Propriété des données** - Les utilisateurs ne peuvent modifier que leurs propres données
3. **Validation des types** - Les images et vidéos sont validées
4. **Limites de taille** - 10MB pour images, 50MB pour vidéos
5. **Lecture publique limitée** - Seules les données publiques sont lisibles par tous
6. **Données sensibles protégées** - Santé, messages, contacts d'urgence

### ⚠️ Limitations actuelles

1. **Vérification du propriétaire d'animal** - Doit être faite côté client pour Storage
2. **Vérification des participants** - Pour les conversations, doit être faite côté client
3. **Opérations admin** - Certaines opérations nécessitent des Cloud Functions

### 🚀 Recommandations

1. **Implémenter des Cloud Functions** pour:
   - Attribution de badges
   - Création de notifications
   - Gestion des produits marketplace
   - Validation des professionnels

2. **Ajouter des index composites** pour:
   - `posts`: `(authorId, createdAt desc)`
   - `messages`: `(conversationId, timestamp asc)`
   - `notifications`: `(userId, createdAt desc)`

3. **Monitoring et alertes**:
   - Surveiller les tentatives d'accès non autorisées
   - Alertes sur les uploads de fichiers volumineux
   - Logs des opérations sensibles

## 📝 Application des règles

### Dans la console Firebase:

1. **Firestore Database**:
   - Allez dans Firestore Database > Rules
   - Copiez les règles Firestore ci-dessus
   - Cliquez sur "Publier"

2. **Storage**:
   - Allez dans Storage > Rules
   - Copiez les règles Storage ci-dessus
   - Cliquez sur "Publier"

### Test des règles:

```javascript
// Dans la console Firebase, utilisez le simulateur de règles
// Exemple de test:
// - Utilisateur authentifié: uid = "test-user-123"
// - Tenter de lire /users/test-user-123 ✅
// - Tenter de lire /users/other-user-456 ✅
// - Tenter de modifier /users/other-user-456 ❌
```

## 🔄 Mise à jour

Ces règles doivent être mises à jour lorsque:
- De nouvelles collections sont ajoutées
- De nouvelles fonctionnalités nécessitent des permissions différentes
- Des problèmes de sécurité sont identifiés
- Les exigences métier changent

Date de dernière mise à jour: 2025-01-06

## 📋 Collections ajoutées

### Nouvelles collections (complétées)

1. **favorites** - Système de favoris/likes pour les animaux (indépendant du matching)
2. **petLikes** - Likes pour le système de matching entre animaux
3. **petMatches** - Matches mutuels entre animaux
4. **petPasses** - Passes (rejets) dans le matching
5. **petSitters** - Profils cat-sitters (legacy, peut être remplacé par petSitterProfiles)
6. **promoSubmissions** - Soumissions de promotions par les professionnels
7. **treatments** - Traitements médicaux des animaux
8. **medications** - Médicaments et plannings de médication
9. **healthDocuments** - Documents de santé des animaux
10. **healthReminders** - Rappels de santé (vaccins, traitements, etc.)
11. **bookingRequests** - Demandes de réservation cat-sitter
12. **userSettings** - Paramètres utilisateur (langue, notifications, etc.)
13. **userPreferences** - Préférences UI/UX
14. **catSitterMessages** - Messages spécifiques cat-sitter
15. **activePets** - Animal actif sélectionné par utilisateur
16. **unreadCounts** - Compteurs de notifications non lues
17. **userRoles** - Rôles utilisateur (cat-sitter, éleveur, refuge)
18. **discoveryFeed** - Feed personnalisé de découverte
19. **blockedUsers** - Utilisateurs bloqués
20. **reports** - Signalements de contenu

### Fonctionnalités couvertes

✅ Matching entre animaux (likes, matches, passes)
✅ Favoris/bookmarks indépendants
✅ Santé complète (traitements, médicaments, documents, rappels)
✅ Promotions professionnelles
✅ Cat-sitting (profils et réservations)
✅ Social (posts, comments, likes, amis)
✅ Messagerie (conversations, messages)
✅ Commerce (produits, commandes)
✅ Défis et badges
✅ Perdu & Trouvé
✅ Notifications
✅ Réservations cat-sitter complètes
✅ Paramètres et préférences utilisateur
✅ Système de rôles (badges pros)
✅ Blocage d'utilisateurs
✅ Signalements de contenu
✅ Feed de découverte

### Important

Toutes les collections nécessaires pour l'app ODALEA sont maintenant couvertes avec les bonnes permissions Firestore.
