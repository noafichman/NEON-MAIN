import React, { useState, useRef, useCallback, useEffect } from 'react';
import Map, { MapRef, Marker } from 'react-map-gl';
import { useContextMenu } from '../../hooks/useContextMenu';
import MapContextMenu from './contextMenus/MapContextMenu';
import EntityContextMenu from './contextMenus/EntityContextMenu';
import EntityMarker from './entities/EntityMarker';
import EntityInfo from './entities/EntityInfo';
import EntityPanel from '../sidebar/EntityPanel';
import { useMilitaryEntities } from '../../hooks/useMilitaryEntities';
import { useMapShapes } from '../../hooks/useMapShapes';
import { MilitaryEntity } from '../../types/entities';
import { MapShape, Position } from '../../types/shapes';
import { Search, Wifi, Bell, Menu, Settings, MessageSquare, Calendar, Clock, Video, Image, FileText, PenTool } from 'lucide-react';
import AlertPanel from '../alerts/AlertPanel';
import LastAlertsPanel from '../alerts/LastAlertsPanel';
import ShapesMenu from './shapes/ShapesMenu';
import ShapeForm from './shapes/ShapeForm';
import ShapeRenderer from './shapes/ShapeRenderer';

// Default map settings
const INITIAL_VIEW_STATE = {
  longitude: 120.50,
  latitude: 33.50,
  zoom: 13
};

interface MapContainerProps {
  isPanelVisible: boolean;
  setIsPanelVisible: (visible: boolean) => void;
}

const MapContainer: React.FC<MapContainerProps> = ({ isPanelVisible, setIsPanelVisible }) => {
  const mapRef = useRef<MapRef>(null);
  const { entities, alerts, dismissAlert } = useMilitaryEntities();
  const { shapes, loading: shapesLoading, createShape, updateShape, deleteShape } = useMapShapes();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLastAlerts, setShowLastAlerts] = useState(false);
  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const [shapeType, setShapeType] = useState<string | null>(null);
  const [shapeMenuPosition, setShapeMenuPosition] = useState({ x: 0, y: 0 });
  const [previewShape, setPreviewShape] = useState<MapShape | null>(null);
  const [editingShape, setEditingShape] = useState<MapShape | null>(null);
  
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
    // Don't handle map clicks if we're in shape creation mode
    if (shapeType) return;
    
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
  }, [hideMapContext, hideEntityContext, showMapContext, shapeType]);
  
  // Handler for entity click
  const handleEntityClick = useCallback((entity: MilitaryEntity, e: React.MouseEvent) => {
    // Don't handle entity clicks if we're in shape creation mode
    if (shapeType) return;
    
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
  }, [hideMapContext, hideEntityContext, showEntityContext, shapeType]);
  
  // Prevent default context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Handle shapes button click
  const handleShapesButtonClick = (e: React.MouseEvent) => {
    const buttonRect = e.currentTarget.getBoundingClientRect();
    setShapeMenuPosition({
      x: buttonRect.left,
      y: window.innerHeight - buttonRect.bottom + 10 // Position above the button
    });
    setShowShapesMenu(!showShapesMenu);
  };
  
  // Handle shape type selection
  const handleShapeSelect = (type: string) => {
    setShapeType(type);
    setShowShapesMenu(false);
  };
  
  // Close shape form
  const handleCloseShapeForm = () => {
    setShapeType(null);
  };

  // Helper to get center point of any shape (copied from ShapeRenderer)
  function getShapeCenter(shape: MapShape): Position {
    switch (shape.type) {
      case 'point':
        return shape.position;
      case 'circle':
        return shape.center;
      case 'rectangle': {
        return {
          latitude: (shape.bounds.northEast.latitude + shape.bounds.southWest.latitude) / 2,
          longitude: (shape.bounds.northEast.longitude + shape.bounds.southWest.longitude) / 2
        };
      }
      case 'polyline':
      case 'polygon': {
        const path = shape.path;
        const sumLat = path.reduce((sum: number, point: Position) => sum + point.latitude, 0);
        const sumLng = path.reduce((sum: number, point: Position) => sum + point.longitude, 0);
        return {
          latitude: sumLat / path.length,
          longitude: sumLng / path.length
        };
      }
      case 'arrow': {
        return {
          latitude: (shape.start.latitude + shape.end.latitude) / 2,
          longitude: (shape.start.longitude + shape.end.longitude) / 2
        };
      }
      default:
        return { latitude: 0, longitude: 0 };
    }
  }

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
        <button 
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
          onClick={handleShapesButtonClick}
          title="Add Map Shapes"
        >
          <PenTool size={18} />
        </button>
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
        {/* Render map shapes */}
        {!shapesLoading && (shapes.length > 0 || previewShape) && (
          <ShapeRenderer 
            shapes={previewShape ? [...shapes, previewShape] : shapes} 
            onShapeDeleted={deleteShape} 
            onShapeEdit={(shape: MapShape) => setEditingShape(shape)} 
          />
        )}
        
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
        shapes={shapes}
        onShapeEdit={setEditingShape}
        onShapeDelete={deleteShape}
        onShapeCenter={(shape) => {
          const center = getShapeCenter(shape);
          mapRef.current?.flyTo({
            center: [center.longitude, center.latitude],
            zoom: 15,
            duration: 1500
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
      
      {/* Shapes Menu */}
      {showShapesMenu && (
        <ShapesMenu
          position={shapeMenuPosition}
          onSelect={handleShapeSelect}
          onClose={() => setShowShapesMenu(false)}
        />
      )}
      
      {/* Shape Form */}
      {(shapeType || editingShape) && (
        <ShapeForm
          type={shapeType || (editingShape?.type || '')}
          mapRef={mapRef}
          onClose={() => { setShapeType(null); setEditingShape(null); setPreviewShape(null); }}
          createShape={createShape}
          updateShape={updateShape}
          onPreviewShapeChange={setPreviewShape}
          initialShape={editingShape || undefined}
        />
      )}
    </div>
  );
};

export default MapContainer;