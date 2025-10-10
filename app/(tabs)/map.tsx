import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
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
import { Compass, Layers, Filter, Users, Heart, Search, Stethoscope } from 'lucide-react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { petService, userService } from '@/services/database';
import { getBlurredUserLocation, getBlurredPetLocation } from '@/services/location-privacy';

// Type definitions for map region
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

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Default coordinates (Montmartre, Paris)
const DEFAULT_LAT = 48.8867;
const DEFAULT_LNG = 2.3431;

export default function MapScreen() {
  const router = useRouter();
  const { user } = useFirebaseUser();
  const { incrementActionCount, shouldShowInterstitialAd } = usePremium();
  const { t } = useI18n();
  const { getThemedColor } = useTheme();

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
  const [showFilters, setShowFilters] = useState(false);
  const [vets, setVets] = useState<VetPlace[]>([]);

  // Request location permission and get current location
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'web') {
          if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
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
                console.log('Geolocation error on web', err);
                setLocationPermission(false);
                setUserLocation({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG });
                setRegion({
                  latitude: DEFAULT_LAT,
                  longitude: DEFAULT_LNG,
                  latitudeDelta: LATITUDE_DELTA,
                  longitudeDelta: LONGITUDE_DELTA,
                });
              },
              { enableHighAccuracy: true, timeout: 5000 }
            );
          } else {
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
            setLocationPermission(true);
            try {
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
              if (user?.pets && user.pets.length > 0) {
                const primaryPet = user.pets.find((p) => p.isPrimary) || user.pets[0];
                if (primaryPet) {
                  setSelectedPet(primaryPet);
                  setSelectedUser(user);
                }
              }
            } catch (error) {
              console.error('Error getting location:', error);
              setUserLocation({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG });
              setRegion({
                latitude: DEFAULT_LAT,
                longitude: DEFAULT_LNG,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
              });
            }
          } else {
            console.log('Location permission denied, using default location');
            setUserLocation({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG });
            setRegion({
              latitude: DEFAULT_LAT,
              longitude: DEFAULT_LNG,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            });
            Alert.alert(
              'Permission de localisation',
              "Nous avons besoin de votre localisation pour vous montrer les animaux près de chez vous. Nous utilisons Paris comme localisation par défaut.",
              [{ text: 'OK' }]
            );
          }
        }
      } catch (e) {
        console.log('Location init failed', e);
      }
    })();
  }, [user]);

  // Re-center on user location when they login
  useEffect(() => {
    if (user && userLocation) {
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
    console.log('Marker pressed:', pet.id, pet.name);
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
        console.log('Show interstitial ad');
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
    const newFilters = new Set(activeFilters);
    if (filter === 'all') {
      if (newFilters.has('all')) {
        newFilters.clear();
      } else {
        newFilters.clear();
        newFilters.add('all');
        newFilters.add('pets');
        newFilters.add('sitters');
        newFilters.add('friends');
        newFilters.add('lost');
        newFilters.add('vets');
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
      const { track } = require('@/services/tracking');
      track('map_filter_apply', { filters: Array.from(newFilters) });
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
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.error('❌ Google Maps API key not found in environment');
        console.log('Available env keys:', Object.keys(process.env).filter(k => k.includes('GOOGLE')));
        Alert.alert('Configuration', 'La clé API Google Maps est manquante. Veuillez configurer EXPO_PUBLIC_GOOGLE_MAPS_API_KEY dans votre fichier .env');
        return;
      }
      
      console.log('🔑 Using Google Maps API key:', apiKey.substring(0, 10) + '...');
      
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${loc.latitude},${loc.longitude}&radius=5000&type=veterinary_care&key=${apiKey}`;
      console.log('📍 Fetching vets near:', loc);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('❌ Failed to fetch vets, status:', response.status);
        Alert.alert('Erreur', `Impossible de charger les vétérinaires (${response.status})`);
        return;
      }
      
      const data = await response.json();
      console.log('📊 Vets API response status:', data.status);
      
      if (data.status === 'REQUEST_DENIED') {
        console.error('❌ Google Places API error:', data.error_message);
        Alert.alert('Erreur API', data.error_message || 'Accès refusé à l\'API Google Places. Vérifiez que l\'API Places est activée dans votre console Google Cloud.');
        return;
      }
      
      if (data.status === 'ZERO_RESULTS') {
        console.log('ℹ️ No vets found in this area');
        Alert.alert('Information', 'Aucun vétérinaire trouvé dans cette zone (rayon de 5km)');
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
        console.log(`✅ Found ${vetPlaces.length} veterinarians`);
      } else {
        console.log('⚠️ No vets in response');
        setVets([]);
      }
    } catch (error) {
      console.error('❌ Error fetching vets:', error);
      Alert.alert('Erreur', 'Erreur lors du chargement des vétérinaires: ' + (error as Error).message);
    }
  };

  const handleMyLocation = async () => {
    if (!locationPermission && Platform.OS !== 'web') {
      Alert.alert(
        'Permission de localisation',
        'Nous avons besoin de votre localisation pour vous montrer les animaux près de chez vous. Veuillez activer les services de localisation dans vos paramètres.',
        [{ text: t('common.ok') }]
      );
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
      Alert.alert(t('common.error'), "Impossible d'obtenir votre position actuelle");
    }
  };

  // Load nearby pets from Firestore when we have a location
  const nearbyPetsQuery = useQuery({
    queryKey: ['map', 'nearbyPets', userLocation?.latitude ?? DEFAULT_LAT, userLocation?.longitude ?? DEFAULT_LNG],
    enabled: true,
    queryFn: async () => {
      const loc = userLocation ?? { latitude: DEFAULT_LAT, longitude: DEFAULT_LNG };
      const list = await petService.getNearbyPets({ lat: loc.latitude, lng: loc.longitude }, 10);
      return list;
    },
  });

  const firebasePets = (nearbyPetsQuery.data ?? []).filter((p: any) => !!p.location) as Pet[];
  const firebasePetsWithOwner: AllPet[] = firebasePets.map((p) => ({ ...p, owner: undefined }));

  // Fetch users from Firestore
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
    []
  );

  const allUsersRaw = (usersQuery.data ?? []) as User[];
  const allUsersNormalized = useMemo(() => allUsersRaw.map(normalizeUser), [allUsersRaw, normalizeUser]);

  // Patch incomplete profiles and missing locations with Paris defaults
  const patchUserMutation = useMutation({
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
      missing.slice(0, 50).forEach((u) => patchUserMutation.mutate(u));
    }
  }, [usersForMap]);

  const usersWithLocation = usersForMap.filter((u) => !!u.location);

  // Add user's own pets to the list if they have location
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

  // Projection helpers for web overlay markers
  const projectPoint = useCallback(
    (lat: number, lng: number) => {
      const dx = (lng - region.longitude) / region.longitudeDelta + 0.5;
      const dy = (region.latitude - lat) / region.latitudeDelta + 0.5;
      return { left: dx * width, top: dy * height };
    },
    [region]
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
        scrollEnabled={true}
        zoomEnabled={true}
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
              Alert.alert(
                vet.name,
                `${vet.address}${vet.rating ? `\n⭐ ${vet.rating}/5` : ''}`,
                [{ text: 'OK' }]
              );
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
                  Alert.alert(
                    vet.name,
                    `${vet.address}${vet.rating ? `\n⭐ ${vet.rating}/5` : ''}`,
                    [{ text: 'OK' }]
                  );
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

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={[styles.controlButton, SHADOWS.medium]} onPress={handleMyLocation} testID="btn-my-location">
          <Compass size={24} color={COLORS.black} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, SHADOWS.medium, showFilters && styles.controlButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
          testID="btn-filters"
          activeOpacity={0.8}
        >
          <Filter size={24} color={showFilters ? COLORS.white : (activeFilters.size > 0 && !activeFilters.has('all') ? COLORS.primary : COLORS.black)} />
          {activeFilters.size > 0 && !activeFilters.has('all') && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilters.size}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={[styles.filterMenu, SHADOWS.large]} testID="filter-menu">
          <TouchableOpacity
            style={[styles.filterItem, activeFilters.has('all') && styles.filterItemActive]}
            onPress={() => handleFilterPress('all')}
            testID="filter-all"
            activeOpacity={0.7}
          >
            <View style={[styles.filterIconContainer, activeFilters.has('all') && styles.filterIconActive]}>
              <Layers size={18} color={activeFilters.has('all') ? COLORS.white : COLORS.primary} />
            </View>
            <Text style={[styles.filterText, activeFilters.has('all') && styles.filterTextActive]}>Tout afficher</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterItem, activeFilters.has('pets') && styles.filterItemActive]}
            onPress={() => handleFilterPress('pets')}
            testID="filter-pets"
            activeOpacity={0.7}
          >
            <View style={[styles.filterIconContainer, activeFilters.has('pets') && styles.filterIconActive]}>
              <Heart size={18} color={activeFilters.has('pets') ? COLORS.white : COLORS.primary} />
            </View>
            <Text style={[styles.filterText, activeFilters.has('pets') && styles.filterTextActive]}>Animaux</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterItem, activeFilters.has('sitters') && styles.filterItemActive]}
            onPress={() => handleFilterPress('sitters')}
            testID="filter-sitters"
            activeOpacity={0.7}
          >
            <View style={[styles.filterIconContainer, activeFilters.has('sitters') && styles.filterIconActive]}>
              <Users size={18} color={activeFilters.has('sitters') ? COLORS.white : COLORS.primary} />
            </View>
            <Text style={[styles.filterText, activeFilters.has('sitters') && styles.filterTextActive]}>Cat Sitters</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterItem, activeFilters.has('friends') && styles.filterItemActive]}
            onPress={() => handleFilterPress('friends')}
            testID="filter-friends"
            activeOpacity={0.7}
          >
            <View style={[styles.filterIconContainer, activeFilters.has('friends') && styles.filterIconActive]}>
              <Users size={18} color={activeFilters.has('friends') ? COLORS.white : COLORS.primary} />
            </View>
            <Text style={[styles.filterText, activeFilters.has('friends') && styles.filterTextActive]}>Amis</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterItem, activeFilters.has('lost') && styles.filterItemActive]}
            onPress={() => handleFilterPress('lost')}
            testID="filter-lost"
            activeOpacity={0.7}
          >
            <View style={[styles.filterIconContainer, activeFilters.has('lost') && styles.filterIconActive]}>
              <Search size={18} color={activeFilters.has('lost') ? COLORS.white : COLORS.primary} />
            </View>
            <Text style={[styles.filterText, activeFilters.has('lost') && styles.filterTextActive]}>Perdus</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterItem, activeFilters.has('vets') && styles.filterItemActive]}
            onPress={() => handleFilterPress('vets')}
            testID="filter-vets"
            activeOpacity={0.7}
          >
            <View style={[styles.filterIconContainer, activeFilters.has('vets') && styles.filterIconActive]}>
              <Stethoscope size={18} color={activeFilters.has('vets') ? COLORS.white : COLORS.primary} />
            </View>
            <Text style={[styles.filterText, activeFilters.has('vets') && styles.filterTextActive]}>Vétérinaires</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedPet && (
        <View style={styles.selectedPetCardContainer} testID="selected-pet-card">
          <AdBanner size="banner" style={styles.adBannerTop} />
          
          <TouchableOpacity 
            style={[styles.selectedPetCard, SHADOWS.large]} 
            onPress={handlePetCardPress} 
            activeOpacity={0.95}
          >
            <View style={styles.petCardImageContainer}>
              {selectedPet.mainPhoto ? (
                <Image
                  source={{ uri: selectedPet.mainPhoto }}
                  style={styles.petCardImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.petCardImagePlaceholder, { backgroundColor: selectedPet.gender === 'female' ? COLORS.female : COLORS.male }]}>
                  <Text style={styles.petCardImageEmoji}>🐱</Text>
                </View>
              )}
              <View style={[styles.petGenderBadge, { backgroundColor: selectedPet.gender === 'female' ? COLORS.female : COLORS.male }]}>
                <Text style={styles.petGenderText}>{selectedPet.gender === 'female' ? '♀' : '♂'}</Text>
              </View>
            </View>

            <View style={styles.petCardInfo}>
              <View style={styles.petCardHeader}>
                <Text style={styles.petCardName}>{selectedPet.name}</Text>
                <TouchableOpacity onPress={handleUserPress} style={styles.ownerBadge}>
                  <Text style={styles.ownerBadgeText}>@{selectedUser?.pseudo ?? ''}</Text>
                  {selectedUser?.isPremium && <Text style={styles.premiumIcon}>⭐</Text>}
                </TouchableOpacity>
              </View>
              
              <Text style={styles.petCardBreed}>
                {selectedPet.breed} • {selectedPet.type}
              </Text>
              
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

      <View style={[styles.statsBar, SHADOWS.medium]}>
        <Text style={styles.statsText}>
          {filteredPets.length} {t('map.pets')} • {filteredUsers.length} utilisateurs
        </Text>
      </View>
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
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 16,
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: COLORS.white,
  },
  filterMenu: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    paddingVertical: 12,
    minWidth: 180,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 12,
  },
  filterItemActive: {
    backgroundColor: COLORS.primary,
  },
  filterIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIconActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    flex: 1,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  selectedPetCardContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  selectedPetCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  adBannerTop: {
    marginVertical: 0,
  },
  petCardImageContainer: {
    width: 120,
    height: 140,
    position: 'relative',
  },
  petCardImage: {
    width: '100%',
    height: '100%',
  },
  petCardImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petCardImageEmoji: {
    fontSize: 48,
  },
  petGenderBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  petGenderText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '700' as const,
  },
  petCardInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  petCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  petCardName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    flex: 1,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ownerBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  premiumIcon: {
    fontSize: 12,
  },
  petCardBreed: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  petCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  petCardLocation: {
    fontSize: 13,
    color: '#888',
    flex: 1,
  },
  sitterBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sitterBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  statsBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  statsText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  webOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none' as const,
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
    borderStyle: 'solid' as const,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
});
