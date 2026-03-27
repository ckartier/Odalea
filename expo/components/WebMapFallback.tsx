import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { MapPin, Navigation, ZoomIn, ZoomOut } from 'lucide-react-native';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface WebMapFallbackProps {
  style?: any;
  region?: Region;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  onRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
  onMapReady?: () => void;
  testID?: string;
  children?: React.ReactNode;
  provider?: any;
}

export default function WebMapFallback({
  style,
  region,
  showsUserLocation,
  onRegionChange,
  onMapReady,
  testID,
  children,
}: WebMapFallbackProps) {
  const [currentRegion, setCurrentRegion] = useState<Region>(
    region || {
      latitude: 48.8567,
      longitude: 2.3508,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }
  );

  useEffect(() => {
    if (region) {
      setCurrentRegion(region);
    }
  }, [region]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onMapReady?.();
    }, 100);
    return () => clearTimeout(timer);
  }, [onMapReady]);

  const handleZoom = (delta: number) => {
    const newRegion = {
      ...currentRegion,
      latitudeDelta: Math.max(0.001, Math.min(100, currentRegion.latitudeDelta * delta)),
      longitudeDelta: Math.max(0.001, Math.min(100, currentRegion.longitudeDelta * delta)),
    };
    setCurrentRegion(newRegion);
    onRegionChange?.(newRegion);
  };

  const handlePan = (latDelta: number, lngDelta: number) => {
    const newRegion = {
      ...currentRegion,
      latitude: currentRegion.latitude + latDelta * currentRegion.latitudeDelta,
      longitude: currentRegion.longitude + lngDelta * currentRegion.longitudeDelta,
    };
    setCurrentRegion(newRegion);
    onRegionChange?.(newRegion);
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.mapBackground}>
        <View style={styles.gridOverlay}>
          {Array.from({ length: 10 }).map((_, i) => (
            <View key={`h-${i}`} style={[styles.gridLineH, { top: `${i * 10}%` }]} />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <View key={`v-${i}`} style={[styles.gridLineV, { left: `${i * 10}%` }]} />
          ))}
        </View>

        <View style={styles.coordsContainer}>
          <Text style={styles.coordsText}>
            {currentRegion.latitude.toFixed(4)}°N, {currentRegion.longitude.toFixed(4)}°E
          </Text>
        </View>

        {showsUserLocation && (
          <View style={styles.userLocationMarker}>
            <View style={styles.userLocationDot} />
            <View style={styles.userLocationPulse} />
          </View>
        )}

        <View style={styles.centerMarker}>
          <MapPin size={32} color="#0f172a" fill="#0f172a" />
        </View>

        {children}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => handleZoom(0.5)}
          activeOpacity={0.7}
        >
          <ZoomIn size={20} color="#0f172a" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => handleZoom(2)}
          activeOpacity={0.7}
        >
          <ZoomOut size={20} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <View style={styles.panControls}>
        <TouchableOpacity
          style={[styles.panButton, styles.panUp]}
          onPress={() => handlePan(0.3, 0)}
          activeOpacity={0.7}
        >
          <Navigation size={16} color="#0f172a" style={{ transform: [{ rotate: '0deg' }] }} />
        </TouchableOpacity>
        <View style={styles.panRow}>
          <TouchableOpacity
            style={[styles.panButton, styles.panLeft]}
            onPress={() => handlePan(0, -0.3)}
            activeOpacity={0.7}
          >
            <Navigation size={16} color="#0f172a" style={{ transform: [{ rotate: '-90deg' }] }} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.panButton, styles.panRight]}
            onPress={() => handlePan(0, 0.3)}
            activeOpacity={0.7}
          >
            <Navigation size={16} color="#0f172a" style={{ transform: [{ rotate: '90deg' }] }} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.panButton, styles.panDown]}
          onPress={() => handlePan(-0.3, 0)}
          activeOpacity={0.7}
        >
          <Navigation size={16} color="#0f172a" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeText}>Mode carte simplifie (web)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f4e8',
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#e8f4e8',
    position: 'relative',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  coordsContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  coordsText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#64748b',
  },
  userLocationMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -12,
    marginTop: -12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3b82f6',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  centerMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -32,
  },
  controls: {
    position: 'absolute',
    right: 16,
    top: 120,
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  panControls: {
    position: 'absolute',
    left: 16,
    bottom: 100,
    alignItems: 'center',
  },
  panRow: {
    flexDirection: 'row',
    gap: 24,
  },
  panButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  panUp: {},
  panLeft: {},
  panRight: {},
  panDown: {},
  notice: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#ffffff',
  },
});
