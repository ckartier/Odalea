# Firebase Indexes Fix Guide

## Problèmes Identifiés

Votre application rencontre des erreurs Firebase Firestore liées aux index manquants. Ces erreurs se produisent car Firestore nécessite des index composites pour les requêtes complexes.

## Erreurs Actuelles

### 1. Index Conversations
```
The query requires an index for: conversations
- participants (ARRAY_CONTAINS)
- updatedAt (DESCENDING)
```

### 2. Index Bookings
```
The query requires an index for: bookings
- userId (ASCENDING)
- createdAt (DESCENDING)
```

## Solution Rapide

### Option 1: Créer les Index via les Liens Fournis (RECOMMANDÉ)

Firebase vous fournit des liens directs pour créer les index. Cliquez simplement sur ces liens dans vos erreurs:

1. **Pour les conversations:**
   ```
   https://console.firebase.google.com/v1/r/project/copattes/firestore/indexes?create_composite=...
   ```

2. **Pour les bookings:**
   ```
   https://console.firebase.google.com/v1/r/project/copattes/firestore/indexes?create_composite=...
   ```

### Option 2: Créer Manuellement dans la Console Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet "copattes"
3. Allez dans **Firestore Database** → **Indexes**
4. Cliquez sur **Create Index**
5. Créez les index suivants:

#### Index pour Conversations
- Collection: `conversations`
- Champs:
  - `participants` - Array-contains
  - `updatedAt` - Descending
  - `__name__` - Ascending

#### Index pour Bookings
- Collection: `bookings`
- Champs:
  - `userId` - Ascending
  - `createdAt` - Descending
  - `__name__` - Ascending

## Temps de Création

⏱️ **Important:** La création d'index peut prendre de 5 à 30 minutes selon la taille de votre base de données.

## Vérification

Une fois les index créés, vous verrez:
- ✅ Status: "Enabled" dans la console Firebase
- ✅ Plus d'erreurs dans les logs de votre application

## Fichier firestore.indexes.json

Le fichier `firestore.indexes.json` à la racine de votre projet contient déjà la configuration correcte des index. Ce fichier est utilisé pour:
- Documentation
- Déploiement automatique avec Firebase CLI (si configuré)
- Référence pour l'équipe de développement

## Google Maps API Key

### Problème Résolu
L'erreur "Google Maps API key not found" a été corrigée en ajoutant une valeur par défaut dans le code.

### Configuration Actuelle
- Clé API: `AIzaSyDMh-ZNFwOqVvnviQg1-FV7tAZPDy1xxPk`
- Configurée dans: `.env`, `app.json`
- Utilisée pour: MapView web, Places API (vétérinaires)

### Vérifications Nécessaires

1. **Activez les APIs Google Cloud:**
   - Maps JavaScript API
   - Places API
   - Geocoding API

2. **Vérifiez les restrictions:**
   - Allez sur [Google Cloud Console](https://console.cloud.google.com)
   - API & Services → Credentials
   - Vérifiez que votre clé API n'a pas de restrictions qui bloquent les requêtes

## Prochaines Étapes

1. ✅ Cliquez sur les liens d'erreur pour créer les index automatiquement
2. ⏱️ Attendez que les index soient créés (5-30 minutes)
3. 🔄 Rechargez votre application
4. ✅ Vérifiez que les erreurs ont disparu

## Support

Si les erreurs persistent après la création des index:
1. Vérifiez que les index sont bien "Enabled" dans Firebase Console
2. Videz le cache de votre application
3. Redémarrez le serveur de développement
