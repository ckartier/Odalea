# Firebase Storage Rules - Fix Images Upload/Display

## Problème
Les images ne s'affichent pas et l'upload échoue avec l'erreur :
```
storage/unauthorized: User does not have permission to access...
```

## Cause
Les règles Firebase Storage bloquent l'accès read/write aux images.

---

## Solution : Déployer les règles Storage

### Étape 1 : Installer Firebase CLI (si pas déjà fait)
```bash
npm install -g firebase-tools
```

### Étape 2 : Login Firebase
```bash
firebase login
```

### Étape 3 : Initialiser le projet (si pas déjà fait)
```bash
firebase init storage
```
- Sélectionnez votre projet Firebase (copattes)
- Gardez le fichier `storage.rules`

### Étape 4 : Déployer les règles
```bash
firebase deploy --only storage
```

✅ Les règles sont maintenant actives !

---

## Vérification dans Console Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet "copattes"
3. Menu **Storage** → **Rules**
4. Vérifiez que les règles sont bien déployées :

```
match /users/{userId}/pets/{petId}/{filename} {
  allow read: if true;
  allow write: if isOwner(userId) && isValidImageUpload();
}
```

---

## Règles expliquées

### Production (actuelles dans storage.rules)
```javascript
// ✅ Read public pour tous (affichage images dans l'app)
allow read: if true;

// ✅ Write uniquement par le propriétaire + validation taille/type
allow write: if isOwner(userId) && isValidImageUpload();
```

**Avantages :**
- Sécurisé : seul le propriétaire peut uploader ses images
- Performance : read public sans auth check
- UX : les images sont visibles par tous (communauté, map, profils)

### Dev temporaire (DÉCONSEILLÉ en prod)
Si vous voulez tester rapidement sans restrictions :

```javascript
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **Attention** : Cette règle autorise tout utilisateur authentifié à lire/écrire n'importe où.
Ne l'utilisez QUE pour le développement local !

---

## Test après déploiement

### 1. Upload d'image
```bash
# Dans l'app Expo Go :
# 1. Connectez-vous
# 2. Éditez un pet (app/pet/edit/[id])
# 3. Choisissez une photo
# 4. Vérifiez les logs :
```

**Logs attendus :**
```
📤 [UPLOAD START] Path: users/USER_ID/pets/PET_ID/TIMESTAMP.jpg
📤 [UPLOAD] Current user: USER_ID
📦 Blob created via XHR, size: 123456
✅ [UPLOAD SUCCESS] Download URL: https://firebasestorage.googleapis.com/...
```

### 2. Affichage image
```bash
# Ouvrez :
# - Fiche pet (app/pet/[id])
# - Map (app/(tabs)/map)
# - Top bar (avatar)
# - Communauté (posts avec images)
```

**Vérifications :**
- [ ] Avatar dans top bar s'affiche
- [ ] Photo pet sur fiche profil
- [ ] Markers map avec photos
- [ ] Posts communauté avec images
- [ ] Pas d'erreur "storage/unauthorized" dans console

---

## Troubleshooting

### Erreur persiste après déploiement ?

1. **Vérifier que les règles sont actives**
   ```bash
   firebase deploy --only storage --force
   ```

2. **Vider le cache Firestore/Storage**
   - Relancez l'app (fermez complètement Expo Go)
   - Sur web : Clear cache + refresh

3. **Vérifier l'auth**
   ```javascript
   // Dans services/storage.ts ligne 71-76
   console.log('👤 [UPLOAD] Current user:', auth.currentUser?.uid || 'NOT AUTHENTICATED');
   ```
   
   Si `NOT AUTHENTICATED` → Connectez-vous d'abord !

4. **Tester en web d'abord**
   - Plus facile de debugger dans Chrome DevTools
   - Network tab → Voir les requêtes Storage

5. **Vérifier le bucket Storage**
   ```javascript
   // Dans services/firebase.ts
   console.log('📦 Storage Bucket:', firebaseConfig.storageBucket);
   ```
   
   Doit afficher : `copattes.firebasestorage.app` ou `copattes.appspot.com`

### Logs utiles pour debug
```javascript
// services/storage.ts contient déjà tous les logs nécessaires :
// - URI source
// - User ID
// - Blob size
// - Storage path
// - Download URL
// - Error details
```

---

## Migration des anciennes images (optionnel)

Si vous avez des images avec URLs `gs://` dans Firestore :

```javascript
// Script one-time à exécuter
const fixOldImageUrls = async () => {
  const petsRef = collection(db, 'pets');
  const snapshot = await getDocs(petsRef);
  
  for (const doc of snapshot.docs) {
    const pet = doc.data();
    
    // Si mainPhoto commence par gs://
    if (pet.mainPhoto?.startsWith('gs://')) {
      console.log(`⚠️ Pet ${doc.id} has gs:// URL, converting...`);
      
      // Convertir gs:// en https://
      const storageRef = ref(storage, pet.mainPhoto);
      const httpsUrl = await getDownloadURL(storageRef);
      
      // Mettre à jour Firestore
      await updateDoc(doc.ref, { mainPhoto: httpsUrl });
      console.log(`✅ Pet ${doc.id} URL updated`);
    }
  }
};
```

Mais ce n'est pas nécessaire car votre code actuel stocke déjà des URLs https:// (ligne 132 storage.ts).

---

## Checklist finale

- [ ] Règles Storage déployées (`firebase deploy --only storage`)
- [ ] Upload fonctionne (logs "✅ [UPLOAD SUCCESS]")
- [ ] Images s'affichent partout (fiche, map, top bar, communauté)
- [ ] Pas d'erreur "storage/unauthorized"
- [ ] Placeholder affiché si pas d'image

---

## Support

Si le problème persiste après avoir déployé les règles :
1. Partagez les logs console complets (upload + affichage)
2. Screenshot de Firebase Console > Storage > Rules
3. Vérifiez que l'user est bien authentifié (`auth.currentUser` non null)
