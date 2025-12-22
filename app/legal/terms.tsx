import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useTheme } from '@/hooks/theme-store';
import { ArrowLeft } from 'lucide-react-native';
import GlassView from '@/components/GlassView';

export default function TermsScreen() {
  const { currentTheme, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
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
            backgroundColor: currentTheme.card,
          },
          headerTitleStyle: {
            color: currentTheme.text,
            fontSize: 18,
            fontWeight: '600',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={{ marginLeft: 16 }}>
              <ArrowLeft size={24} color={currentTheme.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
          <GlassView style={styles.card} liquidGlass tint="neutral" intensity={isDark ? 15 : 30}>
            <Text style={[styles.mainTitle, { color: currentTheme.text }]}>Conditions Générales d&apos;Utilisation</Text>
            <Text style={[styles.lastUpdate, { color: currentTheme.text, opacity: 0.7 }]}>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</Text>
          </GlassView>
        </Animated.View>

        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
        <GlassView style={styles.section} liquidGlass tint="neutral" intensity={isDark ? 10 : 20}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>1. Acceptation des conditions</Text>
          <Text style={[styles.paragraph, { color: currentTheme.text }]}>
            Bienvenue sur Odalea. En utilisant cette application, vous acceptez les présentes conditions générales d&apos;utilisation. Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser l&apos;application.
          </Text>
        </GlassView>
        </Animated.View>

        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
        <GlassView style={styles.section} liquidGlass tint="neutral" intensity={isDark ? 10 : 20}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>2. Objet de l&apos;application</Text>
          <Text style={[styles.paragraph, { color: currentTheme.text }]}>
            Odalea est une application sociale dédiée aux propriétaires d&apos;animaux de compagnie. Elle permet de créer un profil pour vous et vos animaux, de rencontrer d&apos;autres propriétaires, de partager des moments, de trouver des services (cat-sitters, vétérinaires, boutiques), et de participer à des défis et événements.
          </Text>
        </GlassView>
        </Animated.View>

        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
        <GlassView style={styles.section} liquidGlass tint="neutral" intensity={20}>
          <Text style={styles.sectionTitle}>3. Inscription et compte utilisateur</Text>
          <Text style={styles.paragraph}>
            Pour utiliser Odalea, vous devez créer un compte en fournissant des informations exactes et à jour. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités effectuées sous votre compte.
          </Text>
          <Text style={styles.bulletText}>• Vous devez avoir au moins 18 ans pour créer un compte</Text>
          <Text style={styles.bulletText}>• Vous ne pouvez créer qu&apos;un seul compte par personne</Text>
          <Text style={styles.bulletText}>• Vous devez fournir des informations véridiques</Text>
          <Text style={styles.bulletText}>• Vous êtes responsable de la sécurité de votre mot de passe</Text>
        </GlassView>
        </Animated.View>

        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
        <GlassView style={styles.section} liquidGlass tint="neutral" intensity={20}>
          <Text style={styles.sectionTitle}>4. Utilisation de l&apos;application</Text>
          <Text style={styles.paragraph}>Vous vous engagez à :</Text>
          <Text style={styles.bulletText}>• Respecter la vie privée des autres membres</Text>
          <Text style={styles.bulletText}>• Ne pas harceler, insulter ou menacer d&apos;autres utilisateurs</Text>
          <Text style={styles.bulletText}>• Ne pas publier de contenus illicites, violents, haineux ou inappropriés</Text>
          <Text style={styles.bulletText}>• Utiliser l&apos;application dans un cadre légal et respectueux</Text>
          <Text style={styles.bulletText}>• Signaler tout abus ou contenu inadapté</Text>
          <Text style={styles.bulletText}>• Respecter les droits de propriété intellectuelle</Text>
        </GlassView>
        </Animated.View>

        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
        <GlassView style={styles.section} liquidGlass tint="neutral" intensity={20}>
          <Text style={styles.sectionTitle}>5. Contenus publiés</Text>
          <Text style={styles.paragraph}>
            Vous conservez la propriété des contenus que vous publiez (photos, textes, vidéos). En publiant du contenu, vous accordez à Odalea une licence mondiale, non exclusive, pour utiliser, reproduire et diffuser ce contenu dans le cadre de l&apos;application.
          </Text>
          <Text style={styles.paragraph}>
            Vous garantissez que vous disposez de tous les droits nécessaires sur les contenus publiés et que ceux-ci ne violent aucun droit de tiers.
          </Text>
        </GlassView>
        </Animated.View>

        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
        <GlassView style={styles.section} liquidGlass tint="neutral" intensity={20}>
          <Text style={styles.sectionTitle}>6. Services payants</Text>
          <Text style={styles.paragraph}>
            Certains services de l&apos;application peuvent être payants (abonnement premium, boutique en ligne, services de cat-sitting). Les conditions de paiement et de remboursement sont précisées lors de l&apos;achat.
          </Text>
          <Text style={styles.bulletText}>• Les prix sont indiqués en euros TTC</Text>
          <Text style={styles.bulletText}>• Les paiements sont sécurisés</Text>
          <Text style={styles.bulletText}>• Droit de rétractation de 14 jours pour les achats en ligne</Text>
        </GlassView>
        </Animated.View>

        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
        <GlassView style={styles.section} liquidGlass tint="neutral" intensity={20}>
          <Text style={styles.sectionTitle}>7. Responsabilité</Text>
          <Text style={styles.paragraph}>
            Odalea met tout en œuvre pour assurer la disponibilité et la sécurité de l&apos;application, mais ne peut garantir un fonctionnement sans interruption ni erreur.
          </Text>
          <Text style={styles.paragraph}>
            Odalea n&apos;est pas responsable des interactions entre utilisateurs, des rencontres organisées via l&apos;application, ni des services fournis par des tiers (cat-sitters, professionnels).
          </Text>
        </GlassView>
        </Animated.View>

        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
        <GlassView style={styles.section} liquidGlass tint="neutral" intensity={20}>
          <Text style={styles.sectionTitle}>8. Suspension et résiliation</Text>
          <Text style={styles.paragraph}>
            Odalea se réserve le droit de suspendre ou supprimer votre compte en cas de non-respect des présentes conditions, sans préavis ni indemnité.
          </Text>
          <Text style={styles.paragraph}>
            Vous pouvez supprimer votre compte à tout moment depuis les paramètres de l&apos;application.
          </Text>
        </GlassView>
        </Animated.View>

        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
        <GlassView style={styles.section} liquidGlass tint="neutral" intensity={20}>
          <Text style={styles.sectionTitle}>9. Modification des CGU</Text>
          <Text style={styles.paragraph}>
            Odalea se réserve le droit de modifier les présentes conditions à tout moment. Les utilisateurs seront informés des modifications importantes par notification.
          </Text>
        </GlassView>
        </Animated.View>

        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
        <GlassView style={styles.section} liquidGlass tint="neutral" intensity={20}>
          <Text style={styles.sectionTitle}>10. Droit applicable et juridiction</Text>
          <Text style={styles.paragraph}>
            Les présentes conditions sont régies par le droit français. Tout litige sera soumis aux tribunaux compétents de Paris.
          </Text>
        </GlassView>
        </Animated.View>

        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
        <GlassView style={styles.section} liquidGlass tint="neutral" intensity={20}>
          <Text style={styles.sectionTitle}>11. Contact</Text>
          <Text style={styles.paragraph}>
            Pour toute question concernant ces conditions :
          </Text>
          <Text style={styles.bulletText}>• Email : support@odalea.com</Text>
          <Text style={styles.bulletText}>• Adresse : Odalea SAS, 123 Rue de la Paix, 75001 Paris</Text>
        </GlassView>
        </Animated.View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  card: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'center',
  },
  lastUpdate: {
    fontSize: 12,
    fontStyle: 'italic' as const,
  },
  section: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
    lineHeight: 24,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'left',
  },
  bulletText: {
    fontSize: 15,
    lineHeight: 22,
    marginLeft: 16,
    marginBottom: 8,
  },
});
