/**
 * OdaleaMedia - Composant unifié pour l'affichage des médias
 * 
 * Features:
 * - Placeholder de chargement élégant
 * - Gestion des erreurs avec fallback
 * - Support images, videos (poster)
 * - Cache optimisé via expo-image
 * - Skeleton loading animation
 */

import React, { useState, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { ImageOff, User, Camera } from 'lucide-react-native';

export type MediaType = 'image' | 'video' | 'avatar' | 'pet' | 'post' | 'thumbnail';

export interface OdaleaMediaProps {
  uri?: string | null;
  type?: MediaType;
  width?: number | string;
  height?: number | string;
  style?: any;
  borderRadius?: number;
  resizeMode?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: 'skeleton' | 'blur' | 'none';
  fallbackIcon?: 'image' | 'user' | 'camera' | 'none';
  onPress?: () => void;
  onLoad?: () => void;
  onError?: (error: any) => void;
  testID?: string;
  priority?: 'low' | 'normal' | 'high';
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
}

const PLACEHOLDER_COLORS = {
  light: '#F3F4F6',
  dark: '#374151',
  accent: '#E5E7EB',
};



function OdaleaMediaComponent({
  uri,
  type = 'image',
  width = '100%',
  height = 200,
  style,
  borderRadius = 8,
  resizeMode = 'cover',
  placeholder = 'skeleton',
  fallbackIcon = 'image',
  onPress,
  onLoad,
  onError,
  testID,
  priority = 'normal',
  cachePolicy = 'memory-disk',
}: OdaleaMediaProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(0));

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    onLoad?.();
  }, [fadeAnim, onLoad]);

  const handleError = useCallback((error: any) => {
    console.log('[OdaleaMedia] ❌ Error loading image:', uri?.substring(0, 50));
    setIsLoading(false);
    setHasError(true);
    onError?.(error);
  }, [uri, onError]);

  const getValidUri = useCallback(() => {
    if (!uri || uri.trim() === '') {
      return null;
    }
    
    if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('file://') || uri.startsWith('data:')) {
      return uri;
    }
    
    return null;
  }, [uri]);

  const validUri = getValidUri();
  const showFallback = !validUri || hasError;

  const renderPlaceholder = () => {
    if (placeholder === 'none') return null;

    return (
      <View
        style={[
          styles.placeholder,
          {
            width: typeof width === 'number' ? width : '100%',
            height: typeof height === 'number' ? height : 200,
            borderRadius,
          },
        ]}
      >
        {isLoading && !showFallback && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#9CA3AF" />
          </View>
        )}
      </View>
    );
  };

  const renderFallback = () => {
    const iconSize = Math.min(
      typeof width === 'number' ? width * 0.3 : 40,
      typeof height === 'number' ? height * 0.3 : 40,
      40
    );

    const IconComponent = fallbackIcon === 'user' ? User : fallbackIcon === 'camera' ? Camera : ImageOff;

    return (
      <View
        style={[
          styles.fallbackContainer,
          {
            width: typeof width === 'number' ? width : '100%',
            height: typeof height === 'number' ? height : 200,
            borderRadius,
          },
        ]}
      >
        {fallbackIcon !== 'none' && (
          <IconComponent size={iconSize} color="#9CA3AF" strokeWidth={1.5} />
        )}
      </View>
    );
  };

  const containerStyle = [
    styles.container,
    {
      width,
      height,
      borderRadius,
    },
    style,
  ];

  const content = (
    <View style={containerStyle} testID={testID}>
      {showFallback ? (
        renderFallback()
      ) : (
        <>
          {isLoading && renderPlaceholder()}
          <Animated.View
            style={[
              styles.imageContainer,
              {
                opacity: fadeAnim,
                borderRadius,
              },
            ]}
          >
            <Image
              source={{ uri: validUri! }}
              style={[
                styles.image,
                {
                  width: '100%',
                  height: '100%',
                  borderRadius,
                },
              ]}
              contentFit={resizeMode}
              transition={200}
              cachePolicy={cachePolicy}
              priority={priority}
              onLoad={handleLoad}
              onError={handleError}
              placeholder={placeholder === 'blur' ? { blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' } : undefined}
            />
          </Animated.View>
        </>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={containerStyle}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

export const OdaleaMedia = memo(OdaleaMediaComponent);

export const OdaleaAvatar = memo(function OdaleaAvatar({
  uri,
  size = 48,
  ...props
}: Omit<OdaleaMediaProps, 'width' | 'height' | 'type'> & { size?: number }) {
  return (
    <OdaleaMedia
      uri={uri}
      type="avatar"
      width={size}
      height={size}
      borderRadius={size / 2}
      fallbackIcon="user"
      placeholder="skeleton"
      {...props}
    />
  );
});

export const OdaleaPetPhoto = memo(function OdaleaPetPhoto({
  uri,
  size = 80,
  ...props
}: Omit<OdaleaMediaProps, 'width' | 'height' | 'type'> & { size?: number }) {
  return (
    <OdaleaMedia
      uri={uri}
      type="pet"
      width={size}
      height={size}
      borderRadius={12}
      fallbackIcon="camera"
      placeholder="skeleton"
      {...props}
    />
  );
});

export const OdaleaPostImage = memo(function OdaleaPostImage({
  uri,
  aspectRatio = 4 / 3,
  ...props
}: Omit<OdaleaMediaProps, 'type'> & { aspectRatio?: number }) {
  return (
    <OdaleaMedia
      uri={uri}
      type="post"
      width="100%"
      height={undefined}
      style={{ aspectRatio }}
      borderRadius={12}
      fallbackIcon="image"
      placeholder="blur"
      {...props}
    />
  );
});

export const OdaleaThumbnail = memo(function OdaleaThumbnail({
  uri,
  size = 60,
  ...props
}: Omit<OdaleaMediaProps, 'width' | 'height' | 'type'> & { size?: number }) {
  return (
    <OdaleaMedia
      uri={uri}
      type="thumbnail"
      width={size}
      height={size}
      borderRadius={8}
      fallbackIcon="image"
      placeholder="skeleton"
      priority="low"
      {...props}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: PLACEHOLDER_COLORS.light,
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    backgroundColor: 'transparent',
  },
  placeholder: {
    backgroundColor: PLACEHOLDER_COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  fallbackContainer: {
    backgroundColor: PLACEHOLDER_COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OdaleaMedia;
