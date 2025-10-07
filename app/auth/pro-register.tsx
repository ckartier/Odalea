import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
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
  Briefcase,
  CreditCard,
  FileText,
  Globe,
  CheckCircle,
  Star,
  Shield
} from 'lucide-react-native';

import { isEmailTaken } from '@/services/user-validation';
import { trpc } from '@/lib/trpc';
import GlassView from '@/components/GlassView';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProRegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const iconScale = useRef(new Animated.Value(0.5)).current;
  
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    iconScale.setValue(0.5);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);
  
  // Personal data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('FR');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  
  // Professional data
  const [companyName, setCompanyName] = useState('');
  const [siret, setSiret] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [iban, setIban] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en'>('fr');
  

  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
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
    
    if (!password.trim()) {
      newErrors.password = 'Mot de passe requis';
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
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
  
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
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
  
  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!acceptedTerms) {
      newErrors.acceptedTerms = 'Vous devez accepter les conditions générales';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      handleSignUp();
    }
  };
  
  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/auth/signin');
      }
    }
  };
  
  const availabilityQuery = trpc.users.checkAvailability.useQuery(
    { email: /\S+@\S+\.\S+/.test(email) ? email.trim().toLowerCase() : undefined },
    { enabled: false }
  );

  const handleSignUp = async () => {
    setLoading(true);
    
    try {
      if (/\S+@\S+\.\S+/.test(email)) {
        const [localEmailTaken, server] = await Promise.all([
          isEmailTaken(email),
          availabilityQuery.refetch(),
        ]);
        const serverTaken = server.data?.emailAvailable === false;
        if (localEmailTaken || serverTaken) {
          setErrors(prev => ({ ...prev, email: 'Cet email est déjà utilisé' }));
          setLoading(false);
          return;
        }
      }
      const userData = {
        firstName,
        lastName,
        email,
        emailLower: email.trim().toLowerCase(),
        password,
        countryCode,
        phoneNumber,
        address,
        zipCode,
        city,
        isCatSitter: false,
        isProfessional: true,
        professionalData: {
          companyName,
          siret: siret.replace(/\s/g, ''), // Remove spaces
          businessAddress,
          businessEmail,
          businessPhone,
          businessDescription,
          iban: iban.replace(/\s/g, '').toUpperCase(), // Format IBAN
          acceptedTerms,
          language: selectedLanguage,
          isVerified: false,
          subscriptionType: 'basic' as const,
          products: [],
          orders: [],
          analytics: {
            totalSales: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            topProducts: [],
            monthlyRevenue: [],
            customerRetention: 0,
          },
        },
      };
      
      const result = await signUp(userData);
      
      if (result.success) {
        // Clear sensitive data from memory
        setIban('');
        setSiret('');
        setPassword('');
        router.push('/auth/verify?type=professional');
      } else {
        Alert.alert('Inscription échouée', result.error || 'Impossible de créer le compte');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const renderStep1 = () => (
    <>
      <Animated.View style={[styles.headerContainer, {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }]}>
        <Animated.View style={[styles.iconContainer, {
          transform: [{ scale: iconScale }],
        }]}>
          <Briefcase size={32} color={COLORS.maleAccent} />
        </Animated.View>
        <Text style={styles.stepText}>Étape 1 sur 3</Text>
        <Text style={styles.title}>Compte Professionnel</Text>
        <Text style={styles.subtitle}>Créez votre compte professionnel pour vendre sur Coppet</Text>
      </Animated.View>
      
      <Animated.View style={[styles.benefitsContainer, {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }]}>
        <View style={styles.benefitItem}>
          <CheckCircle size={20} color={COLORS.success} />
          <Text style={styles.benefitText}>Vendez vos produits sur la marketplace</Text>
        </View>
        <View style={styles.benefitItem}>
          <Star size={20} color={COLORS.success} />
          <Text style={styles.benefitText}>Tableau de bord analytique avancé</Text>
        </View>
        <View style={styles.benefitItem}>
          <Shield size={20} color={COLORS.success} />
          <Text style={styles.benefitText}>Badge de vérification professionnel</Text>
        </View>
      </Animated.View>
      
      <Animated.View style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}>
      <GlassView style={styles.formContainer} liquidGlass tint="neutral" intensity={40}>
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
          label="Email"
          placeholder="Entrez votre email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
          leftIcon={<Mail size={20} color={COLORS.darkGray} />}
        />
        
        <Input
          label="Mot de passe"
          placeholder="Créez un mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          isPassword
          error={errors.password}
        />
        
        <View style={styles.phoneContainer}>
          <CountryCodePicker
            value={countryCode}
            onChange={setCountryCode}
            style={styles.countryCode}
          />
          
          <Input
            label="Numéro de téléphone"
            placeholder="Entrez votre numéro de téléphone"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            error={errors.phoneNumber}
            containerStyle={styles.phoneInput}
            leftIcon={<Phone size={20} color={COLORS.darkGray} />}
          />
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
        
        <Button
          title="Suivant"
          onPress={handleNextStep}
          style={styles.button}
        />
      </GlassView>
      </Animated.View>
    </>
  );
  
  const renderStep2 = () => (
    <>
      <Animated.View style={[styles.headerContainer, {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }]}>
        <Animated.View style={[styles.iconContainer, {
          transform: [{ scale: iconScale }],
        }]}>
          <Building2 size={32} color={COLORS.maleAccent} />
        </Animated.View>
        <Text style={styles.stepText}>Étape 2 sur 3</Text>
        <Text style={styles.title}>Informations Entreprise</Text>
        <Text style={styles.subtitle}>Renseignez les détails de votre entreprise</Text>
      </Animated.View>
      
      <Animated.View style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}>
      <GlassView style={styles.formContainer} liquidGlass tint="neutral" intensity={40}>
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
        
        <View style={styles.languageContainer}>
          <Text style={styles.languageLabel}>Langue préférée</Text>
          <View style={styles.languageOptions}>
            <TouchableOpacity
              style={[
                styles.languageOption,
                selectedLanguage === 'fr' ? styles.languageOptionActive : null,
              ]}
              onPress={() => setSelectedLanguage('fr')}
            >
              <Text style={[
                styles.languageOptionText,
                selectedLanguage === 'fr' ? styles.languageOptionTextActive : null,
              ]}>Français</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.languageOption,
                selectedLanguage === 'en' ? styles.languageOptionActive : null,
              ]}
              onPress={() => setSelectedLanguage('en')}
            >
              <Text style={[
                styles.languageOptionText,
                selectedLanguage === 'en' ? styles.languageOptionTextActive : null,
              ]}>English</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Button
          title="Suivant"
          onPress={handleNextStep}
          style={styles.button}
        />
      </GlassView>
      </Animated.View>
    </>
  );
  
  const renderStep3 = () => (
    <>
      <Animated.View style={[styles.headerContainer, {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }]}>
        <Animated.View style={[styles.iconContainer, {
          transform: [{ scale: iconScale }],
        }]}>
          <Shield size={32} color={COLORS.maleAccent} />
        </Animated.View>
        <Text style={styles.stepText}>Étape 3 sur 3</Text>
        <Text style={styles.title}>Conditions Légales</Text>
        <Text style={styles.subtitle}>Acceptez les conditions pour finaliser votre inscription</Text>
      </Animated.View>
      
      <Animated.View style={[styles.legalInfoContainer, {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }]}>
        <Text style={styles.legalInfoTitle}>Votre compte professionnel inclut :</Text>
        <View style={styles.legalInfoList}>
          <Text style={styles.legalInfoItem}>• Accès au tableau de bord vendeur</Text>
          <Text style={styles.legalInfoItem}>• Gestion des produits et commandes</Text>
          <Text style={styles.legalInfoItem}>• Statistiques de vente détaillées</Text>
          <Text style={styles.legalInfoItem}>• Support client prioritaire</Text>
          <Text style={styles.legalInfoItem}>• Badge de vérification</Text>
        </View>
      </Animated.View>
      
      <Animated.View style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}>
      <GlassView style={styles.formContainer} liquidGlass tint="neutral" intensity={40}>
        <View style={styles.legalSection}>
          <Text style={styles.legalText}>
            En continuant, vous acceptez les{' '}
            <Text 
              style={styles.linkText}
              onPress={() => router.push('/legal/terms')}
            >
              conditions générales d&apos;utilisation
            </Text>
            {' '}et la{' '}
            <Text 
              style={styles.linkText}
              onPress={() => router.push('/legal/privacy')}
            >
              politique de confidentialité
            </Text>
            {' '}pour les comptes professionnels.
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.termsContainer,
            acceptedTerms ? styles.termsActive : null,
          ]}
          onPress={() => setAcceptedTerms(!acceptedTerms)}
        >
          <View style={[
            styles.checkbox,
            acceptedTerms ? styles.checkboxActive : null,
          ]}>
            {acceptedTerms && <View style={styles.checkboxInner} />}
          </View>
          <View style={styles.termsTextContainer}>
            <Text style={styles.termsText}>
              J'accepte les conditions générales et je confirme être un professionnel
            </Text>
          </View>
        </TouchableOpacity>
        
        {errors.acceptedTerms && (
          <Text style={styles.errorText}>{errors.acceptedTerms}</Text>
        )}
        
        <Button
          title="Créer mon compte professionnel"
          onPress={handleNextStep}
          loading={loading}
          disabled={!acceptedTerms}
          style={[
            styles.professionalButton,
            !acceptedTerms ? styles.disabledButton : null,
          ]}
        />
      </GlassView>
      </Animated.View>
    </>
  );
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E0F2FE', '#BAE6FD', '#7DD3FC']}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <StatusBar style="dark" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={handlePreviousStep}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        
        {step === 1 ? renderStep1() : step === 2 ? renderStep2() : renderStep3()}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Vous avez déjà un compte ?</Text>
          <TouchableOpacity onPress={() => router.push('/auth/signin')}>
            <Text style={styles.footerLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 10,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...SHADOWS.medium,
  },
  stepText: {
    fontSize: 14,
    color: COLORS.white,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...SHADOWS.small,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: COLORS.black,
    marginLeft: 12,
    flex: 1,
  },
  legalInfoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...SHADOWS.small,
  },
  legalInfoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 12,
  },
  legalInfoList: {
    gap: 8,
  },
  legalInfoItem: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  formContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  countryCode: {
    flex: 0.3,
  },
  phoneInput: {
    flex: 0.7,
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
  languageContainer: {
    marginBottom: 16,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  languageOptions: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  languageOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  languageOptionActive: {
    backgroundColor: 'rgba(163, 213, 255, 0.4)',
    borderColor: 'rgba(163, 213, 255, 0.6)',
  },
  languageOptionText: {
    fontSize: 16,
    color: COLORS.black,
  },
  languageOptionTextActive: {
    color: COLORS.white,
  },
  legalSection: {
    marginBottom: 16,
  },
  legalText: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
    textAlign: 'center',
  },
  termsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    paddingVertical: 12,
  },
  termsActive: {
    backgroundColor: COLORS.neutral,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.maleAccent,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: COLORS.maleAccent,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: COLORS.white,
    borderRadius: 2,
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
  },
  linkText: {
    color: COLORS.white,
    fontWeight: '600' as const,
    textDecorationLine: 'underline' as const,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: -12,
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  professionalButton: {
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginRight: 4,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  disabledButton: {
    opacity: 0.5,
  },
});