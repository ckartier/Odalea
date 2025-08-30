import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { COLORS } from '@/constants/colors';
import { usePremium } from '@/hooks/premium-store';

interface AdBannerProps {
  size?: 'banner' | 'largeBanner' | 'mediumRectangle';
  style?: any;
}

export default function AdBanner({ size = 'banner', style }: AdBannerProps) {
  const { isPremium, adConfig } = usePremium();

  // Don't show ads for premium users
  if (isPremium || !adConfig.showBannerAds) {
    return null;
  }

  // For web compatibility, show a placeholder
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.adPlaceholder, getAdSize(size), style]}>
        <Text style={styles.adPlaceholderText}>Ad Space</Text>
        <Text style={styles.adPlaceholderSubtext}>
          Ads are shown on mobile devices
        </Text>
      </View>
    );
  }

  // In a real app, you would use react-native-google-mobile-ads here
  // For now, we'll show a placeholder that looks like an ad
  return (
    <View style={[styles.adContainer, getAdSize(size), style]}>
      <View style={styles.adContent}>
        <Text style={styles.adLabel}>Publicité</Text>
        <Text style={styles.adTitle}>Découvrez nos produits pour animaux</Text>
        <Text style={styles.adDescription}>
          Nourriture, jouets et accessoires de qualité
        </Text>
        <View style={styles.adButton}>
          <Text style={styles.adButtonText}>En savoir plus</Text>
        </View>
      </View>
    </View>
  );
}

const getAdSize = (size: string) => {
  switch (size) {
    case 'banner':
      return { width: 320, height: 50 };
    case 'largeBanner':
      return { width: 320, height: 100 };
    case 'mediumRectangle':
      return { width: 300, height: 250 };
    default:
      return { width: 320, height: 50 };
  }
};

const styles = StyleSheet.create({
  adContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    overflow: 'hidden',
    alignSelf: 'center',
    marginVertical: 8,
  },
  adContent: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
  },
  adLabel: {
    fontSize: 10,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  adTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 2,
  },
  adDescription: {
    fontSize: 10,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 4,
  },
  adButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'center',
  },
  adButtonText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  adPlaceholder: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 8,
  },
  adPlaceholderText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  adPlaceholderSubtext: {
    fontSize: 10,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
});