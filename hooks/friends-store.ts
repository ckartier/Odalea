import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseService } from '@/services/database';
import { User, FriendRequest } from '@/types';
import { useFirebaseUser } from './firebase-user-store';

export const [FriendsContext, useFriends] = createContextHook(() => {
  const { user } = useFirebaseUser();
  const queryClient = useQueryClient();
  
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);

  // Fetch friends list
  const friendsQuery = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('[FriendsStore] No user ID, returning empty friends list');
        return [];
      }
      
      console.log('[FriendsStore] Fetching friends for user:', user.id);
      const userDoc = await databaseService.user.getUser(user.id);
      
      if (!userDoc) {
        console.warn('[FriendsStore] User document not found for:', user.id);
        return [];
      }
      
      if (!userDoc.friends || userDoc.friends.length === 0) {
        console.log('[FriendsStore] User has no friends');
        return [];
      }
      
      console.log('[FriendsStore] Loading', userDoc.friends.length, 'friends');
      const friendsData = await databaseService.user.getUsers(userDoc.friends);
      console.log('[FriendsStore] Loaded', friendsData.length, 'friends successfully');
      return friendsData;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Fetch received friend requests
  const receivedRequestsQuery = useQuery({
    queryKey: ['friendRequests', 'received', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('[FriendsStore] No user ID, returning empty received requests');
        return [];
      }
      console.log('[FriendsStore] Fetching received requests for:', user.id);
      const requests = await databaseService.friendRequest.getFriendRequests(user.id);
      console.log('[FriendsStore] Found', requests.length, 'received requests');
      return requests;
    },
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  // Fetch sent friend requests
  const sentRequestsQuery = useQuery({
    queryKey: ['friendRequests', 'sent', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('[FriendsStore] No user ID, returning empty sent requests');
        return [];
      }
      console.log('[FriendsStore] Fetching sent requests for:', user.id);
      const requests = await databaseService.friendRequest.getSentFriendRequests(user.id);
      console.log('[FriendsStore] Found', requests.length, 'sent requests');
      return requests;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Update state when queries complete
  useEffect(() => {
    if (friendsQuery.data) {
      setFriends(friendsQuery.data);
    }
  }, [friendsQuery.data]);

  useEffect(() => {
    if (receivedRequestsQuery.data) {
      setPendingRequests(receivedRequestsQuery.data);
    }
  }, [receivedRequestsQuery.data]);

  useEffect(() => {
    if (sentRequestsQuery.data) {
      setSentRequests(sentRequestsQuery.data);
    }
  }, [sentRequestsQuery.data]);

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: async (receiverId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Guard: reject non-Firebase UID formats
      if (receiverId.includes('paris-') || receiverId.includes('test-') || receiverId.length < 20) {
        throw new Error('ID utilisateur invalide');
      }
      
      // Check if already friends
      const userDoc = await databaseService.user.getUser(user.id);
      if (userDoc?.friends?.includes(receiverId)) {
        throw new Error('Déjà ami avec cet utilisateur');
      }
      
      // Check if request already exists (sent or received)
      const [sent, received] = await Promise.all([
        databaseService.friendRequest.getSentFriendRequests(user.id),
        databaseService.friendRequest.getFriendRequests(user.id)
      ]);
      
      const existingSent = sent.find(r => r.receiverId === receiverId && r.status === 'pending');
      if (existingSent) {
        throw new Error('Demande déjà envoyée');
      }
      
      const existingReceived = received.find(r => r.senderId === receiverId && r.status === 'pending');
      if (existingReceived) {
        throw new Error('Vous avez déjà une demande de cet utilisateur');
      }
      
      return await databaseService.friendRequest.sendFriendRequest(user.id, receiverId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests', 'sent', user?.id] });
      console.log('✅ Friend request sent successfully');
    },
    onError: (error) => {
      console.error('❌ Error sending friend request:', error);
    }
  });

  // Respond to friend request mutation
  const respondToRequestMutation = useMutation({
    mutationFn: async ({ requestId, accept, senderId }: { requestId: string; accept: boolean; senderId: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      console.log('\ud83d\udd04 Responding to friend request:', { requestId, accept, senderId, receiverId: user.id });
      
      await databaseService.friendRequest.respondToFriendRequest(requestId, accept);
      
      if (accept) {
        // Add as friends in both user documents
        await databaseService.user.addFriend(user.id, senderId);
        
        // Create conversation for accepted friend request
        try {
          console.log('\ud83d\udcac Creating conversation between friends:', user.id, senderId);
          const conversationId = await databaseService.messaging.createConversation([user.id, senderId]);
          console.log('\u2705 Conversation created:', conversationId);
          return { conversationId };
        } catch (error) {
          console.error('\u274c Error creating conversation:', error);
          // Don't fail the friend request if conversation creation fails
        }
      }
      
      return { conversationId: undefined };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests', 'received', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests', 'sent', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['friends', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
      console.log('\u2705 Friend request responded successfully, conversation:', result?.conversationId);
    },
    onError: (error) => {
      console.error('\u274c Error responding to friend request:', error);
    }
  });

  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      await databaseService.user.removeFriend(user.id, friendId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', user?.id] });
      console.log('✅ Friend removed successfully');
    },
    onError: (error) => {
      console.error('❌ Error removing friend:', error);
    }
  });

  // Cancel friend request mutation
  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await databaseService.friendRequest.cancelFriendRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests', 'sent', user?.id] });
      console.log('✅ Friend request cancelled successfully');
    },
    onError: (error) => {
      console.error('❌ Error cancelling friend request:', error);
    }
  });

  // Public functions
  const sendFriendRequest = async (receiverId: string) => {
    return sendFriendRequestMutation.mutateAsync(receiverId);
  };

  const acceptFriendRequest = async (requestId: string, senderId: string) => {
    return respondToRequestMutation.mutateAsync({ requestId, accept: true, senderId });
  };

  const rejectFriendRequest = async (requestId: string, senderId: string) => {
    return respondToRequestMutation.mutateAsync({ requestId, accept: false, senderId });
  };

  const removeFriend = async (friendId: string) => {
    return removeFriendMutation.mutateAsync(friendId);
  };

  const cancelFriendRequest = async (requestId: string) => {
    return cancelRequestMutation.mutateAsync(requestId);
  };

  const refreshFriends = () => {
    queryClient.invalidateQueries({ queryKey: ['friends', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
  };

  // Check if user is friend
  const isFriend = (userId: string): boolean => {
    return friends.some(friend => friend.id === userId);
  };

  // Check if friend request already sent
  const isRequestSent = (userId: string): boolean => {
    return sentRequests.some(request => request.receiverId === userId && request.status === 'pending');
  };

  // Check if friend request received
  const hasReceivedRequest = (userId: string): boolean => {
    return pendingRequests.some(request => request.senderId === userId && request.status === 'pending');
  };

  return {
    friends,
    pendingRequests,
    sentRequests,
    isLoading: friendsQuery.isLoading || receivedRequestsQuery.isLoading || sentRequestsQuery.isLoading,
    isError: friendsQuery.isError || receivedRequestsQuery.isError || sentRequestsQuery.isError,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    cancelFriendRequest,
    refreshFriends,
    isFriend,
    isRequestSent,
    hasReceivedRequest,
    isSendingRequest: sendFriendRequestMutation.isPending,
    isRespondingToRequest: respondToRequestMutation.isPending,
  };
});
