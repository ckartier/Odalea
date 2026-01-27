import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  TextInput,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { databaseService } from '@/services/database';
import { User } from '@/types';
import { 
  Trash2, Users, MessageSquare, Shield, Database, RefreshCw, Bot, AlertTriangle,
  Power, Settings, Bell, ChevronRight, X, Check,
  Activity, Utensils, Heart, Sparkles, Droplets, HelpCircle
} from 'lucide-react-native';
import { getAIAnalytics, AILogAnalytics, AIQuestionCategory, getRecentRiskAlerts, AILogEntry } from '@/services/ai-logging';
import { 
  AIConfig, getAIConfig, toggleAIEnabled, 
  toggleCategoryEnabled, setGlobalBanner, toggleMaintenanceMode 
} from '@/services/ai-config';
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
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [riskAlerts, setRiskAlerts] = useState<AILogEntry[]>([]);
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerType, setBannerType] = useState<'info' | 'warning' | 'error'>('info');
  const [showBannerEditor, setShowBannerEditor] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);

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

  const loadAIAnalytics = useCallback(async () => {
    setAiLoading(true);
    try {
      const [analytics, config, alerts] = await Promise.all([
        getAIAnalytics({ limitCount: 1000 }),
        getAIConfig(),
        getRecentRiskAlerts(20),
      ]);
      setAiAnalytics(analytics);
      setAiConfig(config);
      setRiskAlerts(alerts);
      if (config?.globalBanner) {
        setBannerMessage(config.globalBanner.message);
        setBannerType(config.globalBanner.type);
      }
      console.log('[Admin] AI Analytics loaded:', analytics);
      console.log('[Admin] AI Config loaded:', config);
    } catch (error) {
      console.error('Error loading AI analytics:', error);
      Alert.alert('Erreur', 'Impossible de charger les analytics IA');
    } finally {
      setAiLoading(false);
    }
  }, []);

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

  const getCategoryIcon = (category: AIQuestionCategory) => {
    const icons: Record<AIQuestionCategory, React.ReactNode> = {
      alimentation: <Utensils size={16} color="#6B7280" />,
      comportement: <Activity size={16} color="#6B7280" />,
      prevention: <Heart size={16} color="#6B7280" />,
      hygiene: <Droplets size={16} color="#6B7280" />,
      activite: <Sparkles size={16} color="#6B7280" />,
      autre: <HelpCircle size={16} color="#6B7280" />,
    };
    return icons[category];
  };

  const handleToggleAI = async (enabled: boolean) => {
    if (!user) return;
    setConfigLoading(true);
    try {
      const success = await toggleAIEnabled(enabled, user.id);
      if (success) {
        setAiConfig(prev => prev ? { ...prev, enabled } : null);
        Alert.alert('Succès', `Assistant IA ${enabled ? 'activé' : 'désactivé'}`);
      }
    } catch (error) {
      console.error('Error toggling AI:', error);
      Alert.alert('Erreur', 'Impossible de modifier la configuration');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleToggleCategory = async (category: AIQuestionCategory, enabled: boolean) => {
    if (!user) return;
    setConfigLoading(true);
    try {
      const success = await toggleCategoryEnabled(category, enabled, user.id);
      if (success) {
        setAiConfig(prev => prev ? {
          ...prev,
          enabledCategories: { ...prev.enabledCategories, [category]: enabled }
        } : null);
      }
    } catch (error) {
      console.error('Error toggling category:', error);
      Alert.alert('Erreur', 'Impossible de modifier la catégorie');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleToggleMaintenance = async (enabled: boolean) => {
    if (!user) return;
    setConfigLoading(true);
    try {
      const success = await toggleMaintenanceMode(enabled, user.id);
      if (success) {
        setAiConfig(prev => prev ? { ...prev, maintenanceMode: enabled } : null);
        Alert.alert('Succès', `Mode maintenance ${enabled ? 'activé' : 'désactivé'}`);
      }
    } catch (error) {
      console.error('Error toggling maintenance:', error);
      Alert.alert('Erreur', 'Impossible de modifier le mode maintenance');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleSaveBanner = async () => {
    if (!user) return;
    setConfigLoading(true);
    try {
      const success = await setGlobalBanner(
        { enabled: true, message: bannerMessage, type: bannerType },
        user.id
      );
      if (success) {
        setAiConfig(prev => prev ? {
          ...prev,
          globalBanner: { enabled: true, message: bannerMessage, type: bannerType }
        } : null);
        setShowBannerEditor(false);
        Alert.alert('Succès', 'Bandeau global activé');
      }
    } catch (error) {
      console.error('Error saving banner:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer le bandeau');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleDisableBanner = async () => {
    if (!user) return;
    setConfigLoading(true);
    try {
      const success = await setGlobalBanner(
        { enabled: false, message: '', type: 'info' },
        user.id
      );
      if (success) {
        setAiConfig(prev => prev ? {
          ...prev,
          globalBanner: { enabled: false, message: '', type: 'info' }
        } : null);
        setBannerMessage('');
        Alert.alert('Succès', 'Bandeau global désactivé');
      }
    } catch (error) {
      console.error('Error disabling banner:', error);
      Alert.alert('Erreur', 'Impossible de désactiver le bandeau');
    } finally {
      setConfigLoading(false);
    }
  };

  const getMaxCategoryCount = (): number => {
    if (!aiAnalytics) return 1;
    return Math.max(...Object.values(aiAnalytics.categoryBreakdown), 1);
  };

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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
                {aiLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                  </View>
                ) : aiAnalytics && aiConfig ? (
                  <>
                    {/* Status Global */}
                    <View style={styles.aiStatusHeader}>
                      <View style={styles.aiStatusBadge}>
                        <View style={[
                          styles.statusDot,
                          { backgroundColor: aiConfig.enabled && !aiConfig.maintenanceMode ? '#10B981' : '#EF4444' }
                        ]} />
                        <Text style={styles.aiStatusText}>
                          {aiConfig.maintenanceMode ? 'Maintenance' : aiConfig.enabled ? 'IA Active' : 'IA Désactivée'}
                        </Text>
                      </View>
                      <Text style={styles.lastUpdateText}>
                        Mis à jour: {aiConfig.updatedAt ? new Date(aiConfig.updatedAt).toLocaleString('fr-FR') : 'N/A'}
                      </Text>
                    </View>

                    {/* Contrôles Admin */}
                    <Text style={styles.sectionTitle}>Contrôles Admin</Text>
                    
                    <View style={styles.controlCard}>
                      <View style={styles.controlRow}>
                        <View style={styles.controlInfo}>
                          <Power size={20} color={aiConfig.enabled ? '#10B981' : '#EF4444'} />
                          <View style={styles.controlTextContainer}>
                            <Text style={styles.controlLabel}>Assistant IA</Text>
                            <Text style={styles.controlDescription}>Activer/désactiver globalement</Text>
                          </View>
                        </View>
                        <Switch
                          value={aiConfig.enabled}
                          onValueChange={handleToggleAI}
                          disabled={configLoading}
                          trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                        />
                      </View>

                      <View style={styles.controlDivider} />

                      <View style={styles.controlRow}>
                        <View style={styles.controlInfo}>
                          <Settings size={20} color={aiConfig.maintenanceMode ? '#F59E0B' : '#6B7280'} />
                          <View style={styles.controlTextContainer}>
                            <Text style={styles.controlLabel}>Mode Maintenance</Text>
                            <Text style={styles.controlDescription}>Désactive temporairement l&apos;IA</Text>
                          </View>
                        </View>
                        <Switch
                          value={aiConfig.maintenanceMode}
                          onValueChange={handleToggleMaintenance}
                          disabled={configLoading}
                          trackColor={{ false: '#E5E7EB', true: '#F59E0B' }}
                        />
                      </View>
                    </View>

                    {/* Bandeau Global */}
                    <View style={styles.controlCard}>
                      <View style={styles.controlRow}>
                        <View style={styles.controlInfo}>
                          <Bell size={20} color={aiConfig.globalBanner.enabled ? '#3B82F6' : '#6B7280'} />
                          <View style={styles.controlTextContainer}>
                            <Text style={styles.controlLabel}>Bandeau Global</Text>
                            <Text style={styles.controlDescription}>
                              {aiConfig.globalBanner.enabled ? 'Actif' : 'Désactivé'}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => setShowBannerEditor(!showBannerEditor)}
                        >
                          <Text style={styles.editButtonText}>Modifier</Text>
                          <ChevronRight size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                      </View>

                      {showBannerEditor && (
                        <View style={styles.bannerEditor}>
                          <TextInput
                            style={styles.bannerInput}
                            value={bannerMessage}
                            onChangeText={setBannerMessage}
                            placeholder="Message du bandeau..."
                            multiline
                            numberOfLines={3}
                          />
                          <View style={styles.bannerTypeRow}>
                            {(['info', 'warning', 'error'] as const).map((type) => (
                              <TouchableOpacity
                                key={type}
                                style={[
                                  styles.bannerTypeButton,
                                  bannerType === type && styles.bannerTypeButtonActive,
                                  { borderColor: type === 'info' ? '#3B82F6' : type === 'warning' ? '#F59E0B' : '#EF4444' }
                                ]}
                                onPress={() => setBannerType(type)}
                              >
                                <Text style={[
                                  styles.bannerTypeText,
                                  { color: type === 'info' ? '#3B82F6' : type === 'warning' ? '#F59E0B' : '#EF4444' }
                                ]}>
                                  {type === 'info' ? 'Info' : type === 'warning' ? 'Attention' : 'Erreur'}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          <View style={styles.bannerActions}>
                            <TouchableOpacity
                              style={[styles.bannerActionButton, styles.bannerSaveButton]}
                              onPress={handleSaveBanner}
                              disabled={!bannerMessage.trim()}
                            >
                              <Check size={16} color="#fff" />
                              <Text style={styles.bannerSaveText}>Activer</Text>
                            </TouchableOpacity>
                            {aiConfig.globalBanner.enabled && (
                              <TouchableOpacity
                                style={[styles.bannerActionButton, styles.bannerDisableButton]}
                                onPress={handleDisableBanner}
                              >
                                <X size={16} color="#EF4444" />
                                <Text style={styles.bannerDisableText}>Désactiver</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Catégories */}
                    <Text style={styles.sectionTitle}>Catégories de réponses</Text>
                    <View style={styles.controlCard}>
                      {(Object.keys(aiConfig.enabledCategories) as AIQuestionCategory[]).map((category, index) => (
                        <View key={category}>
                          {index > 0 && <View style={styles.controlDivider} />}
                          <View style={styles.controlRow}>
                            <View style={styles.controlInfo}>
                              {getCategoryIcon(category)}
                              <Text style={styles.controlLabel}>{getCategoryLabel(category)}</Text>
                            </View>
                            <Switch
                              value={aiConfig.enabledCategories[category]}
                              onValueChange={(enabled) => handleToggleCategory(category, enabled)}
                              disabled={configLoading}
                              trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
                            />
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* Stats Overview */}
                    <Text style={styles.sectionTitle}>Statistiques</Text>
                    
                    <View style={styles.statsGrid}>
                      <View style={styles.statCardSmall}>
                        <Bot size={24} color={COLORS.primary} />
                        <Text style={styles.statValueSmall}>{aiAnalytics.totalQuestions}</Text>
                        <Text style={styles.statLabelSmall}>Questions</Text>
                      </View>
                      <View style={[styles.statCardSmall, { borderColor: '#FEE2E2' }]}>
                        <AlertTriangle size={24} color="#EF4444" />
                        <Text style={[styles.statValueSmall, { color: '#EF4444' }]}>{aiAnalytics.riskAlertCount}</Text>
                        <Text style={styles.statLabelSmall}>Alertes risque</Text>
                      </View>
                    </View>

                    {/* Quota Breakdown */}
                    <View style={styles.analyticsCard}>
                      <Text style={styles.analyticsTitle}>Répartition Gratuit / Premium</Text>
                      <View style={styles.quotaRow}>
                        <View style={styles.quotaItem}>
                          <Text style={styles.quotaValue}>{aiAnalytics.quotaBreakdown.gratuit}</Text>
                          <Text style={styles.quotaLabel}>Gratuit</Text>
                          <View style={styles.quotaBar}>
                            <View style={[
                              styles.quotaBarFill,
                              { 
                                width: `${(aiAnalytics.quotaBreakdown.gratuit / Math.max(aiAnalytics.totalQuestions, 1)) * 100}%`,
                                backgroundColor: '#6B7280'
                              }
                            ]} />
                          </View>
                        </View>
                        <View style={styles.quotaItem}>
                          <Text style={[styles.quotaValue, { color: '#F59E0B' }]}>{aiAnalytics.quotaBreakdown.premium}</Text>
                          <Text style={styles.quotaLabel}>Premium</Text>
                          <View style={styles.quotaBar}>
                            <View style={[
                              styles.quotaBarFill,
                              { 
                                width: `${(aiAnalytics.quotaBreakdown.premium / Math.max(aiAnalytics.totalQuestions, 1)) * 100}%`,
                                backgroundColor: '#F59E0B'
                              }
                            ]} />
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Category Chart */}
                    <View style={styles.analyticsCard}>
                      <Text style={styles.analyticsTitle}>Catégories de questions</Text>
                      {Object.entries(aiAnalytics.categoryBreakdown).map(([category, count]) => (
                        <View key={category} style={styles.chartRow}>
                          <View style={styles.chartLabelContainer}>
                            {getCategoryIcon(category as AIQuestionCategory)}
                            <Text style={styles.chartLabel}>{getCategoryLabel(category as AIQuestionCategory)}</Text>
                          </View>
                          <View style={styles.chartBarContainer}>
                            <View style={[
                              styles.chartBar,
                              { width: `${(count / getMaxCategoryCount()) * 100}%` }
                            ]} />
                          </View>
                          <Text style={styles.chartValue}>{count}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Response Types */}
                    <View style={styles.analyticsCard}>
                      <Text style={styles.analyticsTitle}>Types de réponses</Text>
                      {Object.entries(aiAnalytics.responseTypeBreakdown).map(([type, count]) => (
                        <View key={type} style={styles.categoryRow}>
                          <View style={styles.responseTypeLabel}>
                            <View style={[
                              styles.responseTypeDot,
                              { backgroundColor: type === 'normal' ? '#10B981' : type === 'emergency' ? '#EF4444' : '#F59E0B' }
                            ]} />
                            <Text style={styles.categoryLabel}>
                              {type === 'normal' ? 'Normal' : type === 'emergency' ? 'Urgence' : type === 'medical_blocked' ? 'Médical bloqué' : type === 'error' ? 'Erreur' : type}
                            </Text>
                          </View>
                          <Text style={[styles.categoryValue, type !== 'normal' && { color: '#EF4444' }]}>{count}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Recent Risk Alerts */}
                    {riskAlerts.length > 0 && (
                      <View style={styles.analyticsCard}>
                        <Text style={styles.analyticsTitle}>Alertes risque récentes</Text>
                        {riskAlerts.slice(0, 5).map((alert, index) => (
                          <View key={index} style={styles.alertRow}>
                            <AlertTriangle size={14} color="#EF4444" />
                            <View style={styles.alertInfo}>
                              <Text style={styles.alertSpecies}>{alert.species}</Text>
                              <Text style={styles.alertCategory}>{getCategoryLabel(alert.category)}</Text>
                            </View>
                            <Text style={styles.alertTime}>{formatTimestamp(alert.timestamp)}</Text>
                          </View>
                        ))}
                      </View>
                    )}

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
  aiStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  aiStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  aiStatusText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  lastUpdateText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  controlCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  controlInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  controlTextContainer: {
    flex: 1,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#1F2937',
  },
  controlDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  controlDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500' as const,
  },
  bannerEditor: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bannerInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  bannerTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  bannerTypeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  bannerTypeButtonActive: {
    backgroundColor: '#F3F4F6',
  },
  bannerTypeText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  bannerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bannerActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bannerSaveButton: {
    backgroundColor: COLORS.primary,
  },
  bannerSaveText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  bannerDisableButton: {
    backgroundColor: '#FEE2E2',
  },
  bannerDisableText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCardSmall: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValueSmall: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginTop: 8,
  },
  statLabelSmall: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  chartLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 110,
  },
  chartLabel: {
    fontSize: 12,
    color: '#4B5563',
  },
  chartBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  chartBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  chartValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1F2937',
    width: 30,
    textAlign: 'right',
  },
  quotaBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  quotaBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  responseTypeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  responseTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  alertInfo: {
    flex: 1,
  },
  alertSpecies: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  alertCategory: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  alertTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
