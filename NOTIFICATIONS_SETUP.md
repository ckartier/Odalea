# Configuration des Notifications Push

## ✅ Configuration Actuelle

Votre application est maintenant configurée pour les notifications push avec :

1. **expo-notifications** installé et configuré
2. **expo-device** installé pour détecter les appareils physiques
3. Service de notifications créé (`services/notifications.ts`)
4. Hook personnalisé créé (`hooks/use-notifications.ts`)
5. Intégration automatique dans `app/_layout.tsx`

## 📱 Fonctionnalités Disponibles

### 1. Enregistrement automatique du token push
- Le token est automatiquement enregistré au démarrage de l'app
- Le token est sauvegardé dans Firestore pour chaque utilisateur
- Mise à jour automatique si le token change

### 2. Réception de notifications
- Notifications en premier plan (app ouverte)
- Notifications en arrière-plan (app fermée)
- Badge count sur l'icône de l'app

### 3. Notifications programmées
- Planifier des notifications locales
- Annuler des notifications programmées
- Gérer le badge count

## 🔧 Configuration app.json

Votre `app.json` est déjà configuré avec :

```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./local/assets/notification_icon.png",
        "color": "#ffffff",
        "defaultChannel": "default",
        "sounds": ["./local/assets/notification_sound.wav"],
        "enableBackgroundRemoteNotifications": false
      }
    ]
  ]
}
```

### ⚠️ Fichiers manquants (optionnels)
- `./local/assets/notification_icon.png` - Icône de notification Android
- `./local/assets/notification_sound.wav` - Son personnalisé

Ces fichiers sont optionnels. Si absents, les valeurs par défaut seront utilisées.

## 📝 Utilisation dans votre code

### Envoyer une notification push à un utilisateur

```typescript
import { sendPushNotification } from '@/services/notifications';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

// Récupérer le token push de l'utilisateur
const userDoc = await getDoc(doc(db, 'users', userId));
const pushToken = userDoc.data()?.pushToken;

if (pushToken) {
  await sendPushNotification(
    pushToken,
    'Nouveau message',
    'Vous avez reçu un nouveau message de Jean',
    { type: 'message', messageId: '123' }
  );
}
```

### Programmer une notification locale

```typescript
import { schedulePushNotification } from '@/services/notifications';

// Notification dans 1 heure
await schedulePushNotification(
  'Rappel',
  'N\'oubliez pas votre rendez-vous avec le cat-sitter',
  3600, // secondes
  { type: 'booking', bookingId: '456' }
);
```

### Gérer le badge count

```typescript
import { setBadgeCount, getBadgeCount } from '@/services/notifications';

// Définir le nombre de notifications non lues
await setBadgeCount(5);

// Récupérer le nombre actuel
const count = await getBadgeCount();

// Réinitialiser
await setBadgeCount(0);
```

## 🎯 Cas d'usage dans votre app

### 1. Messagerie
Envoyer une notification quand un utilisateur reçoit un message :

```typescript
// Dans votre fonction d'envoi de message
const recipientDoc = await getDoc(doc(db, 'users', recipientId));
const pushToken = recipientDoc.data()?.pushToken;

if (pushToken) {
  await sendPushNotification(
    pushToken,
    `Nouveau message de ${senderName}`,
    messageText,
    { type: 'message', conversationId, senderId }
  );
}
```

### 2. Réservations Cat-Sitter
Notifier le cat-sitter d'une nouvelle réservation :

```typescript
const catSitterDoc = await getDoc(doc(db, 'users', catSitterId));
const pushToken = catSitterDoc.data()?.pushToken;

if (pushToken) {
  await sendPushNotification(
    pushToken,
    'Nouvelle réservation',
    `${ownerName} souhaite réserver vos services`,
    { type: 'booking', bookingId }
  );
}
```

### 3. Rappels de rendez-vous
Programmer un rappel 24h avant un rendez-vous :

```typescript
const bookingDate = new Date(booking.date);
const reminderTime = bookingDate.getTime() - (24 * 60 * 60 * 1000);
const secondsUntilReminder = (reminderTime - Date.now()) / 1000;

if (secondsUntilReminder > 0) {
  await schedulePushNotification(
    'Rappel de rendez-vous',
    `Votre rendez-vous avec ${catSitterName} est demain`,
    secondsUntilReminder,
    { type: 'booking-reminder', bookingId }
  );
}
```

### 4. Défis et Badges
Notifier quand un utilisateur gagne un badge :

```typescript
const userDoc = await getDoc(doc(db, 'users', userId));
const pushToken = userDoc.data()?.pushToken;

if (pushToken) {
  await sendPushNotification(
    pushToken,
    '🏆 Nouveau badge débloqué !',
    `Félicitations ! Vous avez obtenu le badge "${badgeName}"`,
    { type: 'badge', badgeId }
  );
}
```

## 🔐 Permissions

Les permissions sont demandées automatiquement au premier lancement via le hook `useNotifications()`.

Sur iOS, l'utilisateur verra une popup système.
Sur Android, les notifications sont activées par défaut (Android 13+).

## 🧪 Test des notifications

### Test sur appareil physique
Les notifications push nécessitent un appareil physique. Elles ne fonctionnent pas sur simulateur/émulateur.

### Test de notification locale
Vous pouvez tester les notifications locales même sur simulateur :

```typescript
import { schedulePushNotification } from '@/services/notifications';

// Notification dans 5 secondes
await schedulePushNotification(
  'Test',
  'Ceci est une notification de test',
  5
);
```

## 📊 Structure Firestore

Le token push est automatiquement sauvegardé dans Firestore :

```typescript
// Collection: users/{userId}
{
  pushToken: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  pushTokenUpdatedAt: "2025-10-07T10:30:00.000Z",
  // ... autres champs utilisateur
}
```

## 🚀 Prochaines étapes

1. **Créer les assets de notification** (optionnel)
   - Icône de notification Android (96x96px, PNG transparent)
   - Son personnalisé (WAV format)

2. **Implémenter la logique métier**
   - Envoyer des notifications lors des événements importants
   - Gérer les préférences de notification par utilisateur
   - Implémenter le badge count pour les messages non lus

3. **Tester sur appareil physique**
   - Scanner le QR code avec Expo Go
   - Tester la réception de notifications
   - Vérifier le comportement en arrière-plan

4. **Configuration avancée** (pour production)
   - Configurer Firebase Cloud Messaging (FCM) pour Android
   - Configurer Apple Push Notification service (APNs) pour iOS
   - Mettre en place un serveur backend pour envoyer les notifications

## ⚠️ Limitations

- **Web** : Les notifications push ne sont pas entièrement supportées sur web
- **Simulateur** : Les notifications push ne fonctionnent pas sur simulateur iOS/Android
- **Expo Go** : Fonctionne avec Expo Go, mais pour la production, vous devrez build l'app

## 📚 Ressources

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
