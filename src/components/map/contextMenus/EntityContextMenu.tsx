import React from 'react';
import { ContextMenuPosition } from '../../../types/contextMenu';
import { MilitaryEntity } from '../../../types/entities';
import { Info, Edit, Target, Share2, Trash2, AlertTriangle } from 'lucide-react';

interface EntityContextMenuProps {
  position: ContextMenuPosition;
  entity: MilitaryEntity | null;
  onClose: () => void;
  className?: string;
  onDelete?: (entityId: string) => void;
  onEdit?: (entity: MilitaryEntity) => void;
}

const EntityContextMenu: React.FC<EntityContextMenuProps> = ({ 
  position, 
  entity, 
  onClose, 
  className = '',
  onDelete,
  onEdit
}) => {
  // Close the menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  if (!entity) return null;

  const handleDelete = () => {
    if (entity.isManual && onDelete) {
      console.log(`EntityContextMenu: Deleting entity ${entity.id}`, entity);
      // First close the menu
      onClose();
      // Then perform the delete operation after a small delay
      setTimeout(() => {
        onDelete(entity.id);
      }, 50);
    } else {
      console.log(`EntityContextMenu: Can't delete - isManual: ${entity.isManual}, onDelete available: ${!!onDelete}`);
      onClose();
    }
  };

  const handleEdit = () => {
    if (entity.isManual && onEdit) {
      onEdit(entity);
    }
    onClose();
  };

  return (
    <div 
      className={`absolute z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-lg text-gray-200 overflow-visible ${className}`}
      style={{ 
        left: position.x, 
        top: position.y,
        minWidth: '220px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute -top-10 right-0 px-3 py-1.5 bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg text-sm whitespace-nowrap">
        <span className="text-pink-400">{entity.sidc.substring(0, 6)}</span> {entity.name}
        {entity.isManual && <span className="ml-2 text-blue-400">(Manual)</span>}
      </div>
      
      <div className="p-1">
        <MenuItem icon={<Info size={16} />} label="Details" onClick={onClose} />
        <MenuItem 
          icon={<Edit size={16} />} 
          label="Edit Entity" 
          onClick={handleEdit} 
          disabled={!entity.isManual || !onEdit}
        />
        <MenuItem icon={<Target size={16} />} label="Center on Map" onClick={onClose} />
        <MenuItem icon={<Share2 size={16} />} label="Share Location" onClick={onClose} />
        <MenuItem icon={<AlertTriangle size={16} />} label="Report Issue" onClick={onClose} />
        <MenuItem 
          icon={<Trash2 size={16} />} 
          label="Remove" 
          onClick={handleDelete} 
          className={entity.isManual && onDelete ? "text-red-400" : "text-gray-500"} 
          disabled={!entity.isManual || !onDelete}
        />
      </div>
    </div>
  );
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, className = "", disabled = false }) => {
  return (
    <button 
      className={`flex items-center w-full p-2 text-left transition-colors rounded ${
        disabled 
          ? "opacity-50 cursor-not-allowed" 
          : "hover:bg-gray-800"
      } ${className}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <span className="mr-3 text-cyan-400">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

export default EntityContextMenu;