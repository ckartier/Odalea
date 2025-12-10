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
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '@/constants/colors';
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
  Compass,
  Layers,
  Filter,
  Users,
  Heart,
  Search,
  Stethoscope,
  ShieldCheck,
  RefreshCcw,
} from 'lucide-react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { petService, userService } from '@/services/database';
import { getBlurredUserLocation, getBlurredPetLocation } from '@/services/location-privacy';
import { track } from '@/services/tracking';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

type MapFilter = 'all' | 'pets' | 'sitters' | 'friends' | 'lost' | 'vets';

interface VetPlace {
  id: string;
  name: string;
  location: { latitude: number; longitude: number };
  address: string;
  rating?: number;
  phone?: string;
}

type AllPet = Pet & { owner?: User | undefined; isUserPet?: boolean };

interface PopupConfig {
  type: 'error' | 'info' | 'success';
  title: string;
  message: string;
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
  { key: 'sitters', label: 'Cat Sitters', Icon: Users, gradient: ['#38bdf8', '#6366f1'] },
  { key: 'friends', label: 'Amis', Icon: Filter, gradient: ['#f97316', '#facc15'] },
  { key: 'lost', label: 'Perdus', Icon: Search, gradient: ['#f43f5e', '#f97316'] },
  { key: 'vets', label: 'V��térinaires', Icon: Stethoscope, gradient: ['#34d399', '#059669'] },
];

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const DEFAULT_LAT = 48.8867;
const DEFAULT_LNG = 2.3431;
const GOOGLE_PLACES_ENDPOINT = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

const getGooglePlacesApiKey = (): string | null => {
  const key = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
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
  const [activeFilters, setActiveFilters] = useState<Set<MapFilter>>(new Set(['all', 'pets', 'sitters', 'friends', 'lost', 'vets']));
  const [vets, setVets] = useState<VetPlace[]>([]);
  const [popup, setPopup] = useState<PopupConfig | null>(null);
  const popupAnim = useRef(new Animated.Value(0)).current;

  const overlayTop = insets.top + 18;
  const filtersTop = overlayTop + 68;

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

  const handleMarkerPress = useCallback((pet: Pet & { owner?: User }) => {
    console.log('📍 Marker pressed:', pet.id, pet.name);
    setSelectedPet(pet);
    setSelectedUser(pet.owner || null);
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

    if (newFilters.has('vets') && vets.length === 0) {
      await fetchNearbyVets();
    }
  };

  const fetchNearbyVets = async () => {
    try {
      const loc = userLocation ?? { latitude: DEFAULT_LAT, longitude: DEFAULT_LNG };
      const apiKey = getGooglePlacesApiKey();

      if (!apiKey) {
        console.error('❌ Google Places API key not found in environment');
        showPopup({
          type: 'error',
          title: 'Configuration manquante',
          message: 'Ajoutez EXPO_PUBLIC_GOOGLE_PLACES_API_KEY (ou EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) pour activer les vétérinaires.',
        });
        return;
      }

      const params = new URLSearchParams({
        location: `${loc.latitude},${loc.longitude}`,
        radius: '5000',
        type: 'veterinary_care',
        key: apiKey,
      });
      const url = `${GOOGLE_PLACES_ENDPOINT}?${params.toString()}`;
      console.log('📍 Fetching vets near:', loc);

      const response = await fetch(url);
      if (!response.ok) {
        console.error('❌ Failed to fetch vets, status:', response.status);
        showPopup({
          type: 'error',
          title: 'Erreur API',
          message: `Impossible de charger les vétérinaires (${response.status}). Activez la facturation Google Cloud.`,
        });
        return;
      }

      const data = await response.json();
      console.log('📊 Vets API response status:', data.status);

      if (data.status === 'REQUEST_DENIED' || data.status === 'INVALID_REQUEST') {
        console.error('❌ Google Places API error:', data.error_message);
        showPopup({
          type: 'error',
          title: 'Google Places',
          message: getGooglePlacesErrorMessage(data.error_message),
        });
        return;
      }

      if (data.status === 'ZERO_RESULTS') {
        console.log('ℹ️ No vets found in this area');
        showPopup({
          type: 'info',
          title: 'Aucun vétérinaire',
          message: 'Aucun vétérinaire trouvé dans un rayon de 5 km.',
        });
        setVets([]);
        return;
      }

      if (data.results && data.results.length > 0) {
        const vetPlaces: VetPlace[] = data.results.map((place: any) => ({
          id: place.place_id,
          name: place.name,
          location: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          },
          address: place.vicinity,
          rating: place.rating,
        }));
        setVets(vetPlaces);
        showPopup({
          type: 'success',
          title: 'Vétérinaires trouvés',
          message: `${vetPlaces.length} établissements à proximité`,
        });
      } else {
        console.log('⚠️ No vets in response');
        setVets([]);
      }
    } catch (error) {
      console.error('❌ Error fetching vets:', error);
      showPopup({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger les vétérinaires. Vérifiez votre connexion.',
      });
    }
  };

  const handleMyLocation = async () => {
    console.log('🎯 Recenter request');
    if (!locationPermission && Platform.OS !== 'web') {
      showPopup({
        type: 'info',
        title: 'Localisation requise',
        message: 'Activez les services de localisation dans vos réglages pour un centrage précis.',
      });
      return;
    }

    try {
      if (Platform.OS === 'web') {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
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
          });
        }
      } else {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
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
      }
    } catch (error) {
      console.error('Error getting location:', error);
      showPopup({ type: 'error', title: t('common.error'), message: "Impossible d'obtenir votre position actuelle" });
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
  const firebasePetsWithOwner: AllPet[] = firebasePets.map((p) => ({ ...p, owner: undefined }));

  const usersQuery = useQuery({
    queryKey: ['map', 'users'],
    queryFn: async () => {
      const list = await userService.getAllUsers(500);
      return list as User[];
    },
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

  const usersForMap: User[] = useMemo(() => {
    const jitter = (seed: number) => {
      const s = Math.sin(seed) * 10000;
      return s - Math.floor(s);
    };
    return allUsersNormalized.map((u, idx) => {
      if (u.location?.latitude != null && u.location?.longitude != null) return u;
      const j1 = jitter(idx + 1) - 0.5;
      const j2 = jitter(idx + 2) - 0.5;
      const approx = {
        latitude: DEFAULT_LAT + j1 * 0.02,
        longitude: DEFAULT_LNG + j2 * 0.02,
      } as { latitude: number; longitude: number };
      return {
        ...u,
        city: u.city ?? 'Paris',
        zipCode: u.zipCode ?? '75018',
        address: u.address ?? 'Montmartre',
        location: approx,
        normalizedAddress:
          u.normalizedAddress ?? `${u.address ?? 'Montmartre'}, ${u.zipCode ?? '75018'} Paris, France`,
        isActive: u.isActive ?? true,
        profileComplete: u.profileComplete ?? false,
      } as User;
    });
  }, [allUsersNormalized]);

  useEffect(() => {
    const missing = usersForMap.filter((u) => !u.location || u.address === '' || u.city === '' || u.zipCode === '');
    if (missing.length) {
      missing.slice(0, 50).forEach((u) => patchUser(u));
    }
  }, [usersForMap, patchUser]);

  const usersWithLocation = usersForMap.filter((u) => !!u.location);

  const userPetsWithLocation: AllPet[] = user?.pets?.filter((p) => p.location).map((p) => ({
    ...p,
    id: `user-${p.id}`,
    owner: user,
    isUserPet: true,
  })) || [];

  const allPetsIncludingUser: AllPet[] = [...firebasePetsWithOwner, ...userPetsWithLocation];

  const filteredPets = allPetsIncludingUser.filter((pet: AllPet) => {
    if (activeFilters.size === 0) return false;
    if (activeFilters.has('all')) return true;
    if (activeFilters.has('pets')) return true;
    if (activeFilters.has('sitters') && Boolean(pet.owner?.isCatSitter || pet.owner?.isProfessional)) return true;
    return false;
  });

  const filteredUsers = usersWithLocation.filter((u) => {
    if (activeFilters.size === 0) return false;
    if (activeFilters.has('all')) return true;
    if (activeFilters.has('sitters') && (u.isCatSitter || u.isProfessional)) return true;
    if (activeFilters.has('friends')) return true;
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
    <View style={[styles.container, { backgroundColor: getThemedColor('background') }]}> 
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
        {Platform.OS !== 'web' && filteredPets.map((pet, index) => (
          <MapMarker key={`${pet.id}-${index}`} pet={pet} onPress={() => handleMarkerPress(pet)} />
        ))}
        {Platform.OS !== 'web' && filteredUsers.map((u) => (
          <UserMarker key={`user-${u.id}`} user={u} onPress={() => setSelectedUser(u)} />
        ))}
        {Platform.OS !== 'web' && activeFilters.has('vets') && vets.map((vet) => (
          <MapMarker
            key={`vet-${vet.id}`}
            pet={{
              id: vet.id,
              name: vet.name,
              type: 'veterinaire' as any,
              breed: vet.address,
              gender: 'male' as any,
              location: vet.location,
              mainPhoto: '',
            } as any}
            onPress={() => {
              showPopup({
                type: 'info',
                title: vet.name,
                message: `${vet.address}${vet.rating ? `\n⭐ ${vet.rating}/5` : ''}`,
              });
            }}
          />
        ))}
      </MapView>

      {Platform.OS === 'web' && (
        <View pointerEvents="box-none" style={styles.webOverlay} testID="web-marker-layer">
          {filteredPets.map((pet, idx) => {
            if (!pet.location) return null;
            const blurred = getBlurredPetLocation(pet.id, pet.location);
            const pos = projectPoint(blurred.latitude, blurred.longitude);
            const left = Math.max(24, Math.min(width - 24, pos.left));
            const top = Math.max(24, Math.min(height - 24, pos.top));
            const markerColor = pet.gender === 'male' ? COLORS.male : COLORS.female;
            return (
              <TouchableOpacity
                key={`overlay-pet-${pet.id}-${idx}`}
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
          {filteredUsers.map((u, idx) => {
            const originalLoc = { latitude: u.location?.latitude ?? DEFAULT_LAT, longitude: u.location?.longitude ?? DEFAULT_LNG };
            const blurred = getBlurredUserLocation(u.id, originalLoc);
            const pos = projectPoint(blurred.latitude, blurred.longitude);
            const left = Math.max(8, Math.min(width - 8, pos.left));
            const top = Math.max(8, Math.min(height - 8, pos.top));
            return (
              <TouchableOpacity
                key={`overlay-user-${u.id}-${idx}`}
                onPress={() => setSelectedUser(u)}
                activeOpacity={0.9}
                style={[styles.webPin, { left, top }]}
                testID={`user-pin-${u.id}`}
              >
                <View style={styles.webPinDot} />
                <Text style={styles.webPinLabel} numberOfLines={1}>
                  @{u.pseudo ?? 'user'}
                </Text>
              </TouchableOpacity>
            );
          })}
          {activeFilters.has('vets') && vets.map((vet) => {
            const pos = projectPoint(vet.location.latitude, vet.location.longitude);
            const left = Math.max(24, Math.min(width - 24, pos.left));
            const top = Math.max(24, Math.min(height - 24, pos.top));
            return (
              <TouchableOpacity
                key={`overlay-vet-${vet.id}`}
                onPress={() => {
                  showPopup({
                    type: 'info',
                    title: vet.name,
                    message: `${vet.address}${vet.rating ? `\n⭐ ${vet.rating}/5` : ''}`,
                  });
                }}
                activeOpacity={0.8}
                style={[styles.webPetMarker, { left, top }]}
                testID={`vet-marker-${vet.id}`}
              >
                <View style={[styles.webPetMarkerCircle, { backgroundColor: '#10b981', borderColor: COLORS.white }]}>
                  <Text style={styles.webPetEmoji}>🏥</Text>
                </View>
                <View style={[styles.webPetTriangle, { borderTopColor: '#10b981' }]} />
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

      <View style={[styles.statsBar, SHADOWS.medium, { top: overlayTop }]}
        testID="stats-chip"
      >
        <Text style={styles.statsTitle}>{t('map.pets')}</Text>
        <Text style={styles.statsText}>
          {filteredPets.length} animaux • {filteredUsers.length} utilisateurs
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRowContent}
        style={[styles.filterRow, { top: filtersTop }]}
        testID="filter-row"
      >
        {FILTERS.map(({ key, label, Icon, gradient }) => {
          const isActive = activeFilters.has(key);
          return (
            <TouchableOpacity
              key={key}
              onPress={() => handleFilterPress(key)}
              style={styles.filterChip}
              testID={`chip-${key}`}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isActive ? gradient : ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.7)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.filterChipInner, isActive && SHADOWS.small]}
              >
                <Icon size={16} color={isActive ? '#fff' : COLORS.primary} />
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.controlsContainer, { top: filtersTop + 60 }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity style={[styles.controlButton, SHADOWS.medium]} onPress={handleMyLocation} testID="btn-my-location">
          <Compass size={22} color={COLORS.black} />
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
        <TouchableOpacity
          style={[styles.controlButton, SHADOWS.medium]}
          onPress={() => {
            handleFilterPress('vets');
          }}
          testID="btn-vets"
        >
          <Stethoscope size={20} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      {selectedPet && (
        <View style={styles.selectedPetCardContainer} testID="selected-pet-card">
          <AdBanner size="banner" style={styles.adBannerTop} />
          <TouchableOpacity
            style={[styles.selectedPetCard, SHADOWS.large]}
            onPress={handlePetCardPress}
            activeOpacity={0.95}
          >
            <LinearGradient
              colors={selectedPet.gender === 'female' ? ['#fbcfe8', '#f472b6'] : ['#dbeafe', '#60a5fa']}
              style={styles.petCardImageContainer}
            >
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
            </LinearGradient>

            <View style={styles.petCardInfo}>
              <View style={styles.petCardHeader}>
                <View>
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
                    <Text style={styles.sitterBadgeText}>Cat Sitter</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
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
            <Text style={styles.popupTitle}>{popup.title}</Text>
            <Text style={styles.popupMessage}>{popup.message}</Text>
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
    borderRadius: 28,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
  },
  adBannerTop: {
    marginBottom: 10,
  },
  petCardImageContainer: {
    width: 130,
    height: 160,
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    overflow: 'hidden',
    position: 'relative',
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
    padding: 18,
    justifyContent: 'space-between',
  },
  petCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  petCardName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  petCardBreed: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(15,23,42,0.06)',
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
    marginTop: 18,
  },
  petCardLocation: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  sitterBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
  filterRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  filterRowContent: {
    gap: 12,
    paddingRight: 16,
  },
  filterChip: {
    borderRadius: 999,
  },
  filterChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  filterChipTextActive: {
    color: '#fff',
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
  webPin: {
    position: 'absolute',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  webPinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  webPinLabel: {
    fontSize: 12,
    color: '#1A1A1A',
    maxWidth: 140,
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
