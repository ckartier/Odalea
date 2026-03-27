import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { useFirebaseUser } from '@/hooks/firebase-user-store';

import {
  Bell,
  Globe,
  Shield,
  HelpCircle,
  MessageSquare,
  FileText,
  Trash2,
  ChevronRight,
  LogOut,
  Check,
  X,
  UserX,
  Info,
  Lock,
  Stethoscope,
} from 'lucide-react-native';
import { useVetAssistant } from '@/hooks/vet-assistant-store';
import { deleteUserAccount } from '@/services/account-deletion';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, currentLocale, changeLanguage } = useI18n();
  const { signOut } = useFirebaseUser();
  const { chatHistories, startNewConversation } = useVetAssistant();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleLanguageChange = async (lang: 'en' | 'fr' | 'es' | 'de' | 'it') => {
    await changeLanguage(lang);
    setShowLanguageModal(false);
  };



  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/splash');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données (profil, animaux, messages, photos) seront définitivement supprimées.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              console.log('[Settings] Starting account deletion...');
              const result = await deleteUserAccount();
              
              if (result.success) {
                Alert.alert(
                  'Compte supprimé',
                  'Votre compte et toutes vos données ont été supprimés avec succès.',
                  [{ text: 'OK', onPress: () => router.replace('/onboarding') }]
                );
              } else {
                Alert.alert(
                  'Erreur',
                  result.error || 'Impossible de supprimer le compte. Veuillez réessayer.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('[Settings] Account deletion error:', error);
              Alert.alert(
                'Erreur',
                'Une erreur inattendue est survenue. Veuillez réessayer.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  const handleClearVetHistory = () => {
    const petIds = Object.keys(chatHistories);
    if (petIds.length === 0) {
      Alert.alert(
        'Historique vide',
        'Aucun historique de conseils bien-être à supprimer.'
      );
      return;
    }

    Alert.alert(
      'Supprimer l\'historique',
      'Voulez-vous supprimer tout l\'historique de l\'assistant bien-être animal ? Cette action est irréversible.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            petIds.forEach(petId => startNewConversation(petId));
            Alert.alert('Historique supprimé', 'L\'historique de l\'assistant bien-être a été supprimé.');
          },
        },
      ]
    );
  };

  const getLanguageName = () => {
    switch (currentLocale) {
      case 'fr': return 'Français';
      case 'en': return 'English';
      case 'es': return 'Español';
      case 'de': return 'Deutsch';
      case 'it': return 'Italiano';
      default: return 'Français';
    }
  };

  const preferencesItems = [
    {
      id: 'language',
      title: t('settings.language'),
      icon: <Globe size={22} color={COLORS.black} />,
      subtitle: getLanguageName(),
      onPress: () => setShowLanguageModal(true),
    },
    {
      id: 'notifications',
      title: t('settings.notifications'),
      icon: <Bell size={22} color={COLORS.black} />,
      onPress: () => router.push('/settings/notifications'),
    },
  ];

  const securityItems = [
    {
      id: 'privacy',
      title: t('settings.privacy'),
      icon: <Lock size={22} color={COLORS.black} />,
      onPress: () => router.push('/settings/privacy'),
    },
    {
      id: 'blocked-users',
      title: t('settings.blocked_users'),
      icon: <UserX size={22} color={COLORS.black} />,
      onPress: () => router.push('/settings/blocked-users'),
    },
    {
      id: 'vet-history',
      title: 'Historique bien-être animal',
      subtitle: 'Supprimer l\'historique de l\'assistant',
      icon: <Stethoscope size={22} color={COLORS.black} />,
      onPress: handleClearVetHistory,
    },
    {
      id: 'rgpd',
      title: 'RGPD',
      icon: <Shield size={22} color={COLORS.black} />,
      onPress: () => router.push('/settings/rgpd'),
    },
  ];

  const supportItems = [
    {
      id: 'help',
      title: t('settings.help'),
      icon: <HelpCircle size={22} color={COLORS.black} />,
      onPress: () => router.push('/settings/help'),
    },
    {
      id: 'faq',
      title: 'FAQ',
      icon: <Info size={22} color={COLORS.black} />,
      onPress: () => router.push('/settings/faq'),
    },
    {
      id: 'support',
      title: t('settings.contact_support'),
      icon: <MessageSquare size={22} color={COLORS.black} />,
      onPress: () => router.push('/settings/support'),
    },
  ];

  const legalItems = [
    {
      id: 'terms',
      title: t('settings.terms'),
      icon: <FileText size={22} color={COLORS.black} />,
      onPress: () => router.push('/legal/terms'),
    },
    {
      id: 'privacy-policy',
      title: t('settings.privacy_policy'),
      icon: <FileText size={22} color={COLORS.black} />,
      onPress: () => router.push('/legal/privacy'),
    },
  ];

  const dangerousItems = [
    {
      id: 'logout',
      title: 'Se déconnecter',
      icon: <LogOut size={24} color={COLORS.error} />,
      onPress: handleSignOut,
      textColor: COLORS.error,
    },
    {
      id: 'delete',
      title: t('settings.delete_account'),
      icon: <Trash2 size={24} color={COLORS.error} />,
      onPress: handleDeleteAccount,
      textColor: COLORS.error,
    },
  ];

  const renderSettingItem = (item: any, isFirst: boolean, isLast: boolean) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.settingItem,
        isFirst && styles.settingItemFirst,
        isLast && styles.settingItemLast,
        !isLast && styles.settingItemBorder,
      ]}
      onPress={item.onPress}
      activeOpacity={0.6}
    >
      <View style={[styles.settingIcon, { backgroundColor: item.iconBg || '#F2F2F7' }]}>
        {item.icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: item.textColor || '#000' }]}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        )}
      </View>
      <ChevronRight size={18} color="#C7C7CC" />
    </TouchableOpacity>
  );

  const renderSection = (items: any[]) => (
    <View style={styles.sectionCard}>
      {items.map((item, index) => renderSettingItem(item, index === 0, index === items.length - 1))}
    </View>
  );

  const languages = [
    { code: 'fr' as const, name: 'Français', flag: '🇫🇷' },
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'es' as const, name: 'Español', flag: '🇪🇸' },
    { code: 'de' as const, name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it' as const, name: 'Italiano', flag: '🇮🇹' },
  ];

  if (isDeletingAccount) {
    return (
      <View style={styles.deletingContainer}>
        <ActivityIndicator size="large" color={COLORS.black} />
        <Text style={styles.deletingText}>Suppression de votre compte...</Text>
        <Text style={styles.deletingSubtext}>Cela peut prendre quelques instants</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('settings.settings'),
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.black,
          headerShadowVisible: false,
        }}
      />
      <StatusBar style="dark" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>
          {renderSection(preferencesItems)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.security')}</Text>
          {renderSection(securityItems)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.support')}</Text>
          {renderSection(supportItems)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.legal')}</Text>
          {renderSection(legalItems)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          {renderSection(dangerousItems)}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Odalea v1.0.0</Text>
          <Text style={styles.footerText}>© 2025 Odalea. {t('settings.all_rights_reserved')}</Text>
        </View>
      </ScrollView>

      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLanguageModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.language')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)} style={styles.closeButton}>
                <X size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            <View style={styles.languageList}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={styles.languageItem}
                  onPress={() => handleLanguageChange(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  {currentLocale === lang.code && (
                    <Check size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  deletingContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  deletingText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginTop: 24,
    textAlign: 'center' as const,
  },
  deletingSubtext: {
    fontSize: 14,
    color: '#6D6D72',
    marginTop: 8,
    textAlign: 'center' as const,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#6D6D72',
    textTransform: 'uppercase',
    letterSpacing: -0.08,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  settingItemFirst: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  settingItemLast: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  settingItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  sectionCard: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  settingIcon: {
    width: 29,
    height: 29,
    borderRadius: 6,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '400' as const,
    letterSpacing: -0.41,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  footerText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageList: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 16,
  },
  languageName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500' as const,
    color: COLORS.black,
  },
});
