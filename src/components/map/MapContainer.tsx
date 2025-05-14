import React, { useState, useRef, useCallback } from 'react';
import Map, { MapRef, Marker } from 'react-map-gl';
import { useContextMenu } from '../../hooks/useContextMenu';
import MapContextMenu from './contextMenus/MapContextMenu';
import EntityContextMenu from './contextMenus/EntityContextMenu';
import EntityMarker from './entities/EntityMarker';
import EntityInfo from './entities/EntityInfo';
import EntityPanel from '../sidebar/EntityPanel';
import { useMilitaryEntities } from '../../hooks/useMilitaryEntities';
import { MilitaryEntity } from '../../types/entities';

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
  const { entities } = useMilitaryEntities();
  
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