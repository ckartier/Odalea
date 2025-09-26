import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';

interface MapViewProps {
  children?: React.ReactNode;
  style?: any;
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation?: boolean;
  onRegionChange?: (region: any) => void;
  [key: string]: any;
}

const MapView: React.FC<MapViewProps> = ({ 
  children, 
  style, 
  region,
  showsUserLocation,
  onRegionChange,
  ...props 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (typeof window === 'undefined') return;
      
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      // Load Google Maps script
      const script = document.createElement('script');
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAkZRD6EuCR5HfjEzByEJxXdi-LWlXqvjI';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = () => {
        console.error('Failed to load Google Maps');
        setIsLoaded(false);
      };
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google) return;

      const mapOptions = {
        center: {
          lat: region?.latitude || 48.8566,
          lng: region?.longitude || 2.3522
        },
        zoom: 13,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      };

      googleMapRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
      setIsLoaded(true);

      // Add event listener for region changes
      if (onRegionChange) {
        googleMapRef.current.addListener('bounds_changed', () => {
          const bounds = googleMapRef.current.getBounds();
          const center = googleMapRef.current.getCenter();
          if (bounds && center) {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            onRegionChange({
              latitude: center.lat(),
              longitude: center.lng(),
              latitudeDelta: ne.lat() - sw.lat(),
              longitudeDelta: ne.lng() - sw.lng()
            });
          }
        });
      }
    };

    loadGoogleMaps();
  }, [onRegionChange, region?.latitude, region?.longitude]);

  // Update map center when region changes
  useEffect(() => {
    if (googleMapRef.current && region && isLoaded) {
      const center = new window.google.maps.LatLng(region.latitude, region.longitude);
      googleMapRef.current.setCenter(center);
    }
  }, [region, isLoaded]);

  return (
    <View style={[styles.container, style]}>
      <div 
        ref={mapRef} 
        style={styles.mapContainer as any}
      />
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
  } as any,
});

export default MapView;
export const PROVIDER_GOOGLE = 'google';

// Declare global types for Google Maps
declare global {
  interface Window {
    google: any;
  }
}