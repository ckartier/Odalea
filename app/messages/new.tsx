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
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useAuth } from '@/hooks/auth-store';
import { mockUsers } from '@/mocks/users';
import { Search, UserCheck, UserPlus } from 'lucide-react-native';

export default function NewMessageScreen() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // If userId is provided, navigate to chat with that user
  useEffect(() => {
    if (userId) {
      // In a real app, we would create or get an existing conversation
      // For demo, we'll just navigate to a mock conversation
      router.replace('/messages/conv1');
    }
  }, [userId]);
  
  // Filter users based on search query
  const filteredUsers = mockUsers.filter(u => {
    if (u.id === user?.id) return false;
    
    const pseudo = u.pseudo.toLowerCase();
    return pseudo.includes(searchQuery.toLowerCase());
  });
  
  const handleUserPress = (selectedUserId: string) => {
    // In a real app, we would create or get an existing conversation
    // For demo, we'll just navigate to a mock conversation
    router.replace('/messages/conv1');
  };
  
  const renderUserItem = ({ item }: { item: typeof mockUsers[0] }) => {
    return (
      <TouchableOpacity
        style={[styles.userItem, SHADOWS.small]}
        onPress={() => handleUserPress(item.id)}
      >
        <Image
          source={{ uri: item.pets[0]?.mainPhoto || 'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=500' }}
          style={styles.avatar}
          contentFit="cover"
        />
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>@{item.pseudo}</Text>
          <Text style={styles.userDetails}>
            {item.pets.length} pet{item.pets.length !== 1 ? 's' : ''}
            {item.isCatSitter ? ' • Cat Sitter' : ''}
          </Text>
        </View>
        
        <View style={styles.actionContainer}>
          {Math.random() > 0.5 ? (
            <View style={styles.friendBadge}>
              <UserCheck size={16} color={COLORS.maleAccent} />
            </View>
          ) : (
            <View style={styles.notFriendBadge}>
              <UserPlus size={16} color={COLORS.darkGray} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <Stack.Screen options={{ title: 'New Message' }} />
      
      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.darkGray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
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
                  ? 'No users found matching your search'
                  : 'Start typing to search for users'}
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