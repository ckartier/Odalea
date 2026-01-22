import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Phone, ExternalLink } from 'lucide-react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { User } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  photo: {
    width: Math.min(64, SCREEN_WIDTH * 0.16),
    height: Math.min(64, SCREEN_WIDTH * 0.16),
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoEmoji: {
    fontSize: 28,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#111111',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  description: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#6B7280',
    marginBottom: 14,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
    minHeight: 44,
  },
  buttonPrimary: {
    backgroundColor: '#000000',
  },
  buttonPrimaryText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  buttonSecondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonSecondaryText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#111111',
  },
  cardCompact: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactPhoto: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactEmoji: {
    fontSize: 22,
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111111',
    marginBottom: 3,
  },
  compactBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  compactBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  compactDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  compactDistanceText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
});
