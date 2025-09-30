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
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { usePremium } from '@/hooks/premium-store';
import { useI18n } from '@/hooks/i18n-store';
import { useTheme } from '@/hooks/theme-store';
import { Pet, User } from '@/types';
import { Compass, Layers, Filter, Users, Heart, Search } from 'lucide-react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { petService, userService } from '@/services/database';

// Type definitions for map region
interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

type MapFilter = 'all' | 'pets' | 'sitters' | 'friends' | 'lost';

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
  const [currentFilter, setCurrentFilter] = useState<MapFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

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

  const handleMarkerPress = (pet: Pet & { owner?: User }) => {
    if (selectedPet?.id !== pet.id) {
      setSelectedPet(pet);
      setSelectedUser(pet.owner || null);
    }
    incrementActionCount();
  };

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

  const handleFilterPress = (filter: MapFilter) => {
    setCurrentFilter(filter);
    setShowFilters(false);
    incrementActionCount();
    try {
      const { track } = require('@/services/tracking');
      track('map_filter_apply', { filter });
    } catch (e) {
      console.log('track map_filter_apply failed', e);
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
    switch (currentFilter) {
      case 'pets':
        return true;
      case 'sitters':
        return Boolean(pet.owner?.isCatSitter || pet.owner?.isProfessional);
      case 'friends':
        return false;
      case 'lost':
        return false;
      default:
        return true;
    }
  });

  const filteredUsers = usersWithLocation;

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
        {...(Platform.OS === 'web' ? { provider: PROVIDER_GOOGLE } : {})}
        style={styles.map}
        region={region}
        showsUserLocation={locationPermission}
        showsMyLocationButton={false}
        scrollEnabled={true}
        zoomEnabled={true}
        rotateEnabled={false}
        pitchEnabled={false}
        testID="map-view"
      >
        {filteredPets.map((pet, index) => (
          <MapMarker key={`${pet.id}-${index}`} pet={pet} onPress={() => handleMarkerPress(pet)} />
        ))}
        {filteredUsers.map((u) => (
          <UserMarker key={`user-${u.id}`} user={u} onPress={() => setSelectedUser(u)} />
        ))}
      </MapView>

      {Platform.OS === 'web' && (
        <View pointerEvents="box-none" style={styles.webOverlay} testID="web-marker-layer">
          {filteredUsers.map((u, idx) => {
            const lat = u.location?.latitude ?? DEFAULT_LAT;
            const lng = u.location?.longitude ?? DEFAULT_LNG;
            const pos = projectPoint(lat, lng);
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
        </View>
      )}

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={[styles.controlButton, SHADOWS.medium]} onPress={handleMyLocation} testID="btn-my-location">
          <Compass size={24} color={COLORS.black} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, SHADOWS.medium]}
          onPress={() => setShowFilters(!showFilters)}
          testID="btn-filters"
        >
          <Filter size={24} color={currentFilter !== 'all' ? COLORS.primary : COLORS.black} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={[styles.filterMenu, SHADOWS.large]} testID="filter-menu">
          <TouchableOpacity
            style={[styles.filterItem, currentFilter === 'all' && styles.filterItemActive]}
            onPress={() => handleFilterPress('all')}
            testID="filter-all"
          >
            <Layers size={20} color={currentFilter === 'all' ? COLORS.white : COLORS.black} />
            <Text style={[styles.filterText, currentFilter === 'all' && styles.filterTextActive]}>{t('map.show_all')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterItem, currentFilter === 'pets' && styles.filterItemActive]}
            onPress={() => handleFilterPress('pets')}
            testID="filter-pets"
          >
            <Heart size={20} color={currentFilter === 'pets' ? COLORS.white : COLORS.black} />
            <Text style={[styles.filterText, currentFilter === 'pets' && styles.filterTextActive]}>{t('map.pets')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterItem, currentFilter === 'sitters' && styles.filterItemActive]}
            onPress={() => handleFilterPress('sitters')}
            testID="filter-sitters"
          >
            <Users size={20} color={currentFilter === 'sitters' ? COLORS.white : COLORS.black} />
            <Text style={[styles.filterText, currentFilter === 'sitters' && styles.filterTextActive]}>{t('map.sitters')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterItem, currentFilter === 'friends' && styles.filterItemActive]}
            onPress={() => handleFilterPress('friends')}
            testID="filter-friends"
          >
            <Users size={20} color={currentFilter === 'friends' ? COLORS.white : COLORS.black} />
            <Text style={[styles.filterText, currentFilter === 'friends' && styles.filterTextActive]}>{t('map.friends')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterItem, currentFilter === 'lost' && styles.filterItemActive]}
            onPress={() => handleFilterPress('lost')}
            testID="filter-lost"
          >
            <Search size={20} color={currentFilter === 'lost' ? COLORS.white : COLORS.black} />
            <Text style={[styles.filterText, currentFilter === 'lost' && styles.filterTextActive]}>{t('map.lost_found')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedPet && (
        <View
          style={[
            styles.selectedPetCard,
            SHADOWS.large,
            { backgroundColor: selectedPet.gender === 'female' ? COLORS.female : COLORS.male },
          ]}
          testID="selected-pet-card"
        >
          <AdBanner size="banner" style={styles.adBannerTop} />

          <TouchableOpacity style={styles.petCardContent} onPress={handlePetCardPress} activeOpacity={0.9}>
            <View
              style={[
                styles.petColorIndicator,
                { backgroundColor: selectedPet.gender === 'female' ? COLORS.femaleAccent : COLORS.maleAccent },
              ]}
            />

            <View style={styles.petInfo}>
              <Text style={[styles.petName, { color: COLORS.white }]}>{selectedPet.name}</Text>
              <Text style={[styles.petBreed, { color: COLORS.white, opacity: 0.9 }]}>
                {selectedPet.breed} • {selectedPet.type}
              </Text>
              <TouchableOpacity onPress={handleUserPress}>
                <Text style={[styles.petOwner, { color: COLORS.white }]}>
                  @{selectedUser?.pseudo ?? ''}
                  {selectedUser?.isPremium && ' ⭐'}
                  {(selectedUser?.isCatSitter || selectedUser?.isProfessional) && ' 🐱'}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.petLocation, { color: COLORS.white, opacity: 0.8 }]}>
                {selectedUser?.city ?? ''}
                {selectedUser?.zipCode ? `, ${selectedUser.zipCode}` : ''}
              </Text>
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
  filterMenu: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 150,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  filterItemActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#1A1A1A',
  },
  filterTextActive: {
    color: COLORS.white,
  },
  selectedPetCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    maxHeight: '40%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  adBannerTop: {
    marginVertical: 0,
  },
  petCardContent: {
    flexDirection: 'row',
  },
  petColorIndicator: {
    width: 8,
    height: '100%',
  },
  petInfo: {
    flex: 1,
    padding: 16,
  },
  petName: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 14,
    marginBottom: 4,
  },
  petOwner: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  petLocation: {
    fontSize: 12,
  },
  statsBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statsText: {
    fontSize: 12,
    fontWeight: '500' as const,
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
});
