import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useAuth } from '@/hooks/auth-store';
import { useUsersDirectory } from '@/hooks/firestore-users';
import { useMessaging } from '@/hooks/messaging-store';
import { Search, UserCheck, UserPlus } from 'lucide-react-native';

export default function NewMessageScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { setSearch, usersQuery } = useUsersDirectory();
  const { createConversation, areFriends, hasPendingRequest, sendFriendRequest } = useMessaging();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery, setSearch]);
  
  const filteredUsers = (usersQuery.data ?? []).filter(u => u.id !== user?.id);
  const loading = usersQuery.isLoading;
  
  const handleUserPress = async (selectedUserId: string) => {
    try {
      const conversationId = await createConversation.mutateAsync(selectedUserId);
      router.replace(`/messages/${conversationId}`);
    } catch (error) {
      console.error('[NewMessage] Failed to create conversation', error);
    }
  };
  
  const renderUserItem = ({ item }: { item: typeof filteredUsers[0] }) => {
    const isFriend = areFriends(item.id);
    const isPending = hasPendingRequest(item.id);
    
    const handleAddFriend = async (e: any) => {
      e.stopPropagation();
      try {
        await sendFriendRequest.mutateAsync(item.id);
      } catch (error) {
        console.error('[NewMessage] Failed to send friend request', error);
      }
    };
    
    return (
      <TouchableOpacity
        style={[styles.userItem, SHADOWS.small]}
        onPress={() => handleUserPress(item.id)}
      >
        <Image
          source={{ uri: item.animalPhoto || item.pets?.[0]?.mainPhoto || 'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=500' }}
          style={styles.avatar}
          contentFit="cover"
        />
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>@{item.pseudo}</Text>
          <Text style={styles.userDetails}>
            {item.pets?.length || 0} animal{(item.pets?.length || 0) !== 1 ? 'aux' : ''}
            {item.isCatSitter ? ' • Gardien' : ''}
          </Text>
        </View>
        
        <View style={styles.actionContainer}>
          {isFriend ? (
            <View style={styles.friendBadge}>
              <UserCheck size={16} color={COLORS.maleAccent} />
            </View>
          ) : isPending ? (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>En attente</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.notFriendBadge} onPress={handleAddFriend}>
              <UserPlus size={16} color={COLORS.darkGray} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <Stack.Screen options={{ title: 'Nouveau message' }} />
      
      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.darkGray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher des utilisateurs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.maleAccent} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Aucun utilisateur trouvé'
                  : 'Commencez à taper pour rechercher des utilisateurs'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    margin: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  userDetails: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  actionContainer: {
    marginLeft: 8,
  },
  friendBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFriendBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
  },
  pendingText: {
    fontSize: 11,
    color: COLORS.darkGray,
    fontWeight: '500' as const,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
});