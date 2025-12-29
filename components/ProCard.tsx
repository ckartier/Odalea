import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Phone, ExternalLink } from 'lucide-react-native';
import { COLORS, DIMENSIONS, SHADOWS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';
import { User } from '@/types';

interface ProCardProps {
  professional: User;
  distance?: string;
  compact?: boolean;
}

const PRO_TYPE_CONFIG = {
  vet: { label: 'Vétérinaire', color: '#10b981', emoji: '🩺' },
  shelter: { label: 'Refuge', color: '#f59e0b', emoji: '🏠' },
  breeder: { label: 'Éleveur', color: '#8b5cf6', emoji: '🐱' },
  boutique: { label: 'Boutique', color: '#ec4899', emoji: '🛍️' },
  educator: { label: 'Éducateur', color: '#3b82f6', emoji: '🎓' },
  catSitter: { label: 'Cat Sitter', color: '#6366f1', emoji: '🏡' },
};

export default function ProCard({ professional, distance, compact = false }: ProCardProps) {
  const router = useRouter();

  const proType = professional.isCatSitter 
    ? 'catSitter' 
    : (professional.professionalData?.activityType || 'boutique') as keyof typeof PRO_TYPE_CONFIG;
  
  const config = PRO_TYPE_CONFIG[proType] || PRO_TYPE_CONFIG.boutique;

  const handleViewProfile = () => {
    router.push(`/profile/${professional.id}`);
  };

  const handleContact = () => {
    router.push(`/messages/${professional.id}`);
  };

  const displayName = professional.professionalData?.companyName 
    || professional.name 
    || `${professional.firstName || ''} ${professional.lastName || ''}`.trim() 
    || 'Professionnel';

  const displayPhoto = professional.professionalData?.companyLogo || professional.photo;

  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.cardCompact} 
        onPress={handleViewProfile}
        activeOpacity={0.8}
      >
        <View style={styles.compactLeft}>
          {displayPhoto ? (
            <Image source={{ uri: displayPhoto }} style={styles.compactPhoto} />
          ) : (
            <View style={[styles.compactPhoto, { backgroundColor: `${config.color}20` }]}>
              <Text style={styles.compactEmoji}>{config.emoji}</Text>
            </View>
          )}
          <View style={styles.compactInfo}>
            <Text style={styles.compactName} numberOfLines={1}>{displayName}</Text>
            <View style={styles.compactBadge}>
              <Text style={[styles.compactBadgeText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          </View>
        </View>
        {distance && (
          <View style={styles.compactDistance}>
            <MapPin size={14} color={COLORS.darkGray} />
            <Text style={styles.compactDistanceText}>{distance}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {displayPhoto ? (
          <Image source={{ uri: displayPhoto }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, { backgroundColor: `${config.color}20` }]}>
            <Text style={styles.photoEmoji}>{config.emoji}</Text>
          </View>
        )}
        
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={2}>{displayName}</Text>
          <View style={[styles.badge, { backgroundColor: `${config.color}15` }]}>
            <Text style={[styles.badgeText, { color: config.color }]}>
              {config.emoji} {config.label}
            </Text>
          </View>
          
          {distance && (
            <View style={styles.location}>
              <MapPin size={14} color={COLORS.darkGray} />
              <Text style={styles.locationText}>{distance}</Text>
            </View>
          )}
        </View>
      </View>

      {professional.professionalData?.businessDescription && (
        <Text style={styles.description} numberOfLines={3}>
          {professional.professionalData.businessDescription}
        </Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary]} 
          onPress={handleContact}
          activeOpacity={0.8}
        >
          <Phone size={16} color={COLORS.black} />
          <Text style={styles.buttonSecondaryText}>Contacter</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.buttonPrimary]} 
          onPress={handleViewProfile}
          activeOpacity={0.8}
        >
          <ExternalLink size={16} color={COLORS.white} />
          <Text style={styles.buttonPrimaryText}>Voir profil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: DIMENSIONS.SPACING.md,
    marginHorizontal: DIMENSIONS.SPACING.md,
    marginBottom: DIMENSIONS.SPACING.sm,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  header: {
    flexDirection: 'row',
    marginBottom: DIMENSIONS.SPACING.sm,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: DIMENSIONS.SPACING.sm,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoEmoji: {
    fontSize: 32,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    ...TYPOGRAPHY.h6,
    color: COLORS.black,
    marginBottom: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.darkGray,
  },
  description: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.SPACING.md,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    minHeight: 44,
  },
  buttonPrimary: {
    backgroundColor: COLORS.black,
  },
  buttonPrimaryText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    fontSize: 14,
  },
  buttonSecondary: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  buttonSecondaryText: {
    ...TYPOGRAPHY.button,
    color: COLORS.black,
    fontSize: 14,
  },

  // Compact style
  cardCompact: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: DIMENSIONS.SPACING.sm,
    marginHorizontal: DIMENSIONS.SPACING.md,
    marginBottom: DIMENSIONS.SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactPhoto: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: DIMENSIONS.SPACING.sm,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactEmoji: {
    fontSize: 24,
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.black,
    fontWeight: '600',
    marginBottom: 4,
  },
  compactBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  compactBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  compactDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: DIMENSIONS.SPACING.xs,
  },
  compactDistanceText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.darkGray,
    fontSize: 12,
  },
});
