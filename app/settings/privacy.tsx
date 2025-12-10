import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { Shield, Eye, EyeOff, MapPin, Phone, Mail } from 'lucide-react-native';

export default function PrivacySettingsScreen() {
  const { t } = useI18n();
  
  const [settings, setSettings] = useState({
    showLocation: true,
    showPhone: false,
    showEmail: false,
    allowMessages: true,
    showOnlineStatus: true,
    shareActivity: true,
    allowPhotoTagging: true,
    publicProfile: true,
  });

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleDataExport = () => {
    Alert.alert(
      'Exporter mes données',
      'Nous vous enverrons un fichier contenant toutes vos données par email dans les 48h.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: () => Alert.alert('Demande envoyée', 'Vous recevrez vos données par email.') },
      ]
    );
  };

  const privacyItems = [
    {
      key: 'publicProfile',
      title: 'Profil public',
      description: 'Votre profil est visible par tous les utilisateurs',
      icon: <Eye size={20} color={COLORS.primary} />,
    },
    {
      key: 'showLocation',
      title: 'Afficher ma localisation',
      description: 'Votre ville est visible sur votre profil',
      icon: <MapPin size={20} color={COLORS.primary} />,
    },
    {
      key: 'showPhone',
      title: 'Afficher mon téléphone',
      description: 'Votre numéro est visible par vos contacts',
      icon: <Phone size={20} color={COLORS.primary} />,
    },
    {
      key: 'showEmail',
      title: 'Afficher mon email',
      description: 'Votre email est visible par vos contacts',
      icon: <Mail size={20} color={COLORS.primary} />,
    },
    {
      key: 'allowMessages',
      title: 'Autoriser les messages',
      description: 'Tout le monde peut vous envoyer des messages',
      icon: <Shield size={20} color={COLORS.primary} />,
    },
    {
      key: 'showOnlineStatus',
      title: 'Statut en ligne',
      description: 'Afficher quand vous êtes en ligne',
      icon: <Eye size={20} color={COLORS.primary} />,
    },
    {
      key: 'shareActivity',
      title: 'Partager mon activité',
      description: 'Vos actions sont visibles dans le fil communautaire',
      icon: <Eye size={20} color={COLORS.primary} />,
    },
    {
      key: 'allowPhotoTagging',
      title: 'Autoriser le marquage photo',
      description: 'D\'autres peuvent vous identifier sur leurs photos',
      icon: <Eye size={20} color={COLORS.primary} />,
    },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('settings.privacy'),
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.black,
        }}
      />
      <StatusBar style="dark" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionDescription}>
            Contrôlez qui peut voir vos informations et comment elles sont utilisées.
          </Text>
          
          {privacyItems.map((item) => (
            <View key={item.key} style={[styles.privacyItem, SHADOWS.small]}>
              <View style={styles.privacyIcon}>
                {item.icon}
              </View>
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>{item.title}</Text>
                <Text style={styles.privacyDescription}>{item.description}</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Données personnelles</Text>
          
          <TouchableOpacity
            style={[styles.actionItem, SHADOWS.small]}
            onPress={handleDataExport}
          >
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Exporter mes données</Text>
              <Text style={styles.actionDescription}>
                Télécharger une copie de toutes vos données
              </Text>
            </View>
          </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  privacyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  privacyContent: {
    flex: 1,
    marginRight: 16,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  privacyDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 18,
  },
  actionItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.primary,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 18,
  },
});