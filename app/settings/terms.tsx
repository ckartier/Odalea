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
import { FileText } from 'lucide-react-native';

export default function TermsScreen() {
  const { t } = useI18n();

  const termsContent = [
    {
      title: '1. Acceptation des conditions',
      content: 'En utilisant l\'application Coppet, vous acceptez d\'être lié par ces conditions d\'utilisation. Si vous n\'acceptez pas ces conditions, veuillez ne pas utiliser notre service.',
    },
    {
      title: '2. Description du service',
      content: 'Coppet est une plateforme qui permet aux propriétaires d\'animaux de se connecter, de trouver des services de garde, de participer à une communauté et d\'accéder à des ressources pour leurs animaux de compagnie.',
    },
    {
      title: '3. Inscription et compte utilisateur',
      content: 'Vous devez créer un compte pour utiliser certaines fonctionnalités. Vous êtes responsable de maintenir la confidentialité de vos informations de connexion et de toutes les activités qui se produisent sous votre compte.',
    },
    {
      title: '4. Utilisation acceptable',
      content: 'Vous vous engagez à utiliser Coppet de manière responsable et légale. Il est interdit de publier du contenu offensant, illégal ou qui viole les droits d\'autrui. Vous ne devez pas utiliser le service pour harceler d\'autres utilisateurs.',
    },
    {
      title: '5. Contenu utilisateur',
      content: 'Vous conservez la propriété du contenu que vous publiez, mais vous accordez à Coppet une licence pour l\'utiliser dans le cadre du service. Vous êtes responsable du contenu que vous partagez.',
    },
    {
      title: '6. Services de garde d\'animaux',
      content: 'Coppet facilite la mise en relation entre propriétaires et gardiens d\'animaux. Nous ne sommes pas responsables de la qualité des services fournis. Il est recommandé de vérifier les références et de rencontrer les gardiens avant de confier vos animaux.',
    },
    {
      title: '7. Paiements et remboursements',
      content: 'Les transactions financières se font directement entre utilisateurs ou via nos partenaires de paiement. Les politiques de remboursement dépendent du type de service et sont détaillées lors de la transaction.',
    },
    {
      title: '8. Confidentialité',
      content: 'Votre vie privée est importante pour nous. Consultez notre Politique de Confidentialité pour comprendre comment nous collectons, utilisons et protégeons vos données personnelles.',
    },
    {
      title: '9. Propriété intellectuelle',
      content: 'Coppet et ses contenus sont protégés par des droits de propriété intellectuelle. Vous ne pouvez pas copier, modifier ou distribuer notre contenu sans autorisation.',
    },
    {
      title: '10. Limitation de responsabilité',
      content: 'Coppet est fourni "en l\'état". Nous ne garantissons pas que le service sera ininterrompu ou exempt d\'erreurs. Notre responsabilité est limitée dans la mesure permise par la loi.',
    },
    {
      title: '11. Résiliation',
      content: 'Vous pouvez supprimer votre compte à tout moment. Nous nous réservons le droit de suspendre ou de résilier votre compte en cas de violation de ces conditions.',
    },
    {
      title: '12. Modifications des conditions',
      content: 'Nous pouvons modifier ces conditions à tout moment. Les modifications importantes vous seront notifiées. L\'utilisation continue du service après modification constitue votre acceptation des nouvelles conditions.',
    },
    {
      title: '13. Droit applicable',
      content: 'Ces conditions sont régies par le droit français. Tout litige sera soumis à la juridiction des tribunaux français.',
    },
    {
      title: '14. Contact',
      content: 'Pour toute question concernant ces conditions d\'utilisation, contactez-nous à : legal@coppet.com',
    },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Conditions d\'utilisation',
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.black,
        }}
      />
      <StatusBar style="dark" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.header}>
            <FileText size={40} color={COLORS.primary} />
            <Text style={styles.headerTitle}>{"Conditions d'utilisation"}</Text>
            <Text style={styles.headerDescription}>
              Dernière mise à jour : 1er janvier 2024
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.introCard, SHADOWS.small]}>
            <Text style={styles.introText}>
              {"Bienvenue sur Coppet ! Ces conditions d'utilisation régissent votre utilisation de notre application et de nos services."} 
              En utilisant Coppet, vous acceptez ces conditions dans leur intégralité.
            </Text>
          </View>
        </View>

        {termsContent.map((section, index) => (
          <View key={index} style={styles.section}>
            <View style={[styles.termSection, SHADOWS.small]}>
              <Text style={styles.termTitle}>{section.title}</Text>
              <Text style={styles.termContent}>{section.content}</Text>
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <View style={[styles.footerCard, SHADOWS.small]}>
            <Text style={styles.footerTitle}>Questions ?</Text>
            <Text style={styles.footerText}>
              {"Si vous avez des questions concernant ces conditions d'utilisation, n'hésitez pas à nous contacter à legal@coppet.com"}
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
  termSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  termTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 12,
  },
  termContent: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  footerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
});