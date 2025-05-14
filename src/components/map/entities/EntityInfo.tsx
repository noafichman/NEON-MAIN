import React from 'react';
import { X, ChevronRight, Clock, MapPin, Flag, Shield } from 'lucide-react';
import { MilitaryEntity } from '../../../types/entities';
import { getSymbolInfo } from '../../../utils/symbolUtils';

interface EntityInfoProps {
  entity: MilitaryEntity;
  onClose: () => void;
}

const EntityInfo: React.FC<EntityInfoProps> = ({ entity, onClose }) => {
  const symbolInfo = getSymbolInfo(entity.sidc);
  
  return (
    <div 
      className="absolute bottom-6 right-6 bg-gray-900 border border-gray-700 rounded-lg shadow-lg text-gray-200 overflow-hidden w-80 animate-slideIn"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <h3 className="font-semibold">{entity.name}</h3>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded-full transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex items-start">
          <div className="mr-4" dangerouslySetInnerHTML={{ __html: symbolInfo.symbolHtml }} />
          
          <div className="flex-1">
            <h4 className="font-medium text-cyan-400">{symbolInfo.affiliation} {symbolInfo.echelon}</h4>
            <p className="text-sm text-gray-400">{symbolInfo.description}</p>
          </div>
        </div>
        
        <div className="mt-4 space-y-2 text-sm">
          <InfoRow icon={<Clock size={16} />} label="Last Update" value={entity.lastUpdate} />
          <InfoRow 
            icon={<MapPin size={16} />} 
            label="Position" 
            value={`${entity.position.latitude.toFixed(6)}, ${entity.position.longitude.toFixed(6)}`} 
          />
          <InfoRow icon={<Flag size={16} />} label="Status" value={entity.status} />
          <InfoRow icon={<Shield size={16} />} label="Threat Level" value={entity.threatLevel} />
        </div>
        
        <button className="flex items-center justify-center w-full mt-4 p-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors text-sm font-medium">
          View Details <ChevronRight size={16} className="ml-1" />
        </button>
      </div>
    </div>
  );
};

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
  return (
    <div className="flex items-center">
      <span className="text-cyan-400 mr-2">{icon}</span>
      <span className="text-gray-400 mr-2">{label}:</span>
      <span className="ml-auto">{value}</span>
    </div>
  );
};

export default EntityInfo;