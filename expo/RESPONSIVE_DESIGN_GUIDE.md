# Responsive Design System Guide

This guide explains how to use the responsive design system implemented in this React Native app to ensure it works beautifully across all screen sizes.

## Overview

The responsive system automatically adapts to different screen sizes:
- **xs**: 320px (Small phones)
- **sm**: 375px (iPhone SE, iPhone 12 mini)
- **md**: 414px (iPhone 11, iPhone 12/13/14)
- **lg**: 428px (iPhone 12/13/14/15/16 Pro Max)
- **xl**: 768px (iPad mini, small tablets)
- **xxl**: 1024px (iPad, large tablets)
- **xxxl**: 1366px+ (iPad Pro, desktop)

## Core Components

### 1. Responsive Utilities (`constants/responsive.ts`)

```typescript
import { 
  scale, 
  moderateScale, 
  IS_TABLET, 
  IS_SMALL_DEVICE,
  RESPONSIVE_SPACING,
  RESPONSIVE_FONT_SIZES,
  RESPONSIVE_COMPONENT_SIZES 
} from '@/constants/colors';
```

#### Scaling Functions
- `scale(size)`: Scales based on screen width
- `moderateScale(size, factor)`: Moderate scaling with custom factor
- `verticalScale(size)`: Scales based on screen height

#### Device Detection
- `IS_SMALL_DEVICE`: true for xs/sm screens
- `IS_TABLET`: true for xl/xxl/xxxl screens
- `DEVICE_TYPE`: Current device category

### 2. ResponsiveContainer

Provides consistent padding and max-width across devices:

```tsx
import ResponsiveContainer from '@/components/ResponsiveContainer';

<ResponsiveContainer
  scrollable={true}
  padding="medium"
  maxWidth="content"
  centerContent={true}
>
  {/* Your content */}
</ResponsiveContainer>
```

### 3. ResponsiveCard

Adaptive card component with proper spacing:

```tsx
import ResponsiveCard from '@/components/ResponsiveCard';

<ResponsiveCard
  variant="elevated"
  padding="medium"
  maxWidth="content"
  centerOnTablet={true}
>
  {/* Card content */}
</ResponsiveCard>
```

### 4. ResponsiveGrid

Automatic grid layout that adapts column count:

```tsx
import ResponsiveGrid from '@/components/ResponsiveGrid';

<ResponsiveGrid columns="auto" spacing="medium">
  {items.map(item => (
    <ItemComponent key={item.id} item={item} />
  ))}
</ResponsiveGrid>
```

### 5. ResponsiveText

Typography that scales appropriately:

```tsx
import ResponsiveText from '@/components/ResponsiveText';

<ResponsiveText 
  variant="lg" 
  weight="semibold" 
  color={COLORS.black}
>
  Responsive Title
</ResponsiveText>
```

### 6. ResponsiveModal

Modals that adapt to screen size:

```tsx
import ResponsiveModal from '@/components/ResponsiveModal';

<ResponsiveModal
  isVisible={showModal}
  onClose={() => setShowModal(false)}
  size="medium"
  title="Modal Title"
>
  {/* Modal content */}
</ResponsiveModal>
```

## Updated Core Components

### Button Component
- Uses `moderateScale()` for padding and border radius
- Responsive font sizes via `DIMENSIONS.FONT_SIZES`
- Adaptive minimum height for touch targets

### Input Component
- Responsive height via `DIMENSIONS.COMPONENT_SIZES.INPUT_HEIGHT`
- Scaled padding and border radius
- Adaptive font sizes

### TopBar Component
- Tablet-optimized layout with centered content
- Responsive spacing and icon sizes
- Adaptive max-width for large screens

## Best Practices

### 1. Use Responsive Values
```typescript
// ❌ Fixed values
paddingHorizontal: 16,
fontSize: 18,

// ✅ Responsive values
paddingHorizontal: DIMENSIONS.SPACING.md,
fontSize: DIMENSIONS.FONT_SIZES.lg,
```

### 2. Scale Dimensions
```typescript
// ❌ Fixed dimensions
borderRadius: 12,
marginTop: 20,

// ✅ Scaled dimensions
borderRadius: moderateScale(12),
marginTop: scale(20),
```

### 3. Conditional Layouts
```typescript
// Tablet-specific layouts
const styles = StyleSheet.create({
  container: {
    flexDirection: IS_TABLET ? 'row' : 'column',
    maxWidth: IS_TABLET ? 800 : '100%',
    alignSelf: IS_TABLET ? 'center' : 'stretch',
  },
});
```

### 4. Responsive Spacing
```typescript
// Use responsive spacing system
marginHorizontal: RESPONSIVE_LAYOUT.containerPadding,
paddingVertical: DIMENSIONS.SPACING.md,
```

### 5. Content Max Width
```typescript
// Limit content width on large screens
maxWidth: IS_TABLET ? RESPONSIVE_LAYOUT.contentMaxWidth : '100%',
```

## Layout Patterns

### 1. Feed/List Layout
```tsx
<ResponsiveContainer scrollable>
  <View style={styles.feed}>
    {items.map(item => (
      <ResponsiveCard key={item.id} maxWidth={600}>
        {/* Item content */}
      </ResponsiveCard>
    ))}
  </View>
</ResponsiveContainer>

const styles = StyleSheet.create({
  feed: {
    maxWidth: IS_TABLET ? RESPONSIVE_LAYOUT.contentMaxWidth : '100%',
    alignSelf: 'center',
    width: '100%',
  },
});
```

### 2. Grid Layout
```tsx
<ResponsiveGrid columns="auto">
  {products.map(product => (
    <ProductCard key={product.id} product={product} />
  ))}
</ResponsiveGrid>
```

### 3. Form Layout
```tsx
<ResponsiveContainer padding="large">
  <View style={styles.form}>
    <Input label="Name" />
    <Input label="Email" />
    <Button title="Submit" />
  </View>
</ResponsiveContainer>

const styles = StyleSheet.create({
  form: {
    maxWidth: IS_TABLET ? 400 : '100%',
    alignSelf: 'center',
  },
});
```

## Testing Responsive Design

### 1. Device Testing
Test on various screen sizes:
- iPhone SE (375x667)
- iPhone 12 (390x844)
- iPhone 12 Pro Max (428x926)
- iPad (768x1024)
- iPad Pro (1024x1366)

### 2. Web Testing
Use browser dev tools to simulate different screen sizes and test responsive behavior.

### 3. Orientation Testing
Ensure layouts work in both portrait and landscape orientations.

## Migration Guide

To update existing components:

1. **Replace fixed dimensions**:
   ```typescript
   // Before
   padding: 16,
   fontSize: 18,
   
   // After
   padding: DIMENSIONS.SPACING.md,
   fontSize: DIMENSIONS.FONT_SIZES.lg,
   ```

2. **Add responsive containers**:
   ```tsx
   // Before
   <View style={styles.container}>
   
   // After
   <ResponsiveContainer>
   ```

3. **Update StyleSheet**:
   ```typescript
   // Before
   const styles = StyleSheet.create({
     card: {
       margin: 16,
       borderRadius: 8,
     },
   });
   
   // After
   const styles = StyleSheet.create({
     card: {
       margin: RESPONSIVE_LAYOUT.containerPadding,
       borderRadius: moderateScale(8),
     },
   });
   ```

## Performance Considerations

- Responsive calculations are cached and only recalculated on dimension changes
- Use `React.memo()` for components that don't need frequent re-renders
- Avoid inline style calculations in render methods

## Accessibility

The responsive system maintains accessibility by:
- Ensuring minimum touch target sizes (44pt on iOS, 48dp on Android)
- Scaling text appropriately for readability
- Maintaining proper contrast ratios across all screen sizes
- Supporting system font size preferences

This responsive design system ensures your app looks and works great on all devices while maintaining consistent user experience and accessibility standards.