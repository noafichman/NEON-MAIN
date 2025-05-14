import React, { useEffect, useState } from 'react';
import { Marker, Source, Layer, Popup } from 'react-map-gl';
import type { CircleLayer, LineLayer, FillLayer } from 'mapbox-gl';
import { 
  MapShape, 
  PointShape, 
  CircleShape, 
  RectangleShape, 
  PolygonShape, 
  PolylineShape,
  ArrowShape,
  Position
} from '../../../types/shapes';
import { Trash2 } from 'lucide-react';

interface ShapeRendererProps {
  shapes: MapShape[];
  onShapeDeleted?: (shapeId: string) => void;
  onShapeEdit?: (shape: MapShape) => void;
}

// Helper function to get dash array for line styles
const getDashArray = (style: 'solid' | 'dashed' | 'dotted'): number[] => {
  switch (style) {
    case 'dashed':
      return [4, 2];
    case 'dotted':
      return [1, 2];
    default:
      return [1, 0];
  }
};

const ShapeRenderer: React.FC<ShapeRendererProps> = ({ shapes, onShapeDeleted, onShapeEdit }) => {
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuShapeId, setContextMenuShapeId] = useState<string | null>(null);
  
  useEffect(() => {
    console.log(`ShapeRenderer: Rendering ${shapes.length} shapes`);
    shapes.forEach(shape => {
      console.log(`Rendering shape: ${shape.id}, type: ${shape.type}, name: ${shape.name}`);
    });
  }, [shapes]);

  // Handle shape click
  const handleShapeClick = (shapeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // On left-click, show/hide popup
    if (e.button === 0) {
      setSelectedShape(shapeId === selectedShape ? null : shapeId);
      setContextMenuPos(null);
    }
    // On right-click, show context menu
    else if (e.button === 2) {
      e.preventDefault();
      setContextMenuPos({ x: e.clientX, y: e.clientY });
      setContextMenuShapeId(shapeId);
      setSelectedShape(null);
    }
  };
  
  // Handle context menu close
  const handleContextMenuClose = () => {
    setContextMenuPos(null);
    setContextMenuShapeId(null);
  };
  
  // Handle shape delete
  const handleShapeDelete = async (shapeId: string) => {
    try {
      const response = await fetch(`/api/shapes/${shapeId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete shape: ${response.statusText}`);
      }
      
      console.log(`Shape ${shapeId} deleted successfully`);
      
      // Call the parent component's callback if provided
      if (onShapeDeleted) {
        onShapeDeleted(shapeId);
      }
    } catch (error) {
      console.error('Error deleting shape:', error);
      alert('Failed to delete shape. Please try again.');
    } finally {
      handleContextMenuClose();
    }
  };

  // Handle shape edit
  const handleShapeEdit = (shapeId: string) => {
    const shape = shapes.find(s => s.id === shapeId);
    if (shape && onShapeEdit) {
      onShapeEdit(shape);
    }
    handleContextMenuClose();
  };

  if (!shapes || shapes.length === 0) {
    console.log('ShapeRenderer: No shapes to render');
    return null;
  }

  return (
    <>
      {shapes.map(shape => {
        try {
          switch (shape.type) {
            case 'point':
              return renderPoint(shape as PointShape, handleShapeClick);
            case 'circle':
              return renderCircle(shape as CircleShape, handleShapeClick);
            case 'rectangle':
              return renderRectangle(shape as RectangleShape, handleShapeClick);
            case 'polygon':
              return renderPolygon(shape as PolygonShape, handleShapeClick);
            case 'polyline':
              return renderPolyline(shape as PolylineShape, handleShapeClick);
            case 'arrow':
              return renderArrow(shape as ArrowShape, handleShapeClick);
            default:
              console.error(`Unknown shape type: ${(shape as any).type}`);
              return null;
          }
        } catch (error) {
          console.error(`Error rendering shape ${shape.id}:`, error);
          return null;
        }
      })}
      
      {/* Popups for selected shapes */}
      {selectedShape && shapes.find(s => s.id === selectedShape) && (
        <Popup
          longitude={getShapeCenter(shapes.find(s => s.id === selectedShape)!).longitude}
          latitude={getShapeCenter(shapes.find(s => s.id === selectedShape)!).latitude}
          closeButton={true}
          closeOnClick={true}
          onClose={() => setSelectedShape(null)}
          anchor="bottom"
          className="z-40"
        >
          <div className="p-2">
            <h3 className="font-medium text-sm">{shapes.find(s => s.id === selectedShape)!.name}</h3>
            {shapes.find(s => s.id === selectedShape)!.description && (
              <p className="text-xs text-gray-600 mt-1">{shapes.find(s => s.id === selectedShape)!.description}</p>
            )}
          </div>
        </Popup>
      )}
      
      {/* Context Menu */}
      {contextMenuPos && contextMenuShapeId && (
        <div 
          className="absolute z-50 bg-gray-900/90 backdrop-blur-sm border border-gray-800/50 rounded-lg overflow-hidden shadow-lg"
          style={{ 
            left: contextMenuPos.x, 
            top: contextMenuPos.y 
          }}
        >
          <button
            className="w-full px-3 py-2 flex items-center gap-2 text-blue-400 hover:bg-gray-800/70 hover:text-blue-300 transition-colors"
            onClick={() => handleShapeEdit(contextMenuShapeId)}
          >
            <span className="text-sm">Edit</span>
          </button>
          <button
            className="w-full px-3 py-2 flex items-center gap-2 text-red-400 hover:bg-gray-800/70 hover:text-red-300 transition-colors"
            onClick={() => handleShapeDelete(contextMenuShapeId)}
          >
            <Trash2 size={16} />
            <span className="text-sm">Delete</span>
          </button>
        </div>
      )}
    </>
  );
};

// Helper to get center point of any shape
const getShapeCenter = (shape: MapShape): Position => {
  switch (shape.type) {
    case 'point':
      return (shape as PointShape).position;
    case 'circle':
      return (shape as CircleShape).center;
    case 'rectangle': {
      const rect = shape as RectangleShape;
      return {
        latitude: (rect.bounds.northEast.latitude + rect.bounds.southWest.latitude) / 2,
        longitude: (rect.bounds.northEast.longitude + rect.bounds.southWest.longitude) / 2
      };
    }
    case 'polyline':
    case 'polygon': {
      const path = (shape as PolylineShape | PolygonShape).path;
      const sumLat = path.reduce((sum, point) => sum + point.latitude, 0);
      const sumLng = path.reduce((sum, point) => sum + point.longitude, 0);
      return {
        latitude: sumLat / path.length,
        longitude: sumLng / path.length
      };
    }
    case 'arrow': {
      const arrow = shape as ArrowShape;
      return {
        latitude: (arrow.start.latitude + arrow.end.latitude) / 2,
        longitude: (arrow.start.longitude + arrow.end.longitude) / 2
      };
    }
    default:
      return { latitude: 0, longitude: 0 };
  }
};

// Render a point marker
const renderPoint = (shape: PointShape, onClick: (id: string, e: React.MouseEvent) => void) => {
  console.log(`Rendering point at: ${shape.position.latitude}, ${shape.position.longitude}`);
  return (
    <Marker 
      key={shape.id}
      longitude={shape.position.longitude}
      latitude={shape.position.latitude}
    >
      <div 
        className="w-4 h-4 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer" 
        style={{ 
          backgroundColor: shape.fillColor,
          borderColor: shape.lineColor,
          opacity: shape.fillOpacity
        }}
        title={shape.name}
        onClick={(e) => onClick(shape.id, e as React.MouseEvent)}
        onContextMenu={(e) => onClick(shape.id, e as React.MouseEvent)}
      >
        <div className="absolute whitespace-nowrap text-xs font-medium text-white bg-gray-900/70 px-1 rounded-sm transform translate-y-4">
          {shape.name}
        </div>
      </div>
    </Marker>
  );
};

// Render a circle
const renderCircle = (shape: CircleShape, onClick: (id: string, e: React.MouseEvent) => void) => {
  // Create a GeoJSON feature for the circle
  const circleData = {
    type: 'Feature' as const,
    properties: {
      id: shape.id,
      name: shape.name
    },
    geometry: {
      type: 'Point' as const,
      coordinates: [shape.center.longitude, shape.center.latitude]
    }
  };

  // Style for the circle
  const circleLayer: CircleLayer = {
    id: `circle-${shape.id}`,
    type: 'circle',
    paint: {
      'circle-radius': shape.radius / 5, // Scale down for visual appeal
      'circle-color': shape.fillColor,
      'circle-opacity': shape.fillOpacity,
      'circle-stroke-width': 2,
      'circle-stroke-color': shape.lineColor,
      'circle-stroke-opacity': 1
    }
  };

  return (
    <React.Fragment key={shape.id}>
      <Source id={`circle-source-${shape.id}`} type="geojson" data={circleData}>
        <Layer {...circleLayer} />
      </Source>
      
      {/* Add text label and clickable area */}
      <Marker 
        longitude={shape.center.longitude}
        latitude={shape.center.latitude}
      >
        <div 
          className="absolute w-8 h-8 cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
          onClick={(e) => onClick(shape.id, e as React.MouseEvent)}
          onContextMenu={(e) => onClick(shape.id, e as React.MouseEvent)}
        >
          <div className="whitespace-nowrap text-xs font-medium text-white bg-gray-900/70 px-1 rounded-sm pointer-events-none transform -translate-y-4">
            {shape.name}
          </div>
        </div>
      </Marker>
    </React.Fragment>
  );
};

// Render a rectangle
const renderRectangle = (shape: RectangleShape, onClick: (id: string, e: React.MouseEvent) => void) => {
  // Create GeoJSON for rectangle (as a polygon)
  const { northEast, southWest } = shape.bounds;
  
  const rectangleData = {
    type: 'Feature' as const,
    properties: {
      id: shape.id,
      name: shape.name
    },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [[
        [southWest.longitude, southWest.latitude],
        [northEast.longitude, southWest.latitude],
        [northEast.longitude, northEast.latitude],
        [southWest.longitude, northEast.latitude],
        [southWest.longitude, southWest.latitude] // Close the polygon
      ]]
    }
  };

  // Style for fill
  const fillLayer: FillLayer = {
    id: `rectangle-fill-${shape.id}`,
    type: 'fill',
    paint: {
      'fill-color': shape.fillColor,
      'fill-opacity': shape.fillOpacity
    }
  };

  // Style for outline
  const lineLayer: LineLayer = {
    id: `rectangle-line-${shape.id}`,
    type: 'line',
    paint: {
      'line-color': shape.lineColor,
      'line-width': 2,
      'line-dasharray': getDashArray(shape.lineStyle)
    }
  };

  // Get center for label
  const center = {
    longitude: (northEast.longitude + southWest.longitude) / 2,
    latitude: (northEast.latitude + southWest.latitude) / 2
  };

  return (
    <React.Fragment key={shape.id}>
      <Source id={`rectangle-source-${shape.id}`} type="geojson" data={rectangleData}>
        <Layer 
          {...fillLayer} 
          // Событие onClick обрабатывается через добавление маркера с обработчиком событий
        />
        <Layer {...lineLayer} />
      </Source>
      
      {/* Add text label and clickable area */}
      <Marker longitude={center.longitude} latitude={center.latitude}>
        <div 
          className="absolute w-8 h-8 cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
          onClick={(e) => onClick(shape.id, e as React.MouseEvent)}
          onContextMenu={(e) => onClick(shape.id, e as React.MouseEvent)}
        >
          <div className="whitespace-nowrap text-xs font-medium text-white bg-gray-900/70 px-1 rounded-sm pointer-events-none">
            {shape.name}
          </div>
        </div>
      </Marker>
    </React.Fragment>
  );
};

// Render a polygon
const renderPolygon = (shape: PolygonShape, onClick: (id: string, e: React.MouseEvent) => void) => {
  // Create GeoJSON for polygon
  const coordinates = shape.path.map(point => [point.longitude, point.latitude]);
  
  // Close the polygon if needed (first point equals last point)
  if (
    coordinates.length > 0 && 
    (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
     coordinates[0][1] !== coordinates[coordinates.length - 1][1])
  ) {
    coordinates.push(coordinates[0]);
  }
  
  const polygonData = {
    type: 'Feature' as const,
    properties: {
      id: shape.id,
      name: shape.name
    },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [coordinates]
    }
  };

  // Style for fill
  const fillLayer: FillLayer = {
    id: `polygon-fill-${shape.id}`,
    type: 'fill',
    paint: {
      'fill-color': shape.fillColor,
      'fill-opacity': shape.fillOpacity
    }
  };

  // Style for outline
  const lineLayer: LineLayer = {
    id: `polygon-line-${shape.id}`,
    type: 'line',
    paint: {
      'line-color': shape.lineColor,
      'line-width': 2,
      'line-dasharray': getDashArray(shape.lineStyle)
    }
  };

  // Calculate center point for the label
  const centerLat = shape.path.reduce((sum, point) => sum + point.latitude, 0) / shape.path.length;
  const centerLng = shape.path.reduce((sum, point) => sum + point.longitude, 0) / shape.path.length;

  return (
    <React.Fragment key={shape.id}>
      <Source id={`polygon-source-${shape.id}`} type="geojson" data={polygonData}>
        <Layer 
          {...fillLayer}
          // Событие onClick обрабатывается через добавление маркера с обработчиком событий
        />
        <Layer {...lineLayer} />
      </Source>
      
      {/* Add text label and clickable area */}
      <Marker longitude={centerLng} latitude={centerLat}>
        <div 
          className="absolute w-8 h-8 cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
          onClick={(e) => onClick(shape.id, e as React.MouseEvent)}
          onContextMenu={(e) => onClick(shape.id, e as React.MouseEvent)}
        >
          <div className="whitespace-nowrap text-xs font-medium text-white bg-gray-900/70 px-1 rounded-sm pointer-events-none">
            {shape.name}
          </div>
        </div>
      </Marker>
    </React.Fragment>
  );
};

// Render a polyline
const renderPolyline = (shape: PolylineShape, onClick: (id: string, e: React.MouseEvent) => void) => {
  // Create GeoJSON for line
  const lineData = {
    type: 'Feature' as const,
    properties: {
      id: shape.id,
      name: shape.name
    },
    geometry: {
      type: 'LineString' as const,
      coordinates: shape.path.map(point => [point.longitude, point.latitude])
    }
  };

  // Style for line
  const lineLayer: LineLayer = {
    id: `line-${shape.id}`,
    type: 'line',
    paint: {
      'line-color': shape.lineColor,
      'line-width': 3,
      'line-dasharray': getDashArray(shape.lineStyle)
    }
  };

  // Calculate center point for the label
  const centerLat = shape.path.reduce((sum, point) => sum + point.latitude, 0) / shape.path.length;
  const centerLng = shape.path.reduce((sum, point) => sum + point.longitude, 0) / shape.path.length;

  return (
    <React.Fragment key={shape.id}>
      <Source id={`line-source-${shape.id}`} type="geojson" data={lineData}>
        <Layer {...lineLayer} />
      </Source>
      
      {/* Add text label and clickable area */}
      <Marker longitude={centerLng} latitude={centerLat}>
        <div 
          className="absolute w-8 h-8 cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
          onClick={(e) => onClick(shape.id, e as React.MouseEvent)}
          onContextMenu={(e) => onClick(shape.id, e as React.MouseEvent)}
        >
          <div className="whitespace-nowrap text-xs font-medium text-white bg-gray-900/70 px-1 rounded-sm pointer-events-none">
            {shape.name}
          </div>
        </div>
      </Marker>
    </React.Fragment>
  );
};

// Render an arrow in the classic style: single line with a filled triangle head
const renderArrow = (shape: ArrowShape, onClick: (id: string, e: React.MouseEvent) => void) => {
  // Calculate direction vector
  const dx = shape.end.longitude - shape.start.longitude;
  const dy = shape.end.latitude - shape.start.latitude;
  const length = Math.sqrt(dx * dx + dy * dy);
  const ndx = dx / length;
  const ndy = dy / length;

  // Arrow head size (in degrees, adjust as needed)
  const headLength = 0.0002 * (shape.headSize || 10);
  const headWidth = 0.0001 * (shape.headSize || 10);

  // Base of the arrow head (point before the tip)
  const baseX = shape.end.longitude - ndx * headLength;
  const baseY = shape.end.latitude - ndy * headLength;

  // Perpendicular vector for head width
  const perpX = -ndy;
  const perpY = ndx;

  // Points for the triangle head
  const leftX = baseX + perpX * headWidth;
  const leftY = baseY + perpY * headWidth;
  const rightX = baseX - perpX * headWidth;
  const rightY = baseY - perpY * headWidth;

  // GeoJSON for the main line
  const lineData = {
    type: 'Feature' as const,
    properties: { id: `${shape.id}-line`, name: shape.name },
    geometry: {
      type: 'LineString' as const,
      coordinates: [
        [shape.start.longitude, shape.start.latitude],
        [baseX, baseY] // Stop at the base of the arrow head
      ]
    }
  };

  // GeoJSON for the arrow head (triangle)
  const headData = {
    type: 'Feature' as const,
    properties: { id: `${shape.id}-head`, name: shape.name },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [[
        [shape.end.longitude, shape.end.latitude], // Tip
        [leftX, leftY], // Left base
        [rightX, rightY], // Right base
        [shape.end.longitude, shape.end.latitude] // Close
      ]]
    }
  };

  // Style for the line
  const lineLayer: LineLayer = {
    id: `arrow-line-${shape.id}`,
    type: 'line',
    paint: {
      'line-color': shape.lineColor,
      'line-width': 3,
      'line-dasharray': getDashArray(shape.lineStyle)
    }
  };

  // Style for the arrow head
  const headLayer: FillLayer = {
    id: `arrow-head-${shape.id}`,
    type: 'fill',
    paint: {
      'fill-color': shape.lineColor,
      'fill-opacity': 1
    }
  };

  // Midpoint for label
  const midPoint = {
    longitude: (shape.start.longitude + shape.end.longitude) / 2,
    latitude: (shape.start.latitude + shape.end.latitude) / 2
  };

  return (
    <React.Fragment key={shape.id}>
      <Source id={`arrow-line-source-${shape.id}`} type="geojson" data={lineData}>
        <Layer {...lineLayer} />
      </Source>
      <Source id={`arrow-head-source-${shape.id}`} type="geojson" data={headData}>
        <Layer {...headLayer} />
      </Source>
      {/* Label */}
      <Marker longitude={midPoint.longitude} latitude={midPoint.latitude}>
        <div
          className="absolute w-8 h-8 cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
          onClick={(e) => onClick(shape.id, e as React.MouseEvent)}
          onContextMenu={(e) => onClick(shape.id, e as React.MouseEvent)}
        >
          <div className="whitespace-nowrap text-xs font-medium text-white bg-gray-900/70 px-1 rounded-sm pointer-events-none">
            {shape.name}
          </div>
        </div>
      </Marker>
    </React.Fragment>
  );
};

export default ShapeRenderer; 