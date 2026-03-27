import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { X } from 'lucide-react-native';
import { ReportReason, ReportTargetType } from '@/types';
import { ModerationService } from '@/services/moderation';
import { useFirebaseUser } from '@/hooks/firebase-user-store';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetAuthorId?: string;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: 'spam', label: 'Spam', description: 'Contenu promotionnel non sollicité' },
  { value: 'harassment', label: 'Harcèlement', description: 'Comportement abusif ou intimidation' },
  { value: 'hate_speech', label: 'Discours haineux', description: 'Contenu discriminatoire ou offensant' },
  { value: 'violence', label: 'Violence', description: 'Contenu violent ou menaçant' },
  { value: 'sexual_content', label: 'Contenu sexuel', description: 'Contenu sexuel inapproprié' },
  { value: 'self_harm', label: 'Auto-mutilation', description: 'Promotion de comportements dangereux' },
  { value: 'child_safety', label: 'Sécurité des enfants', description: 'Exploitation ou mise en danger' },
  { value: 'false_info', label: 'Fausses informations', description: 'Désinformation ou canular' },
  { value: 'other', label: 'Autre', description: 'Autre problème' }
];

export function ReportModal({ visible, onClose, targetType, targetId, targetAuthorId }: ReportModalProps) {
  const { user } = useFirebaseUser();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason || !user) return;

    setIsSubmitting(true);
    try {
      await ModerationService.createReport(
        user.id,
        user.name,
        targetType,
        targetId,
        selectedReason,
        details.trim() || undefined
      );

      alert('Signalement envoyé. Notre équipe va le vérifier rapidement.');
      onClose();
      setSelectedReason(null);
      setDetails('');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Erreur lors de l\'envoi du signalement. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTargetLabel = () => {
    switch (targetType) {
      case 'post':
        return 'cette publication';
      case 'comment':
        return 'ce commentaire';
      case 'user':
        return 'cet utilisateur';
      default:
        return 'ce contenu';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Signaler {getTargetLabel()}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>
              Pourquoi signalez-vous ce contenu ?
            </Text>

            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                style={[
                  styles.reasonButton,
                  selectedReason === reason.value && styles.reasonButtonSelected
                ]}
                onPress={() => setSelectedReason(reason.value)}
              >
                <View>
                  <Text style={[
                    styles.reasonLabel,
                    selectedReason === reason.value && styles.reasonLabelSelected
                  ]}>
                    {reason.label}
                  </Text>
                  <Text style={styles.reasonDescription}>{reason.description}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <Text style={styles.detailsLabel}>
              Détails supplémentaires (optionnel)
            </Text>
            <TextInput
              style={styles.detailsInput}
              placeholder="Décrivez le problème..."
              multiline
              numberOfLines={4}
              value={details}
              onChangeText={setDetails}
              textAlignVertical="top"
            />

            <Text style={styles.disclaimer}>
              Les signalements sont anonymes. Notre équipe examinera ce contenu dans les 24h.
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedReason || isSubmitting) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!selectedReason || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Envoyer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000'
  },
  closeButton: {
    padding: 4
  },
  content: {
    padding: 20
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16
  },
  reasonButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  reasonButtonSelected: {
    backgroundColor: '#fff',
    borderColor: '#FF6B6B'
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4
  },
  reasonLabelSelected: {
    color: '#FF6B6B'
  },
  reasonDescription: {
    fontSize: 14,
    color: '#666'
  },
  detailsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8
  },
  detailsInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    color: '#000'
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    marginTop: 16,
    fontStyle: 'italic'
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666'
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    alignItems: 'center'
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc'
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  }
});
