import React, { useState } from 'react';
import { X, Shield, Swords, Target, MoreVertical } from 'lucide-react';
import { Mission } from '../../types/entities';
import mockMissions from '../../data/mockMissions';
import { createSymbol } from '../../utils/symbolUtils';

interface MilitaryEntity {
  id: string;
  name: string;
  status: string;
  sidc: string;
  position: {
    latitude: number;
    longitude: number;
  };
  threatLevel: string;
  lastUpdate: string;
}

interface EntityPanelProps {
  entities: MilitaryEntity[];
  visible: boolean;
  onClose: () => void;
  onEntitySelect: (entity: MilitaryEntity) => void;
  onContextMenu: (entity: MilitaryEntity, event: React.MouseEvent) => void;
}

type TabType = 'blue' | 'red' | 'missions';

const EntityPanel: React.FC<EntityPanelProps> = ({ entities, visible, onClose, onEntitySelect, onContextMenu }) => {
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
      <div className="flex items-center justify-end border-b border-gray-800/30 rounded-t-lg overflow-hidden">
        <div className="flex">
          <button
            className={`p-2 flex items-center justify-center transition-colors ${
              activeTab === 'blue' ? 'bg-blue-500/10 text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:bg-gray-800/30'
            }`}
            onClick={() => setActiveTab('blue')}
            title="Blue Force"
          >
            <Shield size={16} />
          </button>
          <button
            className={`p-2 flex items-center justify-center transition-colors ${
              activeTab === 'red' ? 'bg-red-500/10 text-red-400 border-b-2 border-red-400' : 'text-gray-400 hover:bg-gray-800/30'
            }`}
            onClick={() => setActiveTab('red')}
            title="Red Force"
          >
            <Swords size={16} />
          </button>
          <button
            className={`p-2 flex items-center justify-center transition-colors ${
              activeTab === 'missions' ? 'bg-gray-800/30 text-white border-b-2 border-white' : 'text-gray-400 hover:bg-gray-800/30'
            }`}
            onClick={() => setActiveTab('missions')}
            title="Missions"
          >
            <Target size={16} />
          </button>
        </div>
        <div className="w-px h-6 bg-white/10 mx-2 self-center"></div>
        <button 
          onClick={onClose} 
          className="p-2 text-gray-400 hover:bg-gray-800/30 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {(activeTab === 'blue' || activeTab === 'red') && (
        <div className="overflow-y-auto h-[calc(100%-56px)] rounded-b-lg p-2">
          <div className="h-full bg-black/40 rounded-lg border border-gray-800/30">
            {filteredEntities.map((entity, index) => (
              <button
                key={entity.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onEntitySelect(entity);
                }}
                className={`w-full py-2 px-3 text-left hover:bg-gray-800 transition-colors ${
                  index !== filteredEntities.length - 1 ? 'border-b border-white/10' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 flex items-center justify-center bg-black/50 rounded-md"
                    dangerouslySetInnerHTML={{ 
                      __html: createSymbol(entity.sidc, { size: 24 }) 
                    }} 
                  />
                  <div className="flex-1">
                    <div className="font-medium text-xs text-white">{entity.id}</div>
                    <div className="text-[10px]">
                      <span className="text-gray-400">
                        Position: ({entity.position.latitude.toFixed(2)}, {entity.position.longitude.toFixed(2)}), {new Date(entity.lastUpdate).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onContextMenu(entity, e);
                    }}
                    className="self-center p-1 hover:bg-gray-700/50 rounded-md transition-colors"
                  >
                    <MoreVertical size={14} className="text-gray-400" />
                  </button>
                </div>
              </button>
            ))}
          </div>
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