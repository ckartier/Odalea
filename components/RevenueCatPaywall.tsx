import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { useRevenueCat } from '@/hooks/revenuecat-store';
import { COLORS, SHADOWS } from '@/constants/colors';
import {
  Crown,
  Star,
  CheckCircle,
  X,
  MessageCircle,
  MapPin,
  Shield,
  Zap,
  Camera,
  Users,
  Trophy,
  Sparkles,
} from 'lucide-react-native';

interface RevenueCatPaywallProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseComplete?: () => void;
  onPurchaseError?: (error: string) => void;
}

interface PremiumFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const premiumFeatures: PremiumFeature[] = [
  {
    icon: <MessageCircle size={24} color={COLORS.premium} />,
    title: 'Messages Illimités',
    description: 'Envoyez autant de messages que vous voulez',
  },
  {
    icon: <MapPin size={24} color={COLORS.premium} />,
    title: 'Portée Étendue',
    description: 'Voir les animaux jusqu\'à 50km autour de vous',
  },
  {
    icon: <Shield size={24} color={COLORS.premium} />,
    title: 'Badge Vérifié',
    description: 'Établissez la confiance avec un statut vérifié',
  },
  {
    icon: <Zap size={24} color={COLORS.premium} />,
    title: 'Support Prioritaire',
    description: 'Obtenez une assistance rapide 24/7',
  },
  {
    icon: <Camera size={24} color={COLORS.premium} />,
    title: 'Photos Illimitées',
    description: 'Téléchargez autant de photos que vous voulez',
  },
  {
    icon: <Users size={24} color={COLORS.premium} />,
    title: 'Groupes Premium',
    description: 'Rejoignez des communautés exclusives',
  },
  {
    icon: <Trophy size={24} color={COLORS.premium} />,
    title: 'Défis Premium',
    description: 'Accédez à des défis avec de meilleures récompenses',
  },
  {
    icon: <X size={24} color={COLORS.premium} />,
    title: 'Sans Publicité',
    description: 'Profitez de Odalea sans aucune pub',
  },
];

export default function RevenueCatPaywall({
  visible,
  onClose,
  onPurchaseComplete,
  onPurchaseError,
}: RevenueCatPaywallProps) {
  const { packages, isLoading, purchasePackage } = useRevenueCat();
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useMemo(() => {
    if (!selectedPackage && packages.yearly) {
      setSelectedPackage(packages.yearly);
    } else if (!selectedPackage && packages.monthly) {
      setSelectedPackage(packages.monthly);
    }
  }, [packages, selectedPackage]);

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setPurchasing(true);
    try {
      const result = await purchasePackage(selectedPackage);
      
      if (result.success) {
        onPurchaseComplete?.();
        onClose();
      } else {
        onPurchaseError?.(result.error || 'Purchase failed');
      }
    } catch (error: any) {
      onPurchaseError?.(error.message || 'An unexpected error occurred');
    } finally {
      setPurchasing(false);
    }
  };

  const renderPackageCard = (pkg: PurchasesPackage | null, type: 'monthly' | 'yearly' | 'lifetime') => {
    if (!pkg) return null;

    const isSelected = selectedPackage?.identifier === pkg.identifier;
    const product = pkg.product;
    
    const price = product.priceString;
    const period = type === 'monthly' ? 'mois' : type === 'yearly' ? 'an' : 'à vie';
    
    let savings = '';
    let popular = false;
    
    if (type === 'yearly') {
      savings = 'Économisez 33%';
      popular = true;
    } else if (type === 'lifetime') {
      savings = 'Meilleure valeur';
    }

    return (
      <TouchableOpacity
        key={pkg.identifier}
        style={[
          styles.packageCard,
          isSelected && styles.selectedPackageCard,
          popular && styles.popularPackageCard,
        ]}
        onPress={() => setSelectedPackage(pkg)}
      >
        {popular && (
          <View style={styles.popularBadge}>
            <Star size={12} color={COLORS.white} fill={COLORS.white} />
            <Text style={styles.popularText}>Plus Populaire</Text>
          </View>
        )}
        
        <View style={styles.packageHeader}>
          <Text style={styles.packageTitle}>
            {type === 'monthly' ? 'Mensuel' : type === 'yearly' ? 'Annuel' : 'À Vie'}
          </Text>
          {savings && (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>{savings}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{price}</Text>
          <Text style={styles.period}>/{period}</Text>
        </View>
        
        {product.introPrice && (
          <Text style={styles.trialText}>
            Essai gratuit de {product.introPrice.periodNumberOfUnits} {product.introPrice.periodUnit}
          </Text>
        )}
        
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <CheckCircle size={20} color={COLORS.success} fill={COLORS.success} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFeature = (feature: PremiumFeature, index: number) => (
    <View key={index} style={styles.featureItem}>
      <View style={styles.featureIcon}>{feature.icon}</View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={24} color={COLORS.black} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Crown size={60} color={COLORS.premium} />
              <Sparkles size={24} color={COLORS.warning} style={styles.sparkle} />
            </View>
            <Text style={styles.headerTitle}>Passez à Odalea Pro</Text>
            <Text style={styles.headerSubtitle}>
              Débloquez toutes les fonctionnalités premium et tirez le meilleur parti de votre expérience
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choisissez votre plan</Text>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.premium} />
                <Text style={styles.loadingText}>Chargement des offres...</Text>
              </View>
            ) : (
              <View style={styles.packagesContainer}>
                {renderPackageCard(packages.monthly, 'monthly')}
                {renderPackageCard(packages.yearly, 'yearly')}
                {renderPackageCard(packages.lifetime, 'lifetime')}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ce que vous obtenez</Text>
            <View style={styles.featuresGrid}>
              {premiumFeatures.map(renderFeature)}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              L\u2019abonnement se renouvelle automatiquement. Vous pouvez annuler à tout moment dans les paramètres de votre compte.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.purchaseContainer, SHADOWS.large]}>
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              (!selectedPackage || purchasing || isLoading) && styles.purchaseButtonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={!selectedPackage || purchasing || isLoading}
          >
            {purchasing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Crown size={20} color={COLORS.white} />
                <Text style={styles.purchaseButtonText}>
                  {selectedPackage
                    ? `Continuer avec ${selectedPackage.product.priceString}`
                    : 'Sélectionnez un plan'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          <Text style={styles.termsText}>
            En continuant, vous acceptez nos conditions d\u2019utilisation et notre politique de confidentialité
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 100 : 60,
    paddingBottom: 200,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  sparkle: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 12,
  },
  packagesContainer: {
    gap: 12,
  },
  packageCard: {
    position: 'relative',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.mediumGray,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  selectedPackageCard: {
    borderColor: COLORS.premium,
    borderWidth: 3,
    ...SHADOWS.medium,
  },
  popularPackageCard: {
    borderColor: COLORS.premium,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: COLORS.premium,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...SHADOWS.small,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  savingsBadge: {
    backgroundColor: COLORS.success + '20',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.success,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.premium,
  },
  period: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  trialText: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '500' as const,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  featuresGrid: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 18,
  },
  purchaseContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.premium,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  termsText: {
    fontSize: 11,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 16,
  },
});
