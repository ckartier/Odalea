# Guide de Migration Sécurisée - Odalea

## Contexte
Migration de données legacy (IDs "paris-*") vers architecture sécurisée Firebase avec UIDs réels.

---

## **Étape 1 : Backup Firestore**

```bash
# Firebase Console > Firestore Database > Import/Export
# OU via CLI:
firebase firestore:export gs://your-bucket/backups/$(date +%Y%m%d)
```

---

## **Étape 2 : Audit (Dry Run)**

```bash
cd scripts
node cleanup-and-migrate.js --dry-run
```

**Attendu :**
- Liste des users avec ID invalide (sauf amandine@gmail.com)
- Bookings avec catSitterId/clientId non-UID
- Pets/Posts/Comments orphelins

---

## **Étape 3 : Corrections Code (ce commit)**

### A) Suppression mocks cat-sitter
✅ **app/(tabs)/cat-sitter.tsx** : utilise mocks locaux (OK pour découverte)
✅ **hooks/booking-store.ts** : fallback Firebase → mocks vides si échec
✅ **Aucun seed automatique dans le code**

### B) Correction Storage Rules

**Problème actuel :**
```
users/{uid}/pets/temp-.../*.jpg → ❌ unauthorized
```

**Cause :** Path incorrect. Firebase attend:
```
users/{uid}/pets/{petId}/{filename}
```

**Fix dans storage.rules :** ✅ Déjà corrigé (ligne 35-38)

**Fix dans app :**
- Vérifier que `uploadPetImage()` utilise le bon path

---

## **Étape 4 : Migration Bookings**

```bash
node cleanup-and-migrate.js
```

**Actions :**
1. Supprime users avec ID != Firebase UID (garde amandine@gmail.com)
2. Supprime pets/posts/comments/likes/conversations/messages liés
3. **Migre bookings :** `clientId` → `userId`
4. Supprime bookings avec catSitterId/userId invalides
5. Supprime petSitterProfiles orphelins

---

## **Étape 5 : Règles Firestore Strictes**

### Schéma minimal requis

#### **users**
```json
{
  "id": "auth.uid",
  "email": "string",
  "name": "string",
  "isCatSitter": "boolean",
  "location": { "latitude": "number", "longitude": "number" },
  "createdAt": "timestamp"
}
```
**Règles :**
```js
match /users/{userId} {
  allow read: if signedIn();
  allow write: if request.auth.uid == userId;
  allow create: if request.auth.uid == request.resource.data.id;
}
```

#### **pets**
```json
{
  "id": "auto",
  "ownerId": "auth.uid (immutable)",
  "name": "string",
  "species": "string",
  "createdAt": "timestamp"
}
```
**Règles :**
```js
match /pets/{petId} {
  allow read: if signedIn();
  allow create: if request.auth.uid == request.resource.data.ownerId;
  allow update, delete: if request.auth.uid == resource.data.ownerId;
}
```

#### **bookings** (critique)
```json
{
  "id": "auto",
  "userId": "auth.uid du client (immutable)",
  "catSitterId": "auth.uid du cat-sitter (immutable)",
  "petIds": "string[]",
  "date": "string",
  "status": "pending|accepted|declined|completed|cancelled",
  "totalPrice": "number",
  "createdAt": "timestamp"
}
```
**Règles :**
```js
match /bookings/{bookingId} {
  allow read: if signedIn() && 
    (request.auth.uid == resource.data.userId || 
     request.auth.uid == resource.data.catSitterId);
  
  allow create: if request.auth.uid == request.resource.data.userId &&
                   exists(/databases/$(database)/documents/users/$(request.resource.data.catSitterId));
  
  allow update: if request.auth.uid == resource.data.catSitterId &&
                   request.resource.data.userId == resource.data.userId;
}
```

#### **posts**
```json
{
  "id": "auto",
  "authorId": "auth.uid (immutable)",
  "petId": "string (optionnel)",
  "content": "string",
  "type": "photo|text|challenge|lostFound",
  "createdAt": "timestamp"
}
```

#### **comments**
```json
{
  "id": "auto",
  "postId": "string",
  "authorId": "auth.uid (immutable)",
  "text": "string",
  "createdAt": "timestamp"
}
```

#### **messages**
```json
{
  "id": "auto",
  "conversationId": "string",
  "senderId": "auth.uid (immutable)",
  "text": "string",
  "createdAt": "timestamp"
}
```

---

## **Étape 6 : Tests de Validation**

### Checklist Firestore

```bash
# 1. Vérifier que amandine@gmail.com existe
# Console Firestore > users > chercher UID

# 2. Tester lecture publique (connecté)
# App > Map > voir les cat-sitters

# 3. Tester création booking
# App > Booking > créer réservation
# Vérifier que userId == auth.uid

# 4. Tester refus permission
# Console > Rules Playground
# Test: user A essaie de modifier post de user B → DENIED
```

### Checklist Storage

```bash
# 1. Upload photo pet
# App > Profil > Add Pet > Photo
# Path attendu: users/{auth.uid}/pets/{petId}/{filename}

# 2. Vérifier permission denied si mauvais path
# Impossible d'uploader dans users/{autre_uid}/pets/...
```

### Erreurs attendues (avant fix)

**Permission Denied:**
```
Error: Missing or insufficient permissions
→ Vérifier que userId/ownerId == auth.uid
```

**Storage Unauthorized:**
```
storage/unauthorized
→ Vérifier path: users/{uid}/pets/{petId}/{filename}
→ Vérifier taille < 10MB
```

---

## **Questions critiques résolues**

### Pourquoi userId et catSitterId doivent être des UID Firebase ?

**Raison :** Les règles Firestore utilisent `request.auth.uid` pour vérifier les permissions.

**Avant (insécurisé) :**
```js
{
  "catSitterId": "paris-1", // ❌ string arbitraire
  "clientId": "paris-3"     // ❌ n'importe qui peut écrire
}
```

**Après (sécurisé) :**
```js
{
  "userId": "kJ8fD...", // ✅ UID Firebase du client
  "catSitterId": "xY3bA..." // ✅ UID Firebase du cat-sitter
}
```

**Règle stricte :**
```js
allow create: if request.auth.uid == request.resource.data.userId;
```
→ Seul le user connecté peut créer un booking à son nom.

### Migration sans perte

**Si vous avez des bookings avec "paris-1" :**
1. Identifier l'email associé (ex: "sitter-paris-1@test.com")
2. Créer compte Firebase Auth pour cet email
3. Mapper `paris-1` → nouvel UID
4. Mettre à jour tous les bookings

**Script :**
```js
const mapping = {
  'paris-1': 'kJ8fD...',
  'paris-3': 'xY3bA...'
};

for (const [oldId, newId] of Object.entries(mapping)) {
  await db.collection('bookings')
    .where('catSitterId', '==', oldId)
    .get()
    .then(snap => snap.forEach(doc => 
      doc.ref.update({ catSitterId: newId })
    ));
}
```

---

## **App Check (optionnel, post-migration)**

```bash
npm install @react-native-firebase/app-check

# App
import appCheck from '@react-native-firebase/app-check';
appCheck().activate('site-key', true);

# Rules
allow read: if request.auth != null && request.app != null;
```

---

## **Résumé : Ce qui casse si on retire || true**

| Collection | Opération | Erreur | Fix |
|-----------|-----------|--------|-----|
| **users** | Create avec mauvais ID | Permission denied | ID doit == auth.uid |
| **pets** | Create avec ownerId != auth.uid | Permission denied | ownerId = auth.uid |
| **bookings** | Create avec userId != auth.uid | Permission denied | userId = auth.uid |
| **bookings** | catSitterId = "paris-1" | Permission denied | catSitterId = UID valide |
| **posts** | Suppression par non-owner | Permission denied | Ajouter authorId check |
| **storage** | Upload dans users/autre_uid/ | Unauthorized | Path = users/{auth.uid}/ |

---

## **Commandes finales**

```bash
# 1. Dry run (voir ce qui sera supprimé)
node scripts/cleanup-and-migrate.js --dry-run

# 2. Backup
firebase firestore:export gs://bucket/backup

# 3. Migration réelle
node scripts/cleanup-and-migrate.js

# 4. Tester l'app
npm start
# → Créer booking
# → Upload photo pet
# → Vérifier permissions

# 5. Déployer règles strictes
firebase deploy --only firestore:rules
firebase deploy --only storage
```

---

## **Support**

En cas d'erreur `permission-denied` après migration :
1. Vérifier que l'utilisateur est bien connecté (`auth.currentUser`)
2. Vérifier que les champs immutables (userId, ownerId, authorId) == `auth.uid`
3. Console Firestore Rules > Playground > tester la requête
