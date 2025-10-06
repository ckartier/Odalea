# Analyse du Flux Professionnel - Coppet

## Vue d'ensemble
Ce document analyse le processus complet pour un utilisateur professionnel, de l'enregistrement à la facturation.

## Problèmes Identifiés

### 1. **Enregistrement Professionnel**
**Fichier**: `app/auth/pro-register.tsx`

**Problèmes**:
- ✅ Les données professionnelles sont stockées dans `user.professionalData`
- ❌ Pas de sauvegarde dans la collection `professionals` de Firestore
- ❌ Les produits sont stockés localement dans `professionalData.products` au lieu de la collection `professionalProducts`
- ❌ Pas de synchronisation avec Firebase après l'inscription

**Impact**: Les professionnels ne sont pas visibles dans les requêtes Firestore

---

### 2. **Ajout de Produits**
**Fichier**: `app/pro/products/add.tsx`

**Problèmes**:
- ❌ Les produits sont ajoutés uniquement à `user.professionalData.products` (local)
- ❌ Pas de sauvegarde dans `professionalProducts` collection
- ❌ Les produits ne sont pas visibles pour les autres utilisateurs
- ❌ Pas de `sellerId`, `sellerName`, `sellerLogo` sur les produits
- ❌ Status `pending` mais pas de workflow d'approbation

**Impact**: Les produits ne sont pas visibles dans la boutique

---

### 3. **Affichage des Produits**
**Fichier**: `app/(pro)/shop.tsx`

**Problèmes**:
- ✅ Filtre les produits avec `sellerId`
- ❌ Mais les produits n'ont pas de `sellerId` car non sauvegardés dans Firestore
- ❌ Les informations vendeur (`sellerName`, `sellerLogo`) ne sont pas renseignées

**Impact**: Boutique vide ou produits sans informations vendeur

---

### 4. **Processus d'Achat**
**Fichiers**: 
- `app/shop/product/[id].tsx`
- `app/shop/cart.tsx`
- `components/PaymentModal.tsx`

**Problèmes**:
- ✅ Ajout au panier fonctionne (local)
- ✅ Modal de paiement fonctionne
- ❌ Création de commande via `shop-store.ts` mais pas de lien avec le vendeur
- ❌ Les commandes ne sont pas ajoutées à `professionalData.orders` du vendeur
- ❌ Pas de notification au vendeur
- ❌ Pas de mise à jour des analytics du vendeur

**Impact**: Le vendeur ne voit pas ses commandes

---

### 5. **Messagerie Acheteur-Vendeur**
**Fichiers**:
- `app/messages/[id].tsx`
- `hooks/unified-messaging-store.ts`

**Problèmes**:
- ✅ Système de messagerie existe
- ❌ Pas de création automatique de conversation après achat
- ❌ Pas de lien entre commande et conversation
- ❌ Pas de bouton "Contacter le vendeur" sur la page produit

**Impact**: Pas de communication entre acheteur et vendeur

---

### 6. **Dashboard Professionnel**
**Fichier**: `app/(pro)/dashboard.tsx`

**Problèmes**:
- ✅ Affiche les stats depuis `professionalData`
- ❌ Mais les données ne sont jamais mises à jour (pas de commandes)
- ❌ Pas de synchronisation avec Firestore

**Impact**: Dashboard toujours vide

---

### 7. **Gestion des Commandes**
**Problèmes**:
- ❌ Pas de page `/pro/orders` pour gérer les commandes
- ❌ Pas de système de statut de commande (préparation, expédition, livraison)
- ❌ Pas de notifications pour les nouvelles commandes

**Impact**: Le vendeur ne peut pas gérer ses commandes

---

### 8. **Facturation**
**Problèmes**:
- ❌ Pas de génération de facture
- ❌ Pas de système de paiement au vendeur
- ❌ Pas de calcul de commission
- ❌ IBAN stocké mais jamais utilisé

**Impact**: Pas de système de paiement réel

---

## Architecture Correcte

### Collections Firestore Nécessaires

```
users/
  {userId}/
    - isProfessional: true
    - professionalData: { companyName, siret, ... }

professionals/
  {userId}/
    - companyName
    - siret
    - businessEmail
    - isVerified
    - subscriptionType
    - analytics: { totalSales, totalOrders, ... }

professionalProducts/
  {productId}/
    - name
    - description
    - price
    - photos
    - category
    - stock
    - sellerId
    - sellerName
    - sellerLogo
    - isVerified
    - status: 'pending' | 'approved' | 'rejected'
    - createdAt
    - updatedAt

orders/
  {orderId}/
    - customerId
    - customerName
    - customerEmail
    - sellerId (IMPORTANT!)
    - sellerName
    - items: [{ productId, productName, price, quantity }]
    - totalAmount
    - status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
    - paymentStatus: 'pending' | 'paid' | 'refunded'
    - shippingAddress
    - createdAt
    - updatedAt

conversations/
  {conversationId}/
    - participants: [customerId, sellerId]
    - type: 'order' | 'general'
    - orderId (si type = 'order')
    - lastMessage
    - updatedAt
```

---

## Flux Correct

### 1. Enregistrement Professionnel
```
1. Utilisateur remplit le formulaire pro-register
2. Création du compte user avec isProfessional: true
3. Sauvegarde dans users/{userId}
4. Sauvegarde dans professionals/{userId}
5. Redirection vers dashboard
```

### 2. Ajout de Produit
```
1. Professionnel remplit le formulaire add product
2. Création du produit avec:
   - sellerId = user.id
   - sellerName = professionalData.companyName
   - sellerLogo = user.photo
   - status = 'pending'
3. Sauvegarde dans professionalProducts/{productId}
4. Notification admin pour approbation
5. Après approbation: status = 'approved'
```

### 3. Achat de Produit
```
1. Client ajoute produit au panier
2. Client procède au paiement
3. Création de la commande avec:
   - customerId
   - sellerId (du produit)
   - items
   - totalAmount
4. Sauvegarde dans orders/{orderId}
5. Mise à jour analytics du vendeur
6. Création conversation entre client et vendeur
7. Notification au vendeur
8. Email de confirmation au client
```

### 4. Gestion de Commande (Vendeur)
```
1. Vendeur reçoit notification
2. Vendeur voit commande dans /pro/orders
3. Vendeur change statut: pending → confirmed → shipped → delivered
4. Client reçoit notifications à chaque étape
5. Client peut contacter vendeur via messagerie
```

### 5. Facturation
```
1. Commande livrée
2. Calcul commission plateforme (ex: 10%)
3. Génération facture pour client
4. Génération facture pour vendeur
5. Paiement au vendeur (IBAN) après délai de rétractation
```

---

## Corrections Nécessaires

### Priorité 1 - Critique
1. ✅ Sauvegarder les professionnels dans Firestore
2. ✅ Sauvegarder les produits dans professionalProducts
3. ✅ Ajouter sellerId aux commandes
4. ✅ Créer conversation après achat

### Priorité 2 - Important
5. ✅ Créer page /pro/orders
6. ✅ Système de notifications vendeur
7. ✅ Mise à jour analytics vendeur
8. ✅ Bouton "Contacter le vendeur"

### Priorité 3 - Nice to have
9. Système d'approbation produits
10. Génération de factures
11. Système de paiement vendeur
12. Calcul de commission

---

## Règles de Sécurité Firestore

```javascript
// professionals
match /professionals/{userId} {
  allow read: if true;
  allow write: if request.auth.uid == userId;
}

// professionalProducts
match /professionalProducts/{productId} {
  allow read: if resource.data.status == 'approved' || 
                 request.auth.uid == resource.data.sellerId;
  allow create: if request.auth != null && 
                   request.resource.data.sellerId == request.auth.uid;
  allow update: if request.auth.uid == resource.data.sellerId;
}

// orders
match /orders/{orderId} {
  allow read: if request.auth.uid == resource.data.customerId || 
                 request.auth.uid == resource.data.sellerId;
  allow create: if request.auth.uid == request.resource.data.customerId;
  allow update: if request.auth.uid == resource.data.sellerId;
}
```
