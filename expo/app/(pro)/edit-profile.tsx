import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/constants/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import PhotoUploader from '@/components/PhotoUploader';
import CountryCodePicker from '@/components/CountryCodePicker';
import { useAuth } from '@/hooks/auth-store';
import {
  ArrowLeft,
  Mail,
  User,
  Phone,
  MapPin,
  Hash,
  Building2,
  CreditCard,
  FileText,
} from 'lucide-react-native';

export default function ProEditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.photo || null);
  
  // Personal data
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [countryCode, setCountryCode] = useState(user?.countryCode || 'FR');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [address, setAddress] = useState(user?.address || '');
  const [zipCode, setZipCode] = useState(user?.zipCode || '');
  const [city, setCity] = useState(user?.city || '');
  
  // Professional data
  const [companyName, setCompanyName] = useState(user?.professionalData?.companyName || '');
  const [siret, setSiret] = useState(user?.professionalData?.siret || '');
  const [businessAddress, setBusinessAddress] = useState(user?.professionalData?.businessAddress || '');
  const [businessEmail, setBusinessEmail] = useState(user?.professionalData?.businessEmail || '');
  const [businessPhone, setBusinessPhone] = useState(user?.professionalData?.businessPhone || '');
  const [businessDescription, setBusinessDescription] = useState(user?.professionalData?.businessDescription || '');
  const [iban, setIban] = useState(user?.professionalData?.iban || '');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Don't navigate during initial render to avoid mounting issues
  // Instead, handle the redirect in the render logic
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Personal validation
    if (!firstName.trim()) {
      newErrors.firstName = 'Prénom requis';
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = 'Nom requis';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Numéro de téléphone requis';
    }
    
    if (!address.trim()) {
      newErrors.address = 'Adresse requise';
    }
    
    if (!zipCode.trim()) {
      newErrors.zipCode = 'Code postal requis';
    }
    
    if (!city.trim()) {
      newErrors.city = 'Ville requise';
    }
    
    // Professional validation
    if (!companyName.trim()) {
      newErrors.companyName = 'Nom de l\'entreprise requis';
    }
    
    if (!siret.trim()) {
      newErrors.siret = 'Numéro SIRET requis';
    } else if (siret.length !== 14) {
      newErrors.siret = 'Le numéro SIRET doit contenir 14 chiffres';
    }
    
    if (!businessAddress.trim()) {
      newErrors.businessAddress = 'Adresse de l\'entreprise requise';
    }
    
    if (!businessEmail.trim()) {
      newErrors.businessEmail = 'Email professionnel requis';
    } else if (!/\S+@\S+\.\S+/.test(businessEmail)) {
      newErrors.businessEmail = 'Email professionnel invalide';
    }
    
    if (!businessPhone.trim()) {
      newErrors.businessPhone = 'Téléphone professionnel requis';
    }
    
    if (!businessDescription.trim()) {
      newErrors.businessDescription = 'Description de l\'entreprise requise';
    }
    
    if (!iban.trim()) {
      newErrors.iban = 'IBAN requis';
    } else if (iban.length < 15 || iban.length > 34) {
      newErrors.iban = 'Format IBAN invalide';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validateForm() || !user) return;
    
    setLoading(true);
    
    try {
      const updatedUser = {
        ...user,
        firstName,
        lastName,
        email,
        countryCode,
        phoneNumber,
        address,
        zipCode,
        city,
        photo: profilePhoto || undefined,
        professionalData: {
          ...user.professionalData!,
          companyName,
          siret: siret.replace(/\s/g, ''),
          businessAddress,
          businessEmail,
          businessPhone,
          businessDescription,
          iban: iban.replace(/\s/g, '').toUpperCase(),
        },
      };
      
      await updateUser(updatedUser);
      
      Alert.alert(
        'Profil mis à jour',
        'Vos informations professionnelles ont été sauvegardées avec succès.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating professional profile:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBack = () => {
    router.back();
  };
  
  if (!user || !user.isProfessional) {
    // Navigate back if no user or not professional, but only after component is mounted
    setTimeout(() => {
      router.replace('/(pro)/profile');
    }, 0);
    
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement...</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color={COLORS.black} />
          </TouchableOpacity>
          
          <Text style={styles.title}>Modifier le profil pro</Text>
          
          <View style={styles.placeholder} />
        </View>
        
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <Text style={styles.photoLabel}>Photo de profil</Text>
          <PhotoUploader
            value={profilePhoto || undefined}
            onChange={(uri) => {
              console.log('Profile photo changed in edit:', uri);
              setProfilePhoto(uri);
            }}
            placeholder="Ajouter une photo"
            style={styles.profilePhotoUploader}
          />
        </View>
        
        {/* Personal Information Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Input
            label="Prénom"
            placeholder="Entrez votre prénom"
            value={firstName}
            onChangeText={setFirstName}
            error={errors.firstName}
            leftIcon={<User size={20} color={COLORS.darkGray} />}
          />
          
          <Input
            label="Nom"
            placeholder="Entrez votre nom"
            value={lastName}
            onChangeText={setLastName}
            error={errors.lastName}
            leftIcon={<User size={20} color={COLORS.darkGray} />}
          />
          
          <Input
            label="Email personnel"
            placeholder="Entrez votre email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            leftIcon={<Mail size={20} color={COLORS.darkGray} />}
          />
          
          <View style={styles.phoneSection}>
            <Text style={styles.phoneLabel}>Numéro de téléphone</Text>
            <View style={styles.phoneContainer}>
              <CountryCodePicker
                value={countryCode}
                onChange={setCountryCode}
                style={styles.countryCode}
              />
              
              <View style={styles.phoneInputContainer}>
                <Input
                  placeholder="Entrez votre numéro de téléphone"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  error={errors.phoneNumber}
                  containerStyle={styles.phoneInput}
                  leftIcon={<Phone size={20} color={COLORS.darkGray} />}
                  hideLabel
                />
              </View>
            </View>
          </View>
          
          <Input
            label="Adresse personnelle"
            placeholder="Entrez votre adresse"
            value={address}
            onChangeText={setAddress}
            error={errors.address}
            leftIcon={<MapPin size={20} color={COLORS.darkGray} />}
          />
          
          <View style={styles.rowContainer}>
            <Input
              label="Code postal"
              placeholder="Code postal"
              value={zipCode}
              onChangeText={setZipCode}
              error={errors.zipCode}
              containerStyle={styles.zipInput}
              leftIcon={<Hash size={20} color={COLORS.darkGray} />}
            />
            
            <Input
              label="Ville"
              placeholder="Ville"
              value={city}
              onChangeText={setCity}
              error={errors.city}
              containerStyle={styles.cityInput}
              leftIcon={<Building2 size={20} color={COLORS.darkGray} />}
            />
          </View>
        </View>
        
        {/* Professional Information Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informations professionnelles</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Input
            label="Nom de l'entreprise"
            placeholder="Entrez le nom de votre entreprise"
            value={companyName}
            onChangeText={setCompanyName}
            error={errors.companyName}
            leftIcon={<Building2 size={20} color={COLORS.darkGray} />}
          />
          
          <Input
            label="Numéro SIRET"
            placeholder="Entrez votre numéro SIRET"
            value={siret}
            onChangeText={setSiret}
            error={errors.siret}
            secureTextEntry
            leftIcon={<Hash size={20} color={COLORS.darkGray} />}
          />
          
          <Input
            label="Adresse de l'entreprise"
            placeholder="Entrez l'adresse de votre entreprise"
            value={businessAddress}
            onChangeText={setBusinessAddress}
            error={errors.businessAddress}
            leftIcon={<MapPin size={20} color={COLORS.darkGray} />}
          />
          
          <Input
            label="Email professionnel"
            placeholder="Entrez votre email professionnel"
            value={businessEmail}
            onChangeText={setBusinessEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.businessEmail}
            leftIcon={<Mail size={20} color={COLORS.darkGray} />}
          />
          
          <Input
            label="Téléphone professionnel"
            placeholder="Entrez votre téléphone professionnel"
            value={businessPhone}
            onChangeText={setBusinessPhone}
            keyboardType="phone-pad"
            error={errors.businessPhone}
            leftIcon={<Phone size={20} color={COLORS.darkGray} />}
          />
          
          <Input
            label="Description de l'entreprise"
            placeholder="Décrivez brièvement votre activité"
            value={businessDescription}
            onChangeText={setBusinessDescription}
            multiline
            numberOfLines={3}
            error={errors.businessDescription}
            leftIcon={<FileText size={20} color={COLORS.darkGray} />}
          />
          
          <Input
            label="IBAN"
            placeholder="Entrez votre IBAN pour les paiements"
            value={iban}
            onChangeText={setIban}
            error={errors.iban}
            secureTextEntry
            leftIcon={<CreditCard size={20} color={COLORS.darkGray} />}
          />
          
          <Button
            title="Sauvegarder les modifications"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 120,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.neutral,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  placeholder: {
    width: 40,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 16,
  },
  profilePhotoUploader: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  sectionHeader: {
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  formContainer: {
    width: '100%',
  },
  phoneSection: {
    marginBottom: 16,
  },
  phoneLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  countryCode: {
    flex: 0.3,
  },
  phoneInputContainer: {
    flex: 0.7,
  },
  phoneInput: {
    flex: 1,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  zipInput: {
    flex: 0.4,
  },
  cityInput: {
    flex: 0.6,
  },
  saveButton: {
    marginTop: 32,
  },
});