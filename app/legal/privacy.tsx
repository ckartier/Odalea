import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/constants/colors';
import { ArrowLeft } from 'lucide-react-native';

export default function PrivacyScreen() {
  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Politique de Confidentialité',
          headerShown: true,
          headerStyle: {
            backgroundColor: COLORS.white,
          },
          headerTitleStyle: {
            color: COLORS.black,
            fontSize: 18,
            fontWeight: '600',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={{ marginLeft: 16 }}>
              <ArrowLeft size={24} color={COLORS.black} />
            </TouchableOpacity>
          ),
        }}
      />
      <StatusBar style="dark" />
      
      <View style={styles.container}>
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.text}>
            Coppet s'engage à protéger votre vie privée et vos données personnelles. 
            Cette politique explique comment nous collectons, utilisons et protégeons vos informations 
            conformément au Règlement Général sur la Protection des Données (RGPD).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Responsable du traitement</Text>
          <Text style={styles.text}>
            Coppet SAS, société par actions simplifiée au capital de 10 000 euros, 
            immatriculée au RCS de Paris sous le numéro 123 456 789, 
            dont le siège social est situé au 123 Rue de la Paix, 75001 Paris, France.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Données collectées</Text>
          <Text style={styles.text}>Nous collectons les types de données suivants :</Text>
          
          <Text style={styles.subTitle}>3.1 Données d'identification</Text>
          <Text style={styles.bulletText}>• Nom et prénom</Text>
          <Text style={styles.bulletText}>• Adresse email</Text>
          <Text style={styles.bulletText}>• Numéro de téléphone</Text>
          <Text style={styles.bulletText}>• Adresse postale</Text>
          
          <Text style={styles.subTitle}>3.2 Données sur vos animaux</Text>
          <Text style={styles.bulletText}>• Nom, race, âge de l'animal</Text>
          <Text style={styles.bulletText}>• Photos et vidéos</Text>
          <Text style={styles.bulletText}>• Informations de santé (optionnel)</Text>
          
          <Text style={styles.subTitle}>3.3 Données d'utilisation</Text>
          <Text style={styles.bulletText}>• Données de géolocalisation</Text>
          <Text style={styles.bulletText}>• Historique d'utilisation de l'application</Text>
          <Text style={styles.bulletText}>• Messages et interactions</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Finalités du traitement</Text>
          <Text style={styles.text}>Vos données sont utilisées pour :</Text>
          <Text style={styles.bulletText}>• Créer et gérer votre compte</Text>
          <Text style={styles.bulletText}>• Faciliter les connexions avec d'autres utilisateurs</Text>
          <Text style={styles.bulletText}>• Fournir des services de géolocalisation</Text>
          <Text style={styles.bulletText}>• Améliorer nos services</Text>
          <Text style={styles.bulletText}>• Vous envoyer des notifications importantes</Text>
          <Text style={styles.bulletText}>• Assurer la sécurité de la plateforme</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Base légale</Text>
          <Text style={styles.text}>
            Le traitement de vos données repose sur :
          </Text>
          <Text style={styles.bulletText}>• Votre consentement explicite</Text>
          <Text style={styles.bulletText}>• L'exécution du contrat de service</Text>
          <Text style={styles.bulletText}>• Notre intérêt légitime à améliorer nos services</Text>
          <Text style={styles.bulletText}>• Le respect d'obligations légales</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Partage des données</Text>
          <Text style={styles.text}>
            Nous ne vendons jamais vos données personnelles. Nous pouvons les partager uniquement :
          </Text>
          <Text style={styles.bulletText}>• Avec d'autres utilisateurs selon vos paramètres de confidentialité</Text>
          <Text style={styles.bulletText}>• Avec nos prestataires de services (hébergement, paiement)</Text>
          <Text style={styles.bulletText}>• En cas d'obligation légale</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Durée de conservation</Text>
          <Text style={styles.text}>
            Nous conservons vos données :
          </Text>
          <Text style={styles.bulletText}>• Pendant la durée d'utilisation de votre compte</Text>
          <Text style={styles.bulletText}>• 3 ans après la suppression de votre compte pour les obligations légales</Text>
          <Text style={styles.bulletText}>• Les données anonymisées peuvent être conservées à des fins statistiques</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Vos droits</Text>
          <Text style={styles.text}>
            Conformément au RGPD, vous disposez des droits suivants :
          </Text>
          <Text style={styles.bulletText}>• Droit d'accès à vos données</Text>
          <Text style={styles.bulletText}>• Droit de rectification</Text>
          <Text style={styles.bulletText}>• Droit à l'effacement</Text>
          <Text style={styles.bulletText}>• Droit à la limitation du traitement</Text>
          <Text style={styles.bulletText}>• Droit à la portabilité</Text>
          <Text style={styles.bulletText}>• Droit d'opposition</Text>
          <Text style={styles.bulletText}>• Droit de retirer votre consentement</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Sécurité</Text>
          <Text style={styles.text}>
            Nous mettons en place des mesures techniques et organisationnelles appropriées 
            pour protéger vos données contre tout accès non autorisé, altération, divulgation ou destruction.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Transferts internationaux</Text>
          <Text style={styles.text}>
            Vos données sont hébergées dans l'Union Européenne. 
            Tout transfert hors UE sera effectué avec des garanties appropriées.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Cookies et technologies similaires</Text>
          <Text style={styles.text}>
            Nous utilisons des cookies et technologies similaires pour améliorer votre expérience. 
            Vous pouvez gérer vos préférences dans les paramètres de l'application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Contact et réclamations</Text>
          <Text style={styles.text}>
            Pour exercer vos droits ou pour toute question relative à cette politique :
          </Text>
          <Text style={styles.bulletText}>• Email : privacy@coppet.com</Text>
          <Text style={styles.bulletText}>• Courrier : Coppet SAS - DPO, 123 Rue de la Paix, 75001 Paris</Text>
          <Text style={styles.text}>
            Vous avez également le droit de déposer une réclamation auprès de la CNIL 
            (Commission Nationale de l'Informatique et des Libertés).
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </Text>
        </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 16,
    lineHeight: 24,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginTop: 12,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: COLORS.black,
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'left',
  },
  bulletText: {
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.black,
    marginLeft: 16,
    marginBottom: 8,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontStyle: 'italic' as const,
  },
});