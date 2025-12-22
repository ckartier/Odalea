import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS, DIMENSIONS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Phone, 
  Mail, 
  Send,
  Clock,
  CheckCircle,
  HelpCircle,
  Shield,
  FileText,
  ChevronRight,
  ExternalLink,
} from 'lucide-react-native';

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supportOptions = [
    {
      id: 'faq',
      title: 'FAQ',
      description: 'Questions fréquemment posées',
      icon: HelpCircle,
      color: COLORS.primary,
      onPress: () => router.push('/settings/faq'),
    },
    {
      id: 'help',
      title: 'Centre d\'aide',
      description: 'Guides et tutoriels',
      icon: HelpCircle,
      color: COLORS.info,
      onPress: () => router.push('/settings/help'),
    },
  ];

  const legalOptions = [
    {
      id: 'privacy',
      title: 'Politique de confidentialité',
      description: 'Comment nous protégeons vos données',
      icon: Shield,
      color: COLORS.primary,
      onPress: () => router.push('/legal/privacy'),
    },
    {
      id: 'terms',
      title: 'Conditions d\'utilisation',
      description: 'Nos conditions générales',
      icon: FileText,
      color: COLORS.darkGray,
      onPress: () => router.push('/legal/terms'),
    },
    {
      id: 'rgpd',
      title: 'RGPD',
      description: 'Vos droits sur vos données',
      icon: Shield,
      color: COLORS.warning,
      onPress: () => router.push('/settings/rgpd'),
    },
  ];

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Ticket envoyé ! 🎉',
        'Votre demande a été envoyée avec succès. Notre équipe vous répondra dans les 24h.',
        [{ text: 'OK', onPress: () => { setMessage(''); setSubject(''); } }]
      );
    }, 2000);
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contacter le support',
      'Comment souhaitez-vous nous contacter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:support@odalea.app'),
        },
        {
          text: 'Téléphone',
          onPress: () => Linking.openURL('tel:+33123456789'),
        },
      ]
    );
  };

  const handleReportBug = () => {
    Alert.alert(
      'Signaler un bug',
      'Merci de nous aider à améliorer l\'application. Décrivez le problème rencontré.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer par email',
          onPress: () => Linking.openURL('mailto:bugs@odalea.app?subject=Bug Report'),
        },
      ]
    );
  };

  const handleFeatureRequest = () => {
    Alert.alert(
      'Suggérer une fonctionnalité',
      'Avez-vous une idée pour améliorer Odalea ? Nous serions ravis de l\'entendre !',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer par email',
          onPress: () => Linking.openURL('mailto:feedback@odalea.app?subject=Feature Request'),
        },
      ]
    );
  };

  const contactMethods = [
    {
      id: 'email',
      title: 'Email',
      description: 'support@odalea.app',
      icon: <Mail size={24} color={COLORS.primary} />,
      onPress: () => Linking.openURL('mailto:support@odalea.app'),
    },
    {
      id: 'phone',
      title: 'Téléphone',
      description: '+33 1 23 45 67 89',
      icon: <Phone size={24} color={COLORS.primary} />,
      onPress: () => Linking.openURL('tel:+33123456789'),
    },
  ];

  const renderOptionCard = (option: any) => (
    <TouchableOpacity
      key={option.id}
      style={[styles.optionCard, SHADOWS.small]}
      onPress={option.onPress}
    >
      <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
        <option.icon size={24} color={COLORS.white} />
      </View>
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{option.title}</Text>
        <Text style={styles.optionDescription}>{option.description}</Text>
      </View>
      <ChevronRight size={20} color={COLORS.darkGray} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Support & infos',
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.black,
        }}
      />
      <StatusBar style="dark" />

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: DIMENSIONS.COMPONENT_SIZES.HEADER_HEIGHT + DIMENSIONS.SPACING.md }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          {supportOptions.map(renderOptionCard)}
          
          <TouchableOpacity
            style={[styles.optionCard, SHADOWS.small]}
            onPress={handleContactSupport}
          >
            <View style={[styles.optionIcon, { backgroundColor: COLORS.success }]}>
              <Mail size={24} color={COLORS.white} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Nous contacter</Text>
              <Text style={styles.optionDescription}>Contactez notre équipe support</Text>
            </View>
            <ChevronRight size={20} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations légales</Text>
          {legalOptions.map(renderOptionCard)}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
          <TouchableOpacity
            style={[styles.optionCard, SHADOWS.small]}
            onPress={handleReportBug}
          >
            <View style={[styles.optionIcon, { backgroundColor: COLORS.error }]}>
              <HelpCircle size={24} color={COLORS.white} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Signaler un problème</Text>
              <Text style={styles.optionDescription}>
                {"Aidez-nous à améliorer l'application"}
              </Text>
            </View>
            <ChevronRight size={20} color={COLORS.darkGray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, SHADOWS.small]}
            onPress={handleFeatureRequest}
          >
            <View style={[styles.optionIcon, { backgroundColor: COLORS.success }]}>
              <ExternalLink size={24} color={COLORS.white} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Suggérer une fonctionnalité</Text>
              <Text style={styles.optionDescription}>
                Partagez vos idées avec nous
              </Text>
            </View>
            <ChevronRight size={20} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de contact</Text>
          
          <View style={[styles.infoCard, SHADOWS.small]}>
            <View style={styles.infoRow}>
              <Mail size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>support@odalea.app</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Phone size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>+33 1 23 45 67 89</Text>
            </View>
          </View>
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{"Informations de l'application"}</Text>
          
          <View style={[styles.infoCard, SHADOWS.small]}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Build</Text>
              <Text style={styles.infoValue}>2024.01.15</Text>
            </View>
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
  },
  scrollContent: {
    paddingHorizontal: DIMENSIONS.SPACING.md,
    paddingBottom: DIMENSIONS.SPACING.xxl,
  },
  section: {
    marginBottom: DIMENSIONS.SPACING.lg,
  },
  sectionTitle: {
    fontSize: DIMENSIONS.FONT_SIZES.lg,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: DIMENSIONS.SPACING.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.SPACING.md,
    padding: DIMENSIONS.SPACING.md,
    marginBottom: DIMENSIONS.SPACING.sm,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DIMENSIONS.SPACING.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: DIMENSIONS.SPACING.xs,
  },
  optionDescription: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.darkGray,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.SPACING.md,
    padding: DIMENSIONS.SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DIMENSIONS.SPACING.sm,
    gap: DIMENSIONS.SPACING.sm,
  },
  infoText: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '500' as const,
  },
  infoLabel: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    fontWeight: '500' as const,
    color: COLORS.black,
    flex: 1,
  },
  infoValue: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    color: COLORS.darkGray,
  },
});