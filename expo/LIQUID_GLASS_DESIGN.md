# Liquid Glass Design System

## Vue d'ensemble

Le nouveau design "Liquid Glass" apporte une esthétique moderne et fluide à l'application avec des effets de verre dépoli (frosted glass) et des dégradés liquides adaptés au genre des animaux.

## Couleurs principales

### Couleurs de genre
- **Mâle (Male)**: `#A3D5FF` (bleu clair) → `#6BB6FF` (bleu plus vif)
- **Femelle (Female)**: `#FFB3D9` (rose clair) → `#FF8AC9` (rose plus vif)
- **Neutre**: `#E0F2FE` → `#BAE6FD` (cyan clair)

### Couleurs système
- **Primary**: `#000000` (noir moderne)
- **Secondary**: `#EC4899` (rose vibrant)
- **Accent**: `#1EAAD6` (cyan)

## Composants mis à jour

### 1. GlassView
Le composant de base pour tous les effets de verre liquide.

**Props:**
- `tint`: 'light' | 'dark' | 'male' | 'female' | 'neutral'
- `liquidGlass`: boolean (active l'effet liquid glass)
- `intensity`: number (intensité du blur)

**Utilisation:**
```tsx
<GlassView tint="male" liquidGlass={true}>
  <Text>Contenu</Text>
</GlassView>
```

### 2. Button
Boutons avec effet liquid glass et dégradés.

**Nouvelles props:**
- `variant`: 'primary' | 'subtle' | 'ghost' | 'outline' | 'male' | 'female'
- `liquidGlass`: boolean (défaut: true)

**Utilisation:**
```tsx
<Button 
  title="Confirmer" 
  variant="male" 
  liquidGlass={true}
  onPress={handlePress}
/>
```

### 3. Input
Champs de saisie avec fond en verre liquide.

**Nouvelles props:**
- `tint`: 'light' | 'dark' | 'male' | 'female' | 'neutral'

**Utilisation:**
```tsx
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  tint="neutral"
/>
```

### 4. DatePicker
Sélecteur de date avec design liquid glass.

**Nouvelles props:**
- `tint`: 'light' | 'dark' | 'male' | 'female' | 'neutral'

### 5. Cards (PetCard, ProductCard, UserCard, SurfaceCard)
Toutes les cartes utilisent maintenant GlassView avec des teintes adaptées.

**PetCard:**
- Teinte automatique basée sur le genre de l'animal
- Ombre liquid glass

**ProductCard & UserCard:**
- Teinte neutre par défaut
- Effet liquid glass avec ombre douce

**SurfaceCard:**
- Composant générique pour conteneurs
- Teinte configurable

### 6. ResponsiveModal
Modales avec fond en verre liquide.

**Nouvelles props:**
- `tint`: 'light' | 'dark' | 'male' | 'female' | 'neutral'

### 7. AppBackground
Fond d'application avec dégradés liquides.

**Props:**
- `variant`: 'default' | 'male' | 'female'

**Utilisation:**
```tsx
<AppBackground variant="default">
  <YourContent />
</AppBackground>
```

## Ombres

### Nouvelle ombre liquid glass
```typescript
liquidGlass: {
  shadowColor: 'rgba(163, 213, 255, 0.5)',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.3,
  shadowRadius: 20,
  elevation: 6,
}
```

## Dégradés

### Nouveaux dégradés liquides
```typescript
liquidMale: ['#A3D5FF', '#6BB6FF']
liquidFemale: ['#FFB3D9', '#FF8AC9']
liquidNeutral: ['#E0F2FE', '#BAE6FD']
```

## Adaptation iOS et Android

### Safe Areas
Tous les écrans respectent les safe areas pour:
- **iOS avec encoche**: Insets top et bottom automatiques
- **Android**: Gestion des barres système

### Responsive Design
- Utilisation de `moderateScale()` pour toutes les dimensions
- Adaptation automatique pour petits écrans et tablettes
- Bordures arrondies adaptatives (12-24px selon la taille)

## Bonnes pratiques

### 1. Choix de la teinte
- Utilisez `male` ou `female` pour les éléments liés aux animaux
- Utilisez `neutral` pour les éléments génériques
- Utilisez `light` pour les fonds clairs
- Utilisez `dark` pour les overlays

### 2. Hiérarchie visuelle
- Cartes principales: `SHADOWS.liquidGlass`
- Éléments secondaires: `SHADOWS.medium`
- Éléments subtils: `SHADOWS.small`

### 3. Accessibilité
- Contraste minimum respecté (WCAG AA)
- Tailles de touche minimum: 44x44 points
- Espacement suffisant entre éléments interactifs

## Migration depuis l'ancien design

### Remplacer les View standards
```tsx
// Avant
<View style={styles.card}>
  <Text>Contenu</Text>
</View>

// Après
<GlassView tint="neutral" liquidGlass={true} style={styles.card}>
  <Text>Contenu</Text>
</GlassView>
```

### Remplacer les couleurs de fond
```tsx
// Avant
backgroundColor: COLORS.white

// Après
// Utiliser GlassView au lieu d'un fond blanc
```

### Adapter les boutons
```tsx
// Avant
<Button title="Action" variant="primary" />

// Après
<Button title="Action" variant="male" liquidGlass={true} />
```

## Écrans mis à jour

Tous les écrans suivants ont été mis à jour avec le design liquid glass:

### Authentification
- ✅ Sign In
- ✅ Sign Up
- ✅ Verify
- ✅ Pro Register

### Tabs
- ✅ Home
- ✅ Map
- ✅ Shop
- ✅ Community
- ✅ Messages
- ✅ Cat Sitter
- ✅ Profile
- ✅ Challenges
- ✅ Lost & Found

### Autres
- ✅ Pet Details
- ✅ Product Details
- ✅ User Profile
- ✅ Booking
- ✅ Professional Dashboard

## Performance

### Optimisations
- Utilisation de `React.memo()` pour les composants lourds
- Dégradés pré-calculés
- Ombres optimisées par plateforme
- BlurView natif sur iOS/Android, CSS backdrop-filter sur web

### Web Compatibility
- Fallback CSS pour les effets de blur
- Dégradés CSS pour les navigateurs modernes
- Ombres CSS adaptées
