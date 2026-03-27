# Configuration des Services Google

Ce guide vous explique comment configurer l'authentification Google dans votre application React Native/Expo.

## 📋 Prérequis

1. Un compte Google Cloud Platform
2. Un projet Firebase (optionnel mais recommandé)
3. Les fichiers de configuration Google

## 🚀 Étapes de configuration

### 1. Configuration Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google+ et l'API OAuth2
4. Allez dans "Identifiants" > "Créer des identifiants" > "ID client OAuth 2.0"

### 2. Configuration des Client IDs

Créez des Client IDs pour chaque plateforme :

#### Pour iOS :
- Type d'application : Application iOS
- Bundle ID : `app.rork.coppet-app-8enmv9oy` (ou votre bundle ID)
- Téléchargez le fichier `GoogleService-Info.plist`

#### Pour Android :
- Type d'application : Application Android  
- Nom du package : `app.rork.coppet-app-8enmv9oy` (ou votre package name)
- Certificat de signature SHA-1 (pour le développement, utilisez le certificat de debug)
- Téléchargez le fichier `google-services.json`

#### Pour Web :
- Type d'application : Application Web
- URI de redirection autorisés : `https://auth.expo.io/@your-username/your-app-slug`

### 3. Installation des fichiers de configuration

1. **Pour iOS** : Placez `GoogleService-Info.plist` à la racine de votre projet
2. **Pour Android** : Placez `google-services.json` à la racine de votre projet

### 4. Configuration du code

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

### Hook useGoogleAuth

```typescript
import { useGoogleAuth } from '@/hooks/use-google-auth';

function MyComponent() {
  const { user, signIn, signOut, isLoading, error, isSignedIn } = useGoogleAuth();
  
  // Utilisation...
}
```

### Composants prêts à l'emploi

```typescript
import { GoogleSignInButton, GoogleSignOutButton } from '@/components/GoogleAuthButton';

function AuthScreen() {
  return (
    <GoogleSignInButton
      onSignInSuccess={(user) => {
        console.log('Utilisateur connecté:', user);
      }}
      onSignInError={(error) => {
        console.error('Erreur:', error);
      }}
    />
  );
}
```

## 🔍 Obtenir le certificat SHA-1 pour Android

Pour le développement avec Expo :

```bash
# Certificat de debug Expo
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

## 🌐 URLs de redirection

Pour Expo, utilisez :
- `https://auth.expo.io/@your-username/your-app-slug`
- Ou votre scheme personnalisé : `myapp://auth`

## 📱 Test

1. Lancez votre application
2. Appuyez sur le bouton "Se connecter avec Google"
3. Suivez le processus d'authentification
4. Vérifiez que les informations utilisateur sont correctement récupérées

## 🐛 Dépannage

### Erreurs courantes :

1. **"Invalid client ID"** : Vérifiez que les Client IDs sont corrects
2. **"Unauthorized"** : Vérifiez les URLs de redirection
3. **"SHA-1 mismatch"** : Vérifiez le certificat SHA-1 pour Android

### Logs utiles :

```typescript
console.log('Redirect URI:', AuthSession.makeRedirectUri({ scheme: 'myapp' }));
```

## 📚 Ressources

- [Documentation Expo AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Firebase Auth](https://firebase.google.com/docs/auth)

## ⚠️ Sécurité

- Ne jamais exposer vos Client Secrets dans le code client
- Utilisez HTTPS en production
- Validez les tokens côté serveur
- Implémentez une expiration des sessions