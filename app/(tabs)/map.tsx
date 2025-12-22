import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Platform,
  Modal,
  Animated,
  Easing,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '@/constants/colors';
import GlassCard from '@/components/GlassCard';
import MapView, { PROVIDER_GOOGLE } from '@/components/MapView';
import MapMarker from '@/components/MapMarker';
import UserMarker from '@/components/UserMarker';
import AdBanner from '@/components/AdBanner';
import { Image } from 'expo-image';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { usePremium } from '@/hooks/premium-store';
import { useI18n } from '@/hooks/i18n-store';
import { useTheme } from '@/hooks/theme-store';
import { Pet, User } from '@/types';
import {
  Layers,
  Filter,
  Users,
  Heart,
  Search,
  ShieldCheck,
  RefreshCcw,
  X,
} from 'lucide-react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { petService, userService, petSitterService } from '@/services/database';
import { getBlurredUserLocation, getBlurredPetLocation } from '@/services/location-privacy';
import { track } from '@/services/tracking';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

type MapFilter = 'all' | 'pets' | 'sitters' | 'friends' | 'lost' | 'vets' | 'stores';

interface Place {
  id: string;
  name: string;
  location: { latitude: number; longitude: number };
  address: string;
  rating?: number;
  phone?: string;
  phoneFormatted?: string;
  type: 'vet' | 'store';
  url?: string;
}

type AllPet = Pet & { owner?: User | undefined; isUserPet?: boolean };

interface PopupConfig {
  type: 'error' | 'info' | 'success';
  title: string;
  message: string;
  phone?: string;
  url?: string;
}

const popupColors: Record<PopupConfig['type'], { bg: string; accent: string }> = {
  error: { bg: 'rgba(239,68,68,0.92)', accent: '#fee2e2' },
  info: { bg: 'rgba(59,130,246,0.92)', accent: '#dbeafe' },
  success: { bg: 'rgba(16,185,129,0.92)', accent: '#d1fae5' },
};

const FILTERS: {
  key: MapFilter;
  label: string;
  Icon: typeof Layers;
  gradient: [string, string];
}[] = [
  { key: 'all', label: 'Tout', Icon: Layers, gradient: ['#c084fc', '#a855f7'] },
  { key: 'pets', label: 'Animaux', Icon: Heart, gradient: ['#fb7185', '#f472b6'] },
  { key: 'sitters', label: 'Gardiens', Icon: Users, gradient: ['#38bdf8', '#6366f1'] },
  { key: 'friends', label: 'Amis', Icon: Filter, gradient: ['#f97316', '#facc15'] },
  { key: 'lost', label: 'Perdus', Icon: Search, gradient: ['#f43f5e', '#f97316'] },
  { key: 'vets', label: 'Vétérinaires', Icon: Search, gradient: ['#34d399', '#059669'] },
  { key: 'stores', label: 'Magasins', Icon: Search, gradient: ['#f59e0b', '#d97706'] },
];

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const DEFAULT_LAT = 48.8867;
const DEFAULT_LNG = 2.3431;
const GOOGLE_PLACES_ENDPOINT = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

const getGooglePlacesApiKey = (): string | null => {
  const key = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "AIzaSyDMh-ZNFwOqVvnviQg1-FV7tAZPDy1xxPk";
  if (!key) return null;
  const trimmed = key.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getGooglePlacesErrorMessage = (message?: string): string => {
  if (!message) return 'Activez la facturation Google Cloud et l’API Places pour cette clé.';
  const normalized = message.toLowerCase();
  if (normalized.includes('api key') && normalized.includes('invalid')) {
    return 'La clé Google Places fournie est invalide ou désactivée. Remplacez EXPO_PUBLIC_GOOGLE_PLACES_API_KEY par une clé autorisée.';
  }
  if (normalized.includes('billing')) {
    return 'Activez la facturation Google Cloud pour utiliser l’API Places.';
  }
  if (normalized.includes('not authorized')) {
    return 'Autorisez l’API Places Web Service pour cette clé Google Cloud.';
  }
  return message;
};

export default function MapScreen() {
  const router = useRouter();
  const { user } = useFirebaseUser();
  const { incrementActionCount, shouldShowInterstitialAd } = usePremium();
  const { t } = useI18n();
  const { getThemedColor } = useTheme();
  const insets = useSafeAreaInsets();

  const [region, setRegion] = useState<Region>({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<Set<MapFilter>>(new Set(['pets', 'sitters']));
  const [places, setPlaces] = useState<Place[]>([]);
  const [popup, setPopup] = useState<PopupConfig | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false);
  const popupAnim = useRef(new Animated.Value(0)).current;

  const overlayTop = insets.top + 18;
  const filtersTop = overlayTop + 68;

  const primaryPet = user?.pets?.find((p) => p.isPrimary) || user?.pets?.[0];
  const appGradient = primaryPet?.gender === 'female' 
    ? ['#E8B4D4', '#C8A2C8', '#A8B4D8'] as const
    : ['#A8D5E8', '#B8C5D8', '#C8B5D8'] as const;

  const userLat = userLocation?.latitude ?? DEFAULT_LAT;
  const userLng = userLocation?.longitude ?? DEFAULT_LNG;

  const showPopup = useCallback((config: PopupConfig) => {
    console.log('🔔 Popup:', config.title);
    setPopup(config);
    Animated.spring(popupAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 9,
      tension: 70,
    }).start();
  }, [popupAnim]);

  const hidePopup = useCallback(() => {
    Animated.timing(popupAnim, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setPopup(null);
      }
    });
  }, [popupAnim]);

  useEffect(() => {
    if (!popup) return;
    const timeout = setTimeout(() => {
      hidePopup();
    }, 5500);
    return () => clearTimeout(timeout);
  }, [popup, hidePopup]);

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'web') {
          if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                console.log('🌍 Web geolocation success');
                setLocationPermission(true);
                const userCoords = {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                };
                setUserLocation(userCoords);
                setRegion({
                  latitude: userCoords.latitude,
                  longitude: userCoords.longitude,
                  latitudeDelta: LATITUDE_DELTA,
                  longitudeDelta: LONGITUDE_DELTA,
                });
              },
              (err) => {
                console.log('⚠️ Web geolocation error', err);
                setLocationPermission(false);
                setUserLocation({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG });
                setRegion({
                  latitude: DEFAULT_LAT,
                  longitude: DEFAULT_LNG,
                  latitudeDelta: LATITUDE_DELTA,
                  longitudeDelta: LONGITUDE_DELTA,
                });
                showPopup({
                  type: 'info',
                  title: 'Localisation',
                  message: "Nous n'avons pas pu accéder à votre localisation sur le navigateur. Paris est utilisée par défaut.",
                });
              },
              { enableHighAccuracy: true, timeout: 5000 },
            );
          } else {
            console.log('ℹ️ Web geolocation unavailable, using defaults');
            setUserLocation({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG });
            setRegion({
              latitude: DEFAULT_LAT,
              longitude: DEFAULT_LNG,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            });
          }
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            console.log('✅ Location permission granted');
            setLocationPermission(true);
            try {
              const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
              const userCoords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              };
              setUserLocation(userCoords);
              setRegion({
                latitude: userCoords.latitude,
                longitude: userCoords.longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
              });
              if (user?.pets && user.pets.length > 0) {
                const primaryPet = user.pets.find((p) => p.isPrimary) || user.pets[0];
                if (primaryPet) {
                  setSelectedPet(primaryPet);
                  setSelectedUser(user);
                }
              }
            } catch (error) {
              console.error('❌ Error getting location:', error);
              setUserLocation({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG });
              setRegion({
                latitude: DEFAULT_LAT,
                longitude: DEFAULT_LNG,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
              });
              showPopup({
                type: 'error',
                title: 'Localisation',
                message: "Impossible d'obtenir votre position actuelle. Paris est utilisée à la place.",
              });
            }
          } else {
            console.log('🚫 Location permission denied, defaulting to Paris');
            setUserLocation({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG });
            setRegion({
              latitude: DEFAULT_LAT,
              longitude: DEFAULT_LNG,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            });
            showPopup({
              type: 'info',
              title: 'Autorisation requise',
              message: 'Activez la localisation pour découvrir les animaux près de vous. Paris est affichée par défaut.',
            });
          }
        }
      } catch (e) {
        console.log('❌ Location init failed', e);
        showPopup({ type: 'error', title: 'Localisation', message: 'Une erreur est survenue lors du démarrage de la carte.' });
      }
    })();
  }, [user, showPopup]);

  useEffect(() => {
    if (user && userLocation) {
      console.log('🔁 Re-centering map for logged user');
      setRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
      if (user.pets && user.pets.length > 0) {
        const primaryPet = user.pets.find((p) => p.isPrimary) || user.pets[0];
        if (primaryPet) {
          setSelectedPet(primaryPet);
          setSelectedUser(user);
        }
      }
    }
  }, [user, userLocation]);

  const handleMarkerPress = useCallback(async (pet: Pet & { owner?: User }) => {
    console.log('📍 Marker pressed:', pet.id, pet.name);
    setSelectedPet(pet);
    
    // Try to get owner if not already present
    if (pet.owner) {
      setSelectedUser(pet.owner);
    } else if (pet.ownerId) {
      try {
        const owner = await userService.getUser(pet.ownerId);
        setSelectedUser(owner);
      } catch (error) {
        console.error('❌ Error fetching owner:', error);
        setSelectedUser(null);
      }
    } else {
      setSelectedUser(null);
    }
    
    incrementActionCount();
  }, [incrementActionCount]);

  const handleRegionChange = useCallback((r: Region) => {
    setRegion(r);
  }, []);

  const handlePetCardPress = () => {
    if (selectedPet) {
      incrementActionCount();
      if (shouldShowInterstitialAd()) {
        console.log('🎬 Should show interstitial ad');
      }
      router.push(`/pet/${selectedPet.id}`);
    }
  };

  const handleUserPress = () => {
    if (selectedUser) {
      incrementActionCount();
      router.push(`/profile/${selectedUser.id}`);
    }
  };

  const handleFilterPress = async (filter: MapFilter) => {
    console.log('🎛 Toggle filter', filter);
    const newFilters = new Set(activeFilters);
    if (filter === 'all') {
      if (newFilters.has('all')) {
        newFilters.clear();
      } else {
        newFilters.clear();
        FILTERS.forEach((f) => newFilters.add(f.key));
      }
    } else {
      if (newFilters.has(filter)) {
        newFilters.delete(filter);
        newFilters.delete('all');
      } else {
        newFilters.add(filter);
      }
    }
    setActiveFilters(newFilters);
    incrementActionCount();
    try {
      track('map_filter_apply', { filters: Array.from(newFilters).join(',') });
    } catch (e) {
      console.log('track map_filter_apply failed', e);
    }

    // Clear places if neither vets nor stores are selected
    if (!newFilters.has('vets') && !newFilters.has('stores')) {
      setPlaces([]);
    } else {
      // Fetch places when vets or stores filters are active
      await fetchNearbyPlaces(newFilters);
    }
  };

  const fetchNearbyPlaces = async (filters?: Set<MapFilter>) => {
    try {
      const loc = userLocation ?? { latitude: DEFAULT_LAT, longitude: DEFAULT_LNG };
      const apiKey = getGooglePlacesApiKey();
      const filtersToUse = filters ?? activeFilters;

      if (!apiKey) {
        console.error('❌ Google Places API key not found in environment');
        showPopup({
          type: 'error',
          title: 'Configuration manquante',
          message: 'Ajoutez EXPO_PUBLIC_GOOGLE_PLACES_API_KEY pour activer les lieux.',
        });
        return;
      }

      console.log('🔄 Fetching places for filters:', Array.from(filtersToUse));
      const allPlaces: Place[] = [];

      // Fetch veterinarians
      if (filtersToUse.has('vets') || filtersToUse.has('all')) {
        const vetParams = new URLSearchParams({
          location: `${loc.latitude},${loc.longitude}`,
          radius: '5000',
          type: 'veterinary_care',
          key: apiKey,
        });
        const vetUrl = `${GOOGLE_PLACES_ENDPOINT}?${vetParams.toString()}`;
        console.log('📍 Fetching vets near:', loc);

        const vetResponse = await fetch(vetUrl);
        if (vetResponse.ok) {
          const vetData = await vetResponse.json();
          if (vetData.status === 'OK' && vetData.results) {
            const vetPlaces: Place[] = vetData.results.map((place: any) => ({
              id: place.place_id,
              name: place.name,
              location: {
                latitude: place.geometry.location.lat,
                longitude: place.geometry.location.lng,
              },
              address: place.vicinity,
              rating: place.rating,
              phone: place.phone,
              phoneFormatted: place.formatted_phone_number || place.international_phone_number,
              type: 'vet' as const,
              url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`,
            }));
            console.log(`✅ Loaded ${vetPlaces.length} veterinarians`);
            allPlaces.push(...vetPlaces);
          }
        }
      }

      // Fetch pet stores
      if (filtersToUse.has('stores') || filtersToUse.has('all')) {
        const storeParams = new URLSearchParams({
          location: `${loc.latitude},${loc.longitude}`,
          radius: '5000',
          type: 'pet_store',
          key: apiKey,
        });
        const storeUrl = `${GOOGLE_PLACES_ENDPOINT}?${storeParams.toString()}`;
        console.log('📍 Fetching pet stores near:', loc);

        const storeResponse = await fetch(storeUrl);
        if (storeResponse.ok) {
          const storeData = await storeResponse.json();
          if (storeData.status === 'OK' && storeData.results) {
            const storePlaces: Place[] = storeData.results.map((place: any) => ({
              id: place.place_id,
              name: place.name,
              location: {
                latitude: place.geometry.location.lat,
                longitude: place.geometry.location.lng,
              },
              address: place.vicinity,
              rating: place.rating,
              phone: place.phone,
              phoneFormatted: place.formatted_phone_number || place.international_phone_number,
              type: 'store' as const,
              url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`,
            }));
            console.log(`✅ Loaded ${storePlaces.length} pet stores`);
            allPlaces.push(...storePlaces);
          }
        }
      }

      setPlaces(allPlaces);
      if (allPlaces.length > 0) {
        showPopup({
          type: 'success',
          title: 'Lieux trouvés',
          message: `${allPlaces.length} établissements à proximité`,
        });
      }
    } catch (error) {
      console.error('❌ Error fetching places:', error);
      showPopup({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger les lieux. Vérifiez votre connexion.',
      });
    }
  };



  const nearbyPetsQuery = useQuery({
    queryKey: ['map', 'nearbyPets', userLat, userLng],
    enabled: true,
    queryFn: async () => {
      const list = await petService.getNearbyPets({ lat: userLat, lng: userLng }, 10);
      return list;
    },
  });

  const firebasePets = (nearbyPetsQuery.data ?? []).filter((p: any) => !!p.location) as Pet[];
  
  // Fetch owners for Firebase pets
  const firebasePetsWithOwnerQuery = useQuery({
    queryKey: ['map', 'petsWithOwners', firebasePets.map(p => p.id).join(',')],
    enabled: firebasePets.length > 0,
    queryFn: async () => {
      const petsWithOwners = await Promise.all(
        firebasePets.map(async (pet): Promise<AllPet> => {
          if (!pet.ownerId) return { ...pet, owner: undefined };
          try {
            const owner = await userService.getUser(pet.ownerId);
            return { ...pet, owner: owner ?? undefined };
          } catch (error) {
            console.error(`❌ Error fetching owner for pet ${pet.id}:`, error);
            return { ...pet, owner: undefined };
          }
        })
      );
      return petsWithOwners;
    },
  });
  
  const firebasePetsWithOwner: AllPet[] = firebasePetsWithOwnerQuery.data ?? firebasePets.map((p) => ({ ...p, owner: undefined }));

  const usersQuery = useQuery({
    queryKey: ['map', 'users'],
    queryFn: async () => {
      console.log('🔄 Fetching users from Firestore');
      const list = await userService.getAllUsers(500);
      console.log(`✅ Loaded ${list.length} users from Firestore`);
      return list as User[];
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const catSittersQuery = useQuery({
    queryKey: ['map', 'catSitters'],
    queryFn: async () => {
      console.log('🔄 Fetching cat sitters from Firestore');
      const profiles = await petSitterService.getAllProfiles(100);
      console.log(`✅ Loaded ${profiles.length} cat sitters from Firestore`);
      
      // Fetch user data for each cat sitter profile
      const catSittersWithUsers = await Promise.all(
        profiles.map(async (profile) => {
          try {
            const user = await userService.getUser(profile.userId);
            return { ...profile, user };
          } catch (error) {
            console.error(`❌ Error fetching user for cat sitter ${profile.userId}:`, error);
            return null;
          }
        })
      );
      
      // Filter out null values and users without location
      return catSittersWithUsers.filter(
        (cs) => cs && cs.user && cs.user.location?.latitude && cs.user.location?.longitude
      ) as Array<{ user: User; isActive: boolean; radiusKm: number }>;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const normalizeUser = useCallback(
    (u: User): User => ({
      id: u.id,
      firstName: u.firstName ?? '',
      lastName: u.lastName ?? '',
      name: u.name ?? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
      pseudo: u.pseudo ?? (u.email?.split('@')[0] ?? 'user'),
      pseudoLower: u.pseudoLower ?? (u.pseudo ?? '').toLowerCase(),
      photo: u.photo,
      email: u.email ?? '',
      emailLower: u.emailLower ?? (u.email ?? '').toLowerCase(),
      phoneNumber: u.phoneNumber ?? '',
      countryCode: u.countryCode ?? 'FR',
      address: u.address ?? '',
      zipCode: u.zipCode ?? '',
      city: u.city ?? '',
      location: u.location,
      addressVerified: u.addressVerified ?? false,
      normalizedAddress: u.normalizedAddress,
      isCatSitter: u.isCatSitter ?? false,
      catSitterRadiusKm: u.catSitterRadiusKm ?? 5,
      referralCode: u.referralCode,
      isPremium: u.isPremium ?? false,
      createdAt: u.createdAt ?? Date.now(),
      pets: Array.isArray(u.pets) ? u.pets : [],
      animalType: u.animalType,
      animalName: u.animalName,
      animalGender: u.animalGender,
      animalPhoto: u.animalPhoto,
      isProfessional: u.isProfessional ?? false,
      professionalData: u.professionalData,
      isActive: u.isActive ?? true,
      profileComplete: u.profileComplete ?? false,
    }),
    [],
  );

  const allUsersRaw = useMemo(() => (usersQuery.data ?? []) as User[], [usersQuery.data]);
  const allUsersNormalized = useMemo(() => allUsersRaw.map(normalizeUser), [allUsersRaw, normalizeUser]);

  const { mutate: patchUser } = useMutation({
    mutationFn: async (u: User) => {
      await userService.saveUser(u);
      return u.id;
    },
    onError: (e) => {
      console.log('patch user failed', e);
    },
  });

  const usersWithLocation = useMemo(() => {
    return allUsersNormalized.filter((u) => u.location?.latitude != null && u.location?.longitude != null);
  }, [allUsersNormalized]);

  const userPetsWithLocation: AllPet[] = user?.pets?.filter((p) => p.location).map((p) => ({
    ...p,
    id: `user-${p.id}`,
    owner: user,
    isUserPet: true,
  })) || [];

  // Deduplicate pets: don't add user pets if they're already in Firebase
  const firebasePetIds = new Set(firebasePetsWithOwner.map(p => p.id.replace('user-', '')));
  const uniqueUserPets = userPetsWithLocation.filter(p => !firebasePetIds.has(p.id.replace('user-', '')));
  const allPetsIncludingUser: AllPet[] = [...firebasePetsWithOwner, ...uniqueUserPets];

  const filteredPets = allPetsIncludingUser.filter((pet: AllPet) => {
    if (activeFilters.size === 0) return false;
    if (activeFilters.has('all')) return true;
    if (activeFilters.has('pets')) return true;
    if (activeFilters.has('sitters') && Boolean(pet.owner?.isCatSitter || pet.owner?.isProfessional)) return true;
    return false;
  });

  const catSittersWithLocation = catSittersQuery.data ?? [];

  const filteredUsers = usersWithLocation.filter((u) => {
    // Filter out test users
    if (u.email?.includes('test') || u.pseudo?.toLowerCase().includes('test')) {
      return false;
    }
    // Don't show users who are cat sitters here (they'll be shown via catSittersQuery)
    if (u.isCatSitter && activeFilters.has('sitters')) {
      return false;
    }
    if (activeFilters.size === 0) return false;
    if (activeFilters.has('all')) return true;
    if (activeFilters.has('friends')) return true;
    return false;
  });

  const filteredCatSitters = catSittersWithLocation.filter((cs) => {
    if (activeFilters.size === 0) return false;
    if (activeFilters.has('all')) return true;
    if (activeFilters.has('sitters')) return true;
    return false;
  });

  const projectPoint = useCallback(
    (lat: number, lng: number) => {
      const dx = (lng - region.longitude) / region.longitudeDelta + 0.5;
      const dy = (region.latitude - lat) / region.latitudeDelta + 0.5;
      return { left: dx * width, top: dy * height };
    },
    [region],
  );

  return (
    <View style={styles.container}> 
      <StatusBar style="dark" />

      <MapView
        provider={Platform.OS === 'android' ? (PROVIDER_GOOGLE as any) : undefined}
        style={styles.map}
        region={region}
        showsUserLocation={locationPermission}
        showsMyLocationButton={false}
        scrollEnabled
        zoomEnabled
        rotateEnabled={false}
        pitchEnabled={false}
        onRegionChange={Platform.OS === 'web' ? handleRegionChange : undefined}
        onRegionChangeComplete={Platform.OS !== 'web' ? handleRegionChange : undefined}
        testID="map-view"
      >
        {Platform.OS !== 'web' && filteredPets.map((pet) => (
          <MapMarker 
            key={pet.id} 
            pet={pet} 
            onPress={() => handleMarkerPress(pet)} 
          />
        ))}
        {Platform.OS !== 'web' && filteredUsers.map((u) => (
          <UserMarker key={`user-${u.id}`} user={u} onPress={() => setSelectedUser(u)} />
        ))}
        {Platform.OS !== 'web' && filteredCatSitters.map((cs) => (
          <UserMarker key={`cat-sitter-${cs.user.id}`} user={cs.user} isCatSitter onPress={() => setSelectedUser(cs.user)} />
        ))}
        {Platform.OS !== 'web' && places
          .filter((place) => {
            if (activeFilters.has('all')) return true;
            if (place.type === 'vet' && activeFilters.has('vets')) return true;
            if (place.type === 'store' && activeFilters.has('stores')) return true;
            return false;
          })
          .map((place) => (
          <MapMarker
            key={`place-${place.id}`}
            isVet={place.type === 'vet'}
            pet={{
              id: place.id,
              name: place.name,
              type: place.type === 'vet' ? 'veterinaire' : 'magasin' as any,
              breed: place.address,
              gender: 'male' as any,
              location: place.location,
              mainPhoto: '',
            } as any}
            onPress={() => {
              const phoneInfo = place.phoneFormatted || place.phone;
              showPopup({
                type: 'info',
                title: place.name,
                message: `${place.address}${place.rating ? `\n⭐ ${place.rating}/5` : ''}`,
                phone: phoneInfo,
                url: place.url,
              });
            }}
          />
        ))}
      </MapView>

      {Platform.OS === 'web' && (
        <View pointerEvents="box-none" style={styles.webOverlay} testID="web-marker-layer">
          {filteredPets.map((pet) => {
            if (!pet.location) return null;
            const blurred = getBlurredPetLocation(pet.id, pet.location);
            const pos = projectPoint(blurred.latitude, blurred.longitude);
            const left = Math.max(24, Math.min(width - 24, pos.left));
            const top = Math.max(24, Math.min(height - 24, pos.top));
            const markerColor = pet.gender === 'male' ? COLORS.male : COLORS.female;
            return (
              <TouchableOpacity
                key={`overlay-pet-${pet.id}`}
                onPress={() => handleMarkerPress(pet)}
                activeOpacity={0.8}
                style={[styles.webPetMarker, { left, top }]}
                testID={`pet-marker-${pet.id}`}
              >
                <View style={[styles.webPetMarkerCircle, { backgroundColor: markerColor, borderColor: COLORS.white }]}>
                  {pet.mainPhoto ? (
                    <img
                      src={pet.mainPhoto}
                      alt={pet.name}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <Text style={styles.webPetEmoji}>🐱</Text>
                  )}
                </View>
                <View style={[styles.webPetTriangle, { borderTopColor: markerColor }]} />
              </TouchableOpacity>
            );
          })}
          {filteredUsers.map((u) => {
            const originalLoc = { latitude: u.location?.latitude ?? DEFAULT_LAT, longitude: u.location?.longitude ?? DEFAULT_LNG };
            const blurred = getBlurredUserLocation(u.id, originalLoc);
            const pos = projectPoint(blurred.latitude, blurred.longitude);
            const left = Math.max(24, Math.min(width - 24, pos.left));
            const top = Math.max(24, Math.min(height - 24, pos.top));
            const primaryPet = u.pets?.find((p) => p.isPrimary) || u.pets?.[0];
            const markerColor = primaryPet?.gender === 'male' ? COLORS.male : primaryPet?.gender === 'female' ? COLORS.female : COLORS.primary;
            return (
              <TouchableOpacity
                key={`overlay-user-${u.id}`}
                onPress={() => setSelectedUser(u)}
                activeOpacity={0.8}
                style={[styles.webPetMarker, { left, top }]}
                testID={`user-pin-${u.id}`}
              >
                <View style={[styles.webPetMarkerCircle, { backgroundColor: markerColor, borderColor: COLORS.white }]}>
                  {primaryPet?.mainPhoto ? (
                    <img
                      src={primaryPet.mainPhoto}
                      alt={primaryPet.name}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        objectFit: 'cover',
                      }}
                    />
                  ) : u.animalPhoto ? (
                    <img
                      src={u.animalPhoto}
                      alt={u.animalName || 'pet'}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <Text style={styles.webPetEmoji}>🐾</Text>
                  )}
                </View>
                <View style={[styles.webPetTriangle, { borderTopColor: markerColor }]} />
              </TouchableOpacity>
            );
          })}
          {places
            .filter((place) => {
              if (activeFilters.has('all')) return true;
              if (place.type === 'vet' && activeFilters.has('vets')) return true;
              if (place.type === 'store' && activeFilters.has('stores')) return true;
              return false;
            })
            .map((place) => {
            const pos = projectPoint(place.location.latitude, place.location.longitude);
            const left = Math.max(24, Math.min(width - 24, pos.left));
            const top = Math.max(24, Math.min(height - 24, pos.top));
            const placeColor = place.type === 'vet' ? '#10b981' : '#f59e0b';
            const placeEmoji = place.type === 'vet' ? '🏥' : '🏪';
            return (
              <TouchableOpacity
                key={`overlay-place-${place.id}`}
                onPress={() => {
                  const phoneInfo = place.phoneFormatted || place.phone;
                  showPopup({
                    type: 'info',
                    title: place.name,
                    message: `${place.address}${place.rating ? `\n⭐ ${place.rating}/5` : ''}`,
                    phone: phoneInfo,
                    url: place.url,
                  });
                }}
                activeOpacity={0.8}
                style={[styles.webPetMarker, { left, top }]}
                testID={`place-marker-${place.id}`}
              >
                <View style={[styles.webPetMarkerCircle, { backgroundColor: placeColor, borderColor: COLORS.white }]}>
                  <Text style={styles.webPetEmoji}>{placeEmoji}</Text>
                </View>
                <View style={[styles.webPetTriangle, { borderTopColor: placeColor }]} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <LinearGradient
        colors={['rgba(9,9,11,0.25)', 'transparent']}
        style={[styles.topFade, { height: overlayTop + 120 }]}
        pointerEvents="none"
      />





      <Modal
        visible={showFilterMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterMenu(false)}
        >
          <GlassCard
            tint={primaryPet?.gender === 'female' ? 'female' : 'male'}
            intensity={60}
            noPadding
            style={styles.filterMenu}
          >
            <View style={styles.filterMenuHeader}>
              <Text style={styles.filterMenuTitle}>Filtrer la carte</Text>
              <TouchableOpacity onPress={() => setShowFilterMenu(false)} style={styles.filterMenuClose}>
                <X size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>
            <View style={styles.filterMenuContent}>
              {FILTERS.map(({ key, label, Icon, gradient }) => {
                const isActive = activeFilters.has(key);
                return (
                  <GlassCard
                    key={key}
                    tint={isActive ? (primaryPet?.gender === 'female' ? 'female' : 'male') : 'neutral'}
                    intensity={isActive ? 50 : 20}
                    noPadding
                    onPress={() => handleFilterPress(key)}
                    style={styles.filterMenuItem}
                    testID={`filter-item-${key}`}
                  >
                    <View style={styles.filterMenuItemInner}>
                      <View style={styles.filterMenuItemLeft}>
                        <View style={styles.filterMenuItemIcon}>
                          <Icon size={22} color={isActive ? COLORS.primary : '#64748b'} />
                        </View>
                        <Text style={[styles.filterMenuItemText, isActive && styles.filterMenuItemTextActive]}>
                          {label}
                        </Text>
                      </View>
                      {isActive && (
                        <View style={styles.filterMenuItemCheck}>
                          <Text style={styles.filterMenuItemCheckText}>✓</Text>
                        </View>
                      )}
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          </GlassCard>
        </TouchableOpacity>
      </Modal>

      <View style={[styles.controlsContainer, { top: filtersTop }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[styles.controlButton, SHADOWS.medium]}
          onPress={() => setShowFilterMenu(true)}
          activeOpacity={0.85}
          testID="btn-filter"
        >
          <Filter size={22} color={COLORS.black} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, SHADOWS.medium]}
          onPress={() => {
            setSelectedPet(null);
            setSelectedUser(null);
            showPopup({ type: 'info', title: 'Carte réinitialisée', message: 'Sélection effacée.' });
          }}
          testID="btn-reset"
        >
          <RefreshCcw size={20} color={COLORS.black} />
        </TouchableOpacity>

      </View>

      {selectedPet && (
        <View style={styles.selectedPetCardContainer} testID="selected-pet-card">
          <AdBanner size="banner" style={styles.adBannerTop} />
          <GlassCard
            tint={selectedPet.gender === 'female' ? 'female' : 'male'}
            intensity={70}
            noPadding
            onPress={handlePetCardPress}
            style={styles.selectedPetCard}
          >
            <View style={styles.petCardContentWrapper}>
              <View style={styles.petCardImageContainer}>
                {selectedPet.mainPhoto ? (
                  <Image
                    source={{ uri: selectedPet.mainPhoto }}
                    style={styles.petCardImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.petCardImagePlaceholder}>
                    <Text style={styles.petCardImageEmoji}>🐾</Text>
                  </View>
                )}
                <View style={styles.petGenderBadge}>
                  <Text style={styles.petGenderText}>{selectedPet.gender === 'female' ? '♀' : '♂'}</Text>
                </View>
              </View>

              <View style={styles.petCardInfo}>
                <View style={styles.petCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.petCardName}>{selectedPet.name}</Text>
                    <Text style={styles.petCardBreed}>
                      {selectedPet.breed} • {selectedPet.type}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleUserPress} style={styles.ownerBadge}>
                    <Text style={styles.ownerBadgeText}>@{selectedUser?.pseudo ?? ''}</Text>
                    {selectedUser?.isPremium && <ShieldCheck size={14} color={COLORS.primary} />}
                  </TouchableOpacity>
                </View>

                <View style={styles.petCardFooter}>
                  <Text style={styles.petCardLocation}>
                    📍 {selectedUser?.city ?? ''}{selectedUser?.zipCode ? `, ${selectedUser.zipCode}` : ''}
                  </Text>
                  {(selectedUser?.isCatSitter || selectedUser?.isProfessional) && (
                    <View style={styles.sitterBadge}>
                      <Text style={styles.sitterBadgeText}>Gardien</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </GlassCard>
        </View>
      )}

      {popup && (
        <Animated.View
          style={[
            styles.popupContainer,
            {
              backgroundColor: popupColors[popup.type].bg,
              borderColor: popupColors[popup.type].accent,
              opacity: popupAnim,
              transform: [
                {
                  translateY: popupAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
          testID="animated-popup"
        >
          <View style={styles.popupContent}>
            <Text style={styles.popupTitle}>{popup.title || ''}</Text>
            <Text style={styles.popupMessage}>{popup.message || ''}</Text>
            <View style={styles.popupActions}>
              {popup.phone ? (
                <TouchableOpacity
                  style={styles.phoneButton}
                  onPress={() => {
                    const phoneNumber = popup.phone?.replace(/[^0-9+]/g, '');
                    if (phoneNumber) {
                      Linking.openURL(`tel:${phoneNumber}`);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.phoneButtonText}>📞 {popup.phone}</Text>
                </TouchableOpacity>
              ) : null}
              {popup.url ? (
                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={() => {
                    if (popup.url) {
                      Linking.openURL(popup.url);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.mapButtonText}>🗺️ Ouvrir dans Maps</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <TouchableOpacity onPress={hidePopup} style={styles.popupClose} testID="popup-close">
            <Text style={styles.popupCloseText}>OK</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  controlsContainer: {
    position: 'absolute',
    right: 16,
    gap: 12,
    alignItems: 'flex-end',
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPetCardContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    gap: 12,
  },
  selectedPetCard: {
    minHeight: 140,
  },
  petCardContentWrapper: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  adBannerTop: {
    marginBottom: 10,
  },
  petCardImageContainer: {
    width: 100,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  petCardImage: {
    width: '100%',
    height: '100%',
  },
  petCardImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petCardImageEmoji: {
    fontSize: 42,
  },
  petGenderBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petGenderText: {
    fontWeight: '700',
    color: COLORS.black,
  },
  petCardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  petCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  petCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  petCardBreed: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  ownerBadgeText: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
  },
  petCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  petCardLocation: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  sitterBadge: {
    backgroundColor: 'rgba(109, 40, 217, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  sitterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsBar: {
    position: 'absolute',
    left: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
  },
  statsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  filterMenu: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
  },
  filterMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15,23,42,0.08)',
  },
  filterMenuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
  },
  filterMenuClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15,23,42,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterMenuContent: {
    padding: 20,
    gap: 12,
  },
  filterMenuItem: {
    marginBottom: 0,
  },
  filterMenuItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  filterMenuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  filterMenuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterMenuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  filterMenuItemTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  filterMenuItemCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterMenuItemCheckText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  webOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
  },

  webPetMarker: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -24 }, { translateY: -62 }],
  },
  webPetMarkerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  webPetEmoji: {
    fontSize: 24,
  },
  webPetTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  popupContainer: {
    position: 'absolute',
    top: 32,
    alignSelf: 'center',
    maxWidth: '90%',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  popupContent: {
    flex: 1,
  },
  popupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  popupMessage: {
    fontSize: 13,
    color: '#f8fafc',
    marginTop: 2,
  },
  popupActions: {
    marginTop: 12,
    gap: 8,
  },
  phoneButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-start',
  },
  phoneButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  mapButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignSelf: 'flex-start',
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  popupClose: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(15,23,42,0.18)',
  },
  popupCloseText: {
    color: '#fff',
    fontWeight: '700',
  },
});
