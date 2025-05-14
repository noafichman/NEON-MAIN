import React from 'react';
import { ContextMenuPosition } from '../../../types/contextMenu';
import { MilitaryEntity } from '../../../types/entities';
import { Info, Edit, Target, Share2, Trash2, AlertTriangle } from 'lucide-react';

interface EntityContextMenuProps {
  position: ContextMenuPosition;
  entity: MilitaryEntity | null;
  onClose: () => void;
}

const EntityContextMenu: React.FC<EntityContextMenuProps> = ({ position, entity, onClose }) => {
  // Close the menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  if (!entity) return null;

  return (
    <div 
      className="absolute z-10 bg-gray-900 border border-gray-700 rounded-lg shadow-lg text-gray-200 overflow-hidden"
      style={{ 
        left: position.x, 
        top: position.y,
        minWidth: '220px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2 bg-gray-800 border-b border-gray-700 font-medium">
        <span className="text-pink-400">{entity.sidc.substring(0, 6)}</span> {entity.name}
      </div>
      
      <div className="p-1">
        <MenuItem icon={<Info size={16} />} label="Details" onClick={onClose} />
        <MenuItem icon={<Edit size={16} />} label="Edit Entity" onClick={onClose} />
        <MenuItem icon={<Target size={16} />} label="Center on Map" onClick={onClose} />
        <MenuItem icon={<Share2 size={16} />} label="Share Location" onClick={onClose} />
        <MenuItem icon={<AlertTriangle size={16} />} label="Report Issue" onClick={onClose} />
        <MenuItem icon={<Trash2 size={16} />} label="Remove" onClick={onClose} className="text-red-400" />
      </div>
    </div>
  );
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, className = "" }) => {
  return (
    <button 
      className={`flex items-center w-full p-2 text-left hover:bg-gray-800 transition-colors rounded ${className}`}
      onClick={onClick}
    >
      <span className="mr-3 text-cyan-400">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

export default EntityContextMenu;