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
      if (!user?.id) return [];
      
      const userDoc = await databaseService.user.getUser(user.id);
      if (!userDoc || !userDoc.friends || userDoc.friends.length === 0) return [];
      
      const friendsData = await databaseService.user.getUsers(userDoc.friends);
      return friendsData;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Fetch received friend requests
  const receivedRequestsQuery = useQuery({
    queryKey: ['friendRequests', 'received', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await databaseService.friendRequest.getFriendRequests(user.id);
    },
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  // Fetch sent friend requests
  const sentRequestsQuery = useQuery({
    queryKey: ['friendRequests', 'sent', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await databaseService.friendRequest.getSentFriendRequests(user.id);
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
      
      await databaseService.friendRequest.respondToFriendRequest(requestId, accept);
      
      if (accept) {
        await databaseService.user.addFriend(user.id, senderId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests', 'received', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['friends', user?.id] });
      console.log('✅ Friend request responded successfully');
    },
    onError: (error) => {
      console.error('❌ Error responding to friend request:', error);
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
