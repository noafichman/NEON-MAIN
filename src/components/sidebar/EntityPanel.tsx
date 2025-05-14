import React, { useState } from 'react';
import { X, Shield, Swords, Target } from 'lucide-react';
import { MilitaryEntity, Mission } from '../../types/entities';
import mockMissions from '../../data/mockMissions';
import { createSymbol } from '../../utils/symbolUtils';

interface EntityPanelProps {
  entities: MilitaryEntity[];
  visible: boolean;
  onClose: () => void;
  onEntitySelect: (entity: MilitaryEntity) => void;
}

type TabType = 'blue' | 'red' | 'missions';

const EntityPanel: React.FC<EntityPanelProps> = ({ entities, visible, onClose, onEntitySelect }) => {
  const [activeTab, setActiveTab] = useState<TabType>('blue');

  const iliation = (sidc: string): 'friendly' | 'hostile' | 'unknown' => {
    const code = sidc.charAt(1);
    if (code === 'F') return 'friendly';
    if (code === 'H') return 'hostile';
    return 'unknown';
  };

  const filteredEntities = entities.filter(entity => {
    const affiliation = iliation(entity.sidc);
    if (activeTab === 'blue') return affiliation === 'friendly';
    if (activeTab === 'red') return affiliation === 'hostile';
    return false;
  });

  if (!visible) return null;

  return (
    <div className="absolute top-4 left-4 w-80 h-[calc(100%-2rem)] bg-gray-900/40 backdrop-blur-sm rounded-lg border border-gray-800/30 shadow-lg z-20 animate-slideIn">
      <div className="flex items-center justify-between border-b border-gray-800/30 rounded-t-lg overflow-hidden">
        <div className="flex-1 flex">
          <button
            className={`flex-1 p-4 flex items-center justify-center transition-colors ${
              activeTab === 'blue' ? 'bg-blue-500/10 text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:bg-gray-800/30'
            }`}
            onClick={() => setActiveTab('blue')}
            title="Blue Force"
          >
            <Shield size={20} />
          </button>
          <button
            className={`flex-1 p-4 flex items-center justify-center transition-colors ${
              activeTab === 'red' ? 'bg-red-500/10 text-red-400 border-b-2 border-red-400' : 'text-gray-400 hover:bg-gray-800/30'
            }`}
            onClick={() => setActiveTab('red')}
            title="Red Force"
          >
            <Swords size={20} />
          </button>
          <button
            className={`flex-1 p-4 flex items-center justify-center transition-colors ${
              activeTab === 'missions' ? 'bg-gray-800/30 text-white border-b-2 border-white' : 'text-gray-400 hover:bg-gray-800/30'
            }`}
            onClick={() => setActiveTab('missions')}
            title="Missions"
          >
            <Target size={20} />
          </button>
        </div>
        <button 
          onClick={onClose} 
          className="p-4 text-gray-400 hover:bg-gray-800/30 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {(activeTab === 'blue' || activeTab === 'red') && (
        <div className="overflow-y-auto h-[calc(100%-56px)] rounded-b-lg">
          {filteredEntities.map(entity => (
            <button
              key={entity.id}
              onClick={() => onEntitySelect(entity)}
              className="w-full p-3 text-left hover:bg-gray-800/30 transition-colors border-b border-gray-800/30"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ 
                    __html: createSymbol(entity.sidc, { size: 25 }) 
                  }} 
                />
                <div>
                  <div className="font-medium text-sm">{entity.name}</div>
                  <div className="mt-1 text-xs text-gray-400">{entity.status}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeTab === 'missions' && (
        <div className="overflow-y-auto h-[calc(100%-56px)] rounded-b-lg">
          {mockMissions.map(mission => (
            <div key={mission.id} className="p-4 border-b border-gray-800/30">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">{mission.name}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    mission.status === 'Active'
                      ? 'bg-green-900/30 text-green-400'
                      : mission.status === 'Planned'
                      ? 'bg-blue-900/30 text-blue-400'
                      : 'bg-gray-800/30 text-gray-400'
                  }`}
                >
                  {mission.status}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                <div>Type: {mission.type}</div>
                <div>Start: {new Date(mission.startTime).toLocaleString()}</div>
                <div>End: {new Date(mission.endTime).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EntityPanel;