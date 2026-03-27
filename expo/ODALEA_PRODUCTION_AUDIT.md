# AUDIT COMPLET ODALEA - RAPPORT DE PRODUCTION

**Date:** 2026-01-26  
**Version:** 1.0  
**Objectif:** Préparer l'application pour une mise en production App Store

---

## PHASE 1 - INVENTAIRE COMPLET

### Routes Expo Router (Écrans accessibles)

| Route | Description | Statut |
|-------|-------------|--------|
| `/` | Index (redirection) | ✅ OK |
| `/animated-splash` | Splash vidéo | ✅ OK |
| `/onboarding` | 3 écrans onboarding | ✅ OK |
| `/auth/signin` | Connexion | ✅ OK |
| `/auth/signup` | Inscription | ✅ OK |
| `/auth/pro-register` | Inscription pro | ✅ OK |
| `/auth/verify` | Vérification email | ✅ OK |
| `/(tabs)/home` | Découvrir → redirect /matching/discover | ✅ OK |
| `/(tabs)/challenges` | Matchs → redirect /matching/list | ✅ OK |
| `/(tabs)/messages` | Messages | ✅ OK |
| `/(tabs)/profile` | Profil utilisateur | ✅ OK |
| `/(tabs)/map` | Carte interactive | ✅ OK |
| `/(tabs)/community` | Communauté (hidden tab) | ✅ OK |
| `/(tabs)/cat-sitter` | Cat-sitters (hidden tab) | ✅ OK |
| `/(tabs)/lost-found` | Perdu/Trouvé (hidden tab) | ✅ OK |
| `/matching/discover` | Swipe matching animaux | ✅ OK |
| `/matching/list` | Liste des matchs | ✅ OK |
| `/pet/[id]` | Détail animal | ✅ OK |
| `/pet/add` | Ajouter animal | ✅ OK |
| `/pet/edit/[id]` | Modifier animal | ✅ OK |
| `/profile/[id]` | Profil autre utilisateur | ✅ OK |
| `/profile/edit` | Modifier profil | ✅ OK |
| `/messages/[id]` | Conversation chat | ✅ OK |
| `/messages/new` | Nouvelle conversation | ✅ OK |
| `/cat-sitter/[id]` | Détail cat-sitter | ✅ OK |
| `/booking/[id]` | Réservation | ✅ OK |
| `/community/create` | Créer post | ✅ OK |
| `/lost-found/report` | Signaler perdu/trouvé | ✅ OK |
| `/lost-found/[id]` | Détail signalement | ✅ OK |
| `/challenges/[id]` | Détail défi | ✅ OK |
| `/premium` | Abonnement premium | ✅ OK |
| `/badges` | Badges utilisateur | ✅ OK |
| `/friends` | Liste amis | ✅ OK |
| `/settings/*` | Paramètres (11 écrans) | ✅ OK |
| `/legal/terms` | CGU | ✅ OK |
| `/legal/privacy` | Politique confidentialité | ✅ OK |
| `/(pro)/*` | Dashboard pro (8 écrans) | ✅ OK |
| `/menu` | Menu hamburger | ✅ OK |

### Collections Firebase Firestore

| Collection | Description | Rules |
|------------|-------------|-------|
| `users` | Utilisateurs | ✅ OK |
| `pets` | Animaux | ✅ OK |
| `posts` | Publications | ✅ OK |
| `comments` | Commentaires | ✅ OK |
| `likes` | J'aime | ✅ OK |
| `conversations` | Conversations | ✅ OK |
| `messages` | Messages | ⚠️ Voir P1 |
| `friendRequests` | Demandes ami | ✅ OK |
| `petSitterProfiles` | Profils cat-sitters | ✅ OK |
| `bookings` | Réservations | ✅ OK |
| `reviews` | Avis | ✅ OK |
| `lostFoundReports` | Signalements | ✅ OK |
| `professionals` | Professionnels | ✅ OK |
| `professionalProducts` | Produits pro | ✅ OK |
| `challenges` | Défis | ✅ OK (admin write) |
| `userChallenges` | Participations défis | ✅ OK |
| `badges` | Badges | ✅ OK (admin write) |
| `notifications` | Notifications | ✅ OK |
| `petLikes` | Likes matching | ✅ OK |
| `petMatches` | Matchs animaux | ✅ OK |
| `petPasses` | Passes matching | ✅ OK |

### Firebase Storage Paths

| Path | Usage | Rules |
|------|-------|-------|
| `users/{uid}/profile/*` | Photos profil | ✅ OK |
| `users/{uid}/pets/{petId}/*` | Photos animaux | ✅ OK |
| `users/{uid}/posts/{postId}/*` | Médias posts | ✅ OK |
| `users/{uid}/lost-found/{reportId}/*` | Photos signalements | ✅ OK |
| `users/{uid}/products/{productId}/*` | Photos produits | ✅ OK |
| `verifications/{uid}/*` | Documents vérification | ✅ OK |

---

## PHASE 2 - AUDIT UI/UX

### Problèmes Identifiés

| Écran | Problème | Gravité |
|-------|----------|---------|
| `(tabs)/profile.tsx` | Double FAB (en haut dans section + en bas absolu) | P1 |
| `(tabs)/community.tsx` | Header sticky chevauche parfois le contenu | P2 |
| `(tabs)/map.tsx` | `handleMapError` défini mais jamais utilisé | P2 |
| `auth/signin.tsx` | Variables inutilisées (spacing, layout, components) | P2 |
| `messages/[id].tsx` | Utilise `useAuth` de `user-store` au lieu de `firebase-user-store` | P1 |
| `lost-found/[id].tsx` | Apostrophe non échappée (ESLint) | P2 |

### Design System

- ✅ Accent noir (#000000) respecté
- ✅ Fond blanc cohérent
- ✅ Menu bas flottant centré (4 items visibles)
- ✅ Typographie cohérente via `theme/tokens.ts`
- ✅ SafeAreaView correctement utilisé

### Responsive

- ✅ `IS_TABLET` et `RESPONSIVE_LAYOUT` utilisés
- ✅ Dimensions dynamiques avec `useWindowDimensions`
- ⚠️ Certains composants ont des dimensions fixes (à vérifier sur petits écrans)

---

## PHASE 3 - NAVIGATION & LOGIQUE PRODUIT

### Architecture Navigation

```
app/
├── _layout.tsx (Stack principal)
├── (tabs)/
│   ├── _layout.tsx (4 tabs visibles + 4 hidden)
│   ├── home.tsx → Redirect /matching/discover
│   ├── challenges.tsx → Redirect /matching/list
│   ├── messages.tsx
│   ├── profile.tsx
│   ├── map.tsx (hidden)
│   ├── community.tsx (hidden)
│   ├── cat-sitter.tsx (hidden)
│   └── lost-found.tsx (hidden)
├── matching/
│   ├── discover.tsx (Swipe cards)
│   └── list.tsx (Matchs list)
└── ... autres routes stack
```

### Problèmes Navigation

| Problème | Impact | Gravité |
|----------|--------|---------|
| `home.tsx` et `challenges.tsx` sont des redirections simples | Pas de header natif, UX légèrement dégradée | P2 |
| Écrans hidden tabs accessibles via menu uniquement | UX intentionnelle mais documentation nécessaire | P2 |
| Route `/messages/{userId}` vs `/messages/{conversationId}` | Confusion potentielle dans la logique | P1 |

### Logique Produit

- ✅ Onboarding → Auth → Tabs flow correct
- ✅ Premium gate sur certaines features
- ✅ Matching bidirectionnel avec création de conversation
- ⚠️ Certains écrans (defis.tsx, admin.tsx) semblent orphelins

---

## PHASE 4 - FIREBASE AUTH

### Configuration

```typescript
// services/firebase.ts
- ✅ Singleton pattern avec globalThis
- ✅ Validation des variables d'environnement
- ✅ Persistence browserLocalPersistence sur web
- ✅ Gestion erreurs Fast Refresh
```

### hooks/firebase-user-store.ts

| Aspect | Statut | Notes |
|--------|--------|-------|
| `onAuthStateChanged` | ✅ | Unique listener avec unsubscribe |
| Session persistence | ✅ | Gérée par Firebase SDK |
| Error handling | ✅ | Messages utilisateur traduits |
| Impersonation | ⚠️ | Fonction dev présente (à retirer en prod) |

### Risques Production

| Risque | Impact | Recommandation |
|--------|--------|----------------|
| `impersonateUser` exporté publiquement | Sécurité | Retirer ou protéger par flag dev |
| Pas de rate limiting côté client | DDoS | Implémenter throttling |
| Email verification non forcée | Spam | Forcer vérification avant accès complet |

---

## PHASE 5 - FIRESTORE DATA & RULES

### Règles Sécurité (firestore.rules)

```
✅ isAuth() helper function
✅ isOwner() verification
✅ isParticipant() pour conversations
✅ fieldUnchanged() pour immutabilité
✅ Deny all other paths par défaut
```

### Problèmes Identifiés

| Collection | Problème | Gravité |
|------------|----------|---------|
| `messages` | `allow read: if isAuth()` trop permissif | P0 |
| `petLikes/petMatches/petPasses` | Pas de vérification ownerId | P1 |
| `challengeSubmissions` | `allow create/update: if isAuth()` sans vérification userId | P1 |
| `healthRecords/vaccinations` | Pas de vérification petOwner | P1 |

### Recommandations Rules

```javascript
// Messages - Corriger
match /messages/{messageId} {
  allow read: if isAuth() && (
    resource.data.senderId == request.auth.uid || 
    resource.data.receiverId == request.auth.uid
  );
}

// PetLikes - Ajouter vérification
match /petLikes/{likeId} {
  allow create: if isAuth() && request.resource.data.userId == request.auth.uid;
}
```

### Modèles de Données

- ✅ Types cohérents dans `types/index.ts`
- ✅ Sanitization avec `firestore-sanitizer.ts`
- ⚠️ Certains champs optionnels non documentés

---

## PHASE 6 - FIREBASE STORAGE

### StorageService (services/storage.ts)

| Fonction | Statut | Notes |
|----------|--------|-------|
| `uploadImage` | ✅ | Avec progress tracking |
| `uploadProfilePicture` | ✅ | Path sécurisé par UID |
| `uploadPetPhoto` | ✅ | Vérifie auth.currentUser |
| `uploadPostImage` | ✅ | OK |
| `uploadLostFoundImage` | ✅ | OK |
| `uriToBlob` | ✅ | Gère file://, content://, https:// |

### Règles Storage (storage.rules)

```
✅ isAuthenticated() required
✅ isOwner(userId) pour write
✅ isValidImageUpload() - 10MB max
✅ isValidVideoUpload() - 50MB max
✅ Fallback deny all other paths
```

### Problèmes Upload

| Problème | Impact | Gravité |
|----------|--------|---------|
| Pas de compression image côté client | Performance/coût | P2 |
| Pas de validation extension fichier | Sécurité légère | P2 |
| Logs sensibles en production | Fuite info | P1 |

---

## PHASE 7 - MESSAGES & CONVERSATIONS

### Architecture Messaging

```
hooks/
├── messaging-store.ts (conversations Firestore)
├── unified-messaging-store.ts (agrège cat-sitter + regular)
└── user-store.ts (re-export firebase-user-store)

services/
└── database.ts → messagingService
```

### Fonctionnalités

| Feature | Statut | Notes |
|---------|--------|-------|
| Créer conversation | ✅ | Avec participants |
| Envoyer message | ✅ | + push notification |
| Temps réel | ✅ | onSnapshot listeners |
| Mark as read | ✅ | Update unreadCount |
| Conversation match | ✅ | hasMatch flag |

### Problèmes

| Problème | Impact | Gravité |
|----------|--------|---------|
| `messages/[id].tsx` utilise mauvais hook auth | Peut casser | P0 |
| Messages rules trop permissives | Sécurité | P0 |
| Pas de pagination messages | Performance | P1 |
| Push notification sans fallback | UX | P2 |

### Fix Requis - messages/[id].tsx

```typescript
// Ligne 18: Remplacer
import { useAuth } from '@/hooks/user-store';
// Par
import { useFirebaseUser } from '@/hooks/firebase-user-store';
// Et
const { user } = useFirebaseUser();
```

---

## PHASE 8 - COMMUNAUTÉ / PERDU / TROUVÉ

### Community (community.tsx)

| Feature | Statut |
|---------|--------|
| Feed posts | ✅ |
| Filtres (all/lost/found/challenges/pros/friends) | ✅ |
| Like/Comment | ✅ |
| Create post | ✅ |
| Report/Block | ✅ |
| Urgent carousel | ✅ |
| Professional cards | ✅ |

### Lost & Found

| Feature | Statut |
|---------|--------|
| Create report | ✅ |
| List reports | ✅ |
| Detail view | ✅ |
| Respond to report | ✅ |
| Update status | ✅ |

### Problèmes

| Problème | Gravité |
|----------|---------|
| ESLint warning `router` dans useCallback | P2 |
| Variable `isLoading` inutilisée dans lost-found.tsx | P2 |
| Apostrophe non échappée lost-found/[id].tsx | P2 |

---

## PHASE 9 - PERFORMANCE & STABILITÉ

### Optimisations Présentes

- ✅ React.memo sur composants clés
- ✅ useMemo/useCallback avec dépendances
- ✅ QueryClient avec staleTime/gcTime configurés
- ✅ FlatList avec removeClippedSubviews, maxToRenderPerBatch
- ✅ Listeners Firebase avec cleanup dans useEffect

### Problèmes Performance

| Problème | Impact | Gravité |
|----------|--------|---------|
| Map charge tous les users (500 limit) | Mémoire/réseau | P1 |
| Pas de virtualisation sur certaines listes | Scroll lag | P2 |
| Console.log excessifs en production | Performance | P1 |
| Listeners messages par conversation (pas batch) | Connexions Firebase | P2 |

### Erreurs ESLint (25 warnings)

| Type | Nombre | Action |
|------|--------|--------|
| Variables inutilisées | 20 | Nettoyer |
| Apostrophes non échappées | 1 | Corriger |
| useCallback deps inutiles | 1 | Corriger |
| Unused eslint-disable | 1 | Supprimer |

---

## PHASE 10 - SYNTHÈSE & PLAN PRODUCTION

### Classification des Problèmes

#### P0 - Bloque mise en production (3)

| ID | Problème | Fichier | Action |
|----|----------|---------|--------|
| P0-1 | Messages rules trop permissives | firestore.rules | Restreindre read aux participants |
| P0-2 | Import auth incorrect dans chat | messages/[id].tsx | Remplacer useAuth par useFirebaseUser |
| P0-3 | petLikes/petMatches sans vérification owner | firestore.rules | Ajouter vérification userId |

#### P1 - UX Majeure (8)

| ID | Problème | Fichier | Action |
|----|----------|---------|--------|
| P1-1 | Double FAB profile | (tabs)/profile.tsx | Supprimer un des deux |
| P1-2 | challengeSubmissions rules laxistes | firestore.rules | Ajouter vérification userId |
| P1-3 | healthRecords sans vérification owner | firestore.rules | Vérifier via pet.ownerId |
| P1-4 | Logs sensibles en production | services/storage.ts | Conditionner par __DEV__ |
| P1-5 | Map charge 500 users | (tabs)/map.tsx | Pagination/geolimit |
| P1-6 | impersonateUser exporté | firebase-user-store.ts | Protéger par __DEV__ |
| P1-7 | Console.log excessifs | Multiples fichiers | Remplacer par logger conditionnel |
| P1-8 | Pas de pagination messages | messaging-store.ts | Implémenter infinite scroll |

#### P2 - Polish (12)

| ID | Problème | Fichier |
|----|----------|---------|
| P2-1 | Variables inutilisées | auth/signin.tsx, (pro)/*.tsx |
| P2-2 | Apostrophe non échappée | lost-found/[id].tsx |
| P2-3 | useCallback dep router | (tabs)/community.tsx |
| P2-4 | handleMapError inutilisé | (tabs)/map.tsx |
| P2-5 | isLoading inutilisé | (tabs)/lost-found.tsx |
| P2-6 | Compression images manquante | services/storage.ts |
| P2-7 | queryClient inutilisé | (tabs)/profile.tsx |
| P2-8 | Header sticky overlap | (tabs)/community.tsx |
| P2-9 | Home/Challenges sont des redirects | (tabs)/home.tsx, challenges.tsx |
| P2-10 | Écrans orphelins | defis.tsx, admin.tsx |
| P2-11 | Documentation routes hidden | - |
| P2-12 | Image non définie | animated-splash.tsx |

---

### Plan de Correction par Priorité

#### Semaine 1 - P0 (Critiques)

1. **Firestore Rules - Messages**
```javascript
match /messages/{messageId} {
  allow read: if isAuth() && (
    resource.data.senderId == request.auth.uid || 
    resource.data.receiverId == request.auth.uid
  );
}
```

2. **Firestore Rules - Pet Matching**
```javascript
match /petLikes/{likeId} {
  allow create: if isAuth() && request.resource.data.userId == request.auth.uid;
  allow delete: if isAuth() && resource.data.userId == request.auth.uid;
}
```

3. **Fix messages/[id].tsx**
- Remplacer import `useAuth` par `useFirebaseUser`

#### Semaine 2 - P1 (UX Majeure)

1. Supprimer double FAB dans profile.tsx
2. Conditionner logs par `__DEV__`
3. Protéger `impersonateUser` par `__DEV__`
4. Ajouter rules healthRecords/vaccinations
5. Implémenter pagination map (geohash ou limite par viewport)
6. Ajouter pagination messages

#### Semaine 3 - P2 (Polish)

1. Nettoyer variables inutilisées (ESLint)
2. Échapper apostrophes
3. Corriger deps useCallback
4. Ajouter compression images
5. Documenter routes hidden

---

### Checklist Pré-Production

- [ ] P0-1: Rules messages corrigées
- [ ] P0-2: Import auth corrigé dans chat
- [ ] P0-3: Rules petMatching corrigées
- [ ] P1-1 à P1-8: Tous corrigés
- [ ] Tests manuels sur iOS/Android
- [ ] Tests web (React Native Web)
- [ ] Vérification logs en mode release
- [ ] Validation email forcée
- [ ] Rate limiting implémenté
- [ ] Backup Firestore configuré
- [ ] Monitoring errors (Sentry ou similaire)

---

### Recommandations Finales

1. **Sécurité**: Corriger les rules Firestore avant toute mise en production
2. **Performance**: Implémenter pagination pour map et messages
3. **Monitoring**: Ajouter Sentry ou équivalent pour crash reporting
4. **Tests**: Ajouter tests E2E pour flows critiques (auth, messaging, matching)
5. **Documentation**: Documenter l'architecture navigation et les routes hidden

---

**Statut Global**: ⚠️ **Non prêt pour production**

**Estimation correction P0**: 2-4 heures  
**Estimation correction P1**: 1-2 jours  
**Estimation totale avant prod**: 3-5 jours de travail

