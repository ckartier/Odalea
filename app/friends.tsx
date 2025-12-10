import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { 
  Users, 
  Search, 
  MessageCircle,
  MoreVertical,
  UserX,
  Bell,
  UserPlus,
  Clock,
  X,
} from 'lucide-react-native';
import { useFriends } from '@/hooks/friends-store';
import { databaseService } from '@/services/database';
import { User, FriendRequest } from '@/types';
import FriendRequestsModal from '@/components/FriendRequestsModal';

type TabType = 'friends' | 'received' | 'sent';

interface SentRequestWithInfo extends FriendRequest {
  receiverInfo?: User;
}

export default function FriendsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { 
    friends, 
    pendingRequests, 
    sentRequests, 
    removeFriend, 
    cancelFriendRequest,
    isLoading 
  } = useFriends();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [sentRequestsWithInfo, setSentRequestsWithInfo] = useState<SentRequestWithInfo[]>([]);

  useEffect(() => {
    const loadSentRequestsInfo = async () => {
      if (!sentRequests || sentRequests.length === 0) {
        setSentRequestsWithInfo([]);
        return;
      }

      try {
        const requestsData = await Promise.all(
          sentRequests.map(async (request) => {
            try {
              const receiverInfo = await databaseService.user.getUser(request.receiverId);
              return { ...request, receiverInfo: receiverInfo || undefined };
            } catch (error) {
              console.error('Error loading receiver info:', error);
              return { ...request, receiverInfo: undefined };
            }
          })
        );
        setSentRequestsWithInfo(requestsData);
      } catch (error) {
        console.error('Error loading sent requests info:', error);
      }
    };

    if (activeTab === 'sent') {
      loadSentRequestsInfo();
    }
  }, [sentRequests, activeTab]);

  const filteredFriends = friends.filter(friend =>
    friend.pseudo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemoveFriend = (friendId: string, friendName: string) => {
    Alert.alert(
      'Supprimer ami',
      `Êtes-vous sûr de vouloir supprimer @${friendName} de vos amis ?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friendId);
              Alert.alert('Ami supprimé', `@${friendName} a été supprimé de votre liste d'amis.`);
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer cet ami');
            }
          },
        },
      ]
    );
  };

  const handleCancelRequest = (requestId: string, receiverName: string) => {
    Alert.alert(
      'Annuler la demande',
      `Voulez-vous annuler la demande d'ami envoyée à @${receiverName} ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelFriendRequest(requestId);
            } catch {
              Alert.alert('Erreur', 'Impossible d\'annuler la demande');
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = (friendId: string, friendName: string) => {
    Alert.alert(
      'Bloquer utilisateur',
      `Êtes-vous sûr de vouloir bloquer @${friendName} ? Cette personne ne pourra plus vous contacter.`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Bloquer',
          style: 'destructive',
          onPress: async () => {
            await removeFriend(friendId);
            Alert.alert('Utilisateur bloqué', `@${friendName} a été bloqué avec succès.`);
          },
        },
      ]
    );
  };

  const handleSendMessage = (friendId: string) => {
    router.push(`/messages/${friendId}`);
  };

  const showFriendOptions = (friend: User) => {
    Alert.alert(
      `@${friend.pseudo}`,
      'Que souhaitez-vous faire ?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Envoyer un message',
          onPress: () => handleSendMessage(friend.id),
        },
        {
          text: 'Voir le profil',
          onPress: () => router.push(`/profile/${friend.id}`),
        },
        {
          text: 'Supprimer ami',
          style: 'destructive',
          onPress: () => handleRemoveFriend(friend.id, friend.pseudo),
        },
        {
          text: 'Bloquer',
          style: 'destructive',
          onPress: () => handleBlockUser(friend.id, friend.pseudo),
        },
      ]
    );
  };

  const renderFriend = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.friendItem, SHADOWS.small]}
      onPress={() => router.push(`/profile/${item.id}`)}
    >
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: item.photo || 'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=100' }}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
        
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>@{item.pseudo || item.name}</Text>
          {item.city && <Text style={styles.friendLocation}>{item.city}</Text>}
        </View>
      </View>
      
      <View style={styles.friendActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleSendMessage(item.id)}
        >
          <MessageCircle size={20} color={COLORS.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => showFriendOptions(item)}
        >
          <MoreVertical size={20} color={COLORS.darkGray} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderSentRequest = ({ item }: { item: SentRequestWithInfo }) => {
    const receiverName = item.receiverInfo?.pseudo || item.receiverInfo?.name || 'Utilisateur';
    const receiverPhoto = item.receiverInfo?.photo;

    return (
      <View style={[styles.friendItem, SHADOWS.small]}>
        <View style={styles.friendInfo}>
          <Image
            source={{ uri: receiverPhoto || 'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=100' }}
            style={styles.avatar}
            contentFit="cover"
          />
          
          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>@{receiverName}</Text>
            {item.receiverInfo?.city && (
              <Text style={styles.friendLocation}>{item.receiverInfo.city}</Text>
            )}
            <View style={styles.statusBadge}>
              <Clock size={12} color={COLORS.warning} />
              <Text style={styles.statusText}>En attente</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => handleCancelRequest(item.id, receiverName)}
        >
          <X size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    );
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'friends':
        return filteredFriends.length > 0 ? (
          <FlatList
            data={filteredFriends}
            renderItem={renderFriend}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Users size={64} color={COLORS.darkGray} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Aucun ami trouvé' : 'Aucun ami pour le moment'}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchQuery 
                ? 'Essayez de modifier votre recherche.'
                : 'Commencez à vous connecter avec d\'autres propriétaires d\'animaux dans votre région.'}
            </Text>
          </View>
        );
      
      case 'received':
        return pendingRequests.length > 0 ? (
          <View style={styles.listContent}>
            <Text style={styles.sectionInfo}>
              Vous avez {pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} d&apos;ami en attente
            </Text>
            <TouchableOpacity
              style={[styles.viewRequestsButton, SHADOWS.small]}
              onPress={() => setShowRequestsModal(true)}
            >
              <Bell size={20} color={COLORS.white} />
              <Text style={styles.viewRequestsButtonText}>
                Voir les demandes ({pendingRequests.length})
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Bell size={64} color={COLORS.darkGray} />
            <Text style={styles.emptyTitle}>Aucune demande reçue</Text>
            <Text style={styles.emptyDescription}>
              Les demandes d&apos;ami que vous recevez apparaîtront ici.
            </Text>
          </View>
        );
      
      case 'sent':
        return sentRequestsWithInfo.length > 0 ? (
          <FlatList
            data={sentRequestsWithInfo}
            renderItem={renderSentRequest}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <UserPlus size={64} color={COLORS.darkGray} />
            <Text style={styles.emptyTitle}>Aucune demande envoyée</Text>
            <Text style={styles.emptyDescription}>
              Les demandes d&apos;ami que vous envoyez apparaîtront ici.
            </Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Mes amis',
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.black,
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/settings/blocked-users')}
              style={styles.headerButton}
            >
              <UserX size={24} color={COLORS.darkGray} />
            </TouchableOpacity>
          ),
        }}
      />
      <StatusBar style="dark" />

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={COLORS.darkGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des amis..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.darkGray}
          />
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Users size={20} color={activeTab === 'friends' ? COLORS.primary : COLORS.darkGray} />
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Amis ({friends.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.activeTab]}
          onPress={() => setActiveTab('received')}
        >
          <Bell size={20} color={activeTab === 'received' ? COLORS.primary : COLORS.darkGray} />
          <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
            Reçues ({pendingRequests.length})
          </Text>
          {pendingRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => setActiveTab('sent')}
        >
          <UserPlus size={20} color={activeTab === 'sent' ? COLORS.primary : COLORS.darkGray} />
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            Envoyées ({sentRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyDescription}>Chargement...</Text>
        </View>
      ) : (
        getTabContent()
      )}

      <FriendRequestsModal
        visible={showRequestsModal}
        onClose={() => setShowRequestsModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.darkGray,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  listContent: {
    padding: 16,
  },
  sectionInfo: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 16,
    textAlign: 'center',
  },
  viewRequestsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  viewRequestsButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 2,
  },
  friendLocation: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '500' as const,
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 22,
  },
});
