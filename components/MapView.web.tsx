import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapViewProps {
  children?: React.ReactNode;
  style?: unknown;
  region?: MapRegion;
  showsUserLocation?: boolean;
  onRegionChange?: (region: MapRegion) => void;
  [key: string]: unknown;
}

const DEFAULT_LAT = 48.8566;
const DEFAULT_LNG = 2.3522;

const MAP_SCRIPT_ID = 'google-maps-script';

const MapView: React.FC<MapViewProps> = ({
  children,
  style,
  region,
  showsUserLocation,
  onRegionChange,
  ...props
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || typeof window === 'undefined' || !window.google?.maps) return;

    const centerLat = typeof region?.latitude === 'number' ? region.latitude : DEFAULT_LAT;
    const centerLng = typeof region?.longitude === 'number' ? region.longitude : DEFAULT_LNG;

    const mapOptions: google.maps.MapOptions = {
      center: { lat: centerLat, lng: centerLng },
      zoom: 13,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
      disableDefaultUI: false,
      clickableIcons: true,
    };

    googleMapRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
    setIsLoaded(true);

    if (onRegionChange && googleMapRef.current) {
      googleMapRef.current.addListener('bounds_changed', () => {
        try {
          const bounds = googleMapRef.current?.getBounds?.();
          const center = googleMapRef.current?.getCenter?.();
          if (bounds && center && onRegionChange) {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            const payload: MapRegion = {
              latitude: center.lat(),
              longitude: center.lng(),
              latitudeDelta: ne.lat() - sw.lat(),
              longitudeDelta: ne.lng() - sw.lng(),
            };
            onRegionChange(payload);
          }
        } catch (e) {
          console.log('[MapView.web] bounds_changed handler error', e);
        }
      });
    }
  }, [onRegionChange, region?.latitude, region?.longitude]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('[MapView.web] Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');
      setLoadError('Clé API Google Maps manquante (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY).');
      return;
    }

    if (window.google?.maps) {
      initializeMap();
      return;
    }

    const existing = document.getElementById(MAP_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => initializeMap());
      existing.addEventListener('error', () => setLoadError("Échec du chargement de Google Maps."));
      return;
    }

    const script = document.createElement('script');
    script.id = MAP_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('[MapView.web] Google Maps script loaded');
      initializeMap();
    };
    script.onerror = () => {
      console.error('[MapView.web] Failed to load Google Maps');
      setLoadError('Échec du chargement de Google Maps.');
    };
    document.head.appendChild(script);
  }, [initializeMap]);

  useEffect(() => {
    if (googleMapRef.current && region && isLoaded && window.google?.maps) {
      try {
        const center = new window.google.maps.LatLng(region.latitude, region.longitude);
        googleMapRef.current.setCenter(center);
      } catch (e) {
        console.log('[MapView.web] setCenter error', e);
      }
    }
  }, [region, isLoaded]);

  if (loadError) {
    return (
      <View style={[styles.container, style]} testID="map-error">
        <Text style={styles.errorText}>{loadError}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} testID="map-container">
      <div ref={mapRef} style={styles.mapContainer as unknown as React.CSSProperties} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
  } as unknown as React.CSSProperties,
  errorText: {
    textAlign: 'center' as const,
    color: '#ff3b30',
    marginTop: 16,
  },
});

export default MapView;
export const PROVIDER_GOOGLE = 'google';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace google {
    export namespace maps {
      class Map {
        constructor(el: HTMLElement, opts?: MapOptions);
        setCenter(latLng: LatLng): void;
        addListener(eventName: string, handler: () => void): void;
        getBounds(): LatLngBounds | undefined;
        getCenter(): LatLng;
      }
      type MapTypeId = any;
      const MapTypeId: { ROADMAP: MapTypeId };
      interface MapOptions {
        center?: { lat: number; lng: number };
        zoom?: number;
        mapTypeId?: MapTypeId;
        styles?: unknown[];
        disableDefaultUI?: boolean;
        clickableIcons?: boolean;
      }
      class LatLng {
        constructor(lat: number, lng: number);
        lat(): number;
        lng(): number;
      }
      interface LatLngBounds {
        getNorthEast(): LatLng;
        getSouthWest(): LatLng;
      }
    }
  }
  interface Window {
    google: typeof google | undefined;
  }
}
