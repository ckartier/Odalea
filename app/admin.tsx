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
import { Trash2, Users, MessageSquare, Shield, Database, RefreshCw, Bot, AlertTriangle } from 'lucide-react-native';
import { getAIAnalytics, AILogAnalytics, AIQuestionCategory } from '@/services/ai-logging';
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
  const [selectedTab, setSelectedTab] = useState<'stats' | 'users' | 'content' | 'ai'>('stats');
  const [aiAnalytics, setAiAnalytics] = useState<AILogAnalytics | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

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

  const loadAIAnalytics = async () => {
    setAiLoading(true);
    try {
      const analytics = await getAIAnalytics({ limitCount: 1000 });
      setAiAnalytics(analytics);
      console.log('[Admin] AI Analytics loaded:', analytics);
    } catch (error) {
      console.error('Error loading AI analytics:', error);
      Alert.alert('Erreur', 'Impossible de charger les analytics IA');
    } finally {
      setAiLoading(false);
    }
  };

  const getCategoryLabel = (category: AIQuestionCategory): string => {
    const labels: Record<AIQuestionCategory, string> = {
      alimentation: 'Alimentation',
      comportement: 'Comportement',
      prevention: 'Prévention',
      hygiene: 'Hygiène',
      activite: 'Activité',
      autre: 'Autre',
    };
    return labels[category] || category;
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

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'ai' && styles.tabActive]}
          onPress={() => {
            setSelectedTab('ai');
            if (!aiAnalytics) loadAIAnalytics();
          }}
        >
          <Bot size={20} color={selectedTab === 'ai' ? COLORS.primary : '#666'} />
          <Text style={[styles.tabText, selectedTab === 'ai' && styles.tabTextActive]}>
            IA
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

            {selectedTab === 'ai' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Analytics Assistant IA</Text>
                
                {aiLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                  </View>
                ) : aiAnalytics ? (
                  <>
                    <View style={styles.statCard}>
                      <Bot size={32} color={COLORS.primary} />
                      <Text style={styles.statValue}>{aiAnalytics.totalQuestions}</Text>
                      <Text style={styles.statLabel}>Questions totales</Text>
                    </View>

                    <View style={[styles.statCard, styles.warningCard]}>
                      <AlertTriangle size={32} color="#EF4444" />
                      <Text style={styles.statValue}>{aiAnalytics.riskAlertCount}</Text>
                      <Text style={styles.statLabel}>Alertes risque</Text>
                    </View>

                    <View style={styles.analyticsCard}>
                      <Text style={styles.analyticsTitle}>Répartition Gratuit / Premium</Text>
                      <View style={styles.quotaRow}>
                        <View style={styles.quotaItem}>
                          <Text style={styles.quotaValue}>{aiAnalytics.quotaBreakdown.gratuit}</Text>
                          <Text style={styles.quotaLabel}>Gratuit</Text>
                        </View>
                        <View style={styles.quotaItem}>
                          <Text style={[styles.quotaValue, { color: '#F59E0B' }]}>{aiAnalytics.quotaBreakdown.premium}</Text>
                          <Text style={styles.quotaLabel}>Premium</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.analyticsCard}>
                      <Text style={styles.analyticsTitle}>Catégories de questions</Text>
                      {Object.entries(aiAnalytics.categoryBreakdown).map(([category, count]) => (
                        <View key={category} style={styles.categoryRow}>
                          <Text style={styles.categoryLabel}>{getCategoryLabel(category as AIQuestionCategory)}</Text>
                          <Text style={styles.categoryValue}>{count}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.analyticsCard}>
                      <Text style={styles.analyticsTitle}>Types de réponses</Text>
                      {Object.entries(aiAnalytics.responseTypeBreakdown).map(([type, count]) => (
                        <View key={type} style={styles.categoryRow}>
                          <Text style={styles.categoryLabel}>
                            {type === 'normal' ? 'Normal' : type === 'emergency' ? 'Urgence' : type === 'medical_blocked' ? 'Médical bloqué' : type}
                          </Text>
                          <Text style={[styles.categoryValue, type !== 'normal' && { color: '#EF4444' }]}>{count}</Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity style={styles.refreshButton} onPress={loadAIAnalytics}>
                      <RefreshCw size={20} color={COLORS.primary} />
                      <Text style={styles.refreshButtonText}>Actualiser</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.emptyState}>
                    <Bot size={48} color="#9CA3AF" />
                    <Text style={styles.emptyStateText}>Aucune donnée disponible</Text>
                    <TouchableOpacity style={styles.refreshButton} onPress={loadAIAnalytics}>
                      <RefreshCw size={20} color={COLORS.primary} />
                      <Text style={styles.refreshButtonText}>Charger les données</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
  analyticsCard: {
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
  analyticsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 12,
  },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quotaItem: {
    alignItems: 'center',
  },
  quotaValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.primary,
  },
  quotaLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 24,
  },
});
