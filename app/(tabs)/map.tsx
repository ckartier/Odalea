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
  Platform,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import MapView, { PROVIDER_GOOGLE } from '@/components/MapView';
import MapMarker from '@/components/MapMarker';
import UserMarker from '@/components/UserMarker';
import GooglePlaceMarker from '@/components/GooglePlaceMarker';
import MapBottomSheet from '@/components/MapBottomSheet';
import type { MapFilterType } from '@/components/MapFilterChips';
import { Check, SlidersHorizontal, X } from 'lucide-react-native';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { usePremium } from '@/hooks/premium-store';
import { Pet, User } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { petService, userService, petSitterService } from '@/services/database';
import { auth } from '@/services/firebase';
import { getBlurredPetLocation, calculateDistance } from '@/services/location-privacy';
import { track } from '@/services/tracking';
import { useFriends } from '@/hooks/friends-store';
import { useFavorites } from '@/hooks/favorites-store';
import { googlePlacesService, GooglePlace, PlaceType } from '@/services/google-places';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
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

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const DEFAULT_LAT = 48.8567;
const DEFAULT_LNG = 2.3508;

export default function MapScreen() {
  const router = useRouter();
  const { user } = useFirebaseUser();
  const { incrementActionCount, shouldShowInterstitialAd } = usePremium();
  const insets = useSafeAreaInsets();
  const { sendFriendRequest, isFriend, isRequestSent } = useFriends();
  const { isFavorite } = useFavorites();

  const [region, setRegion] = useState<Region>({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGooglePlace, setSelectedGooglePlace] = useState<GooglePlace | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<Set<MapFilterType>>(
    new Set(['users', 'catSitters', 'googleVet', 'googleShop', 'googleZoo', 'googleShelter']),
  );
  const [popup, setPopup] = useState<PopupConfig | null>(null);
  const popupAnim = useRef(new Animated.Value(0)).current;
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);

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
    }, 4000);
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
            } catch (error) {
              console.error('❌ Error getting location:', error);
              setUserLocation({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG });
              setRegion({
                latitude: DEFAULT_LAT,
                longitude: DEFAULT_LNG,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
              });
            }
          } else {
            console.log('🚫 Location permission denied');
            setUserLocation({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG });
            setRegion({
              latitude: DEFAULT_LAT,
              longitude: DEFAULT_LNG,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            });
          }
        }
      } catch (e) {
        console.log('❌ Location init failed', e);
      }
    })();
  }, []);

  const handleMarkerPress = useCallback(async (pet: Pet & { owner?: User }) => {
    console.log('📍 Marker pressed:', pet.id, pet.name);
    setSelectedPet(pet);
    setSelectedGooglePlace(null);
    
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

  const handleGooglePlacePress = useCallback(async (place: GooglePlace) => {
    console.log('📍 Google Place pressed:', place.id, place.name);
    setSelectedPet(null);
    setSelectedUser(null);
    
    try {
      const details = await googlePlacesService.getPlaceDetails(place.id);
      setSelectedGooglePlace(details || place);
    } catch (error) {
      console.error('❌ Error fetching place details:', error);
      setSelectedGooglePlace(place);
    }
    
    incrementActionCount();
  }, [incrementActionCount]);

  const handleRegionChange = useCallback((r: Region) => {
    setRegion(r);
  }, []);

  const handleViewProfile = () => {
    if (selectedPet) {
      incrementActionCount();
      if (shouldShowInterstitialAd()) {
        console.log('🎬 Should show interstitial ad');
      }
      router.push(`/pet/${selectedPet.id}`);
    }
  };

  const handleAddFriend = async () => {
    if (!selectedPet?.ownerId || !user?.id) return;
    if (selectedPet.ownerId === user.id) {
      showPopup({ type: 'error', title: 'Erreur', message: 'Vous ne pouvez pas vous ajouter vous-même' });
      return;
    }
    try {
      await sendFriendRequest(selectedPet.ownerId);
      showPopup({ type: 'success', title: 'Succès', message: 'Demande d\'ami envoyée' });
    } catch (error: any) {
      showPopup({ type: 'error', title: 'Erreur', message: error?.message || 'Impossible d\'envoyer la demande' });
    }
  };

  const handleMessage = async () => {
    if (!selectedPet?.ownerId || !user?.id) return;
    if (selectedPet.ownerId === user.id) {
      showPopup({ type: 'error', title: 'Erreur', message: 'Vous ne pouvez pas vous envoyer un message' });
      return;
    }
    if (!isFriend(selectedPet.ownerId)) {
      showPopup({ type: 'info', title: 'Non autorisé', message: 'Vous devez être amis pour envoyer un message' });
      return;
    }
    router.push(`/messages/${selectedPet.ownerId}`);
  };

  const handleCreatePost = () => {
    if (!selectedPet) return;
    incrementActionCount();
    router.push(`/community/create?petId=${selectedPet.id}`);
  };

  const handleFilterToggle = async (filter: MapFilterType) => {
    console.log('🎛 Toggle filter', filter);
    const newFilters = new Set(activeFilters);
    
    if (newFilters.has(filter)) {
      newFilters.delete(filter);
    } else {
      newFilters.add(filter);
    }
    
    setActiveFilters(newFilters);
    incrementActionCount();
    try {
      track('map_filter_apply', { filters: Array.from(newFilters).join(',') });
    } catch (e) {
      console.log('track map_filter_apply failed', e);
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

  const googlePlacesQuery = useQuery({
    queryKey: ['map', 'googlePlaces', userLat, userLng, Array.from(activeFilters).join(',')],
    enabled: activeFilters.has('googleVet') || activeFilters.has('googleShop') || activeFilters.has('googleZoo') || activeFilters.has('googleShelter'),
    queryFn: async () => {
      console.log('🔄 Fetching Google Places');
      const types: PlaceType[] = [];
      
      if (activeFilters.has('googleVet')) types.push('veterinary_care');
      if (activeFilters.has('googleShop')) types.push('pet_store');
      if (activeFilters.has('googleZoo')) types.push('zoo');
      if (activeFilters.has('googleShelter')) types.push('animal_shelter');
      
      if (types.length === 0) return [];
      
      const places = await googlePlacesService.searchMultipleTypes(
        { latitude: userLat, longitude: userLng },
        types,
        10000
      );
      
      console.log(`✅ Loaded ${places.length} Google Places`);
      return places;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const catSittersQuery = useQuery({
    queryKey: ['map', 'catSitters', auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser) {
        console.log('⚠️ Skipping cat sitters query - user not authenticated');
        return [];
      }

      try {
        console.log('🔄 Fetching cat sitters from Firestore');
        const profiles = await petSitterService.getAllProfiles(100);
        console.log(`✅ Loaded ${profiles.length} cat sitters from Firestore`);
        
        const catSittersWithUsers = await Promise.all(
          profiles.map(async (profile) => {
            if (!profile.userId || profile.userId.includes('paris-') || profile.userId.includes('test')) {
              console.log(`🚫 Skipping mock cat sitter: ${profile.userId}`);
              return null;
            }
            try {
              const user = await userService.getUser(profile.userId);
              if (user?.id.includes('paris-') || user?.id.includes('test')) {
                console.log(`🚫 Skipping mock user: ${user.id}`);
                return null;
              }
              return { ...profile, user };
            } catch (error) {
              console.error(`❌ Error fetching user for cat sitter ${profile.userId}:`, error);
              return null;
            }
          })
        );
        
        return catSittersWithUsers.filter(
          (cs) => cs && cs.user && cs.user.location?.latitude && cs.user.location?.longitude
        ) as { user: User; isActive: boolean; radiusKm: number }[];
      } catch (error) {
        console.error('❌ Error fetching cat sitters:', error);
        return [];
      }
    },
    enabled: !!auth.currentUser,
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

  const usersWithLocation = useMemo(() => {
    const filtered = allUsersNormalized.filter((u) => u.location?.latitude != null && u.location?.longitude != null);
    console.log(`📍 Users with location: ${filtered.length} (from ${allUsersNormalized.length} total users)`);
    return filtered;
  }, [allUsersNormalized]);

  const userPetsWithLocation: AllPet[] = user?.pets?.filter((p) => p.location).map((p) => ({
    ...p,
    id: `user-${p.id}`,
    owner: user,
    isUserPet: true,
  })) || [];

  const firebasePetIds = new Set(firebasePetsWithOwner.map(p => p.id.replace('user-', '')));
  const uniqueUserPets = userPetsWithLocation.filter(p => !firebasePetIds.has(p.id.replace('user-', '')));
  const allPetsIncludingUser: AllPet[] = [...firebasePetsWithOwner, ...uniqueUserPets];

  const filteredPets = allPetsIncludingUser.filter((pet: AllPet) => {
    if (activeFilters.size === 0) return false;
    return activeFilters.has('users');
  });

  const catSittersWithLocation = catSittersQuery.data ?? [];

  const professionals = usersWithLocation.filter((u) => {
    if (!u.isProfessional || !u.professionalData?.activityType) return false;
    if (u.id.includes('paris-') || u.id.includes('test')) return false;
    
    if (activeFilters.size === 0) return false;
    
    const hasProsFilter = activeFilters.has('pros');
    const hasSpecificFilter = activeFilters.has(u.professionalData.activityType as any);
    
    return hasProsFilter || hasSpecificFilter;
  });
  console.log(`👔 Professionals to display: ${professionals.length}`, professionals.map(p => ({ name: p.name || p.pseudo, type: p.professionalData?.activityType })));

  const filteredUsers = usersWithLocation.filter((u) => {
    if (u.email?.includes('test') || u.pseudo?.toLowerCase().includes('test') || u.id.includes('paris-')) {
      return false;
    }
    if (u.isProfessional || u.isCatSitter) return false;
    
    if (u.privacySettings?.hideLocationOnMap) return false;
    if (activeFilters.size === 0) return false;
    return activeFilters.has('users');
  });
  console.log(`👥 Regular users to display: ${filteredUsers.length}`, filteredUsers.map(u => ({ name: u.name || u.pseudo, hasPets: u.pets?.length || 0 })));

  const filteredCatSitters = catSittersWithLocation.filter((cs) => {
    if (activeFilters.size === 0) return false;
    if (activeFilters.has('catSitters')) return true;
    return false;
  });
  console.log(`🏠 Cat sitters to display: ${filteredCatSitters.length}`, filteredCatSitters.map(cs => ({ name: cs.user.name || cs.user.pseudo })));

  const googlePlaces = googlePlacesQuery.data ?? [];
  const filteredGooglePlaces = googlePlaces.filter((place) => {
    if (activeFilters.size === 0) return false;
    
    if (activeFilters.has('googleVet') && place.types.includes('veterinary_care')) return true;
    if (activeFilters.has('googleShop') && place.types.includes('pet_store')) return true;
    if (activeFilters.has('googleZoo') && place.types.includes('zoo')) return true;
    if (activeFilters.has('googleShelter') && place.types.includes('animal_shelter')) return true;
    
    return false;
  });
  console.log(`📍 Google Places to display: ${filteredGooglePlaces.length}`, filteredGooglePlaces.map(p => ({ name: p.name, types: p.types })));

  const projectPoint = useCallback(
    (lat: number, lng: number) => {
      const dx = (lng - region.longitude) / region.longitudeDelta + 0.5;
      const dy = (region.latitude - lat) / region.latitudeDelta + 0.5;
      return { left: dx * width, top: dy * height };
    },
    [region],
  );

  const getDistance = (petLocation?: { latitude: number; longitude: number }) => {
    if (!userLocation || !petLocation) return undefined;
    const dist = calculateDistance(userLocation, petLocation);
    return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
  };

  const getProfessionalType = (owner?: User | null): 'catSitter' | 'vet' | 'breeder' | 'shelter' | 'educator' | undefined => {
    if (!owner?.isProfessional) return undefined;
    const activityType = owner.professionalData?.activityType;
    if (activityType === 'vet' || activityType === 'breeder' || activityType === 'shelter') {
      return activityType;
    }
    if (owner.isCatSitter) return 'catSitter';
    return undefined;
  };

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
          <UserMarker key={`user-${u.id}`} user={u} onPress={() => {
            setSelectedUser(u);
            router.push(`/profile/${u.id}`);
          }} />
        ))}
        {Platform.OS !== 'web' && filteredCatSitters.map((cs) => (
          <UserMarker
            key={`cat-sitter-${cs.user.id}`}
            user={cs.user}
            isCatSitter
            onPress={() => {
              setSelectedUser(cs.user);
              router.push(`/cat-sitter/${cs.user.id}`);
            }}
          />
        ))}
        {Platform.OS !== 'web' && professionals.map((pro) => (
          <UserMarker key={`pro-${pro.id}`} user={pro} isProfessional onPress={() => {
            setSelectedUser(pro);
            router.push(`/profile/${pro.id}`);
          }} />
        ))}
        {Platform.OS !== 'web' && filteredGooglePlaces.map((place) => (
          <GooglePlaceMarker
            key={`google-${place.id}`}
            place={place}
            onPress={() => handleGooglePlacePress(place)}
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
            const petImageUrl = pet.mainPhoto;
            return (
              <TouchableOpacity
                key={`overlay-pet-${pet.id}`}
                style={[styles.webPetMarker, { left, top }]}
                onPress={() => handleMarkerPress(pet)}
                activeOpacity={0.8}
              >
                <View style={[styles.webPetMarkerCircle, { backgroundColor: markerColor, borderColor: COLORS.white }]}>
                  {petImageUrl ? (
                    <img
                      src={petImageUrl}
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
            if (!u.location) return null;
            const pos = projectPoint(u.location.latitude, u.location.longitude);
            const left = Math.max(24, Math.min(width - 24, pos.left));
            const top = Math.max(24, Math.min(height - 24, pos.top));
            return (
              <TouchableOpacity
                key={`overlay-user-${u.id}`}
                style={[styles.webUserMarker, { left, top }]}
                onPress={() => {
                  setSelectedUser(u);
                  router.push(`/profile/${u.id}`);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.webUserMarkerCircle, { backgroundColor: '#6366f1', borderColor: COLORS.white }]}>
                  {u.photo ? (
                    <img
                      src={u.photo}
                      alt={u.name || u.pseudo}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <Text style={styles.webUserEmoji}>👤</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
          {professionals.map((pro) => {
            if (!pro.location) return null;
            const pos = projectPoint(pro.location.latitude, pro.location.longitude);
            const left = Math.max(24, Math.min(width - 24, pos.left));
            const top = Math.max(24, Math.min(height - 24, pos.top));
            const activityType = pro.professionalData?.activityType || 'pro';
            const proColors: Record<string, string> = {
              vet: '#10b981',
              boutique: '#f59e0b',
              educator: '#06b6d4',
              shelter: '#8b5cf6',
              breeder: '#f59e0b',
            };
            const proColor = proColors[activityType] || '#10b981';
            return (
              <TouchableOpacity
                key={`overlay-pro-${pro.id}`}
                style={[styles.webUserMarker, { left, top }]}
                onPress={() => {
                  setSelectedUser(pro);
                  router.push(`/profile/${pro.id}`);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.webUserMarkerCircle, { backgroundColor: proColor, borderColor: COLORS.white }]}>
                  {pro.photo ? (
                    <img
                      src={pro.photo}
                      alt={pro.professionalData?.companyName || pro.name || pro.pseudo}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <Text style={styles.webUserEmoji}>🏢</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
          {filteredCatSitters.map((cs) => {
            if (!cs.user.location) return null;
            const pos = projectPoint(cs.user.location.latitude, cs.user.location.longitude);
            const left = Math.max(24, Math.min(width - 24, pos.left));
            const top = Math.max(24, Math.min(height - 24, pos.top));
            return (
              <TouchableOpacity
                key={`overlay-cs-${cs.user.id}`}
                style={[styles.webUserMarker, { left, top }]}
                onPress={() => {
                  setSelectedUser(cs.user);
                  router.push(`/cat-sitter/${cs.user.id}`);
                }}
                activeOpacity={0.8}
                testID={`web-cat-sitter-${cs.user.id}`}
              >
                <View style={[styles.webUserMarkerCircle, { backgroundColor: '#6366f1', borderColor: COLORS.white }]}>
                  {cs.user.photo ? (
                    <img
                      src={cs.user.photo}
                      alt={cs.user.name || cs.user.pseudo}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <Text style={styles.webUserEmoji}>🏠</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
          {filteredGooglePlaces.map((place) => {
            if (!place.location) return null;
            const pos = projectPoint(place.location.latitude, place.location.longitude);
            const left = Math.max(24, Math.min(width - 24, pos.left));
            const top = Math.max(24, Math.min(height - 24, pos.top));
            const placeColor = place.types.includes('veterinary_care')
              ? '#10b981'
              : place.types.includes('pet_store')
                ? '#f59e0b'
                : place.types.includes('zoo')
                  ? '#8b5cf6'
                  : '#06b6d4';
            const placeEmoji = place.types.includes('veterinary_care')
              ? '🏥'
              : place.types.includes('pet_store')
                ? '🛒'
                : place.types.includes('zoo')
                  ? '🦁'
                  : '🏠';
            return (
              <TouchableOpacity
                key={`overlay-google-${place.id}`}
                style={[styles.webUserMarker, { left, top }]}
                onPress={() => handleGooglePlacePress(place)}
                activeOpacity={0.8}
                testID={`web-google-place-${place.id}`}
              >
                <View style={[styles.webUserMarkerCircle, { backgroundColor: placeColor, borderColor: COLORS.white }]}>
                  <Text style={styles.webUserEmoji}>{placeEmoji}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={[styles.filterButtonContainer, { top: insets.top + 14, right: 14 }]} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsFiltersOpen(true)}
          activeOpacity={0.85}
          testID="map-open-filters"
        >
          <SlidersHorizontal size={18} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {isFiltersOpen && (
        <View style={styles.filtersOverlay}>
          <TouchableOpacity 
            style={styles.filtersBackdrop} 
            activeOpacity={1}
            onPress={() => setIsFiltersOpen(false)}
          />
          <View style={[styles.filtersSheet, { bottom: insets.bottom + 20 }]} testID="map-filters-modal">
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>Filtres</Text>
              <TouchableOpacity
                onPress={() => setIsFiltersOpen(false)}
                style={styles.filtersCloseButton}
                activeOpacity={0.85}
                testID="map-close-filters"
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.filtersContent}>
              {([
                { key: 'users', label: 'Utilisateurs', color: '#0f172a' },
                { key: 'catSitters', label: 'Cat Sitters', color: '#0f172a' },
                { key: 'pros', label: 'Professionnels', color: '#0f172a' },
                { key: 'googleVet', label: 'Vétérinaires', color: '#0f172a' },
                { key: 'googleShop', label: 'Animaleries', color: '#0f172a' },
                { key: 'googleZoo', label: 'Zoos', color: '#0f172a' },
                { key: 'googleShelter', label: 'Refuges', color: '#0f172a' },
              ] as const).map((item) => {
                const isActive = activeFilters.has(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.filterChip,
                      isActive && styles.filterChipActive,
                    ]}
                    onPress={() => handleFilterToggle(item.key)}
                    activeOpacity={0.7}
                    testID={`map-filter-${item.key}`}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {item.label}
                    </Text>
                    {isActive && <Check size={16} color="#ffffff" strokeWidth={3} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.filtersActions}>
              <TouchableOpacity
                style={styles.filtersResetButton}
                onPress={() => setActiveFilters(new Set())}
                activeOpacity={0.85}
                testID="map-filters-reset"
              >
                <Text style={styles.filtersResetText}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filtersApplyButton}
                onPress={() => setIsFiltersOpen(false)}
                activeOpacity={0.85}
                testID="map-filters-apply"
              >
                <Text style={styles.filtersApplyText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {selectedPet && !selectedGooglePlace && (
        <MapBottomSheet
          pet={selectedPet}
          owner={selectedUser}
          distance={getDistance(selectedPet.location)}
          isFriend={isFriend(selectedPet.ownerId || '')}
          isRequestSent={isRequestSent(selectedPet.ownerId || '')}
          isFavorite={isFavorite(selectedPet.id)}
          isProfessional={Boolean(selectedUser?.isProfessional)}
          professionalType={getProfessionalType(selectedUser)}
          onViewProfile={handleViewProfile}
          onAddFriend={handleAddFriend}
          onMessage={handleMessage}
          onCreatePost={handleCreatePost}
          onClose={() => setSelectedPet(null)}
        />
      )}

      {selectedGooglePlace && (
        <MapBottomSheet
          googlePlace={selectedGooglePlace}
          distance={getDistance(selectedGooglePlace.location)}
          onClose={() => setSelectedGooglePlace(null)}
          onViewProfile={() => {}}
          onAddFriend={() => {}}
          onMessage={() => {}}
          onCreatePost={() => {}}
        />
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
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  filterButtonContainer: {
    position: 'absolute',
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  webOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
  },
  filtersOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  filtersBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  filtersSheet: {
    position: 'absolute',
    left: '4%',
    right: '4%',
    width: '92%',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  filtersTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  filtersCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  filtersActions: {
    flexDirection: 'row',
    gap: 12,
  },
  filtersResetButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  filtersResetText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
  },
  filtersApplyButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    alignItems: 'center',
  },
  filtersApplyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
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
    borderStyle: 'solid' as const,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  webUserMarker: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -20 }, { translateY: -40 }],
  },
  webUserMarkerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  webUserEmoji: {
    fontSize: 18,
  },
  popupContainer: {
    position: 'absolute',
    top: 90,
    alignSelf: 'center',
    maxWidth: '90%',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  popupContent: {
    flex: 1,
  },
  popupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  popupMessage: {
    fontSize: 13,
    color: '#f8fafc',
    marginTop: 2,
  },
});
