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
import { Heart } from 'lucide-react-native';
import { Pet } from '@/types';
import { COLORS } from '@/constants/colors';

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
              <Heart size={60} color={COLORS.white} fill={COLORS.error} />
            </View>
          </View>

          <Text style={styles.title}>C&apos;est un match! 🎉</Text>
          <Text style={styles.subtitle}>
            Vous avez tous les deux aimé vos animaux!
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
                onClose();
                onSendMessage?.();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Envoyer un message</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    width: width - 48,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  heartContainer: {
    marginBottom: 20,
  },
  heartBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  petImageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  petImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: COLORS.secondary,
  },
  petInfo: {
    alignItems: 'center',
  },
  petName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 16,
    color: COLORS.gray,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  secondaryButton: {
    backgroundColor: COLORS.lightGray,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
});
