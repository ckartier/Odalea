import React, { useState, useEffect } from 'react';
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
import { COLORS, SHADOWS } from '@/constants/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import PhotoUploader from '@/components/PhotoUploader';
import CountryCodePicker from '@/components/CountryCodePicker';
import DropdownSelector from '@/components/DropdownSelector';
import { useAuth } from '@/hooks/auth-store';
import { isPseudoTaken, isEmailTaken } from '@/services/user-validation';
import { trpc } from '@/lib/trpc';
import {
  ArrowLeft,
  Mail,
  User,
  Phone,
  MapPin,
  Hash,
  Building2,
  Save,
  Heart,
  Settings,
} from 'lucide-react-native';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.photo || null);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [pseudo, setPseudo] = useState(user?.pseudo || '');
  const [email, setEmail] = useState(user?.email || '');
  const [countryCode, setCountryCode] = useState(user?.countryCode || 'FR');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [address, setAddress] = useState(user?.address || '');
  const [zipCode, setZipCode] = useState(user?.zipCode || '');
  const [city, setCity] = useState(user?.city || '');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (user) {
      console.log('📝 Syncing form with user data:', user);
      setProfilePhoto(user.photo || null);
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPseudo(user.pseudo || '');
      setEmail(user.email || '');
      setCountryCode(user.countryCode || 'FR');
      setPhoneNumber(user.phoneNumber || '');
      setAddress(user.address || '');
      setZipCode(user.zipCode || '');
      setCity(user.city || '');
    }
  }, [user]);
  
  // Don't navigate during initial render to avoid mounting issues
  // Instead, handle the redirect in the render logic
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!firstName.trim()) {
      newErrors.firstName = 'Prénom requis';
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = 'Nom requis';
    }
    
    if (!pseudo.trim()) {
      newErrors.pseudo = 'Pseudo requis';
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const availabilityQuery = trpc.users.checkAvailability.useQuery(
    { pseudo: pseudo.trim() || undefined, email: /\S+@\S+\.\S+/.test(email) ? email.trim().toLowerCase() : undefined },
    { enabled: false }
  );

  const handleSave = async () => {
    if (!validateForm() || !user) return;
    
    setLoading(true);
    
    try {
      if (!user) return;
      const newPseudo = pseudo.trim();
      const newEmail = email.trim();

      const checksNeeded = {
        pseudo: newPseudo && newPseudo !== (user.pseudo || ''),
        email: newEmail && newEmail.toLowerCase() !== (user.email || '').toLowerCase(),
      } as const;

      if (checksNeeded.pseudo || checksNeeded.email) {
        const [clientResults, server] = await Promise.all([
          Promise.all([
            checksNeeded.pseudo ? isPseudoTaken(newPseudo) : Promise.resolve(false),
            checksNeeded.email && /\S+@\S+\.\S+/.test(newEmail) ? isEmailTaken(newEmail) : Promise.resolve(false),
          ]),
          availabilityQuery.refetch(),
        ]);
        const [pseudoTakenLocal, emailTakenLocal] = clientResults;
        const serverData = server.data ?? {};
        const errs: Record<string, string> = {};
        if (checksNeeded.pseudo && (pseudoTakenLocal || serverData.pseudoAvailable === false)) {
          errs.pseudo = 'Ce pseudo est déjà utilisé';
        }
        if (checksNeeded.email && (emailTakenLocal || serverData.emailAvailable === false)) {
          errs.email = 'Cet email est déjà utilisé';
        }
        if (Object.keys(errs).length > 0) {
          setErrors(prev => ({ ...prev, ...errs }));
          setLoading(false);
          return;
        }
      }

      const updatedUser = {
        ...user,
        firstName,
        lastName,
        pseudo: newPseudo,
        pseudoLower: newPseudo.toLowerCase(),
        email: newEmail,
        emailLower: newEmail.toLowerCase(),
        countryCode,
        phoneNumber,
        address,
        zipCode,
        city,
        photo: profilePhoto || undefined,
      };
      
      await updateUser(updatedUser);
      
      Alert.alert(
        'Profil mis à jour',
        'Vos informations ont été sauvegardées avec succès.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBack = () => {
    router.back();
  };
  
  if (!user) {
    // Navigate back if no user, but only after component is mounted
    setTimeout(() => {
      router.replace('/(tabs)/profile');
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
          
          <Text style={styles.title}>Modifier le profil</Text>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Save size={24} color={COLORS.primary} />
          </TouchableOpacity>
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
        
        {/* Form */}
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
            label="Pseudo"
            placeholder="Entrez votre pseudo"
            value={pseudo}
            onChangeText={setPseudo}
            error={errors.pseudo}
            leftIcon={<User size={20} color={COLORS.darkGray} />}
          />
          
          <Input
            label="Email"
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
            label="Adresse"
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
          
          {/* Cat-Sitter Dashboard Link */}
          {user?.isCatSitter && (
            <TouchableOpacity
              style={styles.catSitterButton}
              onPress={() => router.push('/cat-sitter-dashboard')}
            >
              <View style={styles.catSitterButtonContent}>
                <Heart size={24} color={COLORS.catSitter} />
                <View style={styles.catSitterButtonText}>
                  <Text style={styles.catSitterButtonTitle}>Dashboard Cat-Sitter</Text>
                  <Text style={styles.catSitterButtonSubtitle}>
                    Gérez vos réservations et paramètres
                  </Text>
                </View>
                <Settings size={20} color={COLORS.darkGray} />
              </View>
            </TouchableOpacity>
          )}
          
          <Button
            title="Sauvegarder les modifications"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButtonLarge}
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
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.neutral,
    justifyContent: 'center',
    alignItems: 'center',
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
  saveButtonLarge: {
    marginTop: 32,
  },
  catSitterButton: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  catSitterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  catSitterButtonText: {
    flex: 1,
  },
  catSitterButtonTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 2,
  },
  catSitterButtonSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
});