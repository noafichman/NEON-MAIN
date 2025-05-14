import React from 'react';
import { Square, Circle, Map, MapPin, Triangle, ArrowRight } from 'lucide-react';

interface ShapesMenuProps {
  position: { x: number; y: number };
  onSelect: (type: string) => void;
  onClose: () => void;
}

interface ShapeOption {
  type: string;
  name: string;
  icon: React.ReactNode;
}

const ShapesMenu: React.FC<ShapesMenuProps> = ({ position, onSelect, onClose }) => {
  const shapeOptions: ShapeOption[] = [
    { type: 'point', name: 'Point', icon: <MapPin size={16} /> },
    { type: 'polyline', name: 'Polyline', icon: <Map size={16} /> },
    { type: 'polygon', name: 'Polygon', icon: <Triangle size={16} /> },
    { type: 'circle', name: 'Circle', icon: <Circle size={16} /> },
    { type: 'rectangle', name: 'Rectangle', icon: <Square size={16} /> },
    { type: 'arrow', name: 'Arrow', icon: <ArrowRight size={16} /> },
  ];

  // Handle click outside to close the menu
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.shapes-menu')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      className="shapes-menu absolute z-50 w-48 bg-gray-900/90 backdrop-blur-sm border border-gray-800/50 rounded-lg overflow-hidden shadow-lg"
      style={{ 
        left: position.x, 
        top: position.y 
      }}
    >
      <div className="p-2 bg-gray-800/50 border-b border-gray-700/50">
        <h3 className="text-sm font-medium text-gray-200">Add Map Shape</h3>
      </div>
      <ul>
        {shapeOptions.map((option) => (
          <li key={option.type}>
            <button
              className="w-full px-3 py-2 flex items-center gap-2 text-gray-300 hover:bg-gray-800/70 hover:text-white transition-colors"
              onClick={() => onSelect(option.type)}
            >
              <span className="text-gray-400">{option.icon}</span>
              <span className="text-sm">{option.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ShapesMenu; 