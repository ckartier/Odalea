# 🐱 Analyse et Corrections du Parcours Cat-Sitter

## 📋 Résumé des Problèmes Identifiés

### 1. **Enregistrement d'un Nouveau Cat-Sitter**
#### Problèmes:
- ✅ L'enregistrement utilisateur fonctionne via `signup.tsx`
- ⚠️ Le flag `isCatSitter` est bien enregistré mais pas synchronisé avec Firestore
- ❌ Pas de profil cat-sitter dédié créé dans la collection `petSitterProfiles`
- ❌ La localisation n'est pas toujours enregistrée correctement

#### Solutions Appliquées:
1. Créer automatiquement un profil cat-sitter dans Firestore lors de l'inscription
2. S'assurer que la localisation est bien enregistrée
3. Ajouter le rayon de service (catSitterRadiusKm)

### 2. **Visibilité sur la Carte Google**
#### Problèmes:
- ⚠️ Les cat-sitters ne sont pas filtrés correctement sur la carte
- ❌ Les utilisateurs sans localisation ne sont pas visibles
- ❌ Le filtre "sitters" ne fonctionne pas correctement

#### Solutions Appliquées:
1. Corriger le filtre pour afficher les cat-sitters
2. S'assurer que tous les utilisateurs ont une localisation (même approximative)
3. Ajouter des marqueurs spécifiques pour les cat-sitters

### 3. **Booking d'un Cat-Sitter**
#### Problèmes:
- ✅ Le système de booking existe
- ⚠️ Les bookings ne sont pas liés aux profils cat-sitter
- ❌ Pas de notification au cat-sitter lors d'une réservation
- ❌ Le cat-sitter ne peut pas voir ses réservations

#### Solutions Appliquées:
1. Lier les bookings aux profils cat-sitter
2. Créer une conversation automatique lors du booking
3. Ajouter les bookings à la liste du cat-sitter

### 4. **Messagerie**
#### Problèmes:
- ✅ Le système de messagerie existe
- ⚠️ Pas de création automatique de conversation lors du booking
- ❌ Les messages liés aux bookings ne sont pas identifiés

#### Solutions Appliquées:
1. Créer automatiquement une conversation lors du booking
2. Lier la conversation au booking
3. Ajouter le bookingId dans les messages

---

## 🔧 Corrections Appliquées

### Fichier 1: `app/auth/signup.tsx`
**Modifications:**
- Ajout de la création automatique du profil cat-sitter si `isCatSitter === true`
- Enregistrement du rayon de service
- Vérification de la localisation avant l'enregistrement

### Fichier 2: `app/(tabs)/cat-sitter.tsx`
**Modifications:**
- Chargement des cat-sitters depuis Firestore
- Affichage des utilisateurs avec `isCatSitter === true`
- Tri par distance et popularité

### Fichier 3: `app/booking/[id].tsx`
**Modifications:**
- Création automatique d'une conversation lors du booking
- Liaison du booking au profil cat-sitter
- Ajout du chatId dans le booking

### Fichier 4: `services/database.ts`
**Modifications:**
- Ajout de méthodes pour gérer les profils cat-sitter
- Méthodes pour lier bookings et conversations
- Méthodes pour récupérer les bookings d'un cat-sitter

### Fichier 5: `app/(tabs)/map.tsx`
**Modifications:**
- Correction du filtre "sitters" pour afficher les cat-sitters
- Ajout de marqueurs spécifiques pour les cat-sitters
- Affichage du badge cat-sitter sur les profils

---

## 📝 Règles de Sécurité Firestore à Vérifier

Assurez-vous que ces règles sont bien appliquées:

```javascript
// Collection petSitterProfiles
match /petSitterProfiles/{sitterId} {
  allow read: if true;  // Public
  allow create, update: if isAuthenticated() || true;
  allow delete: if isOwner(sitterId) || true;
}

// Collection bookings
match /bookings/{bookingId} {
  allow read: if isAuthenticated() || true;
  allow create: if isAuthenticated() || true;
  allow update: if isAuthenticated() || true;
  allow delete: if isAuthenticated() || true;
}

// Collection conversations
match /conversations/{conversationId} {
  allow read: if isAuthenticated() || true;
  allow create: if isAuthenticated() || true;
  allow update: if isAuthenticated() || true;
  allow delete: if false;
}

// Collection messages
match /messages/{messageId} {
  allow read: if isAuthenticated() || true;
  allow create: if isAuthenticated() || true;
  allow update, delete: if false;
}
```

---

## ✅ Checklist de Vérification

### Enregistrement Cat-Sitter
- [ ] L'utilisateur peut cocher "Je suis cat-sitter" lors de l'inscription
- [ ] Le rayon de service est bien enregistré (catSitterRadiusKm)
- [ ] La localisation est bien enregistrée (latitude, longitude)
- [ ] Un profil cat-sitter est créé dans `petSitterProfiles`
- [ ] Le flag `isCatSitter` est à `true` dans le profil utilisateur

### Visibilité sur la Carte
- [ ] Les cat-sitters apparaissent sur la carte
- [ ] Le filtre "Cat-sitters" fonctionne correctement
- [ ] Les marqueurs des cat-sitters sont différents des autres utilisateurs
- [ ] Le badge cat-sitter (🐱) est affiché sur les profils

### Booking
- [ ] Un utilisateur peut réserver un cat-sitter
- [ ] Le booking est enregistré dans Firestore
- [ ] Une conversation est créée automatiquement
- [ ] Le cat-sitter reçoit une notification (à implémenter)
- [ ] Le booking apparaît dans la liste du cat-sitter

### Messagerie
- [ ] La conversation est créée lors du booking
- [ ] Le bookingId est lié à la conversation
- [ ] Les messages sont bien envoyés et reçus
- [ ] Le cat-sitter peut répondre aux messages

---

## 🚀 Prochaines Étapes

1. **Tester l'enregistrement d'un nouveau cat-sitter**
   - Créer un compte avec "Je suis cat-sitter" coché
   - Vérifier que le profil est créé dans Firestore
   - Vérifier que la localisation est enregistrée

2. **Tester la visibilité sur la carte**
   - Ouvrir la carte
   - Appliquer le filtre "Cat-sitters"
   - Vérifier que les cat-sitters sont affichés

3. **Tester le booking**
   - Réserver un cat-sitter
   - Vérifier que le booking est créé
   - Vérifier que la conversation est créée
   - Vérifier que le cat-sitter voit le booking

4. **Tester la messagerie**
   - Envoyer un message au cat-sitter
   - Vérifier que le message est reçu
   - Vérifier que le cat-sitter peut répondre

---

## 📊 Données de Test

### Utilisateur Cat-Sitter Test
```json
{
  "id": "test-catsitter-1",
  "firstName": "Marie",
  "lastName": "Dubois",
  "email": "marie.dubois@test.com",
  "isCatSitter": true,
  "catSitterRadiusKm": 5,
  "location": {
    "latitude": 48.8867,
    "longitude": 2.3431
  },
  "city": "Paris",
  "zipCode": "75018",
  "address": "Montmartre"
}
```

### Profil Cat-Sitter Test
```json
{
  "userId": "test-catsitter-1",
  "isActive": true,
  "hourlyRate": 15,
  "description": "Cat-sitter expérimenté",
  "services": ["Pet Sitting", "Dog Walking"],
  "availability": {
    "monday": { "start": "08:00", "end": "18:00", "available": true },
    "tuesday": { "start": "08:00", "end": "18:00", "available": true }
  },
  "radiusKm": 5
}
```

---

## 🐛 Problèmes Connus

1. **Permissions Firestore**
   - Les règles temporaires permettent l'accès sans authentification
   - À remplacer par des règles strictes avant la production

2. **Localisation**
   - Certains utilisateurs n'ont pas de localisation
   - Solution temporaire: utiliser Paris par défaut

3. **Notifications**
   - Pas de système de notifications push implémenté
   - À implémenter pour notifier les cat-sitters des bookings

---

## 📚 Documentation Technique

### Collections Firestore

#### `users`
- Contient tous les utilisateurs
- Champ `isCatSitter: boolean` pour identifier les cat-sitters
- Champ `catSitterRadiusKm: number` pour le rayon de service
- Champ `location: { latitude, longitude }` pour la localisation

#### `petSitterProfiles`
- Profils détaillés des cat-sitters
- Lié à `users` via `userId`
- Contient les disponibilités, tarifs, services, etc.

#### `bookings`
- Réservations de cat-sitters
- Champs: `userId`, `catSitterId`, `date`, `timeSlot`, `status`, `chatId`
- Statuts: `pending`, `accepted`, `declined`, `completed`, `cancelled`

#### `conversations`
- Conversations entre utilisateurs
- Créées automatiquement lors d'un booking
- Champ `bookingId` pour lier à une réservation

#### `messages`
- Messages dans les conversations
- Champs: `conversationId`, `senderId`, `receiverId`, `content`, `timestamp`

---

Date de création: 2025-10-06
