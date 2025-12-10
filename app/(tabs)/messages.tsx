import React, { useMemo, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useMessaging } from '@/hooks/messaging-store';
import { useI18n } from '@/hooks/i18n-store';
import { mockUsers } from '@/mocks/users';
import { Bell, Edit, UserCheck, UserPlus } from 'lucide-react-native';

export default function MessagesScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { conversations, getPendingRequests, getConversationUser, respondToFriendRequest } = useMessaging();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'messages' | 'requests'>('messages');
  const [search, setSearch] = useState<string>('');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  
  const pendingRequests = getPendingRequests();
  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    return conversations.filter(c => {
      if (unreadOnly && c.unreadCount === 0) return false;
      const other = getConversationUser(c.id);
      const name = other?.pseudo?.toLowerCase() ?? '';
      const last = c.lastMessage?.content?.toLowerCase() ?? '';
      if (!term) return true;
      return name.includes(term) || last.includes(term);
    });
  }, [conversations, getConversationUser, search, unreadOnly]);
  
  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };
  
  const handleConversationPress = (conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  };
  
  const handleNewMessage = () => {
    router.push('/messages/new');
  };
  
  const toMillis = (val: any): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if (typeof val?.toMillis === 'function') return val.toMillis();
    if (typeof val?.toDate === 'function') return val.toDate().getTime();
    return 0;
  };

  const formatTime = (timestamp: any) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this week, show day name
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  const renderConversationItem = ({ item }: { item: typeof conversations[0] }) => {
    const otherUser = getConversationUser(item.id);
    
    if (!otherUser) return null;
    
    const userPet = otherUser.pets[0];
    
    return (
      <TouchableOpacity
        style={[styles.conversationItem, SHADOWS.small]}
        onPress={() => handleConversationPress(item.id)}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: userPet?.mainPhoto || 'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=500' }}
            style={styles.avatar}
            contentFit="cover"
          />
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName}>@{otherUser.pseudo}</Text>
            {item.lastMessage && (
              <Text style={styles.timestamp}>{formatTime(item.lastMessage.timestamp)}</Text>
            )}
          </View>
          
          {item.lastMessage ? (
            <Text 
              style={[
                styles.lastMessage,
                item.unreadCount > 0 ? styles.unreadMessage : null,
              ]}
              numberOfLines={1}
            >
              {item.lastMessage.content}
            </Text>
          ) : (
            <Text style={styles.noMessages}>{t('messages.no_messages')}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderRequestItem = ({ item }: { item: typeof pendingRequests[0] }) => {
    const sender = mockUsers.find(user => user.id === item.senderId) ?? { id: item.senderId, pseudo: 'User', pets: [{ mainPhoto: undefined }] } as any;
    
    return (
      <View style={[styles.requestItem, SHADOWS.small]}>
        <View style={styles.requestHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: sender.pets[0]?.mainPhoto || 'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=500' }}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>
          
          <View style={styles.requestInfo}>
            <Text style={styles.userName}>@{sender.pseudo}</Text>
            <Text style={styles.timestamp}>{formatTime(toMillis(item.timestamp))}</Text>
          </View>
        </View>
        
        <Text style={styles.requestMessage}>
          @{sender.pseudo} souhaite se connecter avec vous
        </Text>
        
        <View style={styles.requestActions}>
          <TouchableOpacity
            testID="request-accept"
            accessibilityRole="button"
            style={[styles.requestButton, styles.acceptButton]}
            onPress={async () => {
              try {
                await respondToFriendRequest.mutateAsync({ requestId: item.id, accept: true, senderId: item.senderId, receiverId: item.receiverId });
              } catch (e) {
                console.log('[Messages] Accept request failed', e);
              }
            }}
          >
            <UserCheck size={16} color={COLORS.white} />
            <Text style={styles.acceptButtonText}>{t('common.yes')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            testID="request-reject"
            accessibilityRole="button"
            style={[styles.requestButton, styles.rejectButton]}
            onPress={async () => {
              try {
                await respondToFriendRequest.mutateAsync({ requestId: item.id, accept: false, senderId: item.senderId, receiverId: item.receiverId });
              } catch (e) {
                console.log('[Messages] Reject request failed', e);
              }
            }}
          >
            <Text style={styles.rejectButtonText}>{t('common.no')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <TextInput
            placeholder={t('common.search')}
            placeholderTextColor={COLORS.darkGray}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          <TouchableOpacity
            onPress={() => setUnreadOnly(v => !v)}
            style={[styles.unreadToggle, unreadOnly && styles.unreadToggleActive]}
          >
            <Text style={[styles.unreadToggleText, unreadOnly && styles.unreadToggleTextActive]}>Non-lus</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'messages' ? styles.activeTab : null,
            ]}
            onPress={() => setActiveTab('messages')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'messages' ? styles.activeTabText : null,
              ]}
            >
              {t('navigation.messages')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'requests' ? styles.activeTab : null,
            ]}
            onPress={() => setActiveTab('requests')}
          >
            <View style={styles.tabTextContainer}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'requests' ? styles.activeTabText : null,
                ]}
              >
                Demandes
              </Text>
              {pendingRequests.length > 0 && (
                <View style={styles.requestBadge}>
                  <Text style={styles.requestBadgeText}>{pendingRequests.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.newButton}
          onPress={handleNewMessage}
        >
          <Edit size={20} color={COLORS.maleAccent} />
        </TouchableOpacity>
      </View>
      
      {activeTab === 'messages' ? (
        conversations.length > 0 ? (
          <FlatList
            data={filteredConversations}
            renderItem={renderConversationItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Bell size={48} color={COLORS.darkGray} />
            <Text style={styles.emptyTitle}>{t('messages.no_conversations')}</Text>
            <Text style={styles.emptyText}>
              {t('messages.start_conversation_description')}
            </Text>
            <TouchableOpacity
              style={[styles.startButton, SHADOWS.small]}
              onPress={handleNewMessage}
            >
              <Text style={styles.startButtonText}>{t('messages.start_chat')}</Text>
            </TouchableOpacity>
          </View>
        )
      ) : (
        pendingRequests.length > 0 ? (
          <FlatList
            data={pendingRequests}
            renderItem={renderRequestItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <UserPlus size={48} color={COLORS.darkGray} />
            <Text style={styles.emptyTitle}>Aucune demande d'ami</Text>
            <Text style={styles.emptyText}>
              Quand quelqu'un vous envoie une demande d'ami, elle apparaîtra ici
            </Text>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.black,
  },
  unreadToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
  },
  unreadToggleActive: {
    backgroundColor: COLORS.maleAccent,
    borderColor: COLORS.maleAccent,
  },
  unreadToggleText: {
    color: COLORS.darkGray,
    fontWeight: '600' as const,
  },
  unreadToggleTextActive: {
    color: COLORS.white,
  },
  tabs: {
    flexDirection: 'row',
    flex: 1,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.maleAccent,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.darkGray,
  },
  activeTabText: {
    color: COLORS.maleAccent,
    fontWeight: '600' as const,
  },
  tabTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestBadge: {
    backgroundColor: COLORS.maleAccent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  requestBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  newButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
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
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.maleAccent,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  unreadCount: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700' as const,
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  unreadMessage: {
    fontWeight: '500' as const,
    color: COLORS.black,
  },
  noMessages: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontStyle: 'italic',
  },
  requestItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  requestInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  requestMessage: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  requestButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  acceptButton: {
    backgroundColor: COLORS.maleAccent,
  },
  acceptButtonText: {
    color: COLORS.white,
    fontWeight: '500' as const,
  },
  rejectButton: {
    backgroundColor: COLORS.lightGray,
  },
  rejectButtonText: {
    color: COLORS.darkGray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: COLORS.maleAccent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500' as const,
  },
});