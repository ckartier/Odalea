import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Switch,
} from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';

export default function NotificationsSettingsScreen() {
  const { t } = useI18n();
  
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

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('settings.notifications'),
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.black,
        }}
      />
      <StatusBar style="dark" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionDescription}>
            Gérez vos préférences de notifications pour rester informé de ce qui vous intéresse.
          </Text>
          
          {notificationItems.map((item) => (
            <View key={item.key} style={[styles.notificationItem, SHADOWS.small]}>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationDescription}>{item.description}</Text>
              </View>
              <Switch
                value={settings[item.key as keyof typeof settings]}
                onValueChange={(value) => updateSetting(item.key, value)}
                trackColor={{ false: COLORS.mediumGray, true: COLORS.primary }}
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
    backgroundColor: 'transparent',
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