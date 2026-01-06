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
import { TYPOGRAPHY } from '@/constants/typography';
import AppBackground from '@/components/AppBackground';
import { useMessaging } from '@/hooks/messaging-store';
import { useI18n } from '@/hooks/i18n-store';
import { Bell, MessageCircle, UserCheck, UserPlus, Search, Filter } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/database';
import type { User } from '@/types';

export default function MessagesScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { conversations, getPendingRequests, getConversationUser, respondToFriendRequest } = useMessaging();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'messages' | 'requests'>('messages');
  const [search, setSearch] = useState<string>('');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  
  const pendingRequests = getPendingRequests();

  const requestSenderIds = useMemo(() => {
    const ids = new Set<string>();
    for (const r of pendingRequests) ids.add(String(r.senderId));
    return Array.from(ids);
  }, [pendingRequests]);

  const requestSendersQuery = useQuery({
    queryKey: ['friendRequestSenders', requestSenderIds],
    queryFn: async () => {
      if (requestSenderIds.length === 0) return [] as User[];
      console.log('[Messages] Loading friend request senders', requestSenderIds.length);
      const data = await userService.getUsers(requestSenderIds);
      return data;
    },
    enabled: requestSenderIds.length > 0,
  });

  const requestSendersById = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of (requestSendersQuery.data ?? [])) map.set(u.id, u);
    return map;
  }, [requestSendersQuery.data]);
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
    
    if (!otherUser) {
      console.log('[Messages] User not found for conversation:', item.id);
      return null;
    }
    
    const userPet = otherUser.pets?.[0];
    const avatarUri = userPet?.mainPhoto || otherUser.photo || 'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=500';
    
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
            contentFit="cover"
          />
          {item.unreadCount > 0 && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationTop}>
            <Text style={styles.userName} numberOfLines={1}>@{otherUser.pseudo}</Text>
            {item.lastMessage && (
              <Text style={styles.timestamp}>{formatTime(item.lastMessage.timestamp)}</Text>
            )}
          </View>
          
          <View style={styles.conversationBottom}>
            {item.lastMessage ? (
              <Text 
                style={[
                  styles.lastMessage,
                  item.unreadCount > 0 && styles.unreadMessage,
                ]}
                numberOfLines={1}
              >
                {item.lastMessage.content}
              </Text>
            ) : (
              <Text style={styles.noMessages}>Aucun message</Text>
            )}
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderRequestItem = ({ item }: { item: (typeof pendingRequests)[number] }) => {
    const sender = requestSendersById.get(String(item.senderId));
    const avatarUri =
      sender?.pets?.[0]?.mainPhoto ||
      sender?.photo ||
      'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=500';

    return (
      <View style={styles.requestItem}>
        <View style={styles.requestLeft}>
          <Image source={{ uri: avatarUri }} style={styles.requestAvatar} contentFit="cover" />
          <View style={styles.requestInfo}>
            <Text style={styles.requestName}>@{sender?.pseudo ?? 'Utilisateur'}</Text>
            <Text style={styles.requestTime}>{formatTime(toMillis(item.timestamp))}</Text>
            <Text style={styles.requestMessage}>Souhaite se connecter avec vous</Text>
          </View>
        </View>

        <View style={styles.requestActions}>
          <TouchableOpacity
            testID="request-accept"
            style={styles.acceptButton}
            onPress={async () => {
              try {
                await respondToFriendRequest.mutateAsync({
                  requestId: item.id,
                  accept: true,
                  senderId: item.senderId,
                  receiverId: item.receiverId,
                });
              } catch (e) {
                console.log('[Messages] Accept request failed', e);
              }
            }}
          >
            <UserCheck size={18} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity
            testID="request-reject"
            style={styles.rejectButton}
            onPress={async () => {
              try {
                await respondToFriendRequest.mutateAsync({
                  requestId: item.id,
                  accept: false,
                  senderId: item.senderId,
                  receiverId: item.receiverId,
                });
              } catch (e) {
                console.log('[Messages] Reject request failed', e);
              }
            }}
          >
            <Text style={styles.rejectButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <AppBackground>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.topBar}>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity
            style={styles.newMessageButton}
            onPress={handleNewMessage}
          >
            <MessageCircle size={24} color={COLORS.maleAccent} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={18} color={COLORS.darkGray} style={styles.searchIcon} />
          <TextInput
            placeholder="Rechercher une conversation..."
            placeholderTextColor={COLORS.darkGray}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'messages' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('messages')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'messages' && styles.activeTabText,
              ]}
            >
              Messages
            </Text>
            {activeTab === 'messages' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'requests' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('requests')}
          >
            <View style={styles.tabContent}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'requests' && styles.activeTabText,
                ]}
              >
                Demandes
              </Text>
              {pendingRequests.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingRequests.length}</Text>
                </View>
              )}
            </View>
            {activeTab === 'requests' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>

          {activeTab === 'messages' && (
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setUnreadOnly(v => !v)}
            >
              <Filter size={16} color={unreadOnly ? COLORS.maleAccent : COLORS.darkGray} />
              <Text style={[styles.filterText, unreadOnly && styles.filterTextActive]}>Non lus</Text>
            </TouchableOpacity>
          )}
        </View>
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
            <Text style={styles.emptyTitle}>Aucune demande d&apos;ami</Text>
            <Text style={styles.emptyText}>
              Quand quelqu&apos;un vous envoie une demande d&apos;ami, elle apparaîtra ici
            </Text>
          </View>
        )
      )}
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
  },
  newMessageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body1,
    color: COLORS.black,
  },
  clearButton: {
    fontSize: 18,
    color: COLORS.darkGray,
    paddingHorizontal: 8,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  tab: {
    paddingVertical: 8,
    position: 'relative',
  },
  activeTab: {},
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    ...TYPOGRAPHY.subtitle2,
    color: COLORS.darkGray,
  },
  activeTabText: {
    ...TYPOGRAPHY.subtitle1,
    fontSize: 14,
    color: COLORS.black,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.maleAccent,
    borderRadius: 2,
  },
  badge: {
    backgroundColor: COLORS.maleAccent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    ...TYPOGRAPHY.badge,
    color: COLORS.white,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
  },
  filterText: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.darkGray,
  },
  filterTextActive: {
    color: COLORS.maleAccent,
  },
  listContent: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.lightGray,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.maleAccent,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  conversationContent: {
    flex: 1,
  },
  conversationTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    ...TYPOGRAPHY.subtitle1,
    color: COLORS.black,
    flex: 1,
  },
  timestamp: {
    ...TYPOGRAPHY.caption,
    color: COLORS.darkGray,
    marginLeft: 8,
  },
  conversationBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    ...TYPOGRAPHY.body2,
    color: COLORS.darkGray,
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  noMessages: {
    fontSize: 14,
    color: COLORS.mediumGray,
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: COLORS.maleAccent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadCount: {
    ...TYPOGRAPHY.badge,
    color: COLORS.white,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.lightGray,
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    ...TYPOGRAPHY.subtitle1,
    color: COLORS.black,
    marginBottom: 2,
  },
  requestTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  requestMessage: {
    ...TYPOGRAPHY.body3,
    color: COLORS.darkGray,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.maleAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 20,
    color: COLORS.darkGray,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: COLORS.maleAccent,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    ...SHADOWS.small,
  },
  startButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
});