import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react-native';
import { PostFlags } from '@/types';

interface ContentWarningProps {
  flags?: PostFlags;
  mediaUri?: string;
  children?: React.ReactNode;
  type?: 'blur' | 'cover';
}

export function ContentWarning({ flags, mediaUri, children, type = 'blur' }: ContentWarningProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  if (!flags || (!flags.nsfw && !flags.violence && !flags.childRisk)) {
    return <>{children}</>;
  }

  const getWarningText = (): string => {
    if (flags.childRisk) {
      return 'Contenu potentiellement sensible';
    }
    if (flags.violence) {
      return 'Contenu potentiellement violent';
    }
    if (flags.nsfw) {
      return 'Contenu sensible';
    }
    return 'Contenu sensible';
  };

  const getWarningDescription = (): string => {
    if (flags.childRisk) {
      return 'Ce contenu a été signalé comme potentiellement inapproprié';
    }
    if (flags.violence) {
      return 'Ce contenu peut contenir des images de violence';
    }
    if (flags.nsfw) {
      return 'Ce contenu peut ne pas convenir à tous les publics';
    }
    return 'Ce contenu a été marqué comme sensible par notre système de modération';
  };

  if (isRevealed) {
    return (
      <View style={styles.revealedContainer}>
        {children}
        <TouchableOpacity
          style={styles.hideButton}
          onPress={() => setIsRevealed(false)}
        >
          <EyeOff size={16} color="#fff" />
          <Text style={styles.hideButtonText}>Masquer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (type === 'cover') {
    return (
      <View style={styles.coverContainer}>
        <AlertTriangle size={48} color="#FF6B6B" />
        <Text style={styles.warningTitle}>{getWarningText()}</Text>
        <Text style={styles.warningDescription}>{getWarningDescription()}</Text>
        <TouchableOpacity
          style={styles.revealButton}
          onPress={() => setIsRevealed(true)}
        >
          <Eye size={16} color="#fff" />
          <Text style={styles.revealButtonText}>Voir quand même</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.blurContainer}>
      {mediaUri && (
        <Image
          source={{ uri: mediaUri }}
          style={styles.blurredImage}
          blurRadius={20}
        />
      )}
      {children && <View style={styles.blurredContent}>{children}</View>}
      <View style={styles.blurOverlay}>
        <AlertTriangle size={32} color="#fff" />
        <Text style={styles.blurWarningText}>{getWarningText()}</Text>
        <TouchableOpacity
          style={styles.blurRevealButton}
          onPress={() => setIsRevealed(true)}
        >
          <Eye size={16} color="#000" />
          <Text style={styles.blurRevealButtonText}>Afficher</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  revealedContainer: {
    position: 'relative'
  },
  hideButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4
  },
  hideButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  coverContainer: {
    backgroundColor: '#f8f8f8',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
    textAlign: 'center'
  },
  warningDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 280
  },
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
    gap: 8
  },
  revealButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  blurContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12
  },
  blurredImage: {
    width: '100%',
    aspectRatio: 1,
    opacity: 0.3
  },
  blurredContent: {
    opacity: 0.1
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  blurWarningText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  blurRevealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    gap: 6
  },
  blurRevealButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600'
  }
});
