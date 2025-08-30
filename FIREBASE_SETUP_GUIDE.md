# Guide de Configuration Firebase ✅

## ✅ Configuration Actuelle

Votre Firebase est maintenant configuré avec :
- **API Key**: `AIzaSyAkZRD6EuCR5HfjEzByEJxXdi-LWlXqvjI`
- **Project ID**: `coppet-app`
- **App ID**: `1:636879478460:ios:05e9a3856207aff593bab9`
- **Messaging Sender ID**: `636879478460`

## 📋 Étapes pour connecter Firebase

### 1. Configuration Firebase Console

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'authentification Google dans Authentication > Sign-in method

### 2. Configuration des applications

#### Pour iOS :
1. Ajoutez une application iOS avec le Bundle ID : `Copattes.Copattes`
2. Téléchargez le fichier `GoogleService-Info.plist`
3. Placez-le à la racine de votre projet

#### Pour Android :
1. Ajoutez une application Android avec le Package name : `Copattes.Copattes`
2. Téléchargez le fichier `google-services.json`
3. Placez-le à la racine de votre projet

#### Pour Web :
1. Ajoutez une application Web
2. Copiez la configuration Firebase

### 3. ✅ Configuration Firebase Terminée

La configuration Firebase a été mise à jour dans le fichier `.env` :

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyAkZRD6EuCR5HfjEzByEJxXdi-LWlXqvjI
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=coppet-app.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=coppet-app
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=coppet-app.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=636879478460
EXPO_PUBLIC_FIREBASE_APP_ID=1:636879478460:ios:05e9a3856207aff593bab9
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 4. Mise à jour des Client IDs Google

Modifiez le fichier `services/google-auth.ts` et remplacez les Client IDs :

```typescript
this.clientId = Platform.select({
  ios: 'VOTRE_IOS_CLIENT_ID.apps.googleusercontent.com',
  android: 'VOTRE_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  web: 'VOTRE_WEB_CLIENT_ID.apps.googleusercontent.com',
  default: 'VOTRE_WEB_CLIENT_ID.apps.googleusercontent.com'
}) as string;
```

### 5. Configuration app.json (si possible)

Ajoutez dans votre `app.json` :

```json
{
  "expo": {
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

## 🔧 Utilisation

### Hook Firebase Auth
```typescript
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';

function MyComponent() {
  const { user, isLoading, isAuthenticated } = useFirebaseAuth();
  // ...
}
```

### Hook Google Auth (avec Firebase)
```typescript
import { useGoogleAuth } from '@/hooks/use-google-auth';

function AuthComponent() {
  const { user, signIn, signOut, isLoading, error } = useGoogleAuth();
  // ...
}
```

## 📱 Fonctionnalités disponibles

✅ Configuration Firebase terminée
✅ Authentification Google avec Firebase
✅ Persistence des sessions
✅ Synchronisation automatique
✅ Support multi-plateforme (iOS, Android, Web)
✅ Gestion des erreurs
✅ Déconnexion sécurisée
✅ Composant de test Firebase ajouté

## 🐛 Résolution des problèmes

### Erreur "Invalid client ID"
- Vérifiez que les Client IDs sont corrects dans `services/google-auth.ts`
- Assurez-vous que les Bundle ID/Package name correspondent

### Erreur "GoogleService-Info.plist not found"
- Placez le fichier à la racine du projet
- Vérifiez le nom du fichier (sensible à la casse)

### Erreur de certificat SHA-1
- Générez le bon certificat SHA-1 pour votre environnement
- Ajoutez-le dans Firebase Console > Project Settings > Your apps

## 📚 Prochaines étapes

1. ✅ Configuration Firebase terminée
2. Activez les services dans Firebase Console :
   - Authentication (Email/Password, Google, Apple)
   - Firestore Database
   - Storage
3. Configurez les règles de sécurité
4. Testez l'authentification avec le composant de test
5. Configurez Firestore si nécessaire
6. Ajoutez d'autres méthodes d'authentification si souhaité

## 🧪 Test de la Configuration

Un composant de test Firebase a été ajouté à votre application :
- Ouvrez l'onglet "Home" de votre app
- Vous verrez un panneau "Firebase Configuration Test"
- Il affichera le statut de la connexion Firebase
- Tous les éléments doivent afficher des ✅