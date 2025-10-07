import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import CountryCodePicker from '@/components/CountryCodePicker';
import AnimalSelector from '@/components/AnimalSelector';
import DropdownSelector from '@/components/DropdownSelector';
import PhotoUploader from '@/components/PhotoUploader';
import GenderSelector from '@/components/GenderSelector';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { useI18n } from '@/hooks/i18n-store';
import { 
  ArrowLeft, 
  Mail, 
  User, 
  Phone, 
  MapPin, 
  Hash, 
  Building2, 
  Gift,
  Heart,
  Info,
  CreditCard,
  FileText,
  CheckCircle2,
  XCircle
} from 'lucide-react-native';
import GlassView from '@/components/GlassView';
import { LinearGradient } from 'expo-linear-gradient';

import { isPseudoTaken, isEmailTaken } from '@/services/user-validation';
import { trpc } from '@/lib/trpc';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, updateUser, addPet } = useFirebaseUser();
  const { t, currentLocale } = useI18n();
  
  const [step, setStep] = useState(1);
  const [showTooltip, setShowTooltip] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // User data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('FR');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [isCatSitter, setIsCatSitter] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const [isAddressVerified, setIsAddressVerified] = useState<boolean>(false);
  const [normalizedAddress, setNormalizedAddress] = useState<string | null>(null);
  const [geoCoords, setGeoCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [catSitterRadiusKm, setCatSitterRadiusKm] = useState<number>(5);
  
  // Professional data
  const [isProfessional, setIsProfessional] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [siret, setSiret] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [iban, setIban] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en'>('fr');
  
  // Animal data
  const [animalType, setAnimalType] = useState<string>('');
  const [animalName, setAnimalName] = useState<string>('');
  const [animalCharacter, setAnimalCharacter] = useState<string>('');
  const [animalColor, setAnimalColor] = useState<string>('');
  const [animalSpecialSign, setAnimalSpecialSign] = useState<string>('');
  const [animalGender, setAnimalGender] = useState<'male' | 'female'>('male');
  const [animalPhoto, setAnimalPhoto] = useState<string | null>(null);
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPseudoAvailable, setIsPseudoAvailable] = useState<boolean | null>(null);
  const [isEmailAvailable, setIsEmailAvailable] = useState<boolean | null>(null);
  const [checkingPseudo, setCheckingPseudo] = useState<boolean>(false);
  const [checkingEmail, setCheckingEmail] = useState<boolean>(false);
  const pseudoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const validatePseudo = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Pseudo requis';
    if (!/^[a-zA-Z0-9._-]{3,20}$/.test(trimmed)) return '3-20 caractères, lettres/chiffres . _ - uniquement';
    return '';
  };

  useEffect(() => {
    if (!pseudo || validatePseudo(pseudo)) {
      setIsPseudoAvailable(null);
      if (pseudoTimerRef.current) clearTimeout(pseudoTimerRef.current);
      return;
    }
    if (pseudoTimerRef.current) clearTimeout(pseudoTimerRef.current);
    setCheckingPseudo(true);
    pseudoTimerRef.current = setTimeout(async () => {
      try {
        const taken = await isPseudoTaken(pseudo);
        setIsPseudoAvailable(!taken);
      } catch (e) {
        console.log('pseudo check error', e);
        setIsPseudoAvailable(null);
      } finally {
        setCheckingPseudo(false);
      }
    }, 500);
  }, [pseudo]);

  useEffect(() => {
    const isEmailFormatOk = /\S+@\S+\.\S+/.test(email);
    if (!email || !isEmailFormatOk) {
      setIsEmailAvailable(null);
      if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
      return;
    }
    if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
    setCheckingEmail(true);
    emailTimerRef.current = setTimeout(async () => {
      try {
        const taken = await isEmailTaken(email);
        setIsEmailAvailable(!taken);
      } catch (e) {
        console.log('email check error', e);
        setIsEmailAvailable(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 500);
  }, [email]);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!firstName.trim()) {
      newErrors.firstName = t('auth.first_name_required');
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = t('auth.last_name_required');
    }
    
    const pseudoErr = validatePseudo(pseudo);
    if (pseudoErr) {
      newErrors.pseudo = pseudoErr;
    } else if (isPseudoAvailable === false) {
      newErrors.pseudo = 'Ce pseudo est déjà utilisé';
    }
    
    if (!email.trim()) {
      newErrors.email = t('auth.email_required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.email_invalid');
    } else if (isEmailAvailable === false) {
      newErrors.email = 'Cet email est déjà utilisé';
    }
    
    if (!password.trim()) {
      newErrors.password = t('auth.password_required');
    } else if (password.length < 6) {
      newErrors.password = t('auth.password_min_length');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = t('auth.phone_number_required');
    }
    
    if (!address.trim()) {
      newErrors.address = t('auth.address_required');
    }
    
    if (!zipCode.trim()) {
      newErrors.zipCode = t('auth.postal_code_required');
    }
    
    if (!city.trim()) {
      newErrors.city = t('auth.city_required');
    }
    
    if (!isProfessional) {
      if (!animalType) {
        newErrors.animalType = t('auth.animal_type_required');
      }
      
      if (!animalName.trim()) {
        newErrors.animalName = t('auth.pet_name_required');
      }
      
      if (!animalCharacter) {
        newErrors.animalCharacter = t('auth.pet_character_required');
      }
      
      if (!animalColor) {
        newErrors.animalColor = t('auth.pet_color_required');
      }
    }
    
    if (isProfessional) {
      if (!companyName.trim()) {
        newErrors.companyName = t('auth.company_name_required');
      }
      
      if (!siret.trim()) {
        newErrors.siret = t('auth.siret_required');
      }
      
      if (!businessAddress.trim()) {
        newErrors.businessAddress = t('auth.company_address_required');
      }
      
      if (!businessEmail.trim()) {
        newErrors.businessEmail = t('auth.professional_email_required');
      } else if (!/\S+@\S+\.\S+/.test(businessEmail)) {
        newErrors.businessEmail = t('auth.professional_email_invalid');
      }
      
      if (!businessPhone.trim()) {
        newErrors.businessPhone = t('auth.professional_phone_required');
      }
      
      if (!businessDescription.trim()) {
        newErrors.businessDescription = t('auth.company_description_required');
      }
      
      if (!iban.trim()) {
        newErrors.iban = t('auth.iban_required');
      }
      
      if (!acceptedTerms) {
        newErrors.acceptedTerms = t('auth.must_accept_terms');
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNextStep = async () => {
    try {
      const { track } = require('@/services/tracking');
      track('signup_step', { step });
    } catch (e) {
      console.log('track signup_step failed', e);
    }
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      if (isProfessional) {
        setStep(3);
      } else {
        await handleSignUp();
      }
    } else if (step === 3 && isProfessional && validateStep2()) {
      await handleSignUp();
    }
  };
  
  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      try {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/onboarding');
        }
      } catch (error) {
        console.log('Navigation error in signup:', error);
        router.replace('/onboarding');
      }
    }
  };
  
  const availabilityQuery = trpc.users.checkAvailability.useQuery(
    { pseudo: pseudo.trim() || undefined, email: /\S+@\S+\.\S+/.test(email) ? email.trim().toLowerCase() : undefined },
    { enabled: false }
  );

  const [verifyingAddress, setVerifyingAddress] = useState<boolean>(false);
  type AddressSuggestion = { label: string; latitude?: number; longitude?: number; postcode?: string; city?: string; house_number?: string; road?: string };
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);

  const buildFullAddress = () => [address.trim(), zipCode.trim(), city.trim()].filter(Boolean).join(', ');

  const applySuggestion = (s: AddressSuggestion) => {
    console.log('Applying address suggestion', s);
    setAddress(s.label);
    if (s.postcode) setZipCode(s.postcode);
    if (s.city) setCity(s.city);
    setAddressSuggestions([]);
  };

  const handleVerifyAddress = async () => {
    const query = buildFullAddress();
    if (!query) return;
    try {
      setVerifyingAddress(true);
      setAddressSuggestions([]);
      let suggestions: AddressSuggestion[] = [];
      try {
        const Location = await import('expo-location');
        const results = await Location.geocodeAsync(query);
        suggestions = (results || []).slice(0, 5).map((r: any) => ({
          label: [r.name, r.street || r.streetName, r.postalCode, r.city].filter(Boolean).join(', ') || query,
          latitude: typeof r.latitude === 'number' ? r.latitude : undefined,
          longitude: typeof r.longitude === 'number' ? r.longitude : undefined,
          postcode: r.postalCode,
          city: r.city || r.district,
        }));
      } catch (e) {
        console.log('expo-location not available or failed, falling back to Nominatim', e);
      }

      if (suggestions.length === 0) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
          const res = await fetch(url, { headers: { 'Accept-Language': currentLocale } });
          const data: any[] = await res.json();
          suggestions = data.map((d) => ({
            label: d.display_name as string,
            latitude: d.lat ? Number(d.lat) : undefined,
            longitude: d.lon ? Number(d.lon) : undefined,
            postcode: d.address?.postcode,
            city: d.address?.city || d.address?.town || d.address?.village,
          }));
        } catch (webErr) {
          console.log('Nominatim fetch failed', webErr);
        }
      }

      if (suggestions.length === 0) {
        Alert.alert('Adresse introuvable', "Merci de vérifier l'orthographe ou d'ajouter le code postal.");
      }
      setAddressSuggestions(suggestions);
    } catch (err) {
      console.log('verify address error', err);
      Alert.alert('Erreur', "Impossible de vérifier l'adresse pour le moment");
    } finally {
      setVerifyingAddress(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    
    try {
      if (validatePseudo(pseudo) === '') {
        const [clientChecks, serverChecks] = await Promise.all([
          Promise.all([
            isPseudoTaken(pseudo),
            /\S+@\S+\.\S+/.test(email) ? isEmailTaken(email) : Promise.resolve(false),
          ]),
          availabilityQuery.refetch(),
        ]);
        const [pseudoTakenLocal, emailTakenLocal] = clientChecks;
        const serverData = serverChecks.data ?? {};
        const newErrors: Record<string, string> = {};
        if (pseudoTakenLocal || serverData.pseudoAvailable === false) {
          newErrors.pseudo = 'Ce pseudo est déjà utilisé';
          setIsPseudoAvailable(false);
        }
        if (emailTakenLocal || serverData.emailAvailable === false) {
          newErrors.email = 'Cet email est déjà utilisé';
          setIsEmailAvailable(false);
        }
        if (Object.keys(newErrors).length > 0) {
          setErrors(prev => ({ ...prev, ...newErrors }));
          return;
        }
      }
      const result = await signUp({
        email: email.trim(),
        password: password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        countryCode,
      });
      
      if (result.success) {
        await updateUser({
          pseudo: pseudo.trim(),
          pseudoLower: pseudo.trim().toLowerCase(),
          email: email.trim(),
          emailLower: email.trim().toLowerCase(),
          phoneNumber: phoneNumber.trim(),
          address: address.trim(),
          zipCode: zipCode.trim(),
          city: city.trim(),
          countryCode,
          addressVerified: isAddressVerified,
          normalizedAddress: normalizedAddress || undefined,
          location: geoCoords ? { latitude: geoCoords.latitude, longitude: geoCoords.longitude } : undefined,
          isCatSitter,
          catSitterRadiusKm: isCatSitter ? catSitterRadiusKm : undefined,
          referralCode: referralCode.trim() || undefined,
          photo: profilePhoto || undefined,
          isProfessional,
          professionalData: isProfessional ? {
            companyName,
            siret,
            businessAddress,
            businessEmail,
            businessPhone,
            businessDescription,
            iban,
            acceptedTerms,
            language: selectedLanguage,
            isVerified: false,
            subscriptionType: 'basic',
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
          } : undefined,
          animalType: isProfessional ? undefined : animalType,
          animalName: isProfessional ? undefined : animalName,
          animalGender: isProfessional ? undefined : animalGender,
          animalPhoto: isProfessional ? undefined : (animalPhoto || undefined),
        });

        // Create cat-sitter profile if needed
        if (isCatSitter && !isProfessional) {
          try {
            const { petSitterService } = await import('@/services/database');
            await petSitterService.saveProfile(result.user.uid, {
              isActive: true,
              hourlyRate: 15,
              description: '',
              services: ['Pet Sitting'],
              availability: {
                monday: { start: '08:00', end: '18:00', available: true },
                tuesday: { start: '08:00', end: '18:00', available: true },
                wednesday: { start: '08:00', end: '18:00', available: true },
                thursday: { start: '08:00', end: '18:00', available: true },
                friday: { start: '08:00', end: '18:00', available: true },
                saturday: { start: '09:00', end: '17:00', available: true },
                sunday: { start: '10:00', end: '16:00', available: false },
              },
              photos: [],
              experience: '1 year',
              petTypes: ['Cats'],
              languages: ['French'],
              insurance: false,
              emergencyContact: false,
              responseTime: '< 2 hours',
              totalBookings: 0,
              rating: 5.0,
              reviewCount: 0,
              radiusKm: catSitterRadiusKm,
            });
            console.log('✅ Cat-sitter profile created');
          } catch (err) {
            console.error('❌ Error creating cat-sitter profile:', err);
          }
        }

        if (!isProfessional) {
          try {
            let coords: { latitude: number; longitude: number } | null = null;
            const fullAddress = [address, zipCode, city].filter(Boolean).join(', ');
            try {
              const Location = await import('expo-location');
              const results = await Location.geocodeAsync(fullAddress);
              if (results && results.length > 0) {
                const first = results[0] as any;
                if (typeof first?.latitude === 'number' && typeof first?.longitude === 'number') {
                  coords = { latitude: first.latitude, longitude: first.longitude };
                }
              }
            } catch (geoErr) {
              console.log('Geocode failed or not available on this platform, fallback by city', geoErr);
            }
            if (!coords) {
              const cityLower = city.trim().toLowerCase();
              if (cityLower.includes('paris')) coords = { latitude: 48.8566, longitude: 2.3522 };
              else if (cityLower.includes('lyon')) coords = { latitude: 45.7640, longitude: 4.8357 };
              else if (cityLower.includes('marseille')) coords = { latitude: 43.2965, longitude: 5.3698 };
            }

            const petPhoto = animalPhoto || profilePhoto || 'https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?q=80&w=800&auto=format&fit=crop';
            const petData = {
              name: animalName.trim() || 'Mon Animal',
              type: animalType || 'chat',
              breed: 'N/A',
              gender: animalGender,
              dateOfBirth: new Date().toISOString().slice(0, 10),
              color: animalColor || 'autre',
              character: animalCharacter ? [animalCharacter] : [],
              distinctiveSign: animalSpecialSign || undefined,
              vaccinationDates: [],
              microchipNumber: undefined,
              mainPhoto: petPhoto,
              galleryPhotos: petPhoto ? [petPhoto] : [],
              vet: undefined,
              walkTimes: [],
              isPrimary: true,
              location: coords ?? undefined,
            } as const;
            const addRes = await addPet(petData as any);
            console.log('Signup pet add result', addRes);
          } catch (petErr) {
            console.log('Unable to add pet at signup', petErr);
          }
        }

        if (isProfessional) {
          router.push('/auth/verify?type=professional');
        } else {
          router.push('/auth/verify');
        }
      } else {
        Alert.alert(t('auth.signup_failed'), result.error || t('auth.unable_to_create_account'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'An unexpected error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleCatSitter = () => {
    setIsCatSitter(!isCatSitter);
  };
  
  const renderStep1 = () => (
    <>
      <Text style={styles.stepText}>{t('auth.step_1_of', { total: isProfessional ? '3' : '2' })}</Text>
      <Text style={styles.title}>{t('auth.create_account')}</Text>
      <Text style={styles.subtitle}>{t('auth.lets_start_creating')}</Text>
      
      <GlassView style={styles.formContainer} liquidGlass tint="neutral" intensity={40}>
        <Input
          label={t('auth.first_name')}
          placeholder={t('auth.enter_first_name')}
          value={firstName}
          onChangeText={setFirstName}
          error={errors.firstName}
          leftIcon={<User size={20} color={COLORS.darkGray} />}
        />
        
        <Input
          label={t('auth.last_name')}
          placeholder={t('auth.enter_last_name')}
          value={lastName}
          onChangeText={setLastName}
          error={errors.lastName}
          leftIcon={<User size={20} color={COLORS.darkGray} />}
        />
        
        <Input
          label="Pseudo"
          placeholder="Entrez votre pseudo"
          value={pseudo}
          onChangeText={(v) => {
            setPseudo(v);
            const err = validatePseudo(v);
            if (err) {
              setIsPseudoAvailable(null);
            }
          }}
          error={errors.pseudo}
          leftIcon={<User size={20} color={COLORS.darkGray} />}
          testID="pseudo-input"
        />
        {checkingPseudo && !errors.pseudo && (
          <View style={styles.pseudoStatus}>
            <Text style={styles.pseudoOk}>Vérification du pseudo...</Text>
          </View>
        )}
        {isPseudoAvailable !== null && !errors.pseudo && !checkingPseudo && (
          <View style={styles.pseudoStatus}>
            {isPseudoAvailable ? (
              <>
                <CheckCircle2 size={16} color={COLORS.maleAccent} />
                <Text style={styles.pseudoOk}>Pseudo disponible</Text>
              </>
            ) : (
              <>
                <XCircle size={16} color={COLORS.error} />
                <Text style={styles.pseudoError}>Pseudo déjà pris</Text>
              </>
            )}
          </View>
        )}
        
        <Input
          label={t('auth.email')}
          placeholder={t('auth.enter_email')}
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setIsEmailAvailable(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
          leftIcon={<Mail size={20} color={COLORS.darkGray} />}
        />
        {checkingEmail && !errors.email && (
          <View style={styles.pseudoStatus}>
            <Text style={styles.pseudoOk}>Vérification de l’email...</Text>
          </View>
        )}
        {isEmailAvailable !== null && !errors.email && !checkingEmail && (
          <View style={styles.pseudoStatus}>
            {isEmailAvailable ? (
              <>
                <CheckCircle2 size={16} color={COLORS.maleAccent} />
                <Text style={styles.pseudoOk}>Email disponible</Text>
              </>
            ) : (
              <>
                <XCircle size={16} color={COLORS.error} />
                <Text style={styles.pseudoError}>Email déjà pris</Text>
              </>
            )}
          </View>
        )}
        
        <Input
          label={t('auth.password')}
          placeholder={t('auth.create_password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          isPassword
          error={errors.password}
        />
        {password.length > 0 && (
          <View style={styles.passwordStrengthContainer}>
            <View style={[styles.strengthBar, { backgroundColor: '#e5e7eb' }]} />
            <View style={[styles.strengthBar, { backgroundColor: password.length >= 6 ? '#93c5fd' : '#e5e7eb' }]} />
            <View style={[styles.strengthBar, { backgroundColor: /[A-Z]/.test(password) && /\d/.test(password) ? '#60a5fa' : '#e5e7eb' }]} />
            <View style={[styles.strengthBar, { backgroundColor: /[^A-Za-z0-9]/.test(password) && password.length >= 10 ? '#2563eb' : '#e5e7eb' }]} />
          </View>
        )}
        
        {/* Professional Button */}
        <View style={styles.professionalSection}>
          <Button
            title={t('auth.i_am_professional')}
            onPress={() => router.push('/auth/pro-register')}
            style={styles.professionalButton}
          />
          
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setShowTooltip(!showTooltip)}
          >
            <Info size={16} color={COLORS.darkGray} />
            <Text style={styles.infoText}>{t('auth.professional_account_info')}</Text>
          </TouchableOpacity>
          
          {showTooltip && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>
                {t('auth.professional_account_description')}
              </Text>
            </View>
          )}
        </View>
        
        <Button
          title={t('common.next')}
          onPress={handleNextStep}
          style={styles.button}
        />
      </GlassView>
    </>
  );
  
  const renderStep2 = () => (
    <>
      <Text style={styles.stepText}>{t('auth.step_2_of', { total: isProfessional ? '3' : '2' })}</Text>
      <Text style={styles.title}>{t('auth.personal_information')}</Text>
      <Text style={styles.subtitle}>{isProfessional ? t('auth.add_personal_info') : t('auth.add_personal_info_and_pet')}</Text>
      
      <GlassView style={styles.formContainer} liquidGlass tint="neutral" intensity={40}>
        <View style={styles.phoneSection}>
          <Text style={styles.phoneLabel}>{t('auth.phone')}</Text>
          <View style={styles.phoneContainer}>
            <CountryCodePicker
              value={countryCode}
              onChange={setCountryCode}
              style={styles.countryCode}
            />
            
            <View style={styles.phoneInputContainer}>
              <Input
                placeholder={t('auth.enter_phone_number')}
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
          label={t('common.address')}
          placeholder={t('auth.enter_address')}
          value={address}
          onChangeText={(v) => {
            setAddress(v);
          }}
          error={errors.address}
          leftIcon={<MapPin size={20} color={COLORS.darkGray} />}
          testID="address-input"
        />
        
        <View style={styles.rowContainer}>
          <Input
            label={t('auth.postal_code')}
            placeholder={t('auth.postal_code')}
            value={zipCode}
            onChangeText={(v) => {
              setZipCode(v);
              if (countryCode === 'FR') {
                const vv = v.trim();
                if (/^75\d{3}$/.test(vv)) setCity('Paris');
                else if (/^69\d{3}$/.test(vv)) setCity('Lyon');
                else if (/^13\d{3}$/.test(vv)) setCity('Marseille');
              }
              setIsAddressVerified(false);
            }}
            error={errors.zipCode}
            containerStyle={styles.zipInput}
            leftIcon={<Hash size={20} color={COLORS.darkGray} />}
            testID="zip-input"
          />
          
          <Input
            label={t('auth.city')}
            placeholder={t('auth.enter_city')}
            value={city}
            onChangeText={(v) => {
              setCity(v);
              setIsAddressVerified(false);
            }}
            error={errors.city}
            containerStyle={styles.cityInput}
            leftIcon={<Building2 size={20} color={COLORS.darkGray} />}
            testID="city-input"
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.verifyAddressButton} onPress={handleVerifyAddress} testID="verify-address-btn">
            <Text style={styles.verifyAddressText}>Vérifier l'adresse</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.verifyAddressButton} onPress={async () => {
            try {
              setVerifyingAddress(true);
              if (typeof navigator !== 'undefined' && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (pos) => {
                  try {
                    const { latitude, longitude } = pos.coords as GeolocationCoordinates;
                    setGeoCoords({ latitude, longitude });
                    const url = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${latitude}&lon=${longitude}&zoom=18`;
                    const res = await fetch(url, { headers: { 'Accept-Language': currentLocale } });
                    const d: any = await res.json();
                    const addr = d.address || {};
                    const label = d.display_name as string;
                    setAddress(label || [addr.road, addr.house_number].filter(Boolean).join(' '));
                    setZipCode(addr.postcode || zipCode);
                    setCity(addr.city || addr.town || addr.village || city);
                    setNormalizedAddress([addr.house_number, addr.road, addr.postcode, addr.city || addr.town || addr.village].filter(Boolean).join(', '));
                    setIsAddressVerified(true);
                  } catch (revErr) {
                    console.log('reverse geocode failed', revErr);
                  } finally {
                    setVerifyingAddress(false);
                  }
                }, (err) => {
                  console.log('geolocation error', err);
                  setVerifyingAddress(false);
                }, { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 });
              } else {
                try {
                  const Location = await import('expo-location');
                  const perm = await Location.requestForegroundPermissionsAsync();
                  if (perm.status !== 'granted') {
                    setVerifyingAddress(false);
                    return;
                  }
                  const pos = await Location.getCurrentPositionAsync({});
                  const { latitude, longitude } = pos.coords as { latitude: number; longitude: number };
                  setGeoCoords({ latitude, longitude });
                  const url = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${latitude}&lon=${longitude}&zoom=18`;
                  const res = await fetch(url, { headers: { 'Accept-Language': currentLocale } });
                  const d: any = await res.json();
                  const addr = d.address || {};
                  const label = d.display_name as string;
                  setAddress(label || [addr.road, addr.house_number].filter(Boolean).join(' '));
                  setZipCode(addr.postcode || zipCode);
                  setCity(addr.city || addr.town || addr.village || city);
                  setNormalizedAddress([addr.house_number, addr.road, addr.postcode, addr.city || addr.town || addr.village].filter(Boolean).join(', '));
                  setIsAddressVerified(true);
                } catch (nativeGeoErr) {
                  console.log('native geolocation failed', nativeGeoErr);
                } finally {
                  setVerifyingAddress(false);
                }
              }
            } catch (e) {
              console.log('prefill by geolocation error', e);
              setVerifyingAddress(false);
            }
          }} testID="use-my-location-btn">
            <Text style={styles.verifyAddressText}>Utiliser ma position</Text>
          </TouchableOpacity>
        </View>

        {isAddressVerified && (
          <Text style={[styles.addressStatus, { color: COLORS.maleAccent }]} testID="address-verified-badge">Adresse vérifiée</Text>
        )}

        {verifyingAddress && (
          <Text style={styles.addressStatus} testID="address-status">Vérification de l'adresse…</Text>
        )}
        {!verifyingAddress && addressSuggestions.length > 0 && (
          <View style={styles.suggestionsBox} testID="address-suggestions">
            {addressSuggestions.map((s, idx) => (
              <TouchableOpacity key={idx} style={styles.suggestionItem} onPress={() => applySuggestion(s)}>
                <Text style={styles.suggestionTitle}>{[s.house_number, s.road, s.city].filter(Boolean).join(' ') || s.label}</Text>
                {s.postcode || s.city ? (
                  <Text style={styles.suggestionSub}>{[s.postcode, s.city].filter(Boolean).join(' • ')}</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}
        
{!isProfessional && (
          <View style={styles.animalInfoSection}>
            <Text style={styles.animalInfoTitle}>{t('auth.pet_information')}</Text>
            <Text style={styles.animalInfoSubtitle}>
              {t('auth.complete_detailed_profile_later')}
            </Text>
            
            <AnimalSelector
              label={t('auth.animal_type')}
              value={animalType}
              onSelect={setAnimalType}
              error={errors.animalType}
              language={currentLocale}
            />

            <GenderSelector
              label={t('pets.gender') || 'Sexe'}
              value={animalGender}
              onChange={setAnimalGender}
              style={{ marginBottom: 12 }}
            />
            
            <Input
              label={t('pets.pet_name')}
              placeholder={t('auth.enter_pet_name')}
              value={animalName}
              onChangeText={setAnimalName}
              error={errors.animalName}
              leftIcon={<Heart size={20} color={COLORS.darkGray} />}
            />
            
            <DropdownSelector
              label={`${t('auth.pet_character')} *`}
              placeholder="Sélectionner un caractère"
              value={animalCharacter}
              options={[
                { value: 'joueur', label: 'Joueur' },
                { value: 'calme', label: 'Calme' },
                { value: 'calin', label: 'Câlin' },
                { value: 'independant', label: 'Indépendant' },
                { value: 'sociable', label: 'Sociable' },
                { value: 'peureux', label: 'Peureux' },
                { value: 'curieux', label: 'Curieux' },
                { value: 'energetique', label: 'Énergétique' },
                { value: 'gourmand', label: 'Gourmand' },
                { value: 'protecteur', label: 'Protecteur' },
                { value: 'intelligent', label: 'Intelligent' },
                { value: 'docile', label: 'Docile' },
                { value: 'tetu', label: 'Têtu' },
                { value: 'chasseur', label: 'Chasseur' },
                { value: 'affectueux', label: 'Affectueux' },
                { value: 'timide', label: 'Timide' },
                { value: 'aventurier', label: 'Aventurier' },
              ]}
              onChange={setAnimalCharacter}
              error={errors.animalCharacter}
            />
            
            <DropdownSelector
              label={`${t('auth.pet_color')} *`}
              placeholder="Sélectionner une couleur"
              value={animalColor}
              options={[
                { value: 'noir', label: 'Noir' },
                { value: 'blanc', label: 'Blanc' },
                { value: 'gris', label: 'Gris' },
                { value: 'marron', label: 'Marron' },
                { value: 'fauve', label: 'Fauve' },
                { value: 'roux', label: 'Roux' },
                { value: 'creme', label: 'Crème' },
                { value: 'bleu', label: 'Bleu' },
                { value: 'chocolat', label: 'Chocolat' },
                { value: 'lilas', label: 'Lilas' },
                { value: 'sable', label: 'Sable' },
                { value: 'argent', label: 'Argenté' },
                { value: 'bringe', label: 'Bringé' },
                { value: 'tigre', label: 'Tigré' },
                { value: 'ecaille', label: 'Écaille de tortue' },
                { value: 'bicolore', label: 'Bicolore' },
                { value: 'tricolore', label: 'Tricolore' },
                { value: 'multicolore', label: 'Multicolore' },
                { value: 'autre', label: 'Autre' },
              ]}
              onChange={setAnimalColor}
              error={errors.animalColor}
            />
            
            <Input
              label={t('auth.pet_special_sign_optional')}
              placeholder={t('auth.enter_pet_special_sign')}
              value={animalSpecialSign}
              onChangeText={setAnimalSpecialSign}
              multiline
              numberOfLines={2}
              leftIcon={<Info size={20} color={COLORS.darkGray} />}
            />

            <View style={styles.photoSection}>
              <Text style={styles.photoLabel}>{t('auth.pet_photo_optional') || "Photo de l'animal (optionnel)"}</Text>
              <PhotoUploader
                value={animalPhoto || undefined}
                onChange={(uri) => setAnimalPhoto(uri)}
                placeholder={t('auth.add_photo')}
                style={styles.profilePhotoUploader}
              />
            </View>
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.catSitterContainer,
            isCatSitter ? styles.catSitterActive : null,
          ]}
          onPress={toggleCatSitter}
        >
          <View style={[
            styles.checkbox,
            isCatSitter ? styles.checkboxActive : null,
          ]}>
            {isCatSitter && <View style={styles.checkboxInner} />}
          </View>
          <Text style={styles.catSitterText}>{t('auth.i_am_cat_sitter')}</Text>
        </TouchableOpacity>
        
        <Input
          label={t('auth.referral_code_optional')}
          placeholder={t('auth.enter_referral_code')}
          value={referralCode}
          onChangeText={setReferralCode}
          leftIcon={<Gift size={20} color={COLORS.darkGray} />}
        />

        {isCatSitter && (
          <View style={styles.radiusContainer}>
            <Text style={styles.radiusLabel}>Rayon Cat Sitter: {catSitterRadiusKm} km</Text>
            <View style={styles.radiusControls}>
              <TouchableOpacity onPress={() => setCatSitterRadiusKm(Math.max(1, catSitterRadiusKm - 1))} style={styles.radiusBtn}>
                <Text style={styles.radiusBtnText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCatSitterRadiusKm(Math.min(50, catSitterRadiusKm + 1))} style={styles.radiusBtn}>
                <Text style={styles.radiusBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <View style={styles.miniMapBox}>
          <Text style={styles.miniMapTitle}>Aperçu de zone</Text>
          <Text style={styles.miniMapSub}>Ville: {city || '—'} • CP: {zipCode || '—'} • Rayon: {isCatSitter ? catSitterRadiusKm : 0} km</Text>
        </View>
        
        <Button
          title={isProfessional ? t('common.next') : t('auth.create_account_button')}
          onPress={handleNextStep}
          loading={loading}
          style={styles.button}
        />
      </GlassView>
    </>
  );
  
  const renderStep3 = () => (
    <>
      <Text style={styles.stepText}>{t('auth.step_3_of', { total: '3' })}</Text>
      <Text style={styles.title}>{t('auth.professional_information')}</Text>
      <Text style={styles.subtitle}>{t('auth.complete_professional_profile')}</Text>
      
      <GlassView style={styles.formContainer} liquidGlass tint="neutral" intensity={40}>
        <Input
          label={t('auth.company_name')}
          placeholder={t('auth.enter_company_name')}
          value={companyName}
          onChangeText={setCompanyName}
          error={errors.companyName}
          leftIcon={<Building2 size={20} color={COLORS.darkGray} />}
        />
        
        <Input
          label={t('auth.siret_number')}
          placeholder={t('auth.enter_siret')}
          value={siret}
          onChangeText={setSiret}
          error={errors.siret}
          leftIcon={<Hash size={20} color={COLORS.darkGray} />}
        />
        
        <Input
          label={t('auth.company_address')}
          placeholder={t('auth.enter_company_address')}
          value={businessAddress}
          onChangeText={setBusinessAddress}
          error={errors.businessAddress}
          leftIcon={<MapPin size={20} color={COLORS.darkGray} />}
        />
        
        <Input
          label={t('auth.professional_email')}
          placeholder={t('auth.enter_professional_email')}
          value={businessEmail}
          onChangeText={setBusinessEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.businessEmail}
          leftIcon={<Mail size={20} color={COLORS.darkGray} />}
        />
        
        <Input
          label={t('auth.professional_phone')}
          placeholder={t('auth.enter_professional_phone')}
          value={businessPhone}
          onChangeText={setBusinessPhone}
          keyboardType="phone-pad"
          error={errors.businessPhone}
          leftIcon={<Phone size={20} color={COLORS.darkGray} />}
        />
        
        <Input
          label={t('auth.company_description')}
          placeholder={t('auth.describe_business_activity')}
          value={businessDescription}
          onChangeText={setBusinessDescription}
          multiline
          numberOfLines={3}
          error={errors.businessDescription}
          leftIcon={<FileText size={20} color={COLORS.darkGray} />}
        />
        
        <Input
          label={t('auth.iban')}
          placeholder={t('auth.enter_iban')}
          value={iban}
          onChangeText={setIban}
          error={errors.iban}
          leftIcon={<CreditCard size={20} color={COLORS.darkGray} />}
        />
        
        <View style={styles.languageContainer}>
          <Text style={styles.languageLabel}>{t('auth.preferred_language')}</Text>
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
              ]}>{t('auth.french')}</Text>
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
              ]}>{t('auth.english')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.legalSection}>
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
                {t('auth.i_accept_terms')}{' '}
                <Text 
                  style={styles.linkText}
                  onPress={() => {
                    console.log('Navigating to terms from signup...');
                    try {
                      router.push('/legal/terms');
                    } catch (error) {
                      console.error('Navigation error to terms from signup:', error);
                    }
                  }}
                >
                  {t('auth.terms_of_use')}
                </Text>
                {' '}{t('auth.and_privacy_policy')}{' '}
                <Text 
                  style={styles.linkText}
                  onPress={() => {
                    console.log('Navigating to privacy from signup...');
                    try {
                      router.push('/legal/privacy');
                    } catch (error) {
                      console.error('Navigation error to privacy from signup:', error);
                    }
                  }}
                >
                  {t('auth.privacy_policy')}
                </Text>
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {errors.acceptedTerms && (
          <Text style={styles.errorText}>{errors.acceptedTerms}</Text>
        )}
        
        <Button
          title={t('auth.create_professional_account')}
          onPress={handleNextStep}
          loading={loading}
          style={styles.button}
        />
      </GlassView>
    </>
  );
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (address.trim().length > 5) {
        handleVerifyAddress();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [address, zipCode, city, currentLocale]);

  useEffect(() => {
    const n = phoneNumber.trim();
    const dialToCountry: Record<string, string> = {
      '+33': 'FR',
      '+1': countryCode === 'CA' ? 'CA' : 'US',
      '+44': 'GB',
      '+49': 'DE',
      '+39': 'IT',
      '+34': 'ES',
      '+61': 'AU',
      '+81': 'JP',
      '+86': 'CN',
      '+91': 'IN',
      '+55': 'BR',
      '+7': 'RU',
      '+52': 'MX',
      '+82': 'KR',
    };
    const match = Object.keys(dialToCountry).find(d => n.startsWith(d));
    if (match) {
      const cc = dialToCountry[match];
      if (cc && cc !== countryCode) {
        setCountryCode(cc);
      }
    }
  }, [phoneNumber]);

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
          <Text style={styles.footerText}>{t('auth.already_have_account')}</Text>
          <TouchableOpacity onPress={() => router.push('/auth/signin')}>
            <Text style={styles.footerLink}>{t('auth.sign_in')}</Text>
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
  stepText: {
    fontSize: 14,
    color: COLORS.maleAccent,
    marginBottom: 8,
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 32,
  },
  formContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
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
  catSitterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  catSitterActive: {
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
  catSitterText: {
    fontSize: 16,
    color: COLORS.black,
  },
  button: {
    marginTop: 16,
  },
  passwordStrengthContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  strengthBar: {
    flex: 1,
    height: 6,
    borderRadius: 4,
  },
  radiusContainer: {
    marginTop: 8,
    marginBottom: 8,
    padding: 10,
    backgroundColor: COLORS.neutral,
    borderRadius: 10,
  },
  radiusLabel: {
    fontSize: 14,
    color: COLORS.black,
    marginBottom: 8,
  },
  radiusControls: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  radiusBtnText: {
    color: COLORS.black,
    fontWeight: '700' as const,
    fontSize: 16,
  },
  miniMapBox: {
    marginTop: 8,
    backgroundColor: COLORS.default,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  miniMapTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  miniMapSub: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 4,
  },
  pseudoStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  pseudoOk: {
    color: COLORS.maleAccent,
    fontSize: 12,
  },
  pseudoError: {
    color: COLORS.error,
    fontSize: 12,
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
    color: COLORS.maleAccent,
  },
  professionalSection: {
    marginBottom: 16,
  },
  professionalButton: {
    marginBottom: 8,
  },
  infoButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 8,
    alignSelf: 'flex-start' as const,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  tooltip: {
    backgroundColor: COLORS.neutral,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    ...SHADOWS.small,
  },
  tooltipText: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
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
    borderColor: COLORS.lightGray,
    alignItems: 'center' as const,
  },
  languageOptionActive: {
    backgroundColor: COLORS.maleAccent,
    borderColor: COLORS.maleAccent,
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
  termsTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  termsText: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
  },
  linkText: {
    color: COLORS.maleAccent,
    fontWeight: '600' as const,
    textDecorationLine: 'underline' as const,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: -12,
    marginBottom: 16,
  },
  animalInfoSection: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.neutral,
    borderRadius: 12,
  },
  animalInfoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  animalInfoSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 12,
  },
  profilePhotoUploader: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  verifyAddressButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.neutral,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  verifyAddressText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  addressStatus: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  suggestionsBox: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: COLORS.white,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral,
  },
  suggestionTitle: {
    fontSize: 14,
    color: COLORS.black,
  },
  suggestionSub: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 2,
  },

});