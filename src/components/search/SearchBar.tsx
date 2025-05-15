import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, MapPin, Users, PenTool, Navigation, Globe, Loader } from 'lucide-react';
import { MilitaryEntity } from '../../types/entities';
import { MapShape } from '../../types/shapes';
import { searchLocations, Location } from '../../utils/locationService';
import useGeocoding, { GeocodingResult } from '../../hooks/useGeocoding';

interface SearchResult {
  id: string;
  name: string;
  type: 'entity' | 'shape' | 'location' | 'geocoded';
  category?: string;
  originalObject: MilitaryEntity | MapShape | Location | GeocodingResult;
}

interface SearchBarProps {
  entities: MilitaryEntity[];
  shapes: MapShape[];
  mapCenter?: { lat: number, lng: number };
  onSelectResult: (result: SearchResult) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ entities, shapes, mapCenter, onSelectResult }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [localResults, setLocalResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const searchIdRef = useRef<number>(0);
  
  // Use geocoding hook for real-world location search
  const { results: geocodingResults, loading: geocodingLoading, error: geocodingError } = useGeocoding({
    query: searchTerm,
    limit: 5,
    proximity: mapCenter ? { longitude: mapCenter.lng, latitude: mapCenter.lat } : undefined
  });

  // When geocoding results change, update our search results
  useEffect(() => {
    if (geocodingResults.length > 0) {
      const geocodedSearchResults = geocodingResults.map(result => ({
        id: `geo-${result.id}`,
        name: result.name,
        type: 'geocoded' as const,
        category: result.placeType,
        originalObject: result
      }));
      
      // Update results, preserving local results
      setResults(prevResults => {
        // Filter out any previous geocoded results
        const filteredResults = prevResults.filter(r => r.type !== 'geocoded');
        // Add new geocoded results
        return [...filteredResults, ...geocodedSearchResults];
      });
    }
  }, [geocodingResults]);

  // Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setSearchTerm('');
        setResults([]);
        setLocalResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Search in local data (entities, shapes, locations)
  const searchLocal = useCallback(() => {
    if (!searchTerm.trim()) {
      setLocalResults([]);
      return;
    }

    const lowerCaseTerm = searchTerm.toLowerCase();
    
    // Search in entities
    const entityResults = entities
      .filter(entity => 
        entity.name.toLowerCase().includes(lowerCaseTerm) || 
        entity.status.toLowerCase().includes(lowerCaseTerm) || 
        entity.threatLevel.toLowerCase().includes(lowerCaseTerm) ||
        entity.sidc.toLowerCase().includes(lowerCaseTerm)
      )
      .map(entity => ({
        id: entity.id,
        name: entity.name,
        type: 'entity' as const,
        category: entity.status,
        originalObject: entity
      }));
    
    // Search in shapes
    const shapeResults = shapes
      .filter(shape => 
        shape.name.toLowerCase().includes(lowerCaseTerm) || 
        shape.type.toLowerCase().includes(lowerCaseTerm) ||
        (shape.description && shape.description.toLowerCase().includes(lowerCaseTerm))
      )
      .map(shape => ({
        id: shape.id,
        name: shape.name,
        type: 'shape' as const,
        category: shape.type,
        originalObject: shape
      }));
    
    // Search in mock locations
    const locationResults = searchLocations(searchTerm)
      .map(location => ({
        id: location.id,
        name: location.name,
        type: 'location' as const,
        category: location.type,
        originalObject: location
      }));
    
    setLocalResults([...locationResults, ...entityResults, ...shapeResults]);
  }, [searchTerm, entities, shapes]);

  // Combined effect to handle both local and geocoding results
  useEffect(() => {
    // Clear results if search term is empty
    if (!searchTerm.trim()) {
      setResults([]);
      setLocalResults([]);
      return;
    }
    
    // Perform local search
    searchLocal();
    
    // Create a unique ID for this search request
    const currentSearchId = ++searchIdRef.current;
    
  }, [searchTerm, searchLocal]);

  // Separate effect to update results when local results change
  useEffect(() => {
    if (!searchTerm.trim()) return;
    
    setResults(prevResults => {
      // Keep any existing geocoded results, remove old local results
      const geocodedResults = prevResults.filter(r => r.type === 'geocoded');
      return [...localResults, ...geocodedResults];
    });
  }, [localResults, searchTerm]);

  const toggleSearch = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchTerm('');
      setResults([]);
      setLocalResults([]);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setLocalResults([]);
    inputRef.current?.focus();
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelectResult(result);
    setIsExpanded(false);
    setSearchTerm('');
    setResults([]);
    setLocalResults([]);
  };

  const renderIcon = (result: SearchResult) => {
    if (result.type === 'entity') {
      return <Users size={16} className="text-blue-400" />;
    } else if (result.type === 'shape') {
      return <PenTool size={16} className="text-orange-400" />;
    } else if (result.type === 'location') {
      return <Navigation size={16} className="text-green-400" />;
    } else if (result.type === 'geocoded') {
      return <Globe size={16} className="text-purple-400" />;
    }
    return <MapPin size={16} />;
  };

  // Helper function to format place type into a user-friendly string
  const formatPlaceType = (placeType: string | undefined): string => {
    if (!placeType) return 'Location';
    
    // Map Mapbox place types to more user-friendly labels
    switch (placeType) {
      case 'country': return 'Country';
      case 'region': return 'Region/State';
      case 'district': return 'District';
      case 'place': return 'City';
      case 'locality': return 'Locality';
      case 'neighborhood': return 'Neighborhood';
      case 'address': return 'Address';
      case 'poi': return 'Point of Interest';
      case 'postcode': return 'Postal Code';
      default: return placeType.charAt(0).toUpperCase() + placeType.slice(1);
    }
  };

  // Helper to render a group of results with a category title
  const renderResultGroup = (title: string, groupResults: SearchResult[]) => {
    if (groupResults.length === 0) return null;
    
    return (
      <div key={title}>
        <div className="px-3 py-1 bg-gray-800/50 text-xs font-medium text-gray-300">
          {title}
        </div>
        {groupResults.map((result) => (
          <div
            key={`${result.type}-${result.id}`}
            className="px-3 py-2 hover:bg-gray-800/50 cursor-pointer flex items-center"
            onClick={() => handleSelectResult(result)}
          >
            <div className="mr-2">
              {renderIcon(result)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-200 truncate flex items-center">
                <span className="truncate">{result.name}</span>
                {result.type === 'geocoded' && (
                  <span className={`ml-1 text-xs px-1.5 py-0.5 rounded ${getPlaceTypeBadgeColor(result.category)}`}>
                    {formatPlaceTypeShort(result.category)}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {result.type === 'location' 
                  ? `${result.category} - ${(result.originalObject as Location).description}`
                  : result.type === 'geocoded'
                    ? formatGeocodedDisplayName(result.originalObject as GeocodingResult)
                    : result.category}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Format the display name for geocoded results to be more concise and clear
  const formatGeocodedDisplayName = (result: GeocodingResult): string => {
    // For city results, don't repeat the city name that's already in the title
    if (result.placeType === 'place') {
      const parts = result.displayName.split(',');
      if (parts.length > 1) {
        // Remove the first part (city name) as it's already displayed as the title
        return parts.slice(1).join(',').trim();
      }
    }
    
    // For countries, just show the country name
    if (result.placeType === 'country') {
      return result.name;
    }
    
    // For everything else, show the full display name
    return result.displayName;
  };

  // Format place type to a shorter version for badges
  const formatPlaceTypeShort = (placeType: string | undefined): string => {
    if (!placeType) return 'LOC';
    
    switch (placeType) {
      case 'country': return 'Country';
      case 'region': return 'Region';
      case 'district': return 'District';
      case 'place': return 'City';
      case 'locality': return 'Area';
      case 'neighborhood': return 'Nbrhd';
      case 'address': return 'Address';
      case 'poi': return 'POI';
      case 'postcode': return 'Post';
      default: return placeType.substring(0, 4);
    }
  };
  
  // Get badge color based on place type
  const getPlaceTypeBadgeColor = (placeType: string | undefined): string => {
    if (!placeType) return 'bg-gray-700 text-gray-300';
    
    switch (placeType) {
      case 'country': return 'bg-purple-800/50 text-purple-200';
      case 'region': return 'bg-indigo-800/50 text-indigo-200';
      case 'district': return 'bg-blue-800/50 text-blue-200';
      case 'place': return 'bg-green-800/50 text-green-200';
      case 'locality': return 'bg-yellow-800/50 text-yellow-200';
      case 'neighborhood': return 'bg-orange-800/50 text-orange-200';
      case 'address': return 'bg-red-800/50 text-red-200';
      case 'poi': return 'bg-pink-800/50 text-pink-200';
      default: return 'bg-gray-700/50 text-gray-300';
    }
  };

  return (
    <div ref={searchBarRef} className="relative z-50">
      <div className={`flex items-center bg-gray-900/40 backdrop-blur-sm rounded-lg border border-gray-800/30 overflow-hidden transition-all duration-300 ${isExpanded ? 'w-64' : 'w-8'}`}>
        <button 
          onClick={toggleSearch}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
          aria-label="Search"
        >
          <Search size={16} />
        </button>
        
        {isExpanded && (
          <>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for any place in the world..."
              className="flex-1 bg-transparent border-none text-sm text-gray-200 focus:outline-none px-2"
            />
            {searchTerm && (
              <button 
                onClick={clearSearch}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-200"
              >
                <X size={16} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Results dropdown */}
      {isExpanded && (
        <div className="absolute left-0 top-full mt-1 w-80 bg-gray-900/90 backdrop-blur-sm border border-gray-800/30 rounded-lg overflow-hidden">
          {/* Loading indicator */}
          {geocodingLoading && (
            <div className="flex items-center justify-center p-3 text-gray-400">
              <Loader size={16} className="animate-spin mr-2" />
              <span className="text-sm">Searching locations...</span>
            </div>
          )}
          
          {/* Error message */}
          {geocodingError && (
            <div className="p-3 text-red-400 text-sm">
              Error searching locations. Try again.
            </div>
          )}
          
          {/* Results display */}
          <div className="max-h-60 overflow-y-auto">
            {/* Military Entities */}
            {renderResultGroup('Military Entities', results.filter(r => r.type === 'entity'))}
            
            {/* Map Shapes */}
            {renderResultGroup('Map Shapes', results.filter(r => r.type === 'shape'))}
            
            {/* System Locations */}
            {renderResultGroup('System Locations', results.filter(r => r.type === 'location'))}
            
            {/* Places & Locations */}
            {renderResultGroup('Places & Locations', results.filter(r => r.type === 'geocoded'))}
            
            {/* No results message */}
            {searchTerm && !geocodingLoading && results.length === 0 && (
              <div className="p-3 text-sm text-gray-400">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar; 