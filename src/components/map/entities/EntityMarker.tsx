import React, { useMemo } from 'react';
import { MilitaryEntity } from '../../../types/entities';
import { createSymbol } from '../../../utils/symbolUtils';

interface EntityMarkerProps {
  entity: MilitaryEntity;
  onClick: (e: React.MouseEvent) => void;
  isSelected: boolean;
}

const EntityMarker: React.FC<EntityMarkerProps> = ({ entity, onClick, isSelected }) => {
  // Create the military symbol
  const symbolHtml = useMemo(() => {
    return createSymbol(entity.sidc, {
      size: isSelected ? 40 : 35,
      uniqueDesignation: entity.name
    });
  }, [entity.sidc, entity.name, isSelected]);
  
  return (
    <div 
      onClick={onClick}
      onMouseDown={onClick} // For right-click support
      className={`
        cursor-pointer 
        transition-all 
        duration-300 
        transform 
        ${isSelected ? 'scale-110' : 'scale-100'}
      `}
      style={{
        filter: isSelected ? 'drop-shadow(0 0 8px rgba(49, 225, 247, 0.8))' : 'none'
      }}
      dangerouslySetInnerHTML={{ __html: symbolHtml }}
    />
  );
};

export default EntityMarker;