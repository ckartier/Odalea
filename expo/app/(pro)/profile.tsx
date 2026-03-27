import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import PhotoUploader from '@/components/PhotoUploader';
import { useUser } from '@/hooks/user-store';
import {
  LogOut,
  MapPin,
  Phone,
  Settings,
  Star,
  User as UserIcon,
  Camera,
  Euro,
  Package,
  TrendingUp,
  Award,
  CheckCircle,
  Briefcase,
  ArrowRight,
} from 'lucide-react-native';

export default function ProProfileScreen() {
  const router = useRouter();
  const { user, signOut, updateUser } = useUser();
  
  const [refreshing, setRefreshing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(user?.photo);
  
  // Update profile photo when user changes
  useEffect(() => {
    setProfilePhoto(user?.photo);
  }, [user?.photo]);
  
  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };
  
  const handleEditProfile = () => {
    router.push('/(pro)/edit-profile');
  };
  
  const handlePhotoChange = async (uri: string | null) => {
    if (user) {
      console.log('Updating profile photo:', uri);
      setProfilePhoto(uri || undefined);
      // Update user profile photo
      const result = await updateUser({ ...user, photo: uri || undefined });
      if (result.success) {
        console.log('Profile photo updated successfully');
      } else {
        console.error('Failed to update profile photo:', result.error);
        Alert.alert('Erreur', 'Impossible de mettre à jour la photo de profil.');
      }
    }
  };
  
  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/splash');
          },
        },
      ]
    );
  };
  
  if (!user || !user.isProfessional || !user.professionalData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Accès non autorisé</Text>
      </View>
    );
  }
  
  const professionalData = user.professionalData;
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerName}>Profil Professionnel</Text>
          <Text style={styles.companyName}>{professionalData.companyName}</Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, SHADOWS.small]}
            onPress={handleEditProfile}
          >
            <Settings size={20} color={COLORS.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.headerButton, SHADOWS.small]}
            onPress={handleSignOut}
          >
            <LogOut size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profilePhotoContainer}>
            <PhotoUploader
              value={profilePhoto || undefined}
              onChange={handlePhotoChange}
              placeholder="Photo de profil"
              style={styles.profilePhotoUploader}
            >
              <TouchableOpacity style={styles.cameraOverlay}>
                <Camera size={20} color={COLORS.white} />
              </TouchableOpacity>
            </PhotoUploader>
          </View>
          
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
            {professionalData.isVerified && (
              <View style={styles.verifiedBadge}>
                <CheckCircle size={16} color={COLORS.success} />
                <Text style={styles.verifiedText}>Vérifié</Text>
              </View>
            )}
          </View>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <MapPin size={16} color={COLORS.darkGray} />
              <Text style={styles.detailText}>{user.city}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Phone size={16} color={COLORS.darkGray} />
              <Text style={styles.detailText}>+{user.countryCode} {user.phoneNumber}</Text>
            </View>
          </View>
        </View>
        
        {/* Professional Stats */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Statistiques professionnelles</Text>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, SHADOWS.small]}>
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.primary}20` }]}>
              <Package size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>
              {professionalData.products.filter(p => p.isActive).length}
            </Text>
            <Text style={styles.statTitle}>Produits actifs</Text>
          </View>
          
          <View style={[styles.statCard, SHADOWS.small]}>
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.success}20` }]}>
              <Euro size={24} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>
              {professionalData.analytics.totalSales.toFixed(0)}€
            </Text>
            <Text style={styles.statTitle}>Chiffre d&apos;affaires</Text>
          </View>
          
          <View style={[styles.statCard, SHADOWS.small]}>
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.accent}20` }]}>
              <TrendingUp size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.statValue}>
              {professionalData.analytics.totalOrders}
            </Text>
            <Text style={styles.statTitle}>Commandes totales</Text>
          </View>
          
          <View style={[styles.statCard, SHADOWS.small]}>
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.warning}20` }]}>
              <Star size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.statValue}>
              {professionalData.analytics.averageOrderValue.toFixed(1)}
            </Text>
            <Text style={styles.statTitle}>Note moyenne</Text>
          </View>
        </View>
        
        {/* Company Information */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informations de l&apos;entreprise</Text>
        </View>
        
        <View style={[styles.infoCard, SHADOWS.small]}>
          <View style={styles.infoItem}>
            <Package size={18} color={COLORS.darkGray} />
            <Text style={styles.infoLabel}>Entreprise</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {professionalData.companyName}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoItem}>
            <Award size={18} color={COLORS.darkGray} />
            <Text style={styles.infoLabel}>Secteur</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {professionalData.subscriptionType === 'premium' ? 'Premium' : 'Basique'}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoItem}>
            <UserIcon size={18} color={COLORS.darkGray} />
            <Text style={styles.infoLabel}>Email professionnel</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{user.email}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoItem}>
            <Star size={18} color={COLORS.darkGray} />
            <Text style={styles.infoLabel}>Membre depuis</Text>
            <Text style={styles.infoValue}>
              {new Date(user.createdAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>
        
        {/* Business Description */}
        {professionalData.businessDescription && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Description de l&apos;activité</Text>
            </View>
            
            <View style={[styles.descriptionCard, SHADOWS.small]}>
              <Text style={styles.descriptionText}>
                {professionalData.businessDescription}
              </Text>
            </View>
          </>
        )}
        
        {/* Services Management Quick Access */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gestion des prestations</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.servicesManagementCard, SHADOWS.small]}
          onPress={() => router.push('/(pro)/services/manage')}
        >
          <View style={styles.servicesManagementIcon}>
            <Briefcase size={24} color={COLORS.primary} />
          </View>
          <View style={styles.servicesManagementContent}>
            <Text style={styles.servicesManagementTitle}>Gérer vos prestations</Text>
            <Text style={styles.servicesManagementSubtitle}>
              Prix, disponibilités, calendrier et services
            </Text>
          </View>
          <ArrowRight size={20} color={COLORS.darkGray} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
  },
  fixedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  companyName: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  profileSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  profilePhotoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePhotoUploader: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '500' as const,
  },
  detailsContainer: {
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 40,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.black,
    marginLeft: 10,
    width: 120,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkGray,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.mediumGray,
  },
  descriptionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  servicesManagementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  servicesManagementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  servicesManagementContent: {
    flex: 1,
  },
  servicesManagementTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 2,
  },
  servicesManagementSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
});