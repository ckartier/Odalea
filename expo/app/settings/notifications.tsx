import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { useTheme } from '@/hooks/theme-store';

export default function NotificationsSettingsScreen() {
  const { t } = useI18n();
  const { user, updateNotificationSettings } = useFirebaseUser();
  const { currentTheme, isDark } = useTheme();
  
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    smsNotifications: false,
    reminders: true,
    socialActivity: true,
    emergencyAlerts: true,
    messageNotifications: true,
    challengeUpdates: true,
    shopOffers: false,
    lostFoundAlerts: true,
  });

  useEffect(() => {
    if (user?.notificationSettings) {
      setSettings(user.notificationSettings);
    }
  }, [user]);

  const updateSetting = async (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    const result = await updateNotificationSettings({ [key]: value });
    if (!result.success) {
      console.error('Failed to update notification setting:', result.error);
      setSettings(prev => ({ ...prev, [key]: !value }));
      Alert.alert('Erreur', 'Impossible de mettre à jour le paramètre de notification');
    }
  };

  const notificationItems = [
    {
      key: 'pushNotifications',
      title: 'Notifications push',
      description: 'Recevoir des notifications sur votre appareil',
    },
    {
      key: 'emailNotifications',
      title: 'Notifications par email',
      description: 'Recevoir des notifications par email',
    },
    {
      key: 'smsNotifications',
      title: 'Notifications SMS',
      description: 'Recevoir des notifications par SMS',
    },
    {
      key: 'messageNotifications',
      title: 'Messages',
      description: 'Notifications pour les nouveaux messages',
    },
    {
      key: 'reminders',
      title: 'Rappels',
      description: 'Rappels pour les soins de vos animaux',
    },
    {
      key: 'socialActivity',
      title: 'Activité sociale',
      description: 'Likes, commentaires et nouvelles connexions',
    },
    {
      key: 'challengeUpdates',
      title: 'Mises à jour des défis',
      description: 'Nouveaux défis et résultats',
    },
    {
      key: 'lostFoundAlerts',
      title: 'Alertes animaux perdus',
      description: 'Alertes pour les animaux perdus dans votre région',
    },
    {
      key: 'emergencyAlerts',
      title: 'Alertes d\'urgence',
      description: 'Alertes importantes pour la sécurité de vos animaux',
    },
    {
      key: 'shopOffers',
      title: 'Offres boutique',
      description: 'Promotions et nouveaux produits',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen
        options={{
          title: t('settings.notifications'),
          headerStyle: { backgroundColor: currentTheme.card },
          headerTintColor: currentTheme.text,
        }}
      />
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionDescription, { color: currentTheme.text }]}>
            Gérez vos préférences de notifications pour rester informé de ce qui vous intéresse.
          </Text>
          
          {notificationItems.map((item) => (
            <View key={item.key} style={[styles.notificationItem, SHADOWS.small, { backgroundColor: currentTheme.card }]}>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, { color: currentTheme.text }]}>{item.title}</Text>
                <Text style={[styles.notificationDescription, { color: currentTheme.text }]}>{item.description}</Text>
              </View>
              <Switch
                value={settings[item.key as keyof typeof settings]}
                onValueChange={(value) => updateSetting(item.key, value)}
                trackColor={{ false: COLORS.mediumGray, true: currentTheme.accent }}
                thumbColor={COLORS.white}
              />
            </View>
          ))}
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
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  notificationContent: {
    flex: 1,
    marginRight: 16,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 18,
  },
});