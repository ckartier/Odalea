import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { Shield, Download, Trash2, Eye, Edit } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { deleteUserAccount, exportUserData } from '@/services/account-deletion';

export default function RGPDScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDataExport = async () => {
    Alert.alert(
      'Exporter mes données',
      'Nous allons générer un fichier contenant toutes vos données.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Exporter', 
          onPress: async () => {
            setIsExporting(true);
            try {
              const result = await exportUserData();
              if (result.success && result.data) {
                console.log('[RGPD] Data exported:', JSON.stringify(result.data, null, 2));
                Alert.alert(
                  'Export réussi',
                  'Vos données ont été exportées. Contactez dpo@coppet.com pour recevoir le fichier complet.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Erreur', result.error || 'Impossible d\'exporter les données.');
              }
            } catch (error) {
              console.error('[RGPD] Export error:', error);
              Alert.alert('Erreur', 'Une erreur est survenue lors de l\'export.');
            } finally {
              setIsExporting(false);
            }
          }
        },
      ]
    );
  };

  const handleDataDeletion = () => {
    Alert.alert(
      'Supprimer mes données',
      'Cette action supprimera définitivement toutes vos données (profil, animaux, messages, photos). Cette action est IRRÉVERSIBLE.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Je comprends, supprimer', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmation finale',
              'Êtes-vous absolument sûr ? Toutes vos données seront perdues.',
              [
                { text: 'Non, annuler', style: 'cancel' },
                {
                  text: 'Oui, tout supprimer',
                  style: 'destructive',
                  onPress: async () => {
                    setIsDeleting(true);
                    try {
                      const result = await deleteUserAccount();
                      if (result.success) {
                        Alert.alert(
                          'Données supprimées',
                          'Votre compte et toutes vos données ont été définitivement supprimés.',
                          [{ text: 'OK', onPress: () => router.replace('/onboarding') }]
                        );
                      } else {
                        Alert.alert('Erreur', result.error || 'Impossible de supprimer les données.');
                      }
                    } catch (error) {
                      console.error('[RGPD] Deletion error:', error);
                      Alert.alert('Erreur', 'Une erreur est survenue.');
                    } finally {
                      setIsDeleting(false);
                    }
                  },
                },
              ]
            );
          }
        },
      ]
    );
  };

  const rgpdRights = [
    {
      id: 'access',
      title: 'Droit d\'accès',
      description: 'Vous avez le droit de savoir quelles données nous collectons sur vous',
      icon: <Eye size={24} color={COLORS.primary} />,
      action: 'Voir mes données',
      onPress: handleDataExport,
    },
    {
      id: 'rectification',
      title: 'Droit de rectification',
      description: 'Vous pouvez corriger ou mettre à jour vos données personnelles',
      icon: <Edit size={24} color={COLORS.primary} />,
      action: 'Modifier mes données',
      onPress: () => Alert.alert('Information', 'Vous pouvez modifier vos données dans les paramètres de votre profil.'),
    },
    {
      id: 'portability',
      title: 'Droit à la portabilité',
      description: 'Vous pouvez récupérer vos données dans un format structuré',
      icon: <Download size={24} color={COLORS.primary} />,
      action: 'Télécharger mes données',
      onPress: handleDataExport,
    },
    {
      id: 'erasure',
      title: 'Droit à l\'effacement',
      description: 'Vous pouvez demander la suppression de vos données personnelles',
      icon: <Trash2 size={24} color={COLORS.error} />,
      action: 'Supprimer mes données',
      onPress: handleDataDeletion,
    },
  ];

  if (isDeleting || isExporting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>
          {isDeleting ? 'Suppression en cours...' : 'Export en cours...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'RGPD',
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.black,
        }}
      />
      <StatusBar style="dark" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.header}>
            <Shield size={40} color={COLORS.primary} />
            <Text style={styles.headerTitle}>Règlement Général sur la Protection des Données</Text>
            <Text style={styles.headerDescription}>
              Nous respectons votre vie privée et nous conformons aux réglementations RGPD. 
              Vous avez des droits concernant vos données personnelles.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vos droits RGPD</Text>
          
          {rgpdRights.map((right) => (
            <View key={right.id} style={[styles.rightItem, SHADOWS.small]}>
              <View style={styles.rightIcon}>
                {right.icon}
              </View>
              <View style={styles.rightContent}>
                <Text style={styles.rightTitle}>{right.title}</Text>
                <Text style={styles.rightDescription}>{right.description}</Text>
                <TouchableOpacity
                  style={[
                    styles.rightAction,
                    right.id === 'erasure' && styles.dangerAction
                  ]}
                  onPress={right.onPress}
                >
                  <Text style={[
                    styles.rightActionText,
                    right.id === 'erasure' && styles.dangerActionText
                  ]}>
                    {right.action}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Données collectées</Text>
          <View style={[styles.dataCard, SHADOWS.small]}>
            <Text style={styles.dataTitle}>Types de données que nous collectons :</Text>
            <View style={styles.dataList}>
              <Text style={styles.dataItem}>• Informations de profil (nom, email, téléphone)</Text>
              <Text style={styles.dataItem}>• Informations sur vos animaux</Text>
              <Text style={styles.dataItem}>• Données de localisation (avec votre consentement)</Text>
              <Text style={styles.dataItem}>• Messages et communications</Text>
              <Text style={styles.dataItem}>• Photos et médias partagés</Text>
              <Text style={styles.dataItem}>{"• Données d'utilisation de l'application"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utilisation des données</Text>
          <View style={[styles.dataCard, SHADOWS.small]}>
            <Text style={styles.dataTitle}>Nous utilisons vos données pour :</Text>
            <View style={styles.dataList}>
              <Text style={styles.dataItem}>• Fournir nos services de mise en relation</Text>
              <Text style={styles.dataItem}>• Améliorer votre expérience utilisateur</Text>
              <Text style={styles.dataItem}>• Vous envoyer des notifications importantes</Text>
              <Text style={styles.dataItem}>• Assurer la sécurité de la plateforme</Text>
              <Text style={styles.dataItem}>• Respecter nos obligations légales</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact DPO</Text>
          <View style={[styles.contactCard, SHADOWS.small]}>
            <Text style={styles.contactTitle}>Délégué à la Protection des Données</Text>
            <Text style={styles.contactDescription}>
              {"Pour toute question concernant vos données personnelles ou l'exercice de vos droits RGPD :"}
            </Text>
            <Text style={styles.contactEmail}>dpo@coppet.com</Text>
            <Text style={styles.contactNote}>
              Nous nous engageons à répondre à vos demandes dans un délai de 30 jours.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.black,
    marginTop: 16,
    textAlign: 'center' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  header: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.black,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  rightItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  rightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rightContent: {
    flex: 1,
  },
  rightTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  rightDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 18,
    marginBottom: 12,
  },
  rightAction: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  rightActionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.primary,
  },
  dangerAction: {
    backgroundColor: COLORS.errorLight,
  },
  dangerActionText: {
    color: COLORS.error,
  },
  dataCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 12,
  },
  dataList: {
    gap: 8,
  },
  dataItem: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 18,
  },
  contactCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  contactDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 18,
    marginBottom: 12,
  },
  contactEmail: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.primary,
    marginBottom: 8,
  },
  contactNote: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontStyle: 'italic',
  },
});