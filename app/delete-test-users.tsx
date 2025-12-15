import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { collection, getDocs, query, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Trash2 } from 'lucide-react-native';

interface TestUser {
  id: string;
  pseudonym?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export default function DeleteTestUsersScreen() {
  const [users, setUsers] = useState<TestUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const loadedUsers: TestUser[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedUsers.push({
          id: doc.id,
          pseudonym: data.pseudonym,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email
        });
      });
      
      setUsers(loadedUsers);
      console.log(`Loaded ${loadedUsers.length} users`);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cet utilisateur et toutes ses données ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(userId);
              console.log(`Deleting user: ${userId}`);

              // Delete user's pets
              const petsRef = collection(db, 'pets');
              const petsQuery = query(petsRef, where('ownerId', '==', userId));
              const petsSnapshot = await getDocs(petsQuery);
              console.log(`Found ${petsSnapshot.size} pets to delete`);
              for (const petDoc of petsSnapshot.docs) {
                await deleteDoc(doc(db, 'pets', petDoc.id));
              }

              // Delete user's posts
              const postsRef = collection(db, 'posts');
              const postsQuery = query(postsRef, where('userId', '==', userId));
              const postsSnapshot = await getDocs(postsQuery);
              console.log(`Found ${postsSnapshot.size} posts to delete`);
              for (const postDoc of postsSnapshot.docs) {
                await deleteDoc(doc(db, 'posts', postDoc.id));
              }

              // Delete user's comments
              const commentsRef = collection(db, 'comments');
              const commentsQuery = query(commentsRef, where('userId', '==', userId));
              const commentsSnapshot = await getDocs(commentsQuery);
              console.log(`Found ${commentsSnapshot.size} comments to delete`);
              for (const commentDoc of commentsSnapshot.docs) {
                await deleteDoc(doc(db, 'comments', commentDoc.id));
              }

              // Delete user's messages
              const messagesRef = collection(db, 'messages');
              const messagesQuery = query(messagesRef, where('senderId', '==', userId));
              const messagesSnapshot = await getDocs(messagesQuery);
              console.log(`Found ${messagesSnapshot.size} messages to delete`);
              for (const messageDoc of messagesSnapshot.docs) {
                await deleteDoc(doc(db, 'messages', messageDoc.id));
              }

              // Delete user's conversations
              const conversationsRef = collection(db, 'conversations');
              const convQuery = query(conversationsRef, where('participants', 'array-contains', userId));
              const convSnapshot = await getDocs(convQuery);
              console.log(`Found ${convSnapshot.size} conversations to delete`);
              for (const convDoc of convSnapshot.docs) {
                await deleteDoc(doc(db, 'conversations', convDoc.id));
              }

              // Delete friend requests
              const friendRequestsRef = collection(db, 'friendRequests');
              const frQuery1 = query(friendRequestsRef, where('senderId', '==', userId));
              const frSnapshot1 = await getDocs(frQuery1);
              for (const frDoc of frSnapshot1.docs) {
                await deleteDoc(doc(db, 'friendRequests', frDoc.id));
              }
              const frQuery2 = query(friendRequestsRef, where('receiverId', '==', userId));
              const frSnapshot2 = await getDocs(frQuery2);
              for (const frDoc of frSnapshot2.docs) {
                await deleteDoc(doc(db, 'friendRequests', frDoc.id));
              }

              // Delete notifications
              const notificationsRef = collection(db, 'notifications');
              const notifQuery = query(notificationsRef, where('userId', '==', userId));
              const notifSnapshot = await getDocs(notifQuery);
              console.log(`Found ${notifSnapshot.size} notifications to delete`);
              for (const notifDoc of notifSnapshot.docs) {
                await deleteDoc(doc(db, 'notifications', notifDoc.id));
              }

              // Finally, delete the user
              await deleteDoc(doc(db, 'users', userId));
              console.log(`✅ User ${userId} deleted successfully`);

              Alert.alert('Succès', 'Utilisateur supprimé avec succès');
              setUsers(users.filter(u => u.id !== userId));
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'utilisateur');
            } finally {
              setDeleting(null);
            }
          }
        }
      ]
    );
  };

  const deleteAllTestUsers = async () => {
    const testUserIds = ['user-1', 'user-2'];
    const testUsers = users.filter(u => testUserIds.includes(u.id));
    
    if (testUsers.length === 0) {
      Alert.alert('Info', 'Aucun utilisateur test trouvé');
      return;
    }

    Alert.alert(
      'Supprimer tous les utilisateurs test',
      `${testUsers.length} utilisateurs test seront supprimés`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer tout',
          style: 'destructive',
          onPress: async () => {
            for (const user of testUsers) {
              try {
                setDeleting(user.id);
                await deleteUserData(user.id);
              } catch (error) {
                console.error(`Error deleting ${user.id}:`, error);
              }
            }
            setDeleting(null);
            Alert.alert('Succès', 'Tous les utilisateurs test ont été supprimés');
            await loadUsers();
          }
        }
      ]
    );
  };

  const deleteUserData = async (userId: string) => {
    const collections = [
      { name: 'pets', field: 'ownerId' },
      { name: 'posts', field: 'userId' },
      { name: 'comments', field: 'userId' },
      { name: 'messages', field: 'senderId' },
      { name: 'notifications', field: 'userId' }
    ];

    for (const col of collections) {
      const colRef = collection(db, col.name);
      const q = query(colRef, where(col.field, '==', userId));
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, col.name, docSnap.id));
      }
    }

    const conversationsRef = collection(db, 'conversations');
    const convQuery = query(conversationsRef, where('participants', 'array-contains', userId));
    const convSnapshot = await getDocs(convQuery);
    for (const convDoc of convSnapshot.docs) {
      await deleteDoc(doc(db, 'conversations', convDoc.id));
    }

    const friendRequestsRef = collection(db, 'friendRequests');
    const frQuery1 = query(friendRequestsRef, where('senderId', '==', userId));
    const frSnapshot1 = await getDocs(frQuery1);
    for (const frDoc of frSnapshot1.docs) {
      await deleteDoc(doc(db, 'friendRequests', frDoc.id));
    }
    const frQuery2 = query(friendRequestsRef, where('receiverId', '==', userId));
    const frSnapshot2 = await getDocs(frQuery2);
    for (const frDoc of frSnapshot2.docs) {
      await deleteDoc(doc(db, 'friendRequests', frDoc.id));
    }

    await deleteDoc(doc(db, 'users', userId));
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Supprimer utilisateurs test',
          headerStyle: { backgroundColor: '#FF6B6B' },
          headerTintColor: '#fff'
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.loadButton}
          onPress={loadUsers}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loadButtonText}>Charger les utilisateurs</Text>
          )}
        </TouchableOpacity>

        {users.length > 0 && (
          <TouchableOpacity
            style={styles.deleteAllButton}
            onPress={deleteAllTestUsers}
            disabled={!!deleting}
          >
            <Text style={styles.deleteAllButtonText}>Supprimer tous les tests</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.list}>
        {users.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userId}>{user.id}</Text>
              <Text style={styles.userName}>
                {user.pseudonym || `${user.firstName} ${user.lastName}`}
              </Text>
              {user.email && <Text style={styles.userEmail}>{user.email}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.deleteButton, deleting === user.id && styles.deleteButtonDisabled]}
              onPress={() => deleteUser(user.id)}
              disabled={!!deleting}
            >
              {deleting === user.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Trash2 size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        ))}

        {users.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucun utilisateur chargé</Text>
            <Text style={styles.emptySubtext}>Appuyez sur &quot;Charger les utilisateurs&quot;</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 12
  },
  loadButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  loadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  deleteAllButton: {
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  deleteAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  list: {
    flex: 1
  },
  userCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  userInfo: {
    flex: 1
  },
  userId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  userName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2
  },
  userEmail: {
    fontSize: 12,
    color: '#999'
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12
  },
  deleteButtonDisabled: {
    opacity: 0.5
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999'
  }
});
