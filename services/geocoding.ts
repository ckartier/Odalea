import { Platform } from 'react-native';

export interface GeocodeInput {
  address?: string | null;
  city?: string | null;
  zipCode?: string | null;
  countryCode?: string | null;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  normalizedAddress?: string;
}

const cityFallback: Record<string, { latitude: number; longitude: number; zipCode: string; countryCode: string }> = {
  Paris: { latitude: 48.8566, longitude: 2.3522, zipCode: '75001', countryCode: 'FR' },
  Lyon: { latitude: 45.764, longitude: 4.8357, zipCode: '69001', countryCode: 'FR' },
  Marseille: { latitude: 43.2965, longitude: 5.3698, zipCode: '13001', countryCode: 'FR' },
  Toulouse: { latitude: 43.6047, longitude: 1.4442, zipCode: '31000', countryCode: 'FR' },
  Nice: { latitude: 43.7102, longitude: 7.262, zipCode: '06000', countryCode: 'FR' },
};

function buildQuery(q: GeocodeInput): string {
  const parts: string[] = [];
  if (q.address) parts.push(String(q.address));
  if (q.zipCode) parts.push(String(q.zipCode));
  if (q.city) parts.push(String(q.city));
  if (q.countryCode) parts.push(String(q.countryCode));
  return parts.filter(Boolean).join(', ');
}

export async function geocode(input: GeocodeInput): Promise<GeocodeResult | null> {
  try {
    const query = buildQuery(input);
    if (!query) return null;
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'fr', 'User-Agent': Platform.OS + '-expo-app' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const hit = data[0];
      const lat = Number(hit?.lat);
      const lon = Number(hit?.lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        return { latitude: lat, longitude: lon, normalizedAddress: String(hit?.display_name ?? query) };
      }
    }
    return null;
  } catch (e) {
    console.log('[geocoding] error', e);
    return null;
  }
}

export function fallbackGeocode(input: GeocodeInput): GeocodeResult | null {
  const city = String(input.city ?? '').trim();
  if (city && cityFallback[city]) {
    const c = cityFallback[city];
    return { latitude: c.latitude, longitude: c.longitude, normalizedAddress: buildQuery({ address: input.address ?? undefined, zipCode: input.zipCode ?? c.zipCode, city, countryCode: input.countryCode ?? c.countryCode }) };
  }
  return null;
}
