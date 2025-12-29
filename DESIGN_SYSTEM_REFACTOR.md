# ODALEA Design System - Refonte 2025

## Vue d'ensemble

Refonte complète du design d'ODALEA avec une approche moderne, blanche, lisible et intuitive.

## ✅ Tokens de design centralisés

### Couleurs (`constants/colors.ts`)

**Palette principale**
- `primary`: #7C3AED (violet) - Actions principales, états actifs
- `black`: #111111 - Texte principal
- `textSecondary`: #6B7280 - Texte secondaire
- `white`: #FFFFFF - Arrière-plans
- `lightGray`: #F3F4F6 - Surfaces secondaires
- `border`: #E5E7EB - Bordures

**Changements clés**
- Suppression des dégradés en arrière-plan
- Utilisation du violet uniquement pour états actifs
- Icônes noires par défaut (#111)
- Fond blanc uniforme (#FFFFFF)

### Spacing
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

### Ombres
- `small`: Légère (cards)
- `medium`: Moyenne (modales)
- `large`: Forte (FAB, éléments flottants)

## ✅ Composants créés

### 1. AppHeader (`components/AppHeader.tsx`)

**Utilisation**
```typescript
import AppHeader, { useAppHeaderHeight } from '@/components/AppHeader';

// Dans le layout
<AppHeader 
  showMenu={true}
  showNotifications={true}
  notificationCount={5}
  onMenuPress={handleMenu}
  onNotificationPress={handleNotifications}
/>

// Obtenir la hauteur pour le padding
const headerHeight = useAppHeaderHeight();
```

**Caractéristiques**
- Avatar utilisateur (gauche)
- Nom utilisateur + sous-titre (noms des animaux)
- Badges de notification avec compteur
- Icône menu (conditionnel)
- Hauteur: 72px + safe area top
- Fond blanc avec séparateur fin

### 2. SegmentedControl (`components/SegmentedControl.tsx`)

**Utilisation**
```typescript
import { SegmentedControl, SegmentOption } from '@/components/SegmentedControl';

type FilterType = 'all' | 'lost' | 'found';

const options: SegmentOption<FilterType>[] = [
  { key: 'all', label: 'Tout', count: 42 },
  { key: 'lost', label: 'Perdus', count: 5 },
  { key: 'found', label: 'Trouvés', count: 3, badge: '🏆' },
];

<SegmentedControl<FilterType>
  options={options}
  activeKey={activeFilter}
  onChange={setActiveFilter}
/>
```

**Caractéristiques**
- Segments avec bordure grise / fond violet actif
- Compteurs optionnels (pills)
- Badges emoji optionnels
- État désactivé supporté
- Scroll horizontal automatique

### 3. EmptyState (`components/EmptyState.tsx`)

**Utilisation**
```typescript
import EmptyState from '@/components/EmptyState';
import { Plus } from 'lucide-react-native';

<EmptyState
  icon={Plus}
  title="Aucune publication"
  message="Soyez le premier à publier !"
  actionLabel="Créer un post"
  onAction={handleCreate}
/>
```

**Caractéristiques**
- Icône lucide (48px)
- Titre + message
- Bouton d'action optionnel
- Fond blanc propre

### 4. PostCard (`components/PostCard.tsx`)

**Refactorisation**
- Suppression de GlassCard
- Fond blanc avec ombre légère
- Bordures 16px
- Icônes noires (heart, message, share)
- Bouton "⋯" pour actions
- Support types: normal, urgent (lost/found), challenge, pro

## ✅ Navigation (Tabs)

### Configuration (`app/(tabs)/_layout.tsx`)

**4 onglets**
1. **Carte** (Map) - icône Map
2. **Communauté** (Users) - icône Users  
3. **Messages** (MessageCircle) - icône MessageCircle
4. **Profil** (User) - icône User

**Onglets masqués**
- home, shop, cat-sitter, lost-found, challenges (accessibles via routes mais pas dans la tab bar)

**Changements**
- Utilisation de AppHeader au lieu de TopBar
- Couleur active: violet (#7C3AED)
- Couleur inactive: gris (#6B7280)
- Fond blanc, bordure top fine

## ✅ Écran Communauté

**Modifications**
- Suppression de GlassCard/AppBackground
- Fond blanc uniforme
- SegmentedControl pour filtres (Tout/Perdus/Trouvés/Défis/Pros)
- EmptyState pour états vides
- Carte premium (pros) avec fond violet
- FAB violet pour créer un post

## 📋 Guide d'implémentation

### Étape 1: Intégration AppHeader sur tous les écrans

**Écrans à mettre à jour**
- `app/(tabs)/map.tsx`
- `app/(tabs)/messages.tsx`
- `app/(tabs)/profile.tsx`

**Pattern**
```typescript
import AppHeader, { useAppHeaderHeight } from '@/components/AppHeader';

export default function Screen() {
  const headerHeight = useAppHeaderHeight();
  const router = useRouter();
  
  const handleMenu = () => router.push('/menu');
  const handleNotifications = () => router.push('/notifications');
  
  return (
    <View style={{ flex: 1, paddingTop: headerHeight }}>
      <AppHeader 
        showMenu={pathname === '/(tabs)/profile'}
        showNotifications={true}
        notificationCount={0}
        onMenuPress={handleMenu}
        onNotificationPress={handleNotifications}
      />
      {/* Contenu */}
    </View>
  );
}
```

### Étape 2: Remplacer les GlassCard

**Chercher**
```bash
grep -r "GlassCard" app/
```

**Remplacer par**
```typescript
// Avant
<GlassCard tint="neutral" style={styles.card}>
  <Text>Content</Text>
</GlassCard>

// Après
<View style={styles.card}>
  <Text>Content</Text>
</View>

// Styles
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: DIMENSIONS.SPACING.md,
    ...SHADOWS.small,
  },
});
```

### Étape 3: Utiliser EmptyState partout

**Écrans concernés**
- Liste de messages vide
- Liste d'animaux vide
- Recherche sans résultats
- Carte sans markers

**Pattern**
```typescript
if (items.length === 0) {
  return (
    <EmptyState
      icon={iconComponent}
      title="Titre clair"
      message="Message explicatif"
      actionLabel="Action CTA"
      onAction={handleAction}
    />
  );
}
```

### Étape 4: Menu Profil

**Exigence**
- Bouton menu visible uniquement sur l'onglet Profil
- Badge de notifications (demandes d'amis + notifs non lues)

**Implémentation**
```typescript
// Dans app/(tabs)/profile.tsx
import { useFriends } from '@/hooks/friends-store';

const { pendingRequests } = useFriends();
const notificationCount = pendingRequests.length;

<AppHeader 
  showMenu={true}
  showNotifications={true}
  notificationCount={notificationCount}
  onMenuPress={() => router.push('/menu')}
/>
```

### Étape 5: Harmoniser les couleurs

**Chercher et remplacer**
- Boutons: `backgroundColor: COLORS.primary` (violet)
- Texte principal: `color: COLORS.black` (#111)
- Texte secondaire: `color: COLORS.textSecondary` (#6B7280)
- Fonds: `backgroundColor: COLORS.white`
- Bordures: `borderColor: COLORS.border`

**Éviter**
- `COLORS.darkGray` → utiliser `COLORS.textSecondary`
- `COLORS.accent` → utiliser `COLORS.primary`
- Dégradés sur fond d'écran → fond blanc uniforme

## 🎨 Design Guidelines

### Cards
- Bordures: 16-20px
- Ombre: `SHADOWS.small`
- Fond: blanc
- Padding: 16px

### Boutons
- Hauteur min: 44px (touch target)
- Primaire: fond violet, texte blanc
- Secondaire: fond gris clair, texte noir
- Tertiaire: transparent, texte violet

### Icônes
- Taille: 24px (standards), 20px (petites), 48px (empty states)
- Couleur défaut: noir (#111)
- Couleur active: violet (#7C3AED)
- Stroke: 2 (lucide-react-native)

### Typography
- Titres: h4-h6, noir, 600-700
- Corps: body2, noir, 400
- Secondaire: caption, gris, 400
- Labels: labelSmall, noir, 500-600

### Spacing
- Entre sections: 24px
- Entre éléments: 16px
- Padding cards: 16px
- Marges écran: 16px

## 📱 Exemples d'écrans

### Communauté
```
┌─────────────────────────────────┐
│ [Avatar] Nom Utilisateur    [≡]│ ← AppHeader
│         Nana • Milo             │
├─────────────────────────────────┤
│ [Tout] [Perdus] [Trouvés]...   │ ← SegmentedControl
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ [👤] Nom   •  2h  • Paris   │ │
│ │ Contenu du post...          │ │
│ │ [Image]                     │ │
│ │ ♡ 12  💬 3  ↗               │ │
│ └─────────────────────────────┘ │ ← PostCard
│                                 │
│              [+]                │ ← FAB
└─────────────────────────────────┘
[Carte] [Communauté] [Messages] [Profil] ← Tabs
```

### État vide
```
┌─────────────────────────────────┐
│ [Avatar] Nom Utilisateur    [≡]│
├─────────────────────────────────┤
│                                 │
│            [ 📄 ]               │
│                                 │
│      Aucune publication         │
│                                 │
│   Soyez le premier à publier!   │
│                                 │
│      [Créer un post]            │
│                                 │
└─────────────────────────────────┘
```

## 🚀 Prochaines étapes

1. ✅ Tokens + composants de base
2. ✅ AppHeader + tabs
3. ✅ Écran Communauté
4. 🔲 Appliquer à Map, Messages, Profil
5. 🔲 Menu profil avec badges
6. 🔲 Harmoniser toutes les cartes
7. 🔲 Audit accessibilité (contrastes, VoiceOver)

## 🔍 Checklist avant déploiement

- [ ] Tous les écrans utilisent AppHeader
- [ ] Toutes les listes vides utilisent EmptyState
- [ ] Aucun GlassCard résiduel
- [ ] Aucun dégradé en fond d'écran
- [ ] Touch targets ≥ 44px
- [ ] Contrastes WCAG AA validés
- [ ] VoiceOver labels sur tous les boutons
- [ ] Badges de notification fonctionnels
- [ ] Menu visible uniquement sur Profil

## 📚 Fichiers modifiés

### Créés
- `components/AppHeader.tsx`
- `components/SegmentedControl.tsx`
- `components/EmptyState.tsx`

### Modifiés
- `constants/colors.ts` (palette + tokens)
- `components/PostCard.tsx` (design blanc)
- `app/(tabs)/_layout.tsx` (4 tabs + AppHeader)
- `app/(tabs)/community.tsx` (SegmentedControl + EmptyState)

### À modifier ensuite
- `app/(tabs)/map.tsx`
- `app/(tabs)/messages.tsx`
- `app/(tabs)/profile.tsx`
- `app/menu.tsx`
- Tous les écrans avec GlassCard
