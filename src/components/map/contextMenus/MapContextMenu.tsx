import React from 'react';
import { MapPin, Plus, Layers, Target, Download } from 'lucide-react';
import { ContextMenuPosition } from '../../../types/contextMenu';

interface MapContextMenuProps {
  position: ContextMenuPosition;
  onClose: () => void;
  onAddManualEntity?: () => void;
}

const MapContextMenu: React.FC<MapContextMenuProps> = ({ position, onClose, onAddManualEntity }) => {
  // Close the menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      className="absolute z-10 bg-gray-900 border border-gray-700 rounded-lg shadow-lg text-gray-200 overflow-hidden"
      style={{ 
        left: position.x, 
        top: position.y,
        minWidth: '200px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2 bg-gray-800 border-b border-gray-700 text-xs font-mono">
        {position.lngLat ? (
          <div className="flex flex-col">
            {/* <span>Lat: {position.lngLat.lat.toFixed(6)}</span>
            <span>Lng: {position.lngLat.lng.toFixed(6)}</span> */}
          </div>
        ) : 'Map Options'}
      </div>
      
      <div className="p-1">
        <MenuItem icon={<MapPin size={16} />} label="Drop Pin" onClick={onClose} />
        <MenuItem icon={<Plus size={16} />} label="Add Entity" onClick={() => { onClose(); onAddManualEntity && onAddManualEntity(); }} />
        <MenuItem icon={<Layers size={16} />} label="Change Layer" onClick={onClose} />
        <MenuItem icon={<Target size={16} />} label="Center Map Here" onClick={onClose} />
        <MenuItem icon={<Download size={16} />} label="Save Location" onClick={onClose} />
      </div>
    </div>
  );
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick }) => {
  return (
    <button 
      className="flex items-center w-full p-2 text-left hover:bg-gray-800 transition-colors rounded"
      onClick={onClick}
    >
      <span className="mr-3 text-cyan-400">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

export default MapContextMenu;