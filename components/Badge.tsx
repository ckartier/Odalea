import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import GlassView from '@/components/GlassView'; // wrapper blur (iOS/Android) + backdrop-filter (Web)
import { COLORS } from '@/constants/colors';
import { Badge as BadgeType } from '@/types';

interface BadgeProps {
  badge: BadgeType;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  showProgress?: boolean;
  progress?: { current: number; total: number };
}

const Badge: React.FC<BadgeProps> = ({
  badge,
  size = 'medium',
  style,
  showProgress = false,
  progress,
}) => {
  const dims = useMemo(() => {
    switch (size) {
      case 'small':
        return { box: 60, icon: 30, font: 11, ring: 6 };
      case 'large':
        return { box: 120, icon: 64, font: 14, ring: 8 };
      default:
        return { box: 80, icon: 40, font: 12, ring: 7 };
    }
  }, [size]);

  const locked = !badge.unlocked;
  const progressText =
    showProgress && progress?.total
      ? `${Math.min(progress.current ?? 0, progress.total)}/${progress.total}`
      : undefined;

  return (
    <View
      style={[styles.root, { width: dims.box, opacity: locked ? 0.6 : 1 }, style]}
      accessibilityLabel={`${badge.name}${locked ? ' (verrouillé)' : ''}`}
    >
      {/* Anneau dégradé (halo) */}
      <LinearGradient
        colors={['#a3e5fa', '#f7b6d6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.ring,
          {
            width: dims.box,
            height: dims.box,
            borderRadius: dims.box / 2,
            padding: dims.ring,
          },
        ]}
      >
        {/* Pastille verre poli */}
        <GlassView
          intensity={28}
          tint="light"
          style={[
            styles.glass,
            {
              borderRadius: (dims.box - dims.ring * 2) / 2,
              borderColor: 'rgba(255,255,255,0.55)',
            },
          ]}
        >
          {/* Icône du badge */}
          <Image
            source={{ uri: badge.imageUrl }}
            style={{ width: dims.icon, height: dims.icon, borderRadius: 999 }}
            contentFit="contain"
            transition={150}
          />

          {/* État verrouillé */}
          {locked && (
            <View style={styles.lockBadge}>
              <Text style={styles.lockText}>🔒</Text>
            </View>
          )}
        </GlassView>
      </LinearGradient>

      {/* Nom + progression */}
      {size !== 'small' && (
        <View style={styles.meta}>
          <Text style={[styles.name, { fontSize: dims.font }]} numberOfLines={1}>
            {badge.name}
          </Text>
          {!!progressText && (
            <Text style={styles.progress} numberOfLines={1}>
              {progressText}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { alignItems: 'center' },
  ring: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  glass: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderWidth: 1,
    padding: 8,
  },
  lockBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  lockText: { fontSize: 12 },
  meta: { marginTop: 6, alignItems: 'center' },
  name: { textAlign: 'center', color: COLORS.black, fontWeight: '700' as const },
  progress: { color: 'rgba(0,0,0,0.6)', fontSize: 11, marginTop: 2 },
});

export default Badge;
