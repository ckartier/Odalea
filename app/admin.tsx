import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { databaseService } from '@/services/database';
import { User } from '@/types';
import { Trash2, Users, MessageSquare, Shield, Database, RefreshCw } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

export default function AdminScreen() {
  const { user } = useFirebaseUser();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPets: 0,
    totalPosts: 0,
    testUsers: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTab, setSelectedTab] = useState<'stats' | 'users' | 'content'>('stats');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      Alert.alert('Accès refusé', 'Vous n\'avez pas les permissions nécessaires');
      router.back();
      return;
    }
    loadAdminData();
  }, [user]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const allUsers = await databaseService.user.getAllUsers();
      const testUsers = allUsers.filter(u => 
        u.email?.includes('test') || 
        u.firstName?.toLowerCase().includes('test') ||
        u.lastName?.toLowerCase().includes('test')
      );

      setUsers(allUsers);
      setStats({
        totalUsers: allUsers.length,
        totalPets: allUsers.reduce((acc, u) => acc + (u.pets?.length || 0), 0),
        totalPosts: 0,
        testUsers: testUsers.length,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const deleteTestUsers = async () => {
    Alert.alert(
      'Confirmation',
      `Êtes-vous sûr de vouloir supprimer ${stats.testUsers} utilisateurs test ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const testUsers = users.filter(u => 
                u.email?.includes('test') || 
                u.firstName?.toLowerCase().includes('test') ||
                u.lastName?.toLowerCase().includes('test')
              );

              for (const user of testUsers) {
                await databaseService.user.deleteUser(user.id);
              }

              Alert.alert('Succès', `${testUsers.length} utilisateurs test supprimés`);
              await loadAdminData();
            } catch (error) {
              console.error('Error deleting test users:', error);
              Alert.alert('Erreur', 'Impossible de supprimer les utilisateurs test');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const deleteUser = async (userId: string) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await databaseService.user.deleteUser(userId);
              Alert.alert('Succès', 'Utilisateur supprimé');
              await loadAdminData();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'utilisateur');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const makeAdmin = async (userId: string) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir promouvoir cet utilisateur en admin ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Promouvoir',
          onPress: async () => {
            setLoading(true);
            try {
              const targetUser = users.find(u => u.id === userId);
              if (targetUser) {
                await databaseService.user.saveUser({ ...targetUser, role: 'admin' });
                Alert.alert('Succès', 'Utilisateur promu en admin');
                await loadAdminData();
              }
            } catch (error) {
              console.error('Error making admin:', error);
              Alert.alert('Erreur', 'Impossible de promouvoir l\'utilisateur');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!user || user.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Accès refusé</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Administration',
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: '#fff',
        }}
      />

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'stats' && styles.tabActive]}
          onPress={() => setSelectedTab('stats')}
        >
          <Database size={20} color={selectedTab === 'stats' ? COLORS.primary : '#666'} />
          <Text style={[styles.tabText, selectedTab === 'stats' && styles.tabTextActive]}>
            Stats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'users' && styles.tabActive]}
          onPress={() => setSelectedTab('users')}
        >
          <Users size={20} color={selectedTab === 'users' ? COLORS.primary : '#666'} />
          <Text style={[styles.tabText, selectedTab === 'users' && styles.tabTextActive]}>
            Utilisateurs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'content' && styles.tabActive]}
          onPress={() => setSelectedTab('content')}
        >
          <MessageSquare size={20} color={selectedTab === 'content' ? COLORS.primary : '#666'} />
          <Text style={[styles.tabText, selectedTab === 'content' && styles.tabTextActive]}>
            Contenu
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {selectedTab === 'stats' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Statistiques globales</Text>
                
                <View style={styles.statCard}>
                  <Users size={32} color={COLORS.primary} />
                  <Text style={styles.statValue}>{stats.totalUsers}</Text>
                  <Text style={styles.statLabel}>Utilisateurs</Text>
                </View>

                <View style={styles.statCard}>
                  <Database size={32} color={COLORS.secondary} />
                  <Text style={styles.statValue}>{stats.totalPets}</Text>
                  <Text style={styles.statLabel}>Animaux</Text>
                </View>

                <View style={styles.statCard}>
                  <MessageSquare size={32} color={COLORS.accent} />
                  <Text style={styles.statValue}>{stats.totalPosts}</Text>
                  <Text style={styles.statLabel}>Publications</Text>
                </View>

                <View style={[styles.statCard, styles.warningCard]}>
                  <Trash2 size={32} color="#EF4444" />
                  <Text style={styles.statValue}>{stats.testUsers}</Text>
                  <Text style={styles.statLabel}>Utilisateurs test</Text>
                  <TouchableOpacity
                    style={styles.dangerButton}
                    onPress={deleteTestUsers}
                    disabled={stats.testUsers === 0}
                  >
                    <Trash2 size={16} color="#fff" />
                    <Text style={styles.dangerButtonText}>Supprimer tous les tests</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.refreshButton} onPress={loadAdminData}>
                  <RefreshCw size={20} color={COLORS.primary} />
                  <Text style={styles.refreshButtonText}>Actualiser</Text>
                </TouchableOpacity>
              </View>
            )}

            {selectedTab === 'users' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Gestion des utilisateurs</Text>
                
                {users.map((u) => (
                  <View key={u.id} style={styles.userCard}>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>
                        {u.firstName} {u.lastName}
                      </Text>
                      <Text style={styles.userEmail}>{u.email}</Text>
                      <Text style={styles.userMeta}>
                        {u.pets?.length || 0} animaux • {u.role === 'admin' ? '👑 Admin' : 'Utilisateur'}
                      </Text>
                    </View>
                    
                    <View style={styles.userActions}>
                      {u.role !== 'admin' && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => makeAdmin(u.id)}
                        >
                          <Shield size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => deleteUser(u.id)}
                      >
                        <Trash2 size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {selectedTab === 'content' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Gestion du contenu</Text>
                <Text style={styles.comingSoon}>Fonctionnalités à venir...</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#666',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  warningCard: {
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  refreshButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  userMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 40,
  },
  comingSoon: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 40,
  },
});
