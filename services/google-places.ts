export interface GooglePlace {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  phoneNumber?: string;
  website?: string;
  rating?: number;
  priceLevel?: number;
  types: string[];
  photos?: string[];
  businessStatus?: string;
  openingHours?: {
    openNow: boolean;
    weekdayText?: string[];
  };
}

export type PlaceType = 'veterinary_care' | 'pet_store' | 'zoo' | 'animal_shelter';

const PLACE_TYPE_MAPPING: Record<PlaceType, string> = {
  veterinary_care: 'veterinary_care',
  pet_store: 'pet_store',
  zoo: 'zoo',
  animal_shelter: 'animal_shelter',
};

class GooglePlacesService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[GooglePlaces] Missing EXPO_PUBLIC_GOOGLE_PLACES_API_KEY');
    }
  }

  async searchNearby(
    location: { latitude: number; longitude: number },
    type: PlaceType,
    radiusMeters: number = 5000
  ): Promise<GooglePlace[]> {
    if (!this.apiKey) {
      console.error('[GooglePlaces] ❌ EXPO_PUBLIC_GOOGLE_PLACES_API_KEY is missing!');
      console.error('[GooglePlaces] Configure it in your .env file');
      return [];
    }

    try {
      const placeType = PLACE_TYPE_MAPPING[type];
      console.log(`[GooglePlaces] 🔍 Searching for ${placeType} near ${location.latitude},${location.longitude}`);

      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=${radiusMeters}&type=${placeType}&key=${this.apiKey}`;

      console.log(`[GooglePlaces] 📡 Request URL: ${url.replace(this.apiKey, 'API_KEY_HIDDEN')}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`[GooglePlaces] ❌ HTTP error: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const data = await response.json();
      
      console.log(`[GooglePlaces] 📊 API Response:`, {
        status: data.status,
        error_message: data.error_message || 'none',
        results_count: data.results?.length || 0,
        html_attributions: data.html_attributions?.length || 0
      });

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('[GooglePlaces] ❌ API error:', data.status, data.error_message);
        if (data.status === 'REQUEST_DENIED') {
          console.error('[GooglePlaces] 💡 Possible causes:');
          console.error('  - API key invalid or expired');
          console.error('  - Places API not enabled in Google Cloud Console');
          console.error('  - API key restrictions (HTTP referrers, bundle IDs)');
        }
        return [];
      }

      if (!data.results || data.results.length === 0) {
        console.log(`[GooglePlaces] ⚠️ No results found for ${placeType}`);
        console.log(`[GooglePlaces] 💡 Try increasing radius or checking location`);
        return [];
      }

      const places: GooglePlace[] = data.results.map((result: any) => ({
        id: result.place_id,
        name: result.name,
        address: result.vicinity || result.formatted_address || '',
        location: {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        },
        rating: result.rating,
        priceLevel: result.price_level,
        types: result.types || [],
        businessStatus: result.business_status,
        openingHours: result.opening_hours ? {
          openNow: result.opening_hours.open_now || false,
        } : undefined,
      }));

      console.log(`[GooglePlaces] ✅ Found ${places.length} ${placeType} places`);
      return places;
    } catch (error: any) {
      console.error('[GooglePlaces] ❌ Search error:', error?.message || error);
      console.error('[GooglePlaces] Stack:', error?.stack?.substring(0, 300));
      return [];
    }
  }

  async getPlaceDetails(placeId: string): Promise<GooglePlace | null> {
    if (!this.apiKey) {
      console.error('[GooglePlaces] API key not configured');
      return null;
    }

    try {
      console.log(`[GooglePlaces] Getting details for place ${placeId}`);

      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,formatted_phone_number,website,rating,price_level,types,photos,business_status,opening_hours&key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.error('[GooglePlaces] Details API error:', data.status, data.error_message);
        return null;
      }

      const result = data.result;
      const place: GooglePlace = {
        id: placeId,
        name: result.name,
        address: result.formatted_address || '',
        location: {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        },
        phoneNumber: result.formatted_phone_number,
        website: result.website,
        rating: result.rating,
        priceLevel: result.price_level,
        types: result.types || [],
        businessStatus: result.business_status,
        photos: result.photos?.map((photo: any) => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.apiKey}`
        ),
        openingHours: result.opening_hours ? {
          openNow: result.opening_hours.open_now || false,
          weekdayText: result.opening_hours.weekday_text,
        } : undefined,
      };

      console.log(`[GooglePlaces] Got details for ${place.name}`);
      return place;
    } catch (error) {
      console.error('[GooglePlaces] Details error:', error);
      return null;
    }
  }

  async searchMultipleTypes(
    location: { latitude: number; longitude: number },
    types: PlaceType[],
    radiusMeters: number = 5000
  ): Promise<GooglePlace[]> {
    console.log(`[GooglePlaces] Searching for multiple types: ${types.join(', ')}`);
    
    const searches = types.map(type => this.searchNearby(location, type, radiusMeters));
    const results = await Promise.all(searches);
    
    const allPlaces = results.flat();
    const uniquePlaces = Array.from(
      new Map(allPlaces.map(place => [place.id, place])).values()
    );

    console.log(`[GooglePlaces] Found ${uniquePlaces.length} unique places across all types`);
    return uniquePlaces;
  }
}

export const googlePlacesService = new GooglePlacesService();
