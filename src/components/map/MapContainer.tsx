import React, { useState, useRef, useCallback, useEffect } from 'react';
import Map, { MapRef, Marker } from 'react-map-gl';
import { useContextMenu } from '../../hooks/useContextMenu';
import MapContextMenu from './contextMenus/MapContextMenu';
import EntityContextMenu from './contextMenus/EntityContextMenu';
import EntityMarker from './entities/EntityMarker';
import EntityInfo from './entities/EntityInfo';
import EntityPanel from '../sidebar/EntityPanel';
import { useMilitaryEntities } from '../../hooks/useMilitaryEntities';
import { MilitaryEntity } from '../../types/entities';
import { Search, Wifi, Bell, Menu, Settings, MessageSquare, Calendar, Clock, Video, Image, FileText } from 'lucide-react';
import AlertPanel from '../alerts/AlertPanel';
import LastAlertsPanel from '../alerts/LastAlertsPanel';

// Default map settings
const INITIAL_VIEW_STATE = {
  longitude: 121.285,
  latitude: 31.70,
  zoom: 14
};

interface MapContainerProps {
  isPanelVisible: boolean;
  setIsPanelVisible: (visible: boolean) => void;
}

const MapContainer: React.FC<MapContainerProps> = ({ isPanelVisible, setIsPanelVisible }) => {
  const mapRef = useRef<MapRef>(null);
  const { entities, alerts, dismissAlert } = useMilitaryEntities();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLastAlerts, setShowLastAlerts] = useState(false);
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // State for selected entity and info display
  const [selectedEntity, setSelectedEntity] = useState<MilitaryEntity | null>(null);
  
  // Map context menu
  const { 
    visible: mapContextVisible, 
    position: mapContextPosition,
    showMenu: showMapContext,
    hideMenu: hideMapContext
  } = useContextMenu();
  
  // Entity context menu
  const { 
    visible: entityContextVisible, 
    position: entityContextPosition,
    showMenu: showEntityContext,
    hideMenu: hideEntityContext
  } = useContextMenu();
  
  // Handler for map click
  const handleMapClick = useCallback((e: any) => {
    // Hide any open context menus
    hideMapContext();
    hideEntityContext();
    
    // Deselect entity if clicking elsewhere
    setSelectedEntity(null);
    
    // Show map context menu on right-click
    if (e.originalEvent.button === 2) {
      showMapContext({
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY
        // lngLat: e.lngLat
      });
    }
  }, [hideMapContext, hideEntityContext, showMapContext]);
  
  // Handler for entity click
  const handleEntityClick = useCallback((entity: MilitaryEntity, e: React.MouseEvent) => {
    e.stopPropagation();
    hideMapContext();
    
    // Select entity on left-click
    if (e.button === 0) {
      setSelectedEntity(entity);
      hideEntityContext();
    } 
    // Show entity context menu on right-click
    else if (e.button === 2) {
      setSelectedEntity(entity);
      showEntityContext({
        x: e.clientX,
        y: e.clientY,
        entity
      });
    }
  }, [hideMapContext, hideEntityContext, showEntityContext]);
  
  // Prevent default context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="h-full w-full relative" onContextMenu={handleContextMenu}>
      {/* Status Header */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-4 px-4 py-2 bg-gray-900/40 backdrop-blur-sm border border-gray-800/30 rounded-lg">
        <button className="text-gray-400 hover:text-white transition-colors">
          <Search size={16} />
        </button>
        <button className="text-green-400 hover:text-green-300 transition-colors">
          <Wifi size={16} />
        </button>
        <div className="text-gray-400 font-medium text-sm">
          {currentTime.toLocaleTimeString()}
        </div>
        <button 
          onClick={() => setShowLastAlerts(!showLastAlerts)}
          className="text-gray-400 hover:text-white transition-colors relative"
          title={`${alerts.length} new hostile entities`}
        >
          <Bell size={16} />
          {alerts.length > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] font-medium text-white">{alerts.length}</span>
            </div>
          )}
        </button>
      </div>

      {/* Alert Panels */}
      <AlertPanel alerts={alerts} onDismiss={dismissAlert} />
      <LastAlertsPanel 
        alerts={alerts} 
        visible={showLastAlerts} 
        onClose={() => setShowLastAlerts(false)} 
      />

      {/* Bottom Action Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-gray-900/40 backdrop-blur-sm border border-gray-800/30 rounded-lg">
        <button 
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
          onClick={() => setIsPanelVisible(!isPanelVisible)}
        >
          <Menu size={18} />
        </button>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors">
          <Settings size={18} />
        </button>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors">
          <MessageSquare size={18} />
        </button>
        <div className="w-px h-6 bg-white/10"></div>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors">
          <Calendar size={18} />
        </button>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors">
          <Clock size={18} />
        </button>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors">
          <Video size={18} />
        </button>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors">
          <Image size={18} />
        </button>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors">
          <FileText size={18} />
        </button>
      </div>

      <Map
        ref={mapRef}
        mapboxAccessToken="pk.eyJ1IjoiYW10cnRtIiwiYSI6ImNsd2wzeWNlcDFnc2gycXBmaWoweGx5a3oifQ.thuFRVzuZiyk9xuPI173PA"
        initialViewState={INITIAL_VIEW_STATE}
        // mapStyle="mapbox://styles/mapbox/dark-v11"
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        onClick={handleMapClick}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Render all entities as markers */}
        {entities.map(entity => (
          <Marker
            key={entity.id}
            longitude={entity.position.longitude}
            latitude={entity.position.latitude}
            anchor="center"
          >
            <EntityMarker 
              entity={entity} 
              onClick={(e) => handleEntityClick(entity, e)}
              isSelected={selectedEntity?.id === entity.id}
            />
          </Marker>
        ))}
      </Map>
      
      {/* Entity Panel */}
      <EntityPanel
        entities={entities}
        visible={isPanelVisible}
        onClose={() => setIsPanelVisible(false)}
        onEntitySelect={(entity) => {
          setSelectedEntity(entity);
          mapRef.current?.flyTo({
            center: [entity.position.longitude, entity.position.latitude],
            zoom: 8,
            duration: 2000
          });
        }}
        onContextMenu={(entity, e) => {
          e.preventDefault();
          e.stopPropagation();
          setSelectedEntity(entity);
          showEntityContext({
            x: e.clientX - 20, // Offset left to align with the menu icon
            y: e.clientY - 140, // Increased offset to account for floating header
            entity
          });
        }}
      />
      
      {/* Context Menus */}
      {mapContextVisible && (
        <MapContextMenu 
          position={mapContextPosition} 
          onClose={hideMapContext}
        />
      )}
      
      {entityContextVisible && (
        <EntityContextMenu 
          position={entityContextPosition} 
          entity={selectedEntity}
          onClose={hideEntityContext}
          className="z-30"
        />
      )}
      
      {/* Entity Info Panel */}
      {selectedEntity && !entityContextVisible && (
        <EntityInfo 
          entity={selectedEntity}
          onClose={() => setSelectedEntity(null)}
        />
      )}
    </div>
  );
};

export default MapContainer;