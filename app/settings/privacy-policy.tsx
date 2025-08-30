import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { Shield } from 'lucide-react-native';

export default function PrivacyPolicyScreen() {
  const { t } = useI18n();

  const privacyContent = [
    {
      title: '1. Informations que nous collectons',
      content: 'Nous collectons les informations que vous nous fournissez directement (profil, informations sur vos animaux), les informations d\'utilisation (comment vous utilisez l\'app), et les informations de localisation (avec votre consentement).',
    },
    {
      title: '2. Comment nous utilisons vos informations',
      content: 'Nous utilisons vos informations pour fournir nos services, améliorer votre expérience, vous envoyer des communications importantes, et assurer la sécurité de notre plateforme.',
    },
    {
      title: '3. Partage de vos informations',
      content: 'Nous ne vendons pas vos données personnelles. Nous pouvons partager vos informations avec d\'autres utilisateurs (selon vos paramètres de confidentialité), nos prestataires de services, et les autorités si requis par la loi.',
    },
    {
      title: '4. Sécurité des données',
      content: 'Nous mettons en place des mesures de sécurité techniques et organisationnelles pour protéger vos données contre l\'accès non autorisé, la perte ou la destruction.',
    },
    {
      title: '5. Conservation des données',
      content: 'Nous conservons vos données aussi longtemps que nécessaire pour fournir nos services et respecter nos obligations légales. Vous pouvez demander la suppression de vos données à tout moment.',
    },
    {
      title: '6. Vos droits',
      content: 'Vous avez le droit d\'accéder, de corriger, de supprimer vos données, de vous opposer à leur traitement, et de demander leur portabilité. Contactez-nous pour exercer ces droits.',
    },
    {
      title: '7. Cookies et technologies similaires',
      content: 'Nous utilisons des cookies et technologies similaires pour améliorer votre expérience, analyser l\'utilisation de l\'app et personnaliser le contenu.',
    },
    {
      title: '8. Services tiers',
      content: 'Notre app peut contenir des liens vers des services tiers. Nous ne sommes pas responsables de leurs pratiques de confidentialité. Consultez leurs politiques de confidentialité.',
    },
    {
      title: '9. Transferts internationaux',
      content: 'Vos données peuvent être transférées et traitées dans des pays autres que votre pays de résidence. Nous nous assurons que ces transferts respectent les réglementations applicables.',
    },
    {
      title: '10. Mineurs',
      content: 'Notre service n\'est pas destiné aux mineurs de moins de 16 ans. Nous ne collectons pas sciemment d\'informations personnelles auprès de mineurs.',
    },
    {
      title: '11. Modifications de cette politique',
      content: 'Nous pouvons modifier cette politique de confidentialité. Les modifications importantes vous seront notifiées par email ou via l\'application.',
    },
    {
      title: '12. Contact',
      content: 'Pour toute question concernant cette politique de confidentialité ou vos données personnelles, contactez notre délégué à la protection des données : dpo@coppet.com',
    },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Politique de confidentialité',
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.black,
        }}
      />
      <StatusBar style="dark" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.header}>
            <Shield size={40} color={COLORS.primary} />
            <Text style={styles.headerTitle}>Politique de confidentialité</Text>
            <Text style={styles.headerDescription}>
              Dernière mise à jour : 1er janvier 2024
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.introCard, SHADOWS.small]}>
            <Text style={styles.introText}>
              Chez Coppet, nous respectons votre vie privée et nous nous engageons à protéger vos données personnelles. 
              Cette politique explique comment nous collectons, utilisons et protégeons vos informations.
            </Text>
          </View>
        </View>

        {privacyContent.map((section, index) => (
          <View key={index} style={styles.section}>
            <View style={[styles.privacySection, SHADOWS.small]}>
              <Text style={styles.privacyTitle}>{section.title}</Text>
              <Text style={styles.privacyContent}>{section.content}</Text>
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <View style={[styles.contactCard, SHADOWS.small]}>
            <Text style={styles.contactTitle}>Nous contacter</Text>
            <Text style={styles.contactText}>
              Pour toute question concernant cette politique de confidentialité :
            </Text>
            <Text style={styles.contactEmail}>dpo@coppet.com</Text>
            <Text style={styles.contactAddress}>
              Coppet SAS{'\n'}
              123 Rue de la Paix{'\n'}
              75001 Paris, France
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: 20,
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
  },
  introCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  introText: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    textAlign: 'center',
  },
  privacySection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 12,
  },
  privacyContent: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
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
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  contactEmail: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.primary,
    marginBottom: 12,
  },
  contactAddress: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 18,
  },
});