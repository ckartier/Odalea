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
import { COLORS, SHADOWS } from '@/constants/colors';
import { ArrowLeft } from 'lucide-react-native';

export default function TermsScreen() {
  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Conditions d\'Utilisation',
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
          <Text style={styles.paragraph}>
            Bienvenue sur Coppet. En utilisant cette application, tu t'engages à fournir des informations exactes et à jour sur toi et tes animaux, à respecter la vie privée des autres membres, à éviter tout harcèlement, insulte ou contact non sollicité, à utiliser l'application dans un cadre légal, respectueux et bienveillant.
          </Text>
          
          <Text style={styles.paragraph}>
            Tu t'engages également à ne pas publier de contenus illicites, inappropriés, violents, haineux ou frauduleux, à protéger tes identifiants, à ne pas partager ton compte, à signaler tout abus ou contenu inadapté au support, à accepter que Coppet puisse suspendre ou supprimer ton compte en cas de non-respect des règles, et à respecter les règles de sécurité et de courtoisie dans tous tes échanges et rencontres réelles.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Politique de Confidentialité</Text>
          
          <Text style={styles.paragraph}>
            Nous respectons ta vie privée. Les données que tu renseignes dans l'application sont utilisées uniquement pour le fonctionnement de Coppet et ne sont jamais vendues à des tiers. Tu peux choisir quelles informations partager sur ton profil et gérer tes paramètres de confidentialité à tout moment. Nous protégeons tes données grâce à des protocoles de sécurité conformes au RGPD.
          </Text>
          
          <Text style={styles.paragraph}>
            Tu peux demander la suppression de ton compte et de toutes tes informations à tout moment. Nous ne conservons aucune donnée inutilement et nous nous engageons à limiter la collecte aux seuls éléments nécessaires à l'utilisation de l'application. Pour toute question ou demande concernant tes données personnelles, contacte-nous à support@coppet.com.
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
  paragraph: {
    fontSize: 16,
    color: COLORS.black,
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'left',
  },
});