import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '@/theme/tokens';
import { useMessaging } from '@/hooks/messaging-store';

import { Heart, UserPlus, Search, UserCheck, MessageCircle } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/database';
import type { User } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'matches' | 'social' | 'requests';

export default function MessagesScreen() {
  const router = useRouter();
  const { conversations, getPendingRequests, getConversationUser, respondToFriendRequest } = useMessaging();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('matches');
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

  const matchConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    return conversations.filter(c => {
      if (c.hasMatch !== true) return false;
      if (unreadOnly && c.unreadCount === 0) return false;
      const other = getConversationUser(c.id);
      const name = other?.pseudo?.toLowerCase() ?? '';
      const last = c.lastMessage?.content?.toLowerCase() ?? '';
      if (!term) return true;
      return name.includes(term) || last.includes(term);
    });
  }, [conversations, getConversationUser, search, unreadOnly]);

  const socialConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    return conversations.filter(c => {
      if (c.hasMatch === true) return false;
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };
  
  const handleConversationPress = (conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  };
  
  const handleNewMessage = () => {
    router.push('/messages/new');
  };

  const formatTime = (timestamp: any) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const toMillis = (val: any): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if (typeof val?.toMillis === 'function') return val.toMillis();
    if (typeof val?.toDate === 'function') return val.toDate().getTime();
    return 0;
  };
  
  const renderConversationItem = ({ item }: { item: typeof conversations[0] }) => {
    const otherUser = getConversationUser(item.id);
    
    if (!otherUser) {
      return null;
    }
    
    const userPet = otherUser.pets?.[0];
    const avatarUri = userPet?.mainPhoto || otherUser.photo || 'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=500';
    
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item.id)}
        activeOpacity={0.9}
      >
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
            contentFit="cover"
          />
          {item.unreadCount > 0 && <View style={styles.unreadIndicator} />}
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
            <Text style={styles.requestMessage}>Souhaite se connecter avec vous</Text>
            <Text style={styles.requestTime}>{formatTime(toMillis(item.timestamp))}</Text>
          </View>
        </View>

        <View style={styles.requestActions}>
          <TouchableOpacity
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
            activeOpacity={0.8}
          >
            <UserCheck size={20} color={COLORS.surface} />
          </TouchableOpacity>

          <TouchableOpacity
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
            activeOpacity={0.8}
          >
            <Text style={styles.rejectButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (activeTab === 'matches') {
      return (
        <View style={styles.emptyContainer}>
          <Heart size={64} color={COLORS.textSecondary} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Aucun match</Text>
          <Text style={styles.emptyText}>
            Vos matchs d&apos;animaux apparaîtront ici
          </Text>
        </View>
      );
    } else if (activeTab === 'social') {
      return (
        <View style={styles.emptyContainer}>
          <MessageCircle size={64} color={COLORS.textSecondary} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Aucune conversation</Text>
          <Text style={styles.emptyText}>
            Commencez une conversation avec quelqu&apos;un
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.emptyContainer}>
          <UserPlus size={64} color={COLORS.textSecondary} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Aucune demande</Text>
          <Text style={styles.emptyText}>
            Les demandes d&apos;ami apparaîtront ici
          </Text>
        </View>
      );
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>

        <View style={styles.searchContainer}>
          <Search size={18} color={COLORS.textSecondary} />
          <TextInput
            placeholder="Rechercher..."
            placeholderTextColor={COLORS.textSecondary}
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

        <View style={styles.segmentedControl}>
          <Pressable
            style={[
              styles.segment,
              activeTab === 'matches' && styles.segmentActive,
            ]}
            onPress={() => setActiveTab('matches')}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'matches' && styles.segmentTextActive,
              ]}
            >
              Matchs
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.segment,
              activeTab === 'social' && styles.segmentActive,
            ]}
            onPress={() => setActiveTab('social')}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'social' && styles.segmentTextActive,
              ]}
            >
              Social
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.segment,
              activeTab === 'requests' && styles.segmentActive,
            ]}
            onPress={() => setActiveTab('requests')}
          >
            <View style={styles.segmentContent}>
              <Text
                style={[
                  styles.segmentText,
                  activeTab === 'requests' && styles.segmentTextActive,
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
          </Pressable>
        </View>

        {activeTab === 'social' && (
          <TouchableOpacity
            style={styles.newMessageButton}
            onPress={handleNewMessage}
            activeOpacity={0.8}
          >
            <MessageCircle size={20} color={COLORS.surface} />
            <Text style={styles.newMessageButtonText}>Nouveau message</Text>
          </TouchableOpacity>
        )}

        {(activeTab === 'matches' || activeTab === 'social') && (
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setUnreadOnly(v => !v)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, unreadOnly && styles.filterTextActive]}>
              {unreadOnly ? '✓ Non lus' : 'Tous'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {activeTab === 'matches' ? (
        matchConversations.length > 0 ? (
          <FlatList
            data={matchConversations}
            renderItem={renderConversationItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
          />
        ) : renderEmptyState()
      ) : activeTab === 'social' ? (
        socialConversations.length > 0 ? (
          <FlatList
            data={socialConversations}
            renderItem={renderConversationItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
          />
        ) : renderEmptyState()
      ) : (
        pendingRequests.length > 0 ? (
          <FlatList
            data={pendingRequests}
            renderItem={renderRequestItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
          />
        ) : renderEmptyState()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    ...TYPOGRAPHY.title,
    color: COLORS.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  clearButton: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.xs,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.button,
    padding: SPACING.xs,
  },
  segment: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.button - 4,
  },
  segmentActive: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.card,
  },
  segmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  segmentText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '600' as const,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.surface,
    fontWeight: '600' as const,
  },
  newMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.button,
    ...SHADOWS.card,
  },
  newMessageButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.surface,
  },
  filterButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceSecondary,
  },
  filterText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    ...SHADOWS.card,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceSecondary,
  },
  unreadIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  conversationContent: {
    flex: 1,
  },
  conversationTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  userName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    flex: 1,
  },
  timestamp: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  conversationBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  noMessages: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  unreadCount: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.surface,
    fontWeight: '600' as const,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    ...SHADOWS.card,
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
    backgroundColor: COLORS.surfaceSecondary,
    marginRight: SPACING.md,
  },
  requestInfo: {
    flex: 1,
    gap: SPACING.xs / 2,
  },
  requestName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  requestMessage: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  requestTime: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  requestActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
