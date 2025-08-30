import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { UserX, Search, AlertCircle } from 'lucide-react-native';

interface BlockedUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  blockedAt: number;
  reason?: string;
}

// Mock blocked users data
const mockBlockedUsers: BlockedUser[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    blockedAt: Date.now() - 86400000, // 1 day ago
    reason: 'Inappropriate messages',
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9e0e4b0?w=100&h=100&fit=crop&crop=face',
    blockedAt: Date.now() - 172800000, // 2 days ago
    reason: 'Spam',
  },
];

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>(mockBlockedUsers);

  const handleUnblockUser = (userId: string, userName: string) => {
    Alert.alert(
      'Débloquer l\'utilisateur',
      `Êtes-vous sûr de vouloir débloquer ${userName} ?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Débloquer',
          onPress: () => {
            setBlockedUsers(prev => prev.filter(user => user.id !== userId));
            Alert.alert('Utilisateur débloqué', `${userName} a été débloqué avec succès.`);
          },
        },
      ]
    );
  };

  const formatBlockedDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Aujourd\'hui';
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <View style={[styles.userItem, SHADOWS.small]}>
      <View style={styles.userInfo}>
        <Image
          source={{ uri: item.avatar || 'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=100' }}
          style={styles.avatar}
          contentFit="cover"
        />
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.blockedDate}>Bloqué {formatBlockedDate(item.blockedAt)}</Text>
          {item.reason && (
            <Text style={styles.blockReason}>{item.reason}</Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblockUser(item.id, `${item.firstName} ${item.lastName}`)}
      >
        <Text style={styles.unblockButtonText}>Débloquer</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Utilisateurs bloqués',
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.black,
        }}
      />
      <StatusBar style="dark" />

      {blockedUsers.length > 0 ? (
        <FlatList
          data={blockedUsers}
          renderItem={renderBlockedUser}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <UserX size={64} color={COLORS.darkGray} />
          <Text style={styles.emptyTitle}>Aucun utilisateur bloqué</Text>
          <Text style={styles.emptyDescription}>
            Vous n'avez bloqué aucun utilisateur. Les utilisateurs que vous bloquez apparaîtront ici.
          </Text>
        </View>
      )}

      <View style={styles.infoCard}>
        <AlertCircle size={20} color={COLORS.primary} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>À propos du blocage</Text>
          <Text style={styles.infoText}>
            Les utilisateurs bloqués ne peuvent pas vous envoyer de messages, voir votre profil ou interagir avec vos publications.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  blockedDate: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  blockReason: {
    fontSize: 12,
    color: COLORS.error,
    fontStyle: 'italic',
  },
  unblockButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unblockButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500' as const,
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.darkGray,
    lineHeight: 16,
  },
});