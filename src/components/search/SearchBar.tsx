import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Users, PenTool } from 'lucide-react';
import { MilitaryEntity } from '../../types/entities';
import { MapShape } from '../../types/shapes';

interface SearchResult {
  id: string;
  name: string;
  type: 'entity' | 'shape';
  category?: string;
  originalObject: MilitaryEntity | MapShape;
}

interface SearchBarProps {
  entities: MilitaryEntity[];
  shapes: MapShape[];
  onSelectResult: (result: SearchResult) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ entities, shapes, onSelectResult }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setSearchTerm('');
        setResults([]);
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

  // Handle search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
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
    
    setResults([...entityResults, ...shapeResults]);
  }, [searchTerm, entities, shapes]);

  const toggleSearch = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchTerm('');
      setResults([]);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    inputRef.current?.focus();
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelectResult(result);
    setIsExpanded(false);
    setSearchTerm('');
    setResults([]);
  };

  const renderIcon = (result: SearchResult) => {
    if (result.type === 'entity') {
      return <Users size={16} className="text-blue-400" />;
    } else if (result.type === 'shape') {
      return <PenTool size={16} className="text-orange-400" />;
    }
    return <MapPin size={16} />;
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
              placeholder="Search objects..."
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
      {isExpanded && results.length > 0 && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-gray-900/90 backdrop-blur-sm border border-gray-800/30 rounded-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {results.map((result) => (
              <div
                key={`${result.type}-${result.id}`}
                className="px-3 py-2 hover:bg-gray-800/50 cursor-pointer flex items-center"
                onClick={() => handleSelectResult(result)}
              >
                <div className="mr-2">
                  {renderIcon(result)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 truncate">{result.name}</div>
                  <div className="text-xs text-gray-400 truncate">{result.category}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No results message */}
      {isExpanded && searchTerm && results.length === 0 && (
        <div className="absolute left-0 top-full mt-1 w-64 p-3 bg-gray-900/90 backdrop-blur-sm border border-gray-800/30 rounded-lg text-sm text-gray-400">
          No results found
        </div>
      )}
    </div>
  );
};

export default SearchBar; 