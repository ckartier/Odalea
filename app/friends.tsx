import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
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
  UserPlus, 
  UserMinus, 
  MessageCircle,
  MoreVertical,
  UserX,
  Heart,
} from 'lucide-react-native';

interface Friend {
  id: string;
  firstName: string;
  lastName: string;
  pseudo: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: number;
  mutualFriends: number;
  location: string;
  pets: Array<{
    name: string;
    species: string;
  }>;
}

// Mock friends data
const mockFriends: Friend[] = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    pseudo: 'SarahParis',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9e0e4b0?w=100&h=100&fit=crop&crop=face',
    isOnline: true,
    mutualFriends: 3,
    location: 'Paris',
    pets: [{ name: 'Luna', species: 'Chat' }],
  },
  {
    id: '2',
    firstName: 'Mike',
    lastName: 'Chen',
    pseudo: 'MikeLyon',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    isOnline: false,
    lastSeen: Date.now() - 3600000, // 1 hour ago
    mutualFriends: 1,
    location: 'Lyon',
    pets: [{ name: 'Max', species: 'Chien' }],
  },
  {
    id: '3',
    firstName: 'Emma',
    lastName: 'Wilson',
    pseudo: 'EmmaMarseille',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    isOnline: true,
    mutualFriends: 5,
    location: 'Marseille',
    pets: [{ name: 'Bella', species: 'Chien' }, { name: 'Milo', species: 'Chat' }],
  },
];

export default function FriendsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'suggestions'>('friends');

  const filteredFriends = friends.filter(friend =>
    friend.pseudo.toLowerCase().includes(searchQuery.toLowerCase())
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
          onPress: () => {
            setFriends(prev => prev.filter(friend => friend.id !== friendId));
            Alert.alert('Ami supprimé', `@${friendName} a été supprimé de votre liste d'amis.`);
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
          onPress: () => {
            setFriends(prev => prev.filter(friend => friend.id !== friendId));
            Alert.alert('Utilisateur bloqué', `@${friendName} a été bloqué avec succès.`);
          },
        },
      ]
    );
  };

  const handleSendMessage = (friendId: string) => {
    router.push(`/messages/${friendId}`);
  };

  const showFriendOptions = (friend: Friend) => {
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

  const formatLastSeen = (timestamp: number) => {
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `Il y a ${diffMinutes} min`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `Il y a ${hours}h`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return `Il y a ${days}j`;
    }
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={[styles.friendItem, SHADOWS.small]}
      onPress={() => router.push(`/profile/${item.id}`)}
    >
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: item.avatar || 'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=100' }}
            style={styles.avatar}
            contentFit="cover"
          />
          {item.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>@{item.pseudo}</Text>
          <Text style={styles.friendLocation}>{item.location}</Text>
          
          <View style={styles.friendMeta}>
            <Text style={styles.mutualFriends}>
              {item.mutualFriends} ami{item.mutualFriends > 1 ? 's' : ''} en commun
            </Text>
            {!item.isOnline && item.lastSeen && (
              <Text style={styles.lastSeen}> • {formatLastSeen(item.lastSeen)}</Text>
            )}
          </View>
          
          <View style={styles.petsContainer}>
            {item.pets.map((pet, index) => (
              <Text key={index} style={styles.petInfo}>
                {pet.name} ({pet.species})
                {index < item.pets.length - 1 && ', '}
              </Text>
            ))}
          </View>
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Mes amis',
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.black,
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
            Mes amis ({friends.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'suggestions' && styles.activeTab]}
          onPress={() => setActiveTab('suggestions')}
        >
          <UserPlus size={20} color={activeTab === 'suggestions' ? COLORS.primary : COLORS.darkGray} />
          <Text style={[styles.tabText, activeTab === 'suggestions' && styles.activeTabText]}>
            Suggestions
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'friends' ? (
        filteredFriends.length > 0 ? (
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
        )
      ) : (
        <View style={styles.emptyContainer}>
          <Heart size={64} color={COLORS.darkGray} />
          <Text style={styles.emptyTitle}>Suggestions d'amis</Text>
          <Text style={styles.emptyDescription}>
            Les suggestions d'amis basées sur vos intérêts et votre localisation apparaîtront bientôt ici.
          </Text>
        </View>
      )}
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
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.darkGray,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
  listContent: {
    padding: 16,
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
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
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
  friendMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  mutualFriends: {
    fontSize: 12,
    color: COLORS.primary,
  },
  lastSeen: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  petsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  petInfo: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontStyle: 'italic',
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