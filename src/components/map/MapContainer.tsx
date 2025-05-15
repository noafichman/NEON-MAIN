import React, { useState, useRef, useCallback, useEffect } from 'react';
import Map, { MapRef, Marker } from 'react-map-gl';
import { useContextMenu } from '../../hooks/useContextMenu';
import MapContextMenu from './contextMenus/MapContextMenu';
import EntityContextMenu from './contextMenus/EntityContextMenu';
import EntityMarker from './entities/EntityMarker';
import EntityInfo from './entities/EntityInfo';
import EntityPanel from '../sidebar/EntityPanel';
import { useMilitaryEntities } from '../../hooks/useMilitaryEntities';
import { useManualEntities, ManualEntityData } from '../../hooks/useManualEntities';
import { useMapShapes } from '../../hooks/useMapShapes';
import { MilitaryEntity } from '../../types/entities';
import { MapShape, Position } from '../../types/shapes';
import { Search, Wifi, Bell, Menu, Settings, MessageSquare, Calendar, Clock, Video, Image, FileText, PenTool, Crosshair, Navigation, Globe } from 'lucide-react';
import AlertPanel from '../alerts/AlertPanel';
import LastAlertsPanel from '../alerts/LastAlertsPanel';
import ShapesMenu from './shapes/ShapesMenu';
import ShapeForm from './shapes/ShapeForm';
import ShapeRenderer from './shapes/ShapeRenderer';
import VideoModal from '../video/VideoModal';
import SearchBar from '../search/SearchBar';
import WeatherDisplay from '../weather/WeatherDisplay';
import { Location } from '../../utils/locationService';
import { GeocodingResult } from '../../hooks/useGeocoding';
import ChatPanel from '../chat/ChatPanel';
import ManualEntityForm from './entities/ManualEntityForm';
import EditManualEntityForm from './entities/EditManualEntityForm';

// Dynamically determine API URL based on environment
const API_URL = import.meta.env.PROD 
  ? '/api' 
  : 'http://localhost:3001/api';

// Manual entity extension to handle raw data
interface ManualEntityExtension extends MilitaryEntity {
  isManual?: boolean;
  _raw?: ManualEntityData;
}

// Default map settings
const INITIAL_VIEW_STATE = {
  longitude: -43.31,
  latitude: -22.79,
  zoom: 16
};

interface MapContainerProps {
  isPanelVisible: boolean;
  setIsPanelVisible: (visible: boolean) => void;
}

// Search result interface to handle both entity and shape types
interface SearchResult {
  id: string;
  name: string;
  type: 'entity' | 'shape' | 'location' | 'geocoded';
  category?: string;
  originalObject: MilitaryEntity | MapShape | Location | GeocodingResult;
}

const MapContainer: React.FC<MapContainerProps> = ({ isPanelVisible, setIsPanelVisible }) => {
  const mapRef = useRef<MapRef>(null);
  const { entities, alerts, dismissAlert } = useMilitaryEntities();
  const { 
    manualEntities, 
    manualAlerts,
    dismissManualAlert,
    refreshManualEntities, 
    deleteManualEntity, 
    updateManualEntity,
    setManualEntities
  } = useManualEntities();
  const { shapes, loading: shapesLoading, createShape, updateShape, deleteShape } = useMapShapes();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLastAlerts, setShowLastAlerts] = useState(false);
  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const [shapeType, setShapeType] = useState<string | null>(null);
  const [shapeMenuPosition, setShapeMenuPosition] = useState({ x: 0, y: 0 });
  const [previewShape, setPreviewShape] = useState<MapShape | null>(null);
  const [editingShape, setEditingShape] = useState<MapShape | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isClockOpen, setIsClockOpen] = useState(false);
  const [isImagesOpen, setIsImagesOpen] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const youtubeVideoUrl = "https://youtu.be/eRQ-DOe-68w?t=560";
  const [mousePosition, setMousePosition] = useState<{ lat: number, lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number }>({
    lat: INITIAL_VIEW_STATE.latitude,
    lng: INITIAL_VIEW_STATE.longitude
  });
  
  // State for context menu control
  const [contextMenuEnabled, setContextMenuEnabled] = useState(true);
  
  // State for selected entity and info display
  const [selectedEntity, setSelectedEntity] = useState<MilitaryEntity | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedGeocodedLocation, setSelectedGeocodedLocation] = useState<GeocodingResult | null>(null);
  
  // Combine regular and manual entities
  const allEntities = [...entities, ...manualEntities];
  
  // Add debug logging
  useEffect(() => {
    console.log('Regular entities:', entities.length, entities);
    console.log('Manual entities:', manualEntities.length, manualEntities);
    console.log('Combined entities:', allEntities.length, allEntities);
  }, [entities, manualEntities, allEntities]);
  
  // Combined alerts for both regular and manual entities
  const allAlerts = [...alerts, ...manualAlerts];
  const dismissAnyAlert = (alertId: string) => {
    // Try to dismiss as regular alert
    dismissAlert(alertId);
    // Also try to dismiss as manual alert
    dismissManualAlert(alertId);
  };
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Update map center position every 10 minutes or when map moves
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Get current center on map load
    const map = mapRef.current.getMap();
    const center = map.getCenter();
    setMapCenter({
      lat: center.lat,
      lng: center.lng
    });
    
    // Set up event listener for map movement end
    const updateMapCenter = () => {
      const center = map.getCenter();
      setMapCenter({
        lat: center.lat,
        lng: center.lng
      });
    };
    
    map.on('moveend', updateMapCenter);
    
    // Also update periodically even if the map hasn't moved
    const intervalId = setInterval(updateMapCenter, 10 * 60 * 1000);
    
    return () => {
      map.off('moveend', updateMapCenter);
      clearInterval(intervalId);
    };
  }, [mapRef.current]);
  
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
  
  // Handler for map mouse move
  const handleMouseMove = useCallback((e: any) => {
    if (e.lngLat) {
      setMousePosition({
        lat: e.lngLat.lat,
        lng: e.lngLat.lng
      });
    }
  }, []);
  
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
    
    // Don't handle entity clicks if context menus are disabled
    if (!contextMenuEnabled) {
      console.log('Entity click suppressed during cooldown');
      return;
    }
    
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
  }, [hideMapContext, hideEntityContext, showEntityContext, shapeType, contextMenuEnabled]);
  
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

  // Format coordinates for display
  const formatCoordinate = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '-.----';
    return value.toFixed(4);
  };

  // Helper to get center point of any shape
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

  // Handle search result selection
  const handleSearchResultSelect = (result: SearchResult) => {
    // Clear all selections first
    setSelectedEntity(null);
    setSelectedLocation(null);
    setSelectedGeocodedLocation(null);
    
    if (result.type === 'entity') {
      const entity = result.originalObject as MilitaryEntity;
      setSelectedEntity(entity);
      
      mapRef.current?.flyTo({
        center: [entity.position.longitude, entity.position.latitude],
        zoom: 20,
        duration: 1500
      });
    } else if (result.type === 'shape') {
      const shape = result.originalObject as MapShape;
      const center = getShapeCenter(shape);
      
      mapRef.current?.flyTo({
        center: [center.longitude, center.latitude],
        zoom: 20,
        duration: 1500
      });
      
      // If we want to show the shape details, we could set editingShape here
      // or create a specific shape details panel
      setEditingShape(shape);
    } else if (result.type === 'location') {
      const location = result.originalObject as Location;
      setSelectedLocation(location);
      
      mapRef.current?.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 18,
        duration: 1500
      });
    } else if (result.type === 'geocoded') {
      const location = result.originalObject as GeocodingResult;
      setSelectedGeocodedLocation(location);
      
      mapRef.current?.flyTo({
        center: [location.coordinates.longitude, location.coordinates.latitude],
        zoom: getZoomLevelForPlaceType(location.placeType),
        duration: 1500
      });
    }
  };
  
  // Helper to determine appropriate zoom level based on place type
  const getZoomLevelForPlaceType = (placeType: string): number => {
    switch (placeType) {
      case 'country':
        return 5;
      case 'region':
      case 'state':
      case 'province':
        return 7;
      case 'district':
      case 'county':
        return 9;
      case 'place':
      case 'city':
      case 'town':
        return 12;
      case 'locality':
      case 'neighborhood':
        return 14;
      case 'address':
        return 18;
      case 'poi':
        return 19;
      default:
        return 13;
    }
  };

  // Then modify the handleContextMenu function to check this flag
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    // If context menus are disabled, do nothing
    if (!contextMenuEnabled) {
      console.log('Context menu suppressed');
      return;
    }
    
    let lngLat = null;
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      const rect = mapRef.current.getContainer().getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const coord = map.unproject([x, y]);
      lngLat = { lat: coord.lat, lng: coord.lng };
    }
    showMapContext({
      x: e.clientX,
      y: e.clientY,
      lngLat
    });
  }, [showMapContext, mapRef, contextMenuEnabled]);

  // Manual entity states
  const [showManualEntityForm, setShowManualEntityForm] = useState(false);
  const [manualEntityCoords, setManualEntityCoords] = useState<{ lat: number, lng: number } | undefined>(undefined);
  // State for editing existing entity
  const [editingManualEntity, setEditingManualEntity] = useState<ManualEntityData | null>(null);

  const handleManualEntitySaved = () => {
    setShowManualEntityForm(false);
    setEditingManualEntity(null);
    refreshManualEntities();
  };

  // Now modify the handleDeleteManualEntity function
  const handleDeleteManualEntity = async (entityId: string) => {
    try {
      console.log(`MapContainer: Deleting manual entity ${entityId}`);
      
      // Temporarily disable context menus
      setContextMenuEnabled(false);
      
      // Call the deleteManualEntity function from the hook
      const success = await deleteManualEntity(entityId);
      
      // If successful and the entity was selected, clear the selection
      if (success) {
        if (selectedEntity && selectedEntity.id === entityId) {
          setSelectedEntity(null);
        }
        // Hide any open context menus
        hideEntityContext();
        hideMapContext();
        
        console.log(`MapContainer: Successfully deleted entity ${entityId}`);
      } else {
        console.error(`Failed to delete entity ${entityId}`);
      }
      
      // Re-enable context menus after a short delay
      setTimeout(() => {
        setContextMenuEnabled(true);
        console.log('Context menus re-enabled');
      }, 300);
      
      return success;
    } catch (err) {
      console.error('Error in handleDeleteManualEntity:', err);
      // Make sure to re-enable context menus even if there's an error
      setContextMenuEnabled(true);
      return false;
    }
  };

  const handleEditManualEntity = (entity: MilitaryEntity) => {
    if (entity.isManual && entity._raw) {
      // We know this is a manual entity with _raw data
      setEditingManualEntity(entity._raw as ManualEntityData);
    }
  };

  return (
    <div className="h-full w-full relative" onContextMenu={handleContextMenu}>
      {/* Status Header */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-4 px-4 py-2 bg-gray-900/40 backdrop-blur-sm border border-gray-800/30 rounded-lg">
        <SearchBar 
          entities={entities} 
          shapes={shapes}
          mapCenter={mapCenter}
          onSelectResult={handleSearchResultSelect}
        />
        <button className="text-green-400 hover:text-green-300 transition-colors">
          <Wifi size={16} />
        </button>
        <div className="text-gray-400 font-medium text-sm">
          {currentTime.toLocaleTimeString()}
        </div>
        <button 
          onClick={() => setShowLastAlerts(!showLastAlerts)}
          className="text-gray-400 hover:text-white transition-colors relative"
          title={`${allAlerts.length} new hostile entities`}
        >
          <Bell size={16} />
          {allAlerts.length > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] font-medium text-white">{allAlerts.length}</span>
            </div>
          )}
        </button>
      </div>

      {/* Video fixed below search bar */}
      {isVideoModalOpen && (
        <div className="absolute top-16 right-4 z-40">
          <VideoModal 
            videoUrl={youtubeVideoUrl}
            isOpen={isVideoModalOpen}
            onClose={() => setIsVideoModalOpen(false)}
          />
        </div>
      )}

      {/* Position Display */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gray-900/40 backdrop-blur-sm border border-gray-800/30 rounded-lg">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Crosshair size={14} className="text-gray-400" />
            <div className="font-mono text-gray-300">
              {mousePosition ? (
                <>
                  <span>Lat: {formatCoordinate(mousePosition.lat)}</span>
                  <span className="mx-2">|</span>
                  <span>Lng: {formatCoordinate(mousePosition.lng)}</span>
                </>
              ) : (
                <span className="text-gray-500">Move cursor over map</span>
              )}
            </div>
          </div>
          
          <div className="w-px h-6 bg-white/10"></div>
          
          {/* Weather display component using map center coordinates */}
          <WeatherDisplay 
            latitude={mapCenter.lat} 
            longitude={mapCenter.lng} 
          />
        </div>
      </div>

      {/* Alert Panels - Updated to show all alerts */}
      <AlertPanel alerts={allAlerts} onDismiss={dismissAnyAlert} />
      <LastAlertsPanel 
        alerts={allAlerts} 
        visible={showLastAlerts} 
        onClose={() => setShowLastAlerts(false)} 
      />

      {/* Chat Panel */}
      <ChatPanel
        visible={isMessagesOpen}
        onClose={() => setIsMessagesOpen(false)}
      />

      {/* Bottom Action Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-gray-900/40 backdrop-blur-sm border border-gray-800/30 rounded-lg">
        <button 
          className={`p-2 ${isPanelVisible ? 'text-blue-400 bg-gray-800/50' : 'text-gray-400'} hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors`}
          onClick={() => setIsPanelVisible(!isPanelVisible)}
          title="Toggle Entity Panel"
        >
          <Menu size={18} />
        </button>
        <button 
          className={`p-2 ${isSettingsOpen ? 'text-blue-400 bg-gray-800/50' : 'text-gray-400'} hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors`}
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          title="Settings"
        >
          <Settings size={18} />
        </button>
        <button 
          className={`p-2 ${isMessagesOpen ? 'text-blue-400 bg-gray-800/50' : 'text-gray-400'} hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors`}
          onClick={() => setIsMessagesOpen(!isMessagesOpen)}
          title="Messages"
        >
          <MessageSquare size={18} />
        </button>
        <div className="w-px h-6 bg-white/10"></div>
        <button 
          className={`p-2 ${showShapesMenu ? 'text-blue-400 bg-gray-800/50' : 'text-gray-400'} hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors`}
          onClick={handleShapesButtonClick}
          title="Add Map Shapes"
        >
          <PenTool size={18} />
        </button>
        <button 
          className={`p-2 ${isCalendarOpen ? 'text-blue-400 bg-gray-800/50' : 'text-gray-400'} hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors`}
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          title="Calendar"
        >
          <Calendar size={18} />
        </button>
        <button 
          className={`p-2 ${isClockOpen ? 'text-blue-400 bg-gray-800/50' : 'text-gray-400'} hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors`}
          onClick={() => setIsClockOpen(!isClockOpen)}
          title="Clock"
        >
          <Clock size={18} />
        </button>
        <button 
          className={`p-2 ${isVideoModalOpen ? 'text-blue-400 bg-gray-800/50' : 'text-gray-400'} hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors`}
          onClick={() => setIsVideoModalOpen(!isVideoModalOpen)}
          title={isVideoModalOpen ? "Hide Video" : "Show Video"}
        >
          <Video size={18} />
        </button>
        <button 
          className={`p-2 ${isImagesOpen ? 'text-blue-400 bg-gray-800/50' : 'text-gray-400'} hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors`}
          onClick={() => setIsImagesOpen(!isImagesOpen)}
          title="Images"
        >
          <Image size={18} />
        </button>
        <button 
          className={`p-2 ${isFilesOpen ? 'text-blue-400 bg-gray-800/50' : 'text-gray-400'} hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors`}
          onClick={() => setIsFilesOpen(!isFilesOpen)}
          title="Files"
        >
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
        onMouseMove={handleMouseMove}
        onMouseOut={handleContextMenu}
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
        
        {/* Render all entities (including manual entities) as markers */}
        {allEntities.map(entity => (
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
        entities={allEntities}
        visible={isPanelVisible}
        onClose={() => setIsPanelVisible(false)}
        onEntitySelect={(entity) => {
          setSelectedEntity(entity);
          mapRef.current?.flyTo({
            center: [entity.position.longitude, entity.position.latitude],
            // zoom: 20,
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
          onAddManualEntity={() => {
            setShowManualEntityForm(true);
            // Ensure we have valid coordinates before setting them
            if (mapContextPosition.lngLat && 
                typeof mapContextPosition.lngLat.lat === 'number' && 
                !isNaN(mapContextPosition.lngLat.lat) &&
                typeof mapContextPosition.lngLat.lng === 'number' && 
                !isNaN(mapContextPosition.lngLat.lng)) {
              setManualEntityCoords({
                lat: mapContextPosition.lngLat.lat,
                lng: mapContextPosition.lngLat.lng
              });
            } else {
              // Set to default map center if coordinates are invalid
              setManualEntityCoords(mapCenter || { lat: 0, lng: 0 });
            }
            hideMapContext();
          }}
        />
      )}
      
      {entityContextVisible && (
        <EntityContextMenu 
          position={entityContextPosition} 
          entity={selectedEntity}
          onClose={hideEntityContext}
          className="z-30"
          onDelete={handleDeleteManualEntity}
          onEdit={handleEditManualEntity}
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

      {showManualEntityForm && (
        <ManualEntityForm
          lat={manualEntityCoords?.lat}
          lng={manualEntityCoords?.lng}
          onClose={() => setShowManualEntityForm(false)}
          onSaved={handleManualEntitySaved}
        />
      )}

      {editingManualEntity && (
        <EditManualEntityForm
          entity={editingManualEntity}
          onClose={() => setEditingManualEntity(null)}
          onSaved={handleManualEntitySaved}
        />
      )}
    </div>
  );
};

export default MapContainer;