import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { useLostFound } from '@/hooks/lost-found-store';
import { useTheme } from '@/hooks/theme-store';
import { useAuth } from '@/hooks/auth-store';
import { 
  MapPin, 
  Clock, 
  Heart, 
  Share, 
  MessageCircle, 
  Camera,
  Send,
  Eye,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';
import Button from '@/components/Button';

const { width } = Dimensions.get('window');

export default function LostPetDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const router = useRouter();
  const { lostPets, respondToReport, updateReportStatus, isResponding } = useLostFound();
  const { getThemedColor } = useTheme();
  const { user } = useAuth();

  const [responseMessage, setResponseMessage] = useState('');
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [selectedResponseType, setSelectedResponseType] = useState<'sighting' | 'found' | 'help_offer'>('sighting');

  const pet = lostPets.find(p => p.id === id);

  console.log('[LostPetDetails] id:', id);
  console.log('[LostPetDetails] lostPets count:', lostPets.length);
  console.log('[LostPetDetails] found pet:', pet?.petName);

  if (!pet) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Stack.Screen options={{ title: 'Animal perdu' }} />
        <StatusBar style="dark" />
        <View style={styles.emptyContent}>
          <View style={styles.emptyIconContainer}>
            <AlertTriangle size={48} color={COLORS.warning} />
          </View>
          <Text style={styles.emptyTitle}>Animal non trouvé</Text>
          <Text style={styles.emptyDescription}>
            Cette annonce n'existe plus ou a été supprimée.
          </Text>
          <Button
            title="Retour"
            onPress={() => router.back()}
            variant="primary"
            style={styles.backButton}
          />
        </View>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lost':
        return COLORS.lost;
      case 'found':
        return COLORS.found;
      case 'reunited':
        return COLORS.success;
      default:
        return COLORS.darkGray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'lost':
        return 'Perdu';
      case 'found':
        return 'Trouvé';
      case 'reunited':
        return 'Retrouvé';
      default:
        return status;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a moins d\'1h';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  };

  const handleShare = () => {
    Alert.alert(
      'Partager l\'annonce',
      'Cette fonctionnalité permettra de partager l\'annonce sur les réseaux sociaux et par message.',
      [{ text: 'OK' }]
    );
  };

  const handleContactOwner = () => {
    if (pet.contactInfo.userId === user?.id) {
      Alert.alert('Information', 'C\'est votre propre annonce.');
      return;
    }
    
    // In a real app, this would open a chat with the owner
    router.push(`/messages/new?userId=${pet.contactInfo.userId}`);
  };

  const handleSubmitResponse = async () => {
    if (!responseMessage.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un message');
      return;
    }

    try {
      await respondToReport(pet.id, {
        userId: user?.id || '',
        userName: user?.name || '',
        userPhoto: user?.photo,
        message: responseMessage,
        type: selectedResponseType,
      });

      setResponseMessage('');
      setShowResponseForm(false);
      
      Alert.alert(
        'Réponse envoyée',
        'Votre réponse a été envoyée au propriétaire. Il pourra vous contacter via la messagerie.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer la réponse. Veuillez réessayer.');
    }
  };

  const handleMarkAsFound = () => {
    Alert.alert(
      'Marquer comme retrouvé',
      'Êtes-vous sûr que cet animal a été retrouvé ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => updateReportStatus(pet.id, 'reunited'),
        },
      ]
    );
  };

  const isOwner = pet.contactInfo.userId === user?.id;

  return (
    <View style={[styles.container, { backgroundColor: getThemedColor('background') }]}>
      <Stack.Screen 
        options={{ 
          title: pet.petName,
          headerStyle: { backgroundColor: getThemedColor('background') },
          headerTintColor: COLORS.white,
          headerRight: () => (
            <Pressable onPress={handleShare} style={styles.headerButton}>
              <Share size={24} color={COLORS.white} />
            </Pressable>
          ),
        }} 
      />
      <StatusBar style="light" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo Gallery */}
        <View style={styles.photoGallery}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {pet.photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(pet.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(pet.status)}</Text>
                </View>
                {pet.reward && (
                  <View style={styles.rewardBadge}>
                    <Heart size={12} color={COLORS.white} />
                    <Text style={styles.rewardText}>{pet.reward}€</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
          
          {pet.photos.length > 1 && (
            <View style={styles.photoIndicators}>
              {pet.photos.map((_, index) => (
                <View key={index} style={styles.photoIndicator} />
              ))}
            </View>
          )}
        </View>

        {/* Pet Information */}
        <View style={styles.infoSection}>
          <Text style={styles.petName}>{pet.petName}</Text>
          <Text style={styles.petSpecies}>{pet.species} {pet.breed && `• ${pet.breed}`}</Text>
          
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <MapPin size={16} color={COLORS.darkGray} />
              <Text style={styles.metaText}>{pet.lastSeenLocation.address}</Text>
            </View>
            
            <View style={styles.metaItem}>
              <Clock size={16} color={COLORS.darkGray} />
              <Text style={styles.metaText}>
                Vu le {new Date(pet.lastSeenDate).toLocaleDateString('fr-FR')} • {formatTimeAgo(pet.createdAt)}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>{pet.description}</Text>

          {/* Owner Info */}
          <View style={styles.ownerSection}>
            <Text style={styles.sectionTitle}>Propriétaire</Text>
            <View style={styles.ownerInfo}>
              <Image
                source={{ 
                  uri: pet.contactInfo.userPhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100' 
                }}
                style={styles.ownerPhoto}
              />
              <View style={styles.ownerDetails}>
                <Text style={styles.ownerName}>{pet.contactInfo.userName}</Text>
                <Text style={styles.ownerMeta}>Membre depuis 2023</Text>
              </View>
            </View>
          </View>

          {/* Responses */}
          {pet.responses.length > 0 && (
            <View style={styles.responsesSection}>
              <Text style={styles.sectionTitle}>
                Réponses ({pet.responses.length})
              </Text>
              
              {pet.responses.slice(0, 3).map((response) => (
                <View key={response.id} style={styles.responseItem}>
                  <View style={styles.responseHeader}>
                    <Image
                      source={{ 
                        uri: response.userPhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100' 
                      }}
                      style={styles.responseUserPhoto}
                    />
                    <View style={styles.responseUserInfo}>
                      <Text style={styles.responseUserName}>{response.userName}</Text>
                      <Text style={styles.responseTime}>{formatTimeAgo(response.createdAt)}</Text>
                    </View>
                    <View style={[styles.responseTypeBadge, { 
                      backgroundColor: response.type === 'found' ? COLORS.success : 
                                     response.type === 'sighting' ? COLORS.warning : COLORS.info 
                    }]}>
                      <Text style={styles.responseTypeText}>
                        {response.type === 'found' ? 'Trouvé' : 
                         response.type === 'sighting' ? 'Vu' : 'Aide'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.responseMessage}>{response.message}</Text>
                </View>
              ))}
              
              {pet.responses.length > 3 && (
                <Pressable style={styles.viewAllResponses}>
                  <Text style={styles.viewAllResponsesText}>
                    Voir toutes les réponses ({pet.responses.length})
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {isOwner ? (
          <View style={styles.ownerActions}>
            {pet.status === 'lost' && (
              <Button
                title="Marquer comme retrouvé"
                onPress={handleMarkAsFound}
                variant="primary"
                style={styles.actionButton}
                icon={<CheckCircle size={20} color={COLORS.white} />}
              />
            )}
          </View>
        ) : (
          <View style={styles.userActions}>
            <Button
              title="J'ai des informations"
              onPress={() => setShowResponseForm(true)}
              variant="primary"
              style={styles.actionButton}
              icon={<Eye size={20} color={COLORS.white} />}
            />
            
            <Button
              title="Contacter"
              onPress={handleContactOwner}
              variant="outline"
              style={styles.contactButton}
              icon={<MessageCircle size={20} color={getThemedColor('primary')} />}
            />
          </View>
        )}
      </View>

      {/* Response Form Modal */}
      {showResponseForm && (
        <View style={styles.responseModal}>
          <View style={styles.responseModalContent}>
            <Text style={styles.responseModalTitle}>Signaler une information</Text>
            
            <View style={styles.responseTypeSelector}>
              {[
                { key: 'sighting', label: 'Je l\'ai vu', icon: Eye },
                { key: 'found', label: 'Je l\'ai trouvé', icon: CheckCircle },
                { key: 'help_offer', label: 'Je peux aider', icon: Heart },
              ].map((type) => (
                <Pressable
                  key={type.key}
                  style={[
                    styles.responseTypeButton,
                    selectedResponseType === type.key && styles.selectedResponseType
                  ]}
                  onPress={() => setSelectedResponseType(type.key as any)}
                >
                  <type.icon size={20} color={
                    selectedResponseType === type.key ? COLORS.white : COLORS.darkGray
                  } />
                  <Text style={[
                    styles.responseTypeButtonText,
                    selectedResponseType === type.key && styles.selectedResponseTypeText
                  ]}>
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.responseInput}
              placeholder="Décrivez ce que vous avez vu ou comment vous pouvez aider..."
              value={responseMessage}
              onChangeText={setResponseMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.responseModalActions}>
              <Button
                title="Annuler"
                onPress={() => {
                  setShowResponseForm(false);
                  setResponseMessage('');
                }}
                variant="outline"
                style={styles.responseModalButton}
              />
              
              <Button
                title="Envoyer"
                onPress={handleSubmitResponse}
                variant="primary"
                style={styles.responseModalButton}
                loading={isResponding}
                icon={<Send size={16} color={COLORS.white} />}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    backgroundColor: COLORS.white,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  emptyDescription: {
    fontSize: 15,
    color: COLORS.darkGray,
    textAlign: 'center' as const,
    marginBottom: 24,
    lineHeight: 22,
  },
  backButton: {
    minWidth: 160,
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  photoGallery: {
    height: 300,
    position: 'relative',
  },
  photoContainer: {
    width,
    height: 300,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  rewardBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: COLORS.emergency,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  photoIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    opacity: 0.7,
  },
  infoSection: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  petName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  petSpecies: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  metaInfo: {
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.darkGray,
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: COLORS.black,
    lineHeight: 24,
    marginBottom: 24,
  },
  ownerSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 12,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ownerPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  ownerMeta: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  responsesSection: {
    marginBottom: 24,
  },
  responseItem: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  responseUserPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  responseUserInfo: {
    flex: 1,
  },
  responseUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  responseTime: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  responseTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  responseTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  responseMessage: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
  },
  viewAllResponses: {
    alignItems: 'center',
    padding: 12,
  },
  viewAllResponsesText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  actionButtons: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.mediumGray,
  },
  ownerActions: {
    gap: 12,
  },
  userActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  contactButton: {
    flex: 1,
  },
  responseModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  responseModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  responseModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  responseTypeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  responseTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
    gap: 4,
  },
  selectedResponseType: {
    backgroundColor: COLORS.primary,
  },
  responseTypeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  selectedResponseTypeText: {
    color: COLORS.white,
  },
  responseInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.black,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  responseModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  responseModalButton: {
    flex: 1,
  },
});