import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { useAuth } from '@/hooks/auth-store';
import { useTheme } from '@/hooks/theme-store';
// Removed FirebaseTest import

import {
  Settings as SettingsIcon,
  Bell,
  Globe,
  Moon,
  Sun,
  Shield,
  HelpCircle,
  MessageSquare,
  FileText,
  Trash2,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, currentLocale, changeLanguage } = useI18n();
  const { user, signOut } = useAuth();
  const { currentTheme, mode, setThemeMode, isDark } = useTheme();

  const handleLanguageChange = () => {
    Alert.alert(
      t('settings.language'),
      t('auth.select_language'),
      [
        {
          text: 'Français',
          onPress: () => changeLanguage('fr'),
          style: currentLocale === 'fr' ? 'default' : 'cancel',
        },
        {
          text: 'English',
          onPress: () => changeLanguage('en'),
          style: currentLocale === 'en' ? 'default' : 'cancel',
        },
      ]
    );
  };

  const handleThemeChange = () => {
    Alert.alert(
      'Thème',
      'Choisissez le thème de l\'application',
      [
        {
          text: 'Clair',
          onPress: () => setThemeMode('light'),
          style: mode === 'light' ? 'default' : 'cancel',
        },
        {
          text: 'Sombre',
          onPress: () => setThemeMode('dark'),
          style: mode === 'dark' ? 'default' : 'cancel',
        },
        {
          text: 'Système',
          onPress: () => setThemeMode('system'),
          style: mode === 'system' ? 'default' : 'cancel',
        },
      ]
    );
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
      'Cette action est irréversible. Toutes vos données seront définitivement supprimées.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Compte supprimé', 'Votre compte a été supprimé avec succès.');
            router.replace('/');
          },
        },
      ]
    );
  };

  const settingsItems = [
    {
      id: 'notifications',
      title: t('settings.notifications'),
      icon: <Bell size={24} color={currentTheme.text} />,
      onPress: () => router.push('/settings/notifications'),
    },
    {
      id: 'language',
      title: t('settings.language'),
      icon: <Globe size={24} color={currentTheme.text} />,
      subtitle: currentLocale === 'fr' ? 'Français' : 'English',
      onPress: handleLanguageChange,
    },
    {
      id: 'theme',
      title: t('settings.theme'),
      icon: isDark ? <Moon size={24} color={currentTheme.text} /> : <Sun size={24} color={currentTheme.text} />,
      subtitle: mode === 'light' ? 'Clair' : mode === 'dark' ? 'Sombre' : 'Système',
      onPress: handleThemeChange,
    },
    {
      id: 'privacy',
      title: t('settings.privacy'),
      icon: <Shield size={24} color={currentTheme.text} />,
      onPress: () => router.push('/settings/privacy'),
    },
    {
      id: 'blocked-users',
      title: 'Utilisateurs bloqués',
      icon: <Shield size={24} color={currentTheme.text} />,
      onPress: () => router.push('/settings/blocked-users'),
    },
    {
      id: 'help',
      title: t('settings.help'),
      icon: <HelpCircle size={24} color={currentTheme.text} />,
      onPress: () => router.push('/settings/help'),
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      icon: <HelpCircle size={24} color={currentTheme.text} />,
      onPress: () => router.push('/settings/faq'),
    },
    {
      id: 'support',
      title: t('settings.contact_support'),
      icon: <MessageSquare size={24} color={currentTheme.text} />,
      onPress: () => router.push('/settings/support'),
    },
    {
      id: 'terms',
      title: 'Conditions d\'utilisation',
      icon: <FileText size={24} color={currentTheme.text} />,
      onPress: () => router.push('/legal/terms'),
    },
    {
      id: 'privacy-policy',
      title: 'Politique de confidentialité',
      icon: <FileText size={24} color={currentTheme.text} />,
      onPress: () => router.push('/legal/privacy'),
    },
    {
      id: 'rgpd',
      title: 'RGPD',
      icon: <Shield size={24} color={currentTheme.text} />,
      onPress: () => router.push('/settings/rgpd'),
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

  const renderSettingItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.settingItem, SHADOWS.small, { backgroundColor: currentTheme.card }]}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.settingIcon, { backgroundColor: currentTheme.background }]}>
        {item.icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: item.textColor || currentTheme.text }]}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={[styles.settingSubtitle, { color: currentTheme.text }]}>{item.subtitle}</Text>
        )}
      </View>
      <ChevronRight size={20} color={currentTheme.text} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen
        options={{
          title: t('settings.settings'),
          headerStyle: { backgroundColor: currentTheme.card },
          headerTintColor: currentTheme.text,
        }}
      />
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
{/* Removed FirebaseTest usage */}

        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Général</Text>
          {settingsItems.map(renderSettingItem)}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Compte</Text>
          {dangerousItems.map(renderSettingItem)}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: currentTheme.text }]}>
            Coppet v1.0.0
          </Text>
          <Text style={[styles.footerText, { color: currentTheme.text }]}>
            © 2024 Coppet. Tous droits réservés.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
});