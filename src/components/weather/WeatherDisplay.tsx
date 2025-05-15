import React from 'react';
import { Cloud, Thermometer, Droplet, Wind, MapPin } from 'lucide-react';
import useWeather from '../../hooks/useWeather';

interface WeatherDisplayProps {
  latitude?: number | null;
  longitude?: number | null;
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ latitude, longitude }) => {
  const { temperature, condition, humidity, windSpeed, icon, locationName, loading, error } = useWeather({ 
    latitude, 
    longitude 
  });

  // Don't render anything if we have no coordinates
  if (!latitude || !longitude) {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center text-gray-400 animate-pulse">
        <Cloud size={14} className="mr-1" />
        <span className="text-xs">Loading...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center text-red-400">
        <Cloud size={14} className="mr-1" />
        <span className="text-xs">Data unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs text-gray-300">
      <div className="flex items-center">
        <MapPin size={14} className="mr-1 text-blue-400" />
        <span className="font-medium">{locationName}</span>
      </div>
      
      <div className="flex items-center">
        <span className="mr-1 text-lg">{icon}</span>
        <span>{condition}</span>
      </div>
      
      <div className="flex items-center text-gray-300">
        <Thermometer size={14} className="mr-1 text-blue-400" />
        <span>{temperature}°C</span>
      </div>
      
      <div className="flex items-center text-gray-300">
        <Droplet size={14} className="mr-1 text-blue-400" />
        <span>{humidity}%</span>
      </div>
      
      <div className="flex items-center text-gray-300">
        <Wind size={14} className="mr-1 text-blue-400" />
        <span>{windSpeed} km/h</span>
      </div>
    </div>
  );
};

export default WeatherDisplay; 