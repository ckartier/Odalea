import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { 
  HelpCircle, 
  MessageSquare, 
  Book, 
  Video, 
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';

export default function HelpScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const helpItems = [
    {
      id: 'faq',
      title: 'Questions fréquentes',
      description: 'Trouvez des réponses aux questions les plus courantes',
      icon: <HelpCircle size={24} color={COLORS.primary} />,
      onPress: () => router.push('/settings/faq'),
    },
    {
      id: 'guides',
      title: 'Guides d\'utilisation',
      description: 'Apprenez à utiliser toutes les fonctionnalités',
      icon: <Book size={24} color={COLORS.primary} />,
      onPress: () => {
        Alert.alert('Guides', 'Les guides d\'utilisation détaillés seront bientôt disponibles.');
      },
    },
    {
      id: 'tutorials',
      title: 'Tutoriels vidéo',
      description: 'Regardez nos tutoriels pas à pas',
      icon: <Video size={24} color={COLORS.primary} />,
      onPress: () => {
        Alert.alert('Tutoriels', 'Les tutoriels vidéo seront bientôt disponibles.');
      },
    },
    {
      id: 'contact',
      title: 'Contacter le support',
      description: 'Obtenez de l\'aide personnalisée',
      icon: <MessageSquare size={24} color={COLORS.primary} />,
      onPress: () => {
        Alert.alert('Support', 'Vous pouvez nous contacter à support@coppet.com ou utiliser le formulaire ci-dessous.');
      },
    },
    {
      id: 'website',
      title: 'Site web',
      description: 'Visitez notre site pour plus d\'informations',
      icon: <ExternalLink size={24} color={COLORS.primary} />,
      onPress: () => Linking.openURL('https://coppet.com'),
    },
  ];

  const faqItems = [
    {
      question: 'Comment ajouter un animal ?',
      answer: 'Allez dans votre profil et appuyez sur le bouton "+" dans la section "Mes animaux".',
    },
    {
      question: 'Comment trouver des gardiens près de chez moi ?',
      answer: 'Utilisez la carte pour voir les gardiens disponibles dans votre région.',
    },
    {
      question: 'Comment signaler un animal perdu ?',
      answer: 'Allez dans l\'onglet "Perdus & Trouvés" et appuyez sur "Signaler un animal perdu".',
    },
    {
      question: 'Comment participer aux défis ?',
      answer: 'Visitez l\'onglet "Défis" et appuyez sur "Participer" sur le défi de votre choix.',
    },
    {
      question: 'Comment devenir Premium ?',
      answer: 'Allez dans votre profil et appuyez sur "Passer à Premium" pour voir les avantages.',
    },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('settings.help'),
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.black,
        }}
      />
      <StatusBar style="dark" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Centre d'aide</Text>
          <Text style={styles.sectionDescription}>
            Trouvez de l'aide et des réponses à vos questions sur l'utilisation de Coppet.
          </Text>
          
          {helpItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.helpItem, SHADOWS.small]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.helpIcon}>
                {item.icon}
              </View>
              <View style={styles.helpContent}>
                <Text style={styles.helpTitle}>{item.title}</Text>
                <Text style={styles.helpDescription}>{item.description}</Text>
              </View>
              <ChevronRight size={20} color={COLORS.darkGray} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions fréquentes</Text>
          
          {faqItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.faqItem, SHADOWS.small]}
              onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                {expandedFaq === index ? (
                  <ChevronUp size={20} color={COLORS.primary} />
                ) : (
                  <ChevronDown size={20} color={COLORS.darkGray} />
                )}
              </View>
              {expandedFaq === index && (
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nous contacter</Text>
          <View style={[styles.contactCard, SHADOWS.small]}>
            <Text style={styles.contactTitle}>Besoin d'aide supplémentaire ?</Text>
            <Text style={styles.contactDescription}>
              Notre équipe de support est là pour vous aider. Nous répondons généralement dans les 24h.
            </Text>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => {
                Alert.alert(
                  'Contacter le support',
                  'Choisissez votre méthode de contact préférée :',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Email', onPress: () => Linking.openURL('mailto:support@coppet.com') },
                    { text: 'Chat en direct', onPress: () => Alert.alert('Chat', 'Le chat en direct sera bientôt disponible.') },
                  ]
                );
              }}
            >
              <MessageSquare size={20} color={COLORS.white} />
              <Text style={styles.contactButtonText}>Envoyer un message</Text>
            </TouchableOpacity>
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
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  helpIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  helpDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 18,
  },
  faqItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  contactCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  contactDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
});