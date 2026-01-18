import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Heart, MessageCircle } from 'lucide-react-native';
import { Pet } from '@/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '@/theme/tokens';

const { width } = Dimensions.get('window');

interface MatchModalProps {
  visible: boolean;
  matchedPet: Pet | null;
  onClose: () => void;
  onSendMessage?: () => void;
}

export default function MatchModal({
  visible,
  matchedPet,
  onClose,
  onSendMessage,
}: MatchModalProps) {
  const [scaleAnim] = React.useState(() => new Animated.Value(0));
  const [fadeAnim] = React.useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible, scaleAnim, fadeAnim]);

  if (!matchedPet) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={80} style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.heartContainer}>
            <View style={styles.heartBackground}>
              <Heart size={60} color={COLORS.surface} fill={COLORS.primary} />
            </View>
          </View>

          <Text style={styles.title}>C&apos;est un match! 🎉</Text>
          <Text style={styles.subtitle}>
            Vous avez tous les deux liké ces animaux
          </Text>

          <View style={styles.petImageContainer}>
            <Image
              source={{ uri: matchedPet.mainPhoto }}
              style={styles.petImage}
              resizeMode="cover"
            />
            <View style={styles.petInfo}>
              <Text style={styles.petName}>{matchedPet.name}</Text>
              <Text style={styles.petDetails}>
                {matchedPet.breed} • {matchedPet.gender === 'male' ? 'Mâle' : 'Femelle'}
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => {
                onSendMessage?.();
              }}
              activeOpacity={0.8}
            >
              <MessageCircle size={20} color={COLORS.surface} />
              <Text style={styles.primaryButtonText}>Discuter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Continuer</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.overlay,
  },
  content: {
    width: width - SPACING.xxl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.floatingBar,
  },
  heartContainer: {
    marginBottom: SPACING.lg,
  },
  heartBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.title,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  petImageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  petImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surfaceSecondary,
  },
  petInfo: {
    alignItems: 'center',
  },
  petName: {
    ...TYPOGRAPHY.h2,
    fontSize: 24,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  petDetails: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  buttonContainer: {
    width: '100%',
    gap: SPACING.sm,
  },
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.button,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.card,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.surface,
  },
  secondaryButton: {
    backgroundColor: COLORS.surfaceSecondary,
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textPrimary,
  },
});
