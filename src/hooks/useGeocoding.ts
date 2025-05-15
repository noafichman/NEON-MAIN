import { useState, useEffect } from 'react';

export interface GeocodingResult {
  id: string;
  name: string;
  displayName: string; // Full formatted address
  coordinates: {
    longitude: number;
    latitude: number;
  };
  placeType: string; // country, region, place, locality, etc.
  relevance: number; // 0-1 score of how relevant the result is
}

interface UseGeocodingParams {
  query: string;
  limit?: number;
  proximity?: {
    longitude: number;
    latitude: number;
  };
}

const useGeocoding = ({ query, limit = 5, proximity }: UseGeocodingParams) => {
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't search if query is empty
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchLocations = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Access token stored in MapContainer.tsx
        const mapboxAccessToken = "pk.eyJ1IjoiYW10cnRtIiwiYSI6ImNsd2wzeWNlcDFnc2gycXBmaWoweGx5a3oifQ.thuFRVzuZiyk9xuPI173PA";
        
        // Build the geocoding URL
        let geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxAccessToken}&limit=${limit}`;
        
        // Add proximity parameter if provided
        if (proximity) {
          geocodingUrl += `&proximity=${proximity.longitude},${proximity.latitude}`;
        }
        
        const response = await fetch(geocodingUrl);
        
        if (!response.ok) {
          throw new Error(`Geocoding API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform Mapbox results to our format
        const transformedResults: GeocodingResult[] = data.features.map((feature: any) => ({
          id: feature.id,
          name: feature.text,
          displayName: feature.place_name,
          coordinates: {
            longitude: feature.center[0],
            latitude: feature.center[1]
          },
          placeType: feature.place_type?.[0] || 'unknown',
          relevance: feature.relevance || 0.5
        }));
        
        setResults(transformedResults);
      } catch (err) {
        console.error('Geocoding error:', err);
        setError('Failed to get location results');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      searchLocations();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, limit, proximity]);

  return { results, loading, error };
};

export default useGeocoding; 