export interface Location {
  latitude: number;
  longitude: number;
}

const PRIVACY_RADIUS_METERS = 200;
const EARTH_RADIUS_METERS = 6371000;

function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

function generateSeededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

export function blurLocation(location: Location, seed: string): Location {
  const random1 = generateSeededRandom(seed + '_lat');
  const random2 = generateSeededRandom(seed + '_lng');
  
  const angle = random1 * 2 * Math.PI;
  const radius = Math.sqrt(random2) * PRIVACY_RADIUS_METERS;
  
  const latOffset = radiansToDegrees(radius * Math.cos(angle) / EARTH_RADIUS_METERS);
  const lngOffset = radiansToDegrees(
    radius * Math.sin(angle) / (EARTH_RADIUS_METERS * Math.cos(degreesToRadians(location.latitude)))
  );
  
  return {
    latitude: location.latitude + latOffset,
    longitude: location.longitude + lngOffset,
  };
}

export function getBlurredPetLocation(petId: string, location: Location): Location {
  return blurLocation(location, `pet_${petId}`);
}

export function getBlurredUserLocation(userId: string, location: Location): Location {
  return blurLocation(location, `user_${userId}`);
}

export function calculateDistance(loc1: Location, loc2: Location): number {
  const lat1Rad = degreesToRadians(loc1.latitude);
  const lat2Rad = degreesToRadians(loc2.latitude);
  const deltaLat = degreesToRadians(loc2.latitude - loc1.latitude);
  const deltaLng = degreesToRadians(loc2.longitude - loc1.longitude);

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_METERS * c;
}
