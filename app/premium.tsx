import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { useAuth } from '@/hooks/auth-store';
import { usePremium } from '@/hooks/premium-store';
import {
  Crown,
  Star,
  CheckCircle,
  X,
  MessageCircle,
  MapPin,
  Shield,
  Zap,
  Heart,
  Camera,
  Users,
  Trophy,
  ArrowLeft,
  CreditCard,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface PremiumFeature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  freeLimit?: string;
  premiumLimit: string;
}

const getPremiumFeatures = (t: (key: string) => string): PremiumFeature[] => [
  {
    id: 'messages',
    icon: <MessageCircle size={24} color={COLORS.premium} />,
    title: t('messages.messages'),
    description: t('messages.conversations'),
    freeLimit: '10 messages/mois',
    premiumLimit: 'Illimité',
  },
  {
    id: 'map',
    icon: <MapPin size={24} color={COLORS.premium} />,
    title: t('map.around_me'),
    description: 'Voir les animaux et gardiens jusqu\'à 50km',
    freeLimit: 'Rayon 5km',
    premiumLimit: 'Rayon 50km',
  },
  {
    id: 'priority',
    icon: <Zap size={24} color={COLORS.premium} />,
    title: 'Support Prioritaire',
    description: 'Obtenez un support client prioritaire et des temps de réponse plus rapides',
    premiumLimit: 'Support prioritaire 24/7',
  },
  {
    id: 'verification',
    icon: <Shield size={24} color={COLORS.premium} />,
    title: 'Badge Vérifié',
    description: 'Obtenez un badge vérifié pour établir la confiance avec les autres utilisateurs',
    premiumLimit: 'Statut vérifié',
  },
  {
    id: 'photos',
    icon: <Camera size={24} color={COLORS.premium} />,
    title: 'Photos Illimitées',
    description: 'Téléchargez un nombre illimité de photos pour vos profils d\'animaux',
    freeLimit: '5 photos par animal',
    premiumLimit: 'Photos illimitées',
  },
  {
    id: 'groups',
    icon: <Users size={24} color={COLORS.premium} />,
    title: 'Groupes Premium',
    description: 'Rejoignez des groupes exclusifs de propriétaires d\'animaux premium',
    premiumLimit: 'Accès aux groupes premium',
  },
  {
    id: 'challenges',
    icon: <Trophy size={24} color={COLORS.premium} />,
    title: 'Défis Premium',
    description: 'Participez à des défis exclusifs avec de meilleures récompenses',
    premiumLimit: 'Défis premium',
  },
  {
    id: 'ads',
    icon: <X size={24} color={COLORS.premium} />,
    title: 'Expérience Sans Pub',
    description: 'Profitez de Coppet sans aucune publicité',
    premiumLimit: 'Aucune pub',
  },
];

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  savings?: string;
  popular?: boolean;
}

const getPricingPlans = (t: (key: string) => string): PricingPlan[] => [
  {
    id: 'monthly',
    name: 'Mensuel',
    price: 9.99,
    period: 'mois',
  },
  {
    id: 'yearly',
    name: 'Annuel',
    price: 79.99,
    period: 'an',
    savings: 'Économisez 33%',
    popular: true,
  },
  {
    id: 'lifetime',
    name: 'À vie',
    price: 199.99,
    period: 'unique',
    savings: 'Meilleure valeur',
  },
];

export default function PremiumScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, updateUser } = useAuth();
  const premiumStore = usePremium();
  const premiumFeatures = getPremiumFeatures(t);
  const pricingPlans = getPricingPlans(t);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>(pricingPlans[1]); // Default to yearly
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      Alert.alert(t('auth.sign_in'), t('auth.create_account'));
      return;
    }

    setIsLoading(true);

    try {
      // In a real app, this would integrate with payment processing
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate payment processing

      const result = await premiumStore.upgradeToPremium(selectedPlan.id);
      
      if (result.success) {
        await updateUser({ isPremium: true });
        
        Alert.alert(
          'Bienvenue dans Premium ! 🎉',
          'Vous avez maintenant accès à toutes les fonctionnalités premium. Profitez de votre expérience Coppet améliorée !',
          [
            {
              text: 'Commencer l\'exploration',
              onPress: () => router.replace('/(tabs)/map'),
            },
          ]
        );
      } else {
        Alert.alert('Paiement échoué', result.error || 'Impossible de traiter le paiement. Veuillez réessayer.');
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.unknown_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = () => {
    Alert.alert('Restaurer les achats', 'Ceci restaurerait les achats premium précédents.');
  };

  const renderFeature = (feature: PremiumFeature) => (
    <View key={feature.id} style={styles.featureItem}>
      <View style={styles.featureIcon}>
        {feature.icon}
      </View>
      
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
        
        <View style={styles.featureLimits}>
          {feature.freeLimit && (
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Gratuit:</Text>
              <Text style={styles.freeLimitText}>{feature.freeLimit}</Text>
            </View>
          )}
          <View style={styles.limitItem}>
            <Text style={styles.limitLabel}>Premium:</Text>
            <Text style={styles.premiumLimitText}>{feature.premiumLimit}</Text>
            <CheckCircle size={16} color={COLORS.success} />
          </View>
        </View>
      </View>
    </View>
  );

  const renderPricingPlan = (plan: PricingPlan) => (
    <TouchableOpacity
      key={plan.id}
      style={[
        styles.pricingPlan,
        selectedPlan.id === plan.id && styles.selectedPlan,
        plan.popular && styles.popularPlan,
      ]}
      onPress={() => setSelectedPlan(plan)}
    >
      {plan.popular && (
        <View style={styles.popularBadge}>
          <Star size={12} color={COLORS.white} />
          <Text style={styles.popularText}>Plus populaire</Text>
        </View>
      )}
      
      <Text style={styles.planName}>{plan.name}</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.price}>€{plan.price}</Text>
        <Text style={styles.period}>/{plan.period}</Text>
      </View>
      
      {plan.savings && (
        <Text style={styles.savings}>{plan.savings}</Text>
      )}
      
      {selectedPlan.id === plan.id && (
        <View style={styles.selectedIndicator}>
          <CheckCircle size={20} color={COLORS.success} />
        </View>
      )}
    </TouchableOpacity>
  );

  if (user?.isPremium) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: t('profile.premium'),
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft size={24} color={COLORS.black} />
              </TouchableOpacity>
            ),
          }}
        />

        <View style={styles.alreadyPremiumContainer}>
          <Crown size={80} color={COLORS.premium} />
          <Text style={styles.alreadyPremiumTitle}>Vous êtes Premium ! 🎉</Text>
          <Text style={styles.alreadyPremiumSubtitle}>
            Vous avez accès à toutes les fonctionnalités premium. Merci de soutenir Coppet !
          </Text>
          
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/(tabs)/map')}
          >
            <Text style={styles.exploreButtonText}>Explorer les fonctionnalités Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Abonnement Premium',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={COLORS.black} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, SHADOWS.medium]}>
          <Crown size={60} color={COLORS.premium} />
          <Text style={styles.headerTitle}>Passer à Premium</Text>
          <Text style={styles.headerSubtitle}>
            Débloquez toutes les fonctionnalités et tirez le meilleur parti de Coppet
          </Text>
        </View>

        {/* Features */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Fonctionnalités Premium</Text>
          {premiumFeatures.map(renderFeature)}
        </View>

        {/* Pricing */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Choisissez votre plan</Text>
          <View style={styles.pricingContainer}>
            {pricingPlans.map(renderPricingPlan)}
          </View>
        </View>

        {/* Benefits Summary */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Pourquoi passer Premium ?</Text>
          
          <View style={styles.benefitItem}>
            <Heart size={20} color={COLORS.catSitter} />
            <Text style={styles.benefitText}>
              Connectez-vous avec plus d'amoureux des animaux dans votre région
            </Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Shield size={20} color={COLORS.success} />
            <Text style={styles.benefitText}>
              Établissez la confiance avec un statut vérifié
            </Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Zap size={20} color={COLORS.warning} />
            <Text style={styles.benefitText}>
              Obtenez un support prioritaire quand vous en avez besoin
            </Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Trophy size={20} color={COLORS.accent} />
            <Text style={styles.benefitText}>
              Accédez à des défis exclusifs et des récompenses
            </Text>
          </View>
        </View>

        {/* Testimonials */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Ce que disent les utilisateurs Premium</Text>
          
          <View style={styles.testimonial}>
            <Text style={styles.testimonialText}>
              "Premium a rendu tellement plus facile de trouver des gardiens d'animaux de confiance. La fonction de portée étendue est incroyable !"
            </Text>
            <Text style={styles.testimonialAuthor}>- Sarah M., Utilisatrice Premium</Text>
          </View>
          
          <View style={styles.testimonial}>
            <Text style={styles.testimonialText}>
              "J'adore l'expérience sans pub et la messagerie illimitée. Ça vaut chaque centime !"
            </Text>
            <Text style={styles.testimonialAuthor}>- Marc D., Utilisateur Premium</Text>
          </View>
        </View>
      </ScrollView>

      {/* Upgrade Button */}
      <View style={[styles.upgradeContainer, SHADOWS.large]}>
        <View style={styles.priceInfo}>
          <Text style={styles.selectedPlanText}>
            {selectedPlan.name} Plan - €{selectedPlan.price}
          </Text>
          {selectedPlan.savings && (
            <Text style={styles.savingsText}>{selectedPlan.savings}</Text>
          )}
        </View>
        
        <TouchableOpacity
          style={[styles.upgradeButton, isLoading && styles.disabledButton]}
          onPress={handleUpgrade}
          disabled={isLoading}
        >
          <CreditCard size={20} color={COLORS.white} />
          <Text style={styles.upgradeButtonText}>
            {isLoading ? 'Traitement...' : 'Passer à Premium'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestorePurchases}>
          <Text style={styles.restoreButtonText}>Restaurer les achats</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  scrollContent: {
    paddingBottom: 200,
  },
  header: {
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
    lineHeight: 20,
  },
  featureLimits: {
    gap: 4,
  },
  limitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  limitLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: COLORS.darkGray,
    minWidth: 50,
  },
  freeLimitText: {
    fontSize: 12,
    color: COLORS.error,
  },
  premiumLimitText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500' as const,
  },
  pricingContainer: {
    gap: 12,
  },
  pricingPlan: {
    position: 'relative',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.mediumGray,
    backgroundColor: COLORS.lightGray,
  },
  selectedPlan: {
    borderColor: COLORS.premium,
    backgroundColor: COLORS.white,
  },
  popularPlan: {
    borderColor: COLORS.premium,
    backgroundColor: COLORS.white,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    right: 20,
    backgroundColor: COLORS.premium,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.premium,
  },
  period: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  savings: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.success,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    color: COLORS.black,
    flex: 1,
  },
  testimonial: {
    backgroundColor: COLORS.lightGray,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  testimonialText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.darkGray,
    marginBottom: 8,
    lineHeight: 20,
  },
  testimonialAuthor: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: COLORS.primary,
  },
  upgradeContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  priceInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedPlanText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  savingsText: {
    fontSize: 14,
    color: COLORS.success,
    marginTop: 4,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.premium,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  disabledButton: {
    opacity: 0.6,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  restoreButtonText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  alreadyPremiumContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  alreadyPremiumTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  alreadyPremiumSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  exploreButton: {
    backgroundColor: COLORS.premium,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
});