import { useState, useEffect } from 'react';

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  locationName: string;
  loading: boolean;
  error: string | null;
}

interface WeatherParams {
  latitude?: number | null;
  longitude?: number | null;
}

// Mock data for demonstration purposes
const MOCK_WEATHER_CONDITIONS = [
  { condition: 'Clear', icon: '☀️', temp: { min: 20, max: 35 } },
  { condition: 'Cloudy', icon: '☁️', temp: { min: 15, max: 30 } },
  { condition: 'Partly Cloudy', icon: '⛅', temp: { min: 18, max: 32 } },
  { condition: 'Rainy', icon: '🌧️', temp: { min: 10, max: 25 } },
  { condition: 'Thunderstorm', icon: '⛈️', temp: { min: 8, max: 22 } },
  { condition: 'Snowy', icon: '❄️', temp: { min: -5, max: 5 } },
  { condition: 'Windy', icon: '💨', temp: { min: 12, max: 28 } },
  { condition: 'Foggy', icon: '🌫️', temp: { min: 10, max: 20 } }
];

// Mock location names for different coordinate ranges
const MOCK_LOCATIONS = [
  { name: 'Northwind Valley', minLat: 30, maxLat: 35, minLng: 115, maxLng: 125 },
  { name: 'Eastern Plains', minLat: 32, maxLat: 38, minLng: 125, maxLng: 135 },
  { name: 'Southern Delta', minLat: 25, maxLat: 30, minLng: 115, maxLng: 125 },
  { name: 'Western Mountains', minLat: 30, maxLat: 35, minLng: 105, maxLng: 115 },
  { name: 'Central Heights', minLat: 32, maxLat: 36, minLng: 118, maxLng: 123 },
  { name: 'Coastal Region', minLat: 28, maxLat: 33, minLng: 120, maxLng: 130 },
  { name: 'Highland Territory', minLat: 35, maxLat: 40, minLng: 110, maxLng: 120 },
  { name: 'Desert Area', minLat: 25, maxLat: 35, minLng: 100, maxLng: 110 }
];

// Get location name from coordinates
const getLocationName = (lat: number, lng: number): string => {
  for (const location of MOCK_LOCATIONS) {
    if (
      lat >= location.minLat && 
      lat <= location.maxLat && 
      lng >= location.minLng && 
      lng <= location.maxLng
    ) {
      return location.name;
    }
  }
  
  // If no match, generate name based on coordinates
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `Region ${Math.abs(Math.round(lat))}°${latDir} ${Math.abs(Math.round(lng))}°${lngDir}`;
};

// In a real application, we would fetch from a weather API like OpenWeatherMap or Weather API
// For this demo, we'll use mock data that changes based on coordinates
const useWeather = ({ latitude, longitude }: WeatherParams): WeatherData => {
  const [weatherData, setWeatherData] = useState<WeatherData>({
    temperature: 0,
    condition: '',
    humidity: 0,
    windSpeed: 0,
    icon: '',
    locationName: '',
    loading: true,
    error: null
  });

  useEffect(() => {
    // Only fetch if we have coordinates
    if (!latitude || !longitude) {
      setWeatherData(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchWeather = async () => {
      setWeatherData(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        // In a real application, we would make an API call here
        // For demo purposes, generate mock data based on coordinates
        
        // Get location name
        const locationName = getLocationName(latitude, longitude);
        
        // Use coordinates to select random but consistent weather data
        const coordSum = Math.abs(latitude + longitude);
        const seedValue = coordSum % 80; // Create a pseudorandom seed
        
        const weatherIndex = Math.floor(seedValue % MOCK_WEATHER_CONDITIONS.length);
        const weather = MOCK_WEATHER_CONDITIONS[weatherIndex];
        
        // Generate temp within range based on condition
        const tempRange = weather.temp.max - weather.temp.min;
        const tempOffset = (seedValue / 80) * tempRange;
        const temperature = Math.round(weather.temp.min + tempOffset);
        
        // Generate humidity (30-90%)
        const humidity = Math.round(30 + (seedValue % 60));
        
        // Generate wind speed (0-30 km/h)
        const windSpeed = Math.round((seedValue % 30) * 10) / 10;

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setWeatherData({
          temperature,
          condition: weather.condition,
          humidity,
          windSpeed,
          icon: weather.icon,
          locationName,
          loading: false,
          error: null
        });
      } catch (error) {
        setWeatherData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to fetch weather data'
        }));
      }
    };

    fetchWeather();
    
    // Set up interval to refresh weather every 10 minutes
    const intervalId = setInterval(fetchWeather, 10 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [latitude, longitude]);

  return weatherData;
};

export default useWeather; 