import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useEffect } from 'react';
import { Message, FriendRequest, Conversation, User } from '@/types';
import { useUser } from './user-store';
import { databaseService } from '@/services/database';

export const [MessagingContext, useMessaging] = createContextHook(() => {
  const { user } = useUser();
  const qc = useQueryClient();
  const [messagesByConv, setMessagesByConv] = useState<Record<string, Message[]>>({});

  const conversationsQuery = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [] as Conversation[];
      console.log('[Messaging] Fetching conversations for', user.id);
      const data = await databaseService.messaging.getConversations(user.id);
      return data;
    },
    enabled: !!user?.id,
  });

  const [liveConversations, setLiveConversations] = useState<Conversation[]>([]);
  useEffect(() => {
    if (!user?.id) return;
    const unsub = databaseService.realtime.listenToConversations(user.id, (convs: any) => {
      console.log('[Messaging] Realtime conversations update', convs.length);
      setLiveConversations(convs);
    });
    return () => { try { unsub && (unsub as any)(); } catch (e) {} };
  }, [user?.id]);

  const conversations = (liveConversations.length > 0 ? liveConversations : (conversationsQuery.data ?? []));

  const otherParticipantIds = useMemo(() => {
    if (!user) return [] as string[];
    const ids = new Set<string>();
    for (const c of conversations) {
      const participants = c.participants || [];
      for (const pid of participants) {
        if (pid !== user.id) ids.add(pid);
      }
    }
    return Array.from(ids);
  }, [conversations, user]);

  const usersQuery = useQuery({
    queryKey: ['conversationUsers', otherParticipantIds.sort().join(',')],
    queryFn: async () => {
      if (otherParticipantIds.length === 0) return [] as User[];
      const data = await databaseService.user.getUsers(otherParticipantIds);
      return data.map(u => normalizeUser(u));
    },
    enabled: otherParticipantIds.length > 0,
  });

  const usersMap = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of (usersQuery.data ?? [])) {
      map.set(u.id, u);
    }
    return map;
  }, [usersQuery.data]);

  const friendRequestsQuery = useQuery({
    queryKey: ['friendRequests', user?.id],
    queryFn: async () => {
      if (!user) return [] as FriendRequest[];
      console.log('[Messaging] Fetching friend requests for', user.id);
      const data = await databaseService.friendRequest.getFriendRequests(user.id);
      return data;
    },
    enabled: !!user?.id,
  });

  const friendRequests = friendRequestsQuery.data ?? [];

  const getMessages = async (conversationId: string) => {
    if (!conversationId) return [] as Message[];
    if (messagesByConv[conversationId]) return messagesByConv[conversationId];
    console.log('[Messaging] Fetching messages for', conversationId);
    const data = await databaseService.messaging.getMessages(conversationId, 100);
    setMessagesByConv(prev => ({ ...prev, [conversationId]: data }));
    return data;
  };

  useEffect(() => {
    const unsubs: Array<() => void> = [];
    for (const conv of conversations) {
      const unsub = databaseService.realtime.listenToMessages(conv.id, (msgs: any) => {
        setMessagesByConv(prev => ({ ...prev, [conv.id]: msgs }));
      });
      unsubs.push(unsub);
    }
    return () => { unsubs.forEach(u => { try { u(); } catch {} }); };
  }, [conversations.map(c => c.id).join(',')]);

  const sendMessage = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      if (!user?.id) throw new Error('User not signed in');
      const conv = conversations.find(c => c.id === conversationId);
      if (!conv) throw new Error('Conversation not found');
      const participants = conv.participants || [];
      const recipientId = participants.find(pid => pid !== user.id);
      if (!recipientId) throw new Error('Recipient not found');
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        senderId: user.id,
        receiverId: recipientId,
        content,
        timestamp: Date.now(),
        read: false,
      };
      setMessagesByConv(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] ?? []), tempMessage],
      }));
      const messagePayload: any = {
        senderId: user.id,
        receiverId: recipientId,
        content,
        conversationId,
      };
      const id = await databaseService.messaging.sendMessage(messagePayload);
      await qc.invalidateQueries({ queryKey: ['conversations', user.id] });
      return id;
    },
  });

  const createConversation = useMutation({
    mutationFn: async (participantId: string) => {
      if (!user?.id) throw new Error('User not signed in');
      const existing = conversations.find(c => (c.participants || []).includes(participantId));
      if (existing) return existing.id;
      const convId = await databaseService.messaging.createConversation([user.id, participantId]);
      await qc.invalidateQueries({ queryKey: ['conversations', user.id] });
      return convId;
    },
  });

  const sendFriendRequest = useMutation({
    mutationFn: async (recipientId: string) => {
      if (!user?.id) throw new Error('User not signed in');
      const id = await databaseService.friendRequest.sendFriendRequest(user.id, recipientId);
      await qc.invalidateQueries({ queryKey: ['friendRequests', user.id] });
      return id;
    },
  });

  const respondToFriendRequest = useMutation({
    mutationFn: async ({ requestId, accept, senderId, receiverId }: { requestId: string; accept: boolean; senderId: string; receiverId: string }) => {
      await databaseService.friendRequest.respondToFriendRequest(requestId, accept);

      let createdConversationId: string | undefined = undefined;
      if (accept && user?.id) {
        const otherId = user.id === senderId ? receiverId : senderId;
        const existing = conversations.find(c => (c.participants || []).includes(otherId));
        if (existing) {
          createdConversationId = existing.id;
        } else {
          try {
            createdConversationId = await databaseService.messaging.createConversation([user.id, otherId]);
          } catch (e) {
            console.error('[Messaging] Failed to auto-create conversation after accepting request', e);
          }
        }
        await qc.invalidateQueries({ queryKey: ['conversations', user.id] });
      }

      if (user?.id) await qc.invalidateQueries({ queryKey: ['friendRequests', user.id] });
      return { requestId, accept, conversationId: createdConversationId } as const;
    },
  });

  const getConversationUser = (conversationId: string): User | undefined => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation || !user) return undefined;
    const participants = conversation.participants || [];
    const otherUserId = participants.find(id => id !== user.id);
    if (!otherUserId) return undefined;
    return usersMap.get(otherUserId);
  };

  const getPendingRequests = (): FriendRequest[] => {
    if (!user) return [];
    return friendRequests.filter(req => req.receiverId === user.id && req.status === 'pending');
  };

  const areFriends = (userId: string): boolean => {
    if (!user) return false;
    return friendRequests.some(req => ((req.senderId === user.id && req.receiverId === userId) || (req.senderId === userId && req.receiverId === user.id)) && req.status === 'accepted');
  };

  const hasPendingRequest = (userId: string): boolean => {
    if (!user) return false;
    return friendRequests.some(req => ((req.senderId === user.id && req.receiverId === userId) || (req.senderId === userId && req.receiverId === user.id)) && req.status === 'pending');
  };

  function normalizeUser(u: User): User {
    return {
      id: u.id,
      firstName: u.firstName ?? '',
      lastName: u.lastName ?? '',
      name: u.name ?? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
      pseudo: u.pseudo ?? (u.email?.split('@')[0] ?? 'user'),
      pseudoLower: u.pseudoLower ?? (u.pseudo ?? '').toLowerCase(),
      photo: u.photo,
      email: u.email ?? '',
      emailLower: u.emailLower ?? (u.email ?? '').toLowerCase(),
      phoneNumber: u.phoneNumber ?? '',
      countryCode: u.countryCode ?? 'FR',
      address: u.address ?? '',
      zipCode: u.zipCode ?? '',
      city: u.city ?? '',
      location: u.location,
      addressVerified: u.addressVerified ?? false,
      normalizedAddress: u.normalizedAddress,
      isCatSitter: u.isCatSitter ?? false,
      catSitterRadiusKm: u.catSitterRadiusKm ?? 5,
      referralCode: u.referralCode,
      isPremium: u.isPremium ?? false,
      createdAt: u.createdAt ?? Date.now(),
      pets: Array.isArray(u.pets) ? u.pets : [],
      animalType: u.animalType,
      animalName: u.animalName,
      animalGender: u.animalGender,
      animalPhoto: u.animalPhoto,
      isProfessional: u.isProfessional ?? false,
      professionalData: u.professionalData,
      isActive: u.isActive ?? true,
      profileComplete: u.profileComplete ?? false,
    };
  }

  const markConversationAsRead = async (conversationId: string) => {
    if (!user?.id) return;
    await databaseService.realtime.markConversationAsRead(conversationId, user.id);
  };

  return {
    conversations,
    friendRequests,
    getMessages,
    sendMessage,
    sendFriendRequest,
    respondToFriendRequest,
    getConversationUser,
    getPendingRequests,
    areFriends,
    hasPendingRequest,
    createConversation,
    markConversationAsRead,
    isLoading: conversationsQuery.isLoading || friendRequestsQuery.isLoading || usersQuery.isLoading,
  };
});