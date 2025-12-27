# Firebase Storage Rules - Correction Urgente

## ❌ Problème

Les règles Storage actuelles ne correspondent pas aux chemins utilisés dans le code.

**Code utilise:** `users/{userId}/pets/{petId}/{fileName}`  
**Règles attendent:** `pets/{petId}/{fileName}`

## ✅ Solution

Copiez ces règles dans **Firebase Console > Storage > Rules** et publiez:

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
    
    function isVideo() {
      return request.resource.contentType.matches('video/.*');
    }
    
    function isValidSize() {
      return (isImage() && request.resource.size < 10 * 1024 * 1024) ||
             (isVideo() && request.resource.size < 50 * 1024 * 1024);
    }
    
    match /users/{userId}/profile/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) && isImage() && isValidSize();
      allow delete: if isOwner(userId);
    }
    
    match /users/{userId}/pets/{petId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) && isImage() && isValidSize();
      allow delete: if isOwner(userId);
    }
    
    match /users/{userId}/products/{productId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) && isImage() && isValidSize();
      allow delete: if isOwner(userId);
    }
    
    match /users/{userId}/posts/{postId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) && (isImage() || isVideo()) && isValidSize();
      allow delete: if isOwner(userId);
    }
    
    match /users/{userId}/lost-found/{reportId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) && isImage() && isValidSize();
      allow delete: if isOwner(userId);
    }
    
    match /posts/{postId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && (isImage() || isVideo()) && isValidSize();
      allow delete: if isAuthenticated();
    }
    
    match /challenges/{challengeId}/submissions/{userId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) && (isImage() || isVideo()) && isValidSize();
      allow delete: if isOwner(userId);
    }
    
    match /lostFound/{reportId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isImage() && isValidSize();
      allow delete: if isAuthenticated();
    }
    
    match /products/{sellerId}/{productId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isOwner(sellerId) && isImage() && isValidSize();
      allow delete: if isOwner(sellerId);
    }
    
    match /professionals/{userId}/logo/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) && isImage() && isValidSize();
      allow delete: if isOwner(userId);
    }
    
    match /health/{petId}/{documentId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isValidSize();
      allow delete: if isAuthenticated();
    }
    
    match /messages/{conversationId}/{messageId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && (isImage() || isVideo()) && isValidSize();
      allow delete: if false;
    }
  }
}
```

## 📋 Étapes à suivre

1. Ouvrez [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet "copattes"
3. Allez dans **Storage** (menu gauche)
4. Cliquez sur l'onglet **Rules**
5. Remplacez TOUT le contenu par les règles ci-dessus
6. Cliquez sur **Publier**
7. Attendez 10-30 secondes pour la propagation
8. Testez l'upload d'une photo de pet

## 🔍 Vérification

Après avoir publié les règles, vous devriez voir dans les logs:
```
✅ [UPLOAD SUCCESS] Download URL: https://...
```

Au lieu de:
```
❌ storage/unauthorized
```
