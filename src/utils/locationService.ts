// Interface for location data
export interface Location {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  type: 'city' | 'landmark' | 'military' | 'terrain';
}

// Mock locations for demonstration purposes
// In a real application, these would come from an API or database
export const LOCATIONS: Location[] = [
  // Cities
  { id: 'loc-001', name: 'Northwind City', description: 'Major urban center in the north', latitude: 33.15, longitude: 119.87, type: 'city' },
  { id: 'loc-002', name: 'Eastern Harbor', description: 'Coastal port city', latitude: 33.75, longitude: 127.25, type: 'city' },
  { id: 'loc-003', name: 'Delta Town', description: 'River delta settlement', latitude: 28.92, longitude: 120.43, type: 'city' },
  { id: 'loc-004', name: 'Mountain View', description: 'City nestled in the western range', latitude: 33.24, longitude: 110.18, type: 'city' },
  { id: 'loc-005', name: 'Central Junction', description: 'Major transportation hub', latitude: 33.48, longitude: 120.54, type: 'city' },
  
  // Landmarks
  { id: 'loc-006', name: 'Victory Bridge', description: 'Historic bridge crossing the northern river', latitude: 32.78, longitude: 120.12, type: 'landmark' },
  { id: 'loc-007', name: 'Old Lighthouse', description: 'Coastal navigation point', latitude: 29.35, longitude: 123.87, type: 'landmark' },
  { id: 'loc-008', name: 'Memorial Tower', description: 'War memorial site', latitude: 33.55, longitude: 120.61, type: 'landmark' },
  { id: 'loc-009', name: 'Grand Dam', description: 'Major hydroelectric facility', latitude: 34.22, longitude: 115.38, type: 'landmark' },
  
  // Military
  { id: 'loc-010', name: 'Alpha Base', description: 'Primary military installation', latitude: 33.65, longitude: 121.05, type: 'military' },
  { id: 'loc-011', name: 'Bravo Outpost', description: 'Forward reconnaissance position', latitude: 32.85, longitude: 118.75, type: 'military' },
  { id: 'loc-012', name: 'Charlie Point', description: 'Coastal defense facility', latitude: 30.45, longitude: 126.35, type: 'military' },
  { id: 'loc-013', name: 'Delta Airfield', description: 'Military air operations base', latitude: 34.15, longitude: 119.25, type: 'military' },
  
  // Terrain Features
  { id: 'loc-014', name: 'Eagle Peak', description: 'Highest mountain in the region', latitude: 35.65, longitude: 112.85, type: 'terrain' },
  { id: 'loc-015', name: 'Blue Lake', description: 'Freshwater reservoir', latitude: 32.25, longitude: 116.45, type: 'terrain' },
  { id: 'loc-016', name: 'Green Valley', description: 'Fertile agricultural region', latitude: 31.75, longitude: 122.15, type: 'terrain' },
  { id: 'loc-017', name: 'Desert Flats', description: 'Arid region in the west', latitude: 30.35, longitude: 105.75, type: 'terrain' }
];

/**
 * Search locations by name or description
 * @param query The search query
 * @returns Array of matching locations
 */
export const searchLocations = (query: string): Location[] => {
  if (!query.trim()) return [];
  
  const lowerCaseQuery = query.toLowerCase();
  
  return LOCATIONS.filter(location => 
    location.name.toLowerCase().includes(lowerCaseQuery) ||
    (location.description && location.description.toLowerCase().includes(lowerCaseQuery)) ||
    location.type.toLowerCase().includes(lowerCaseQuery)
  );
};

/**
 * Get a location by its ID
 * @param id The location ID
 * @returns The location or undefined if not found
 */
export const getLocationById = (id: string): Location | undefined => {
  return LOCATIONS.find(location => location.id === id);
};

/**
 * Get the nearest location to coordinates
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns The nearest location
 */
export const getNearestLocation = (latitude: number, longitude: number): Location => {
  // Calculate distance using Haversine formula (simplified version)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const latDiff = lat1 - lat2;
    const lonDiff = lon1 - lon2;
    return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
  };
  
  let nearestLocation = LOCATIONS[0];
  let shortestDistance = calculateDistance(latitude, longitude, LOCATIONS[0].latitude, LOCATIONS[0].longitude);
  
  for (let i = 1; i < LOCATIONS.length; i++) {
    const distance = calculateDistance(latitude, longitude, LOCATIONS[i].latitude, LOCATIONS[i].longitude);
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestLocation = LOCATIONS[i];
    }
  }
  
  return nearestLocation;
}; 