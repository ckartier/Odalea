import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { useRevenueCat } from '@/hooks/revenuecat-store';
import { COLORS, SHADOWS } from '@/constants/colors';
import {
  Crown,
  X,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  Mail,
  FileText,
} from 'lucide-react-native';

interface CustomerCenterProps {
  visible: boolean;
  onClose: () => void;
}

export default function CustomerCenter({ visible, onClose }: CustomerCenterProps) {
  const { customerInfo, isPro, entitlement, isLoading, restorePurchases, refresh } = useRevenueCat();
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      const result = await restorePurchases();
      
      if (result.success) {
        Alert.alert(
          'Achats Restaurés',
          'Vos achats ont été restaurés avec succès.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Restauration Échouée',
          result.error || 'Impossible de restaurer vos achats. Veuillez réessayer.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors de la restauration.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } catch (error) {
      console.error('Error refreshing customer info:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('https://apps.apple.com/account/subscriptions');
      } else if (Platform.OS === 'android') {
        await Linking.openURL('https://play.google.com/store/account/subscriptions');
      } else {
        Alert.alert(
          'Information',
          'Veuillez gérer votre abonnement via les paramètres de votre boutique d\'applications.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening subscription management:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'ouvrir les paramètres d\'abonnement.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contacter le Support',
      'Pour toute question concernant votre abonnement, contactez-nous à support@odalea.com',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer un Email',
          onPress: () => Linking.openURL('mailto:support@odalea.com?subject=Question sur mon abonnement'),
        },
      ]
    );
  };

  const formatDate = (timestamp: number | null | undefined) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getSubscriptionStatus = () => {
    if (!isPro || !entitlement) {
      return {
        title: 'Aucun Abonnement Actif',
        color: COLORS.darkGray,
        icon: <AlertCircle size={24} color={COLORS.darkGray} />,
      };
    }

    if (entitlement.willRenew) {
      return {
        title: 'Abonnement Actif',
        color: COLORS.success,
        icon: <CheckCircle size={24} color={COLORS.success} />,
      };
    } else {
      return {
        title: 'Abonnement Expire Bientôt',
        color: COLORS.warning,
        icon: <AlertCircle size={24} color={COLORS.warning} />,
      };
    }
  };

  const status = getSubscriptionStatus();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Centre Client</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.premium} />
              <Text style={styles.loadingText}>Chargement des informations...</Text>
            </View>
          ) : (
            <>
              <View style={[styles.statusCard, SHADOWS.medium]}>
                <View style={styles.statusHeader}>
                  {status.icon}
                  <Text style={[styles.statusTitle, { color: status.color }]}>
                    {status.title}
                  </Text>
                </View>

                {isPro && entitlement && (
                  <View style={styles.statusDetails}>
                    <View style={styles.statusRow}>
                      <Crown size={20} color={COLORS.premium} />
                      <Text style={styles.statusLabel}>Abonnement:</Text>
                      <Text style={styles.statusValue}>Odalea Pro</Text>
                    </View>

                    {entitlement.productIdentifier && (
                      <View style={styles.statusRow}>
                        <CreditCard size={20} color={COLORS.primary} />
                        <Text style={styles.statusLabel}>Plan:</Text>
                        <Text style={styles.statusValue}>
                          {entitlement.productIdentifier.includes('monthly')
                            ? 'Mensuel'
                            : entitlement.productIdentifier.includes('yearly')
                            ? 'Annuel'
                            : 'À Vie'}
                        </Text>
                      </View>
                    )}

                    {entitlement.originalPurchaseDate && (
                      <View style={styles.statusRow}>
                        <Calendar size={20} color={COLORS.accent} />
                        <Text style={styles.statusLabel}>Début:</Text>
                        <Text style={styles.statusValue}>
                          {formatDate(entitlement.originalPurchaseDateMillis)}
                        </Text>
                      </View>
                    )}

                    {entitlement.expirationDate && (
                      <View style={styles.statusRow}>
                        <Calendar size={20} color={entitlement.willRenew ? COLORS.success : COLORS.warning} />
                        <Text style={styles.statusLabel}>
                          {entitlement.willRenew ? 'Renouvellement:' : 'Expire:'}
                        </Text>
                        <Text style={styles.statusValue}>
                          {formatDate(entitlement.expirationDateMillis)}
                        </Text>
                      </View>
                    )}

                    {!entitlement.willRenew && (
                      <View style={styles.warningBanner}>
                        <AlertCircle size={16} color={COLORS.warning} />
                        <Text style={styles.warningText}>
                          Votre abonnement ne se renouvellera pas automatiquement
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {!isPro && (
                  <View style={styles.noSubscriptionContainer}>
                    <Text style={styles.noSubscriptionText}>
                      Vous n\u2019avez pas d\u2019abonnement actif. Passez à Odalea Pro pour profiter de toutes les fonctionnalités premium !
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actions</Text>

                {isPro && (
                  <TouchableOpacity
                    style={[styles.actionButton, SHADOWS.small]}
                    onPress={handleManageSubscription}
                  >
                    <View style={styles.actionIconContainer}>
                      <CreditCard size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionTitle}>Gérer l\u2019Abonnement</Text>
                      <Text style={styles.actionDescription}>
                        Modifier ou annuler votre abonnement
                      </Text>
                    </View>
                    <ExternalLink size={20} color={COLORS.darkGray} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, SHADOWS.small]}
                  onPress={handleRestorePurchases}
                  disabled={isRestoring}
                >
                  <View style={styles.actionIconContainer}>
                    {isRestoring ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <RefreshCw size={24} color={COLORS.primary} />
                    )}
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Restaurer les Achats</Text>
                    <Text style={styles.actionDescription}>
                      Récupérer vos achats précédents
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, SHADOWS.small]}
                  onPress={handleRefresh}
                  disabled={isRefreshing}
                >
                  <View style={styles.actionIconContainer}>
                    {isRefreshing ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <RefreshCw size={24} color={COLORS.accent} />
                    )}
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Actualiser</Text>
                    <Text style={styles.actionDescription}>
                      Mettre à jour les informations
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>

                <TouchableOpacity
                  style={[styles.actionButton, SHADOWS.small]}
                  onPress={handleContactSupport}
                >
                  <View style={styles.actionIconContainer}>
                    <Mail size={24} color={COLORS.catSitter} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Contacter le Support</Text>
                    <Text style={styles.actionDescription}>
                      Besoin d\u2019aide ? Contactez-nous
                    </Text>
                  </View>
                  <ExternalLink size={20} color={COLORS.darkGray} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, SHADOWS.small]}
                  onPress={() => Linking.openURL('https://odalea.com/privacy')}
                >
                  <View style={styles.actionIconContainer}>
                    <Shield size={24} color={COLORS.success} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Politique de Confidentialité</Text>
                    <Text style={styles.actionDescription}>
                      Voir comment nous protégeons vos données
                    </Text>
                  </View>
                  <ExternalLink size={20} color={COLORS.darkGray} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, SHADOWS.small]}
                  onPress={() => Linking.openURL('https://odalea.com/terms')}
                >
                  <View style={styles.actionIconContainer}>
                    <FileText size={24} color={COLORS.accent} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Conditions d\u2019Utilisation</Text>
                    <Text style={styles.actionDescription}>
                      Lire nos conditions générales
                    </Text>
                  </View>
                  <ExternalLink size={20} color={COLORS.darkGray} />
                </TouchableOpacity>
              </View>

              {customerInfo && (
                <View style={styles.debugSection}>
                  <Text style={styles.debugTitle}>Informations de Débogage</Text>
                  <Text style={styles.debugText}>
                    User ID: {customerInfo.originalAppUserId}
                  </Text>
                  <Text style={styles.debugText}>
                    Entitlements: {Object.keys(customerInfo.entitlements.active).join(', ') || 'Aucun'}
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 12,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  statusDetails: {
    gap: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.black,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.warning + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 13,
    color: COLORS.warning,
    flex: 1,
    lineHeight: 18,
  },
  noSubscriptionContainer: {
    paddingVertical: 20,
  },
  noSubscriptionText: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: COLORS.darkGray,
    lineHeight: 18,
  },
  debugSection: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 11,
    color: COLORS.darkGray,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
});
