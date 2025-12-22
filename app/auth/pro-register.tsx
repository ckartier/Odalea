import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import CountryCodePicker from '@/components/CountryCodePicker';
import { useAuth } from '@/hooks/auth-store';
import {
  Mail,
  User,
  Phone,
  MapPin,
  Hash,
  Building2,
  Briefcase,
  CreditCard,
  Shield,
} from 'lucide-react-native';
import { isEmailTaken } from '@/services/user-validation';
import { trpc } from '@/lib/trpc';
import GlassView from '@/components/GlassView';
import ProfessionalTypeSelector from '@/components/professional/ProfessionalTypeSelector';
import CommonInfoForm from '@/components/professional/CommonInfoForm';
import {
  VetForm,
  ShelterForm,
  BreederForm,
  BoutiqueForm,
} from '@/components/professional/ActivityForms';
import {
  createActivityInitialValues,
  PROFESSIONAL_ACTIVITY_CONFIG,
  ActivityValuesMap,
  ActivityFormValues,
  validateActivityValues,
} from '@/constants/professionalActivities';
import {
  ProfessionalActivityType,
  ProfessionalCommonInfo,
  ProfessionalDocument,
  VetProfile,
  ShelterProfile,
  BreederProfile,
  BoutiqueProfile,
} from '@/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{8,15}$/;
const IBAN_REGEX = /^[A-Z]{2}[0-9A-Z]{13,32}$/;
const URL_REGEX = /^(https?:\/\/)[\w.-]+(\.[\w\.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/i;

const formatAddress = (address: ProfessionalCommonInfo['address']) =>
  [address.street, `${address.postcode} ${address.city}`.trim(), address.country]
    .filter(Boolean)
    .join(', ');

const sanitizeNumber = (value: string) => value.replace(/\s+/g, '');

const getCompanyNameFromActivity = (
  activityType: ProfessionalActivityType,
  values: ActivityFormValues,
  fallback: string,
) => {
  switch (activityType) {
    case 'vet':
      return (values.clinicName as string) || fallback;
    case 'shelter':
      return (values.structureName as string) || fallback;
    case 'breeder':
      return (values.affix as string) || fallback;
    case 'boutique':
      return (values.tradeName as string) || fallback;
    default:
      return fallback;
  }
};

const getRegistrationNumberFromActivity = (
  activityType: ProfessionalActivityType,
  values: ActivityFormValues,
) => {
  switch (activityType) {
    case 'boutique':
      return sanitizeNumber((values.siret as string) || '');
    case 'shelter':
      return `${sanitizeNumber((values.siren as string) || '')}00000`.slice(0, 14);
    case 'vet':
      return `${sanitizeNumber((values.ordinalNumber as string) || '')}00000000000000`.slice(0, 14);
    case 'breeder':
      return `${sanitizeNumber((values.breederNumber as string) || '')}00000000000000`.slice(0, 14);
    default:
      return '';
  }
};

const toStringValue = (value: string | string[] | undefined) => (typeof value === 'string' ? value : '');
const toArrayValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value : []);

export default function ProRegisterScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const isCompactScreen = windowHeight < 720;
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
    iconScale.setValue(0.3);
    Animated.sequence([
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [step, fadeAnim, slideAnim, iconScale]);

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
  const [selectedActivity, setSelectedActivity] = useState<ProfessionalActivityType>('vet');
  const [commonInfo, setCommonInfo] = useState<ProfessionalCommonInfo>({
    displayName: '',
    contactEmail: '',
    contactPhone: '',
    address: {
      street: '',
      postcode: '',
      city: '',
      country: 'France',
    },
    description: '',
    identityProofUrl: '',
  });
  const [activityForms, setActivityForms] = useState<ActivityValuesMap>(() => createActivityInitialValues());
  const [iban, setIban] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en'>('fr');

  const activityOptions = useMemo(
    () => Object.values(PROFESSIONAL_ACTIVITY_CONFIG),
    [],
  );

  useEffect(() => {
    const categories = activityOptions.map(option => option.label).join(', ');
    console.log('🗂️ Professional categories initialized:', categories);
  }, [activityOptions]);

  const handleCommonInfoChange = useCallback((path: string, value: string) => {
    setCommonInfo(prev => {
      if (path.startsWith('address.')) {
        const [, field] = path.split('.');
        return {
          ...prev,
          address: {
            ...prev.address,
            [field]: value,
          },
        };
      }
      return {
        ...prev,
        [path]: value,
      } as ProfessionalCommonInfo;
    });
  }, []);

  const handleActivityValueChange = useCallback(
    (key: string, value: string | string[]) => {
      setActivityForms(prev => ({
        ...prev,
        [selectedActivity]: {
          ...prev[selectedActivity],
          [key]: value,
        },
      }));
    },
    [selectedActivity],
  );

  const handleActivitySelect = useCallback((type: ProfessionalActivityType) => {
    console.log('📌 Selecting professional activity', type);
    setSelectedActivity(type);
  }, []);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'Prénom requis';
    if (!lastName.trim()) newErrors.lastName = 'Nom requis';

    if (!email.trim()) newErrors.email = 'Email requis';
    else if (!EMAIL_REGEX.test(email.trim())) newErrors.email = 'Email invalide';

    if (!password.trim()) newErrors.password = 'Mot de passe requis';
    else if (password.length < 6) newErrors.password = '6 caractères minimum';

    if (!phoneNumber.trim()) newErrors.phoneNumber = 'Numéro requis';

    if (!address.trim()) newErrors.address = 'Adresse requise';
    if (!zipCode.trim()) newErrors.zipCode = 'Code postal requis';
    if (!city.trim()) newErrors.city = 'Ville requise';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCommonInfo = () => {
    const newErrors: Record<string, string> = {};
    if (!commonInfo.displayName.trim()) newErrors['common.displayName'] = 'Nom requis';
    if (!commonInfo.contactEmail.trim()) newErrors['common.contactEmail'] = 'Email requis';
    else if (!EMAIL_REGEX.test(commonInfo.contactEmail.trim())) newErrors['common.contactEmail'] = 'Email invalide';

    if (!commonInfo.contactPhone.trim()) newErrors['common.contactPhone'] = 'Téléphone requis';
    else if (!PHONE_REGEX.test(commonInfo.contactPhone.trim())) newErrors['common.contactPhone'] = 'Format international requis';

    if (!commonInfo.address.street.trim()) newErrors['common.address.street'] = 'Rue requise';
    if (!commonInfo.address.postcode.trim()) newErrors['common.address.postcode'] = 'Code postal requis';
    if (!commonInfo.address.city.trim()) newErrors['common.address.city'] = 'Ville requise';
    if (!commonInfo.address.country.trim()) newErrors['common.address.country'] = 'Pays requis';

    if (!commonInfo.description.trim()) newErrors['common.description'] = 'Description requise';

    if (!commonInfo.identityProofUrl.trim()) newErrors['common.identityProofUrl'] = 'Preuve requise';
    else if (!URL_REGEX.test(commonInfo.identityProofUrl.trim())) newErrors['common.identityProofUrl'] = 'URL invalide';

    return newErrors;
  };

  const validateStep2 = () => {
    const commonErrors = validateCommonInfo();
    const activityErrors = validateActivityValues(selectedActivity, activityForms[selectedActivity]);

    const scopedActivityErrors: Record<string, string> = {};
    Object.entries(activityErrors).forEach(([key, value]) => {
      scopedActivityErrors[`activity.${selectedActivity}.${key}`] = value;
    });

    const newErrors: Record<string, string> = {
      ...commonErrors,
      ...scopedActivityErrors,
    };

    if (!iban.trim()) newErrors.iban = 'IBAN requis';
    else if (!IBAN_REGEX.test(iban.replace(/\s+/g, '').toUpperCase())) newErrors.iban = 'Format IBAN invalide';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!acceptedTerms) newErrors.acceptedTerms = 'Vous devez accepter les conditions';
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

  const availabilityQuery = trpc.users.checkAvailability.useQuery(
    { email: EMAIL_REGEX.test(email) ? email.trim().toLowerCase() : undefined },
    { enabled: false },
  );

  const buildDocumentsPayload = (
    activityType: ProfessionalActivityType,
    values: ActivityFormValues,
  ): ProfessionalDocument[] => {
    const docs: ProfessionalDocument[] = [];
    const timestamp = Date.now();
    if (commonInfo.identityProofUrl.trim()) {
      docs.push({
        type: 'identity-common',
        label: 'Preuve identité',
        url: commonInfo.identityProofUrl.trim(),
        uploadedAt: timestamp,
      });
    }

    const config = PROFESSIONAL_ACTIVITY_CONFIG[activityType];
    config.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.inputType === 'url') {
          const urlValue = values[field.key];
          if (typeof urlValue === 'string' && urlValue.trim()) {
            docs.push({
              type: `${activityType}-${field.key}`,
              label: field.label,
              url: urlValue.trim(),
              uploadedAt: timestamp,
            });
          }
        }
      });
    });
    return docs;
  };

  const buildVetProfile = (values: ActivityFormValues): VetProfile => ({
    fullName: toStringValue(values.fullName),
    ordinalNumber: toStringValue(values.ordinalNumber),
    clinicName: toStringValue(values.clinicName),
    clinicPhone: toStringValue(values.clinicPhone),
    clinicEmail: toStringValue(values.clinicEmail),
    specialties: toArrayValue(values.specialties),
    services: toArrayValue(values.services),
    accreditationDocumentUrl: toStringValue(values.accreditationDocumentUrl),
  });

  const buildShelterProfile = (values: ActivityFormValues): ShelterProfile => ({
    structureName: toStringValue(values.structureName),
    siren: toStringValue(values.siren),
    prefecturalApproval: toStringValue(values.prefecturalApproval),
    shelterAddress: toStringValue(values.shelterAddress),
    capacity: toStringValue(values.capacity),
    coverageArea: toStringValue(values.coverageArea),
    referentName: toStringValue(values.referentName),
    referentPhone: toStringValue(values.referentPhone),
    justificationDocumentUrl: toStringValue(values.justificationDocumentUrl),
  });

  const buildBreederProfile = (values: ActivityFormValues): BreederProfile => ({
    affix: toStringValue(values.affix),
    breeds: toArrayValue(values.breeds),
    breederNumber: toStringValue(values.breederNumber),
    healthCertificatesUrl: toStringValue(values.healthCertificatesUrl),
    transferConditions: toStringValue(values.transferConditions),
    farmWebsite: toStringValue(values.farmWebsite),
    activityProofUrl: toStringValue(values.activityProofUrl),
  });

  const buildBoutiqueProfile = (values: ActivityFormValues): BoutiqueProfile => ({
    tradeName: toStringValue(values.tradeName),
    siret: sanitizeNumber(toStringValue(values.siret)),
    boutiqueAddress: toStringValue(values.boutiqueAddress),
    animalLicenseNumber: toStringValue(values.animalLicenseNumber),
    catalogCategories: toArrayValue(values.catalogCategories),
    openingHours: toStringValue(values.openingHours),
    registrationProofUrl: toStringValue(values.registrationProofUrl),
  });

  const handleSignUp = async () => {
    setLoading(true);
    const activityValues = activityForms[selectedActivity];

    try {
      if (EMAIL_REGEX.test(email)) {
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

      const normalizedIban = iban.replace(/\s+/g, '').toUpperCase();
      const formattedAddress = formatAddress({
        street: commonInfo.address.street.trim(),
        postcode: commonInfo.address.postcode.trim(),
        city: commonInfo.address.city.trim(),
        country: commonInfo.address.country.trim(),
      });

      const companyName = getCompanyNameFromActivity(
        selectedActivity,
        activityValues,
        commonInfo.displayName.trim(),
      );
      const registrationNumber = getRegistrationNumberFromActivity(selectedActivity, activityValues);

      const documents = buildDocumentsPayload(selectedActivity, activityValues);

      const professionalBase = {
        companyName,
        siret: registrationNumber,
        businessAddress: formattedAddress,
        businessEmail: commonInfo.contactEmail.trim(),
        businessPhone: commonInfo.contactPhone.trim(),
        businessDescription: commonInfo.description.trim(),
        companyLogo: undefined,
        iban: normalizedIban,
        acceptedTerms,
        language: selectedLanguage,
        isVerified: false,
        subscriptionType: 'basic' as const,
        subscriptionExpiry: undefined,
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
        activityType: selectedActivity,
        commonInfo: {
          displayName: commonInfo.displayName.trim(),
          contactEmail: commonInfo.contactEmail.trim(),
          contactPhone: commonInfo.contactPhone.trim(),
          address: {
            street: commonInfo.address.street.trim(),
            postcode: commonInfo.address.postcode.trim(),
            city: commonInfo.address.city.trim(),
            country: commonInfo.address.country.trim(),
          },
          description: commonInfo.description.trim(),
          identityProofUrl: commonInfo.identityProofUrl.trim(),
        },
        documents,
      };

      const vetProfile = selectedActivity === 'vet' ? buildVetProfile(activityValues) : undefined;
      const shelterProfile = selectedActivity === 'shelter' ? buildShelterProfile(activityValues) : undefined;
      const breederProfile = selectedActivity === 'breeder' ? buildBreederProfile(activityValues) : undefined;
      const boutiqueProfile = selectedActivity === 'boutique' ? buildBoutiqueProfile(activityValues) : undefined;

      console.log('🚀 Submitting professional registration', {
        selectedActivity,
        commonInfo,
        activityValues,
      });

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
          ...professionalBase,
          vetProfile,
          shelterProfile,
          breederProfile,
          boutiqueProfile,
        },
      };

      const result = await signUp(userData);

      if (result.success) {
        setIban('');
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

  const renderActivityForm = () => {
    const props = {
      values: activityForms[selectedActivity],
      onChange: handleActivityValueChange,
      errors,
      testIDPrefix: `activity-${selectedActivity}`,
    };

    switch (selectedActivity) {
      case 'vet':
        return <VetForm {...props} />;
      case 'shelter':
        return <ShelterForm {...props} />;
      case 'breeder':
        return <BreederForm {...props} />;
      case 'boutique':
      default:
        return <BoutiqueForm {...props} />;
    }
  };

  const renderStep1 = () => (
    <>
      <Animated.View style={[styles.headerContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }] }>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconScale }] }] }>
          <Briefcase size={32} color={COLORS.maleAccent} />
        </Animated.View>
        <Text style={styles.stepText}>Étape 1 sur 3</Text>
        <Text style={styles.title}>Compte Professionnel</Text>
        <Text style={styles.subtitle}>Créez votre compte professionnel pour vendre sur Odalea</Text>
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <GlassView style={styles.formContainer} liquidGlass tint="neutral" intensity={40}>
          <Input
            label="Prénom"
            placeholder="Entrez votre prénom"
            value={firstName}
            onChangeText={setFirstName}
            error={errors.firstName}
            leftIcon={<User size={20} color={COLORS.darkGray} />}
            testID="personal-firstName"
          />
          <Input
            label="Nom"
            placeholder="Entrez votre nom"
            value={lastName}
            onChangeText={setLastName}
            error={errors.lastName}
            leftIcon={<User size={20} color={COLORS.darkGray} />}
            testID="personal-lastName"
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
            testID="personal-email"
          />
          <Input
            label="Mot de passe"
            placeholder="Créez un mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            isPassword
            error={errors.password}
            testID="personal-password"
          />
          <View style={styles.phoneContainer}>
            <CountryCodePicker value={countryCode} onChange={setCountryCode} style={styles.countryCode} />
            <Input
              label="Numéro de téléphone"
              placeholder="Entrez votre numéro"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              error={errors.phoneNumber}
              containerStyle={styles.phoneInput}
              leftIcon={<Phone size={20} color={COLORS.darkGray} />}
              testID="personal-phone"
            />
          </View>
          <Input
            label="Adresse"
            placeholder="Entrez votre adresse"
            value={address}
            onChangeText={setAddress}
            error={errors.address}
            leftIcon={<MapPin size={20} color={COLORS.darkGray} />}
            testID="personal-address"
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
              testID="personal-zip"
            />
            <Input
              label="Ville"
              placeholder="Ville"
              value={city}
              onChangeText={setCity}
              error={errors.city}
              containerStyle={styles.cityInput}
              leftIcon={<Building2 size={20} color={COLORS.darkGray} />}
              testID="personal-city"
            />
          </View>
          <Button title="Suivant" onPress={handleNextStep} style={styles.button} />
        </GlassView>
      </Animated.View>
    </>
  );

  const renderStep2 = () => (
    <>
      <Animated.View style={[styles.headerContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }] }>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconScale }] }] }>
          <Building2 size={32} color={COLORS.maleAccent} />
        </Animated.View>
        <Text style={styles.stepText}>Étape 2 sur 3</Text>
        <Text style={styles.title}>Informations Entreprise</Text>
        <Text style={styles.subtitle}>Sélectionnez votre activité et complétez les sections dédiées</Text>
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <GlassView style={styles.formContainer} liquidGlass tint="neutral" intensity={40}>
          <ProfessionalTypeSelector
            selectedType={selectedActivity}
            onSelect={handleActivitySelect}
            options={activityOptions}
          />

          <CommonInfoForm values={commonInfo} onChange={handleCommonInfoChange} errors={errors} />

          <View style={styles.activityWrapper}>{renderActivityForm()}</View>

          <Input
            label="IBAN"
            placeholder="Entrez votre IBAN pour les paiements"
            value={iban}
            onChangeText={setIban}
            error={errors.iban}
            secureTextEntry
            leftIcon={<CreditCard size={20} color={COLORS.darkGray} />}
            testID="professional-iban"
          />

          <View style={styles.languageContainer}>
            <Text style={styles.languageLabel}>Langue préférée</Text>
            <View style={styles.languageOptions}>
              <TouchableOpacity
                style={[styles.languageOption, selectedLanguage === 'fr' && styles.languageOptionActive]}
                onPress={() => setSelectedLanguage('fr')}
                testID="language-fr"
              >
                <Text
                  style={[styles.languageOptionText, selectedLanguage === 'fr' && styles.languageOptionTextActive]}
                >
                  Français
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.languageOption, selectedLanguage === 'en' && styles.languageOptionActive]}
                onPress={() => setSelectedLanguage('en')}
                testID="language-en"
              >
                <Text
                  style={[styles.languageOptionText, selectedLanguage === 'en' && styles.languageOptionTextActive]}
                >
                  English
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button title="Suivant" onPress={handleNextStep} style={styles.button} />
        </GlassView>
      </Animated.View>
    </>
  );

  const renderStep3 = () => (
    <>
      <Animated.View style={[styles.headerContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }] }>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconScale }] }] }>
          <Shield size={32} color={COLORS.maleAccent} />
        </Animated.View>
        <Text style={styles.stepText}>Étape 3 sur 3</Text>
        <Text style={styles.title}>Conditions Légales</Text>
        <Text style={styles.subtitle}>Acceptez les conditions pour finaliser votre inscription</Text>
      </Animated.View>

      <Animated.View style={[styles.legalInfoContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }] }>
        <Text style={styles.legalInfoTitle}>Votre compte professionnel inclut :</Text>
        <View style={styles.legalInfoList}>
          <Text style={styles.legalInfoItem}>• Accès au tableau de bord vendeur</Text>
          <Text style={styles.legalInfoItem}>• Gestion des produits et commandes</Text>
          <Text style={styles.legalInfoItem}>• Statistiques de vente détaillées</Text>
          <Text style={styles.legalInfoItem}>• Support client prioritaire</Text>
          <Text style={styles.legalInfoItem}>• Badge de vérification</Text>
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <GlassView style={styles.formContainer} liquidGlass tint="neutral" intensity={40}>
          <View style={styles.legalSection}>
            <Text style={styles.legalText}>
              En continuant, vous acceptez les{' '}
              <Text style={styles.linkText} onPress={() => router.push('/legal/terms')}>
                conditions générales d’utilisation
              </Text>
              {' '}et la{' '}
              <Text style={styles.linkText} onPress={() => router.push('/legal/privacy')}>
                politique de confidentialité
              </Text>
              {' '}pour les comptes professionnels.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.termsContainer, acceptedTerms && styles.termsActive]}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            testID="terms-checkbox"
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}>
              {acceptedTerms && <View style={styles.checkboxInner} />}
            </View>
            <View style={styles.termsTextContainer}>
              <Text style={styles.termsText}>
                J’accepte les conditions générales et je confirme être un professionnel
              </Text>
            </View>
          </TouchableOpacity>
          {errors.acceptedTerms ? <Text style={styles.errorText}>{errors.acceptedTerms}</Text> : null}
          <Button
            title="Créer mon compte professionnel"
            onPress={handleNextStep}
            loading={loading}
            disabled={!acceptedTerms}
            style={[styles.professionalButton, !acceptedTerms && styles.disabledButton]}
          />
        </GlassView>
      </Animated.View>
    </>
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <StatusBar style="dark" />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, isCompactScreen && styles.scrollContentCompact]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
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
    backgroundColor: COLORS.white,
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
  scrollContentCompact: {
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 24,
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
    color: COLORS.black,
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
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 22,
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
    flexDirection: 'row',
    gap: 12,
  },
  languageOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
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
    color: COLORS.black,
    fontWeight: '600' as const,
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
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    color: COLORS.black,
    fontWeight: '600' as const,
    textDecorationLine: 'underline',
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
    color: COLORS.black,
  },
  disabledButton: {
    opacity: 0.5,
  },
  activityWrapper: {
    marginBottom: 16,
    gap: 16,
  },
});
