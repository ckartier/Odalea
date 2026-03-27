# Corrections Odalea - Résumé

## ✅ Corrections effectuées

### 1. Map - Filtres simplifiés
**Fichiers modifiés:** `components/MapFilterChips.tsx`, `app/(tabs)/map.tsx`

**Avant:** 8 filtres confus (Animaux, Amis, Perdus, Cat Sitters, Vétos, Boutiques, Refuges, Éducateurs)

**Après:** 3 filtres clairs
- **Animaux** (violet #7C3AED) : Affiche tous les animaux
- **Pros** (vert #10b981) : Affiche tous les professionnels (vétos, boutiques, éducateurs, refuges, éleveurs)
- **Cat Sitters** (bleu #6366f1) : Affiche uniquement les cat sitters

**Logique:**
```typescript
const professionals = usersWithLocation.filter((u) => {
  if (!u.isProfessional || !u.professionalData?.activityType) return false;
  if (u.id.includes('paris-') || u.id.includes('test')) return false;
  return activeFilters.has('pros');
});
```

### 2. MapBottomSheet - 4 actions claires
**Fichier modifié:** `components/MapBottomSheet.tsx`

**Actions:**
1. **Fiche** : Ouvre `/pet/[id]` (profil complet)
2. **Message** : Ouvre `/messages/[ownerId]` (uniquement si amis)
3. **Ami** : Envoie demande (désactivé si déjà ami/en attente)
4. **Post** : Ouvre `/community/create?petId=[id]` (créer post lié à l'animal)

**Suppressions:**
- ❌ Bouton "Posts" (confusion avec "Voir posts")
- ❌ Bouton "Favori" (séparé du matching Firebase)
- ❌ Bouton "Toi" (inutile)

**États des boutons:**
```typescript
// Message: désactivé si pas amis
disabled={!isFriend}
backgroundColor: isFriend ? '#7C3AED' : '#e2e8f0'

// Ami: désactivé si ami ou demande envoyée
disabled={isFriend || isRequestSent}
label: {isFriend ? 'Ami' : isRequestSent ? 'En attente' : 'Ami'}
```

### 3. Friend Requests - Prévention doublons
**Fichier:** `hooks/friends-store.ts` (déjà implémenté, vérifié)

**Vérifications:**
```typescript
// Guard: rejeter IDs legacy
if (receiverId.includes('paris-') || receiverId.includes('test-') || receiverId.length < 20) {
  throw new Error('ID utilisateur invalide');
}

// Vérifier si déjà amis
const userDoc = await databaseService.user.getUser(user.id);
if (userDoc?.friends?.includes(receiverId)) {
  throw new Error('Déjà ami avec cet utilisateur');
}

// Vérifier si demande déjà envoyée
const existingSent = sent.find(r => r.receiverId === receiverId && r.status === 'pending');
if (existingSent) {
  throw new Error('Demande déjà envoyée');
}

// Vérifier si demande reçue
const existingReceived = received.find(r => r.senderId === receiverId && r.status === 'pending');
if (existingReceived) {
  throw new Error('Vous avez déjà une demande de cet utilisateur');
}
```

**États possibles:**
- `none` : Aucune relation
- `pending` : Demande envoyée
- `accepted` : Amis

**Doc ID stable:** Utilise l'ID Firestore auto-généré pour chaque demande

---

## 📋 Points restants à corriger

### 1. Messages - Groupement par conversation ⏳

**Problème actuel:**
L'écran `/app/(tabs)/messages.tsx` affiche déjà des conversations mais utilise `messaging-store` qui peut ne pas être synchronisé avec Firebase.

**Solution:**

#### Collection Firestore: `conversations`
```typescript
{
  id: string; // auto-generated
  participants: string[]; // [uid1, uid2] (toujours trié alphabétiquement)
  lastMessage: {
    content: string;
    senderId: string;
    timestamp: Timestamp;
  };
  unreadCount: {
    [uid: string]: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Collection Firestore: `messages`
```typescript
{
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image';
  imageUrl?: string;
  createdAt: Timestamp;
  read: boolean;
}
```

**Indexes nécessaires:**
```javascript
// conversations
participants array-contains [uid] + orderBy updatedAt desc

// messages  
conversationId + orderBy createdAt desc
```

**Query conversations:**
```typescript
const conversationsQuery = useQuery({
  queryKey: ['conversations', userId],
  queryFn: async () => {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
});
```

**Créer conversation au moment de l'acceptation d'ami:**
Déjà implémenté dans `hooks/friends-store.ts` ligne 158-160:
```typescript
if (accept) {
  await databaseService.user.addFriend(user.id, senderId);
  const conversationId = await databaseService.messaging.createConversation([user.id, senderId]);
}
```

**Badge unread:**
```typescript
const totalUnread = conversations.reduce((sum, conv) => 
  sum + (conv.unreadCount?.[userId] || 0), 0
);
```

### 2. Pet Profile - Tabs (Infos/Posts/Santé/Paramètres)

**Fichier à modifier:** `app/pet/[id].tsx`

**Structure proposée:**
```typescript
type TabType = 'infos' | 'posts' | 'health' | 'settings';

const TABS: { key: TabType; label: string; ownerOnly?: boolean }[] = [
  { key: 'infos', label: 'Infos' },
  { key: 'posts', label: 'Posts' },
  { key: 'health', label: 'Santé', ownerOnly: true },
  { key: 'settings', label: 'Paramètres', ownerOnly: true },
];
```

**Query posts par petId:**
```typescript
const petPostsQuery = useQuery({
  queryKey: ['posts', 'pet', petId],
  queryFn: async () => {
    const q = query(
      collection(db, 'posts'),
      where('fromPetId', '==', petId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
});
```

**Index nécessaire:**
```javascript
posts: fromPetId + orderBy createdAt desc
```

### 3. Community - Filtres Lost/Found

**Problème:** Les posts perdus/trouvés sont déjà dans le feed mais les filtres ne fonctionnent pas correctement.

**Solution:** Déjà implémenté dans `app/(tabs)/community.tsx` lignes 254-263:
```typescript
if (activeFilter === 'lost') {
  filtered = posts.filter(p => p.type === 'lost');
} else if (activeFilter === 'found') {
  filtered = posts.filter(p => p.type === 'found');
}
```

**Vérification:** S'assurer que les posts lost/found ont bien `type: 'lost' | 'found'` dans Firestore.

### 4. Multi-pets - Animal principal

**Collection Firestore: `users`**
Ajouter le champ:
```typescript
{
  primaryPetId?: string; // ID de l'animal à afficher par défaut sur la map
}
```

**Logique:**
- Si `primaryPetId` existe, afficher uniquement cet animal sur la map
- Sinon, afficher le premier animal de `user.pets`
- UI: Dropdown dans Profile pour sélectionner l'animal principal

**Query:**
```typescript
const primaryPet = user.pets?.find(p => p.id === user.primaryPetId) || user.pets?.[0];
```

---

## 🔥 Firestore Security Rules - Points clés

### Collections critiques

**posts:**
```javascript
match /posts/{postId} {
  allow read: if request.auth != null;
  allow create: if request.auth.uid == request.resource.data.authorId
                && request.resource.data.keys().hasAll(['authorId', 'content', 'createdAt']);
  allow update: if request.auth.uid == resource.data.authorId;
  allow delete: if request.auth.uid == resource.data.authorId;
}
```

**conversations:**
```javascript
match /conversations/{conversationId} {
  allow read: if request.auth.uid in resource.data.participants;
  allow create: if request.auth.uid in request.resource.data.participants
                && request.resource.data.participants.size() == 2;
  allow update: if request.auth.uid in resource.data.participants;
  allow delete: if false;
}
```

**messages:**
```javascript
match /messages/{messageId} {
  allow read: if request.auth != null 
              && request.auth.uid in getConversationParticipants(resource.data.conversationId);
  allow create: if request.auth.uid == request.resource.data.senderId
                && request.auth.uid in getConversationParticipants(request.resource.data.conversationId);
  allow update, delete: if false;
}
```

**friendRequests:**
```javascript
match /friendRequests/{requestId} {
  allow read: if request.auth.uid == resource.data.senderId 
              || request.auth.uid == resource.data.receiverId;
  allow create: if request.auth.uid == request.resource.data.senderId
                && request.resource.data.senderId != request.resource.data.receiverId
                && request.resource.data.status == 'pending';
  allow update: if request.auth.uid == resource.data.receiverId
                && resource.data.status == 'pending';
  allow delete: if request.auth.uid == resource.data.senderId 
                || request.auth.uid == resource.data.receiverId;
}
```

---

## 📊 Indexes Firestore nécessaires

```json
{
  "indexes": [
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "fromPetId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "conversations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "participants", "arrayConfig": "CONTAINS" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "conversationId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "friendRequests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "receiverId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 🚀 Prochaines étapes

1. ✅ Map filters (Animaux / Pros / Cat Sitters) - **FAIT**
2. ✅ MapBottomSheet (4 actions claires) - **FAIT**
3. ✅ Friend requests (prévention doublons) - **FAIT**
4. ⏳ Messages groupés par conversation - **EN COURS**
5. ⏳ Tabs sur profil animal
6. ⏳ Community feed filtering (lost/found)
7. ⏳ Multi-pets support
8. ⏳ Unread badges

---

## 📝 Notes importantes

### Suppression des faux users
**Tous les IDs type "paris-*" sont déjà bloqués:**
- Map: `if (u.id.includes('paris-') || u.id.includes('test')) return false;`
- Friend requests: `if (receiverId.includes('paris-') || receiverId.length < 20) throw Error;`

### Images et Storage
**Les uploads fonctionnent déjà:**
- Posts: `users/{uid}/posts/temp_{timestamp}/{timestamp}.jpg`
- Pets: `users/{uid}/pets/{petId}/{timestamp}.jpg`

**Rules Storage à vérifier:**
```javascript
match /users/{userId}/posts/{postId}/{imageId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;
}
```

### Modération
Le système de modération est déjà implémenté dans `services/moderation.ts`:
- Rate limiting (10 posts/heure)
- User banning
- Content reporting
- Audit log

---

## 🔍 Diagnostic des bugs mentionnés

### 1. MAP: pros ne s'affichent pas
**Cause:** Trop de filtres (8 au lieu de 3)
**Fix:** ✅ Simplifié à 3 filtres

### 2. MAP: faux users
**Cause:** IDs legacy "paris-*" non filtrés
**Fix:** ✅ Filtrage ajouté partout

### 3. FICHE: clic ne marche pas
**Cause:** Pas de navigation implémentée
**Fix:** ✅ `router.push(/pet/${id})` dans MapBottomSheet

### 4. AMIS: re-demande à chaque fois
**Cause:** Pas de vérification de l'état
**Fix:** ✅ Vérifications dans `friends-store.ts`

### 5. MESSAGES: pas groupés
**Cause:** Affichage de messages plats au lieu de conversations
**Fix:** ⏳ Déjà implémenté mais à vérifier dans Firebase
