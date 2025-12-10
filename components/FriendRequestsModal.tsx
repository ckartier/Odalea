import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { COLORS, SHADOWS } from '@/constants/colors';
import { User, FriendRequest } from '@/types';
import { X, Check, XCircle } from 'lucide-react-native';
import { useFriends } from '@/hooks/friends-store';
import { databaseService } from '@/services/database';

interface FriendRequestItem extends FriendRequest {
  senderInfo?: User;
}

interface FriendRequestsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FriendRequestsModal({ visible, onClose }: FriendRequestsModalProps) {
  const { pendingRequests, acceptFriendRequest, rejectFriendRequest, isRespondingToRequest } = useFriends();
  const [requestsWithInfo, setRequestsWithInfo] = React.useState<FriendRequestItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const loadRequestsInfo = async () => {
      if (!pendingRequests || pendingRequests.length === 0) {
        setRequestsWithInfo([]);
        return;
      }

      setLoading(true);
      try {
        const requestsData = await Promise.all(
          pendingRequests.map(async (request) => {
            try {
              const senderInfo = await databaseService.user.getUser(request.senderId);
              return { ...request, senderInfo: senderInfo || undefined };
            } catch (error) {
              console.error('Error loading sender info:', error);
              return { ...request, senderInfo: undefined };
            }
          })
        );
        setRequestsWithInfo(requestsData);
      } catch (error) {
        console.error('Error loading requests info:', error);
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      loadRequestsInfo();
    }
  }, [pendingRequests, visible]);

  const handleAccept = async (requestId: string, senderId: string, senderName: string) => {
    try {
      await acceptFriendRequest(requestId, senderId);
      Alert.alert('Demande acceptée', `Vous êtes maintenant ami avec @${senderName}`);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Erreur', 'Impossible d’accepter la demande d’ami');
    }
  };

  const handleReject = async (requestId: string, senderId: string, senderName: string) => {
    Alert.alert(
      'Refuser la demande',
      `Êtes-vous sûr de vouloir refuser la demande d'ami de @${senderName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectFriendRequest(requestId, senderId);
            } catch (error) {
              console.error('Error rejecting friend request:', error);
              Alert.alert('Erreur', 'Impossible de refuser la demande d’ami');
            }
          },
        },
      ]
    );
  };

  const renderRequest = ({ item }: { item: FriendRequestItem }) => {
    const senderName = item.senderInfo?.pseudo || item.senderInfo?.name || 'Utilisateur inconnu';
    const senderPhoto = item.senderInfo?.photo;

    return (
      <View style={[styles.requestItem, SHADOWS.small]}>
        <Image
          source={{ 
            uri: senderPhoto || 'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=100' 
          }}
          style={styles.avatar}
          contentFit="cover"
        />
        
        <View style={styles.requestInfo}>
          <Text style={styles.senderName}>@{senderName}</Text>
          {item.senderInfo?.city && (
            <Text style={styles.senderLocation}>{item.senderInfo.city}</Text>
          )}
        </View>
        
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAccept(item.id, item.senderId, senderName)}
            disabled={isRespondingToRequest}
          >
            <Check size={20} color={COLORS.white} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item.id, item.senderId, senderName)}
            disabled={isRespondingToRequest}
          >
            <XCircle size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Demandes d&apos;amis ({pendingRequests.length})
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <X size={24} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chargement...</Text>
            </View>
          ) : requestsWithInfo.length > 0 ? (
            <FlatList
              data={requestsWithInfo}
              renderItem={renderRequest}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucune nouvelle demande d&apos;ami</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    ...SHADOWS.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  closeButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  senderLocation: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
});
