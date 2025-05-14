import React, { useState, useRef, useEffect } from 'react';
import { MapRef } from 'react-map-gl';
import { X } from 'lucide-react';
import { Position, PointShape, CircleShape, RectangleShape, PolylineShape, PolygonShape, ArrowShape, MapShape } from '../../../types/shapes';

interface ShapeFormProps {
  type: string;
  mapRef: React.RefObject<MapRef>;
  onClose: () => void;
  createShape: (shapeData: any) => Promise<boolean>;
  updateShape?: (shapeId: string, shapeData: any) => Promise<boolean>;
  onPreviewShapeChange: (shape: any) => void;
  initialShape?: MapShape;
}

type NewShape =
  | Omit<PointShape, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<CircleShape, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<RectangleShape, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<PolylineShape, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<PolygonShape, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<ArrowShape, 'id' | 'createdAt' | 'updatedAt'>;

// Counter for default names per type
const shapeTypeCounters: Record<string, number> = {};

const ShapeForm: React.FC<ShapeFormProps> = ({ type, mapRef, onClose, createShape, updateShape, onPreviewShapeChange, initialShape }) => {
  // Get and increment counter for this type
  const getDefaultName = () => {
    const typeKey = type.charAt(0).toUpperCase() + type.slice(1);
    if (!shapeTypeCounters[typeKey]) shapeTypeCounters[typeKey] = 1;
    else shapeTypeCounters[typeKey]++;
    return `${typeKey} ${shapeTypeCounters[typeKey]}`;
  };

  // Form fields
  const [name, setName] = useState(initialShape?.name || getDefaultName());
  const [description, setDescription] = useState(initialShape?.description || '');
  const [lineColor, setLineColor] = useState(initialShape?.lineColor || '#1E88E5');
  const [lineStyle, setLineStyle] = useState<'solid' | 'dashed' | 'dotted'>(initialShape?.lineStyle || 'solid');
  const [fillColor, setFillColor] = useState(initialShape?.fillColor || '#1E88E5');
  const [fillOpacity, setFillOpacity] = useState(initialShape?.fillOpacity ?? 0.3);
  
  // Shape-specific fields
  const [pickingPoints, setPickingPoints] = useState(initialShape ? false : true);
  const [points, setPoints] = useState<Position[]>(
    initialShape
      ? initialShape.type === 'point'
        ? [initialShape.position]
        : initialShape.type === 'circle'
        ? [initialShape.center]
        : initialShape.type === 'rectangle'
        ? [initialShape.bounds.northEast, initialShape.bounds.southWest]
        : initialShape.type === 'arrow'
        ? [initialShape.start, initialShape.end]
        : initialShape.type === 'polyline' || initialShape.type === 'polygon'
        ? initialShape.path
        : []
      : []
  );
  const [radius, setRadius] = useState(initialShape && initialShape.type === 'circle' ? initialShape.radius : 100);
  
  // Reference to the click listener
  const clickListenerRef = useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null);
  
  // Helper to format the title
  const formatTitle = () => {
    return initialShape ? `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}` : `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  };

  // Register map click listener
  useEffect(() => {
    if (!mapRef.current || !pickingPoints) return;
    
    // Create click listener
    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      const newPoint = {
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat
      };
      
      if (type === 'point' || type === 'circle') {
        // For point and circle, we only need one point
        setPoints([newPoint]);
        setPickingPoints(false);
      } else if (type === 'rectangle' && points.length < 1) {
        // For rectangle, we need two points
        setPoints([newPoint]);
      } else if (type === 'rectangle') {
        // Second point for rectangle
        setPoints(prev => [...prev, newPoint]);
        setPickingPoints(false);
      } else if (type === 'arrow' && points.length < 1) {
        // For arrow, first point (start)
        setPoints([newPoint]);
      } else if (type === 'arrow') {
        // For arrow, second point (end)
        setPoints(prev => [...prev, newPoint]);
        setPickingPoints(false);
      } else {
        // For polyline and polygon, add points until done
        setPoints(prev => [...prev, newPoint]);
      }
    };
    
    // Store the listener so we can remove it later
    clickListenerRef.current = handleMapClick;
    
    // Add the event listener
    mapRef.current.getMap().on('click', handleMapClick);
    
    // Cleanup on unmount
    return () => {
      if (mapRef.current && clickListenerRef.current) {
        mapRef.current.getMap().off('click', clickListenerRef.current);
      }
    };
  }, [mapRef, pickingPoints, type, points]);
  
  // Build preview shape on every relevant change
  useEffect(() => {
    let preview: any = null;
    if (points.length === 0) {
      onPreviewShapeChange(null);
      return;
    }
    switch (type) {
      case 'point':
        preview = {
          id: 'preview',
          type,
          name,
          description,
          lineColor,
          lineStyle,
          fillColor,
          fillOpacity,
          position: points[0]
        };
        break;
      case 'circle':
        preview = {
          id: 'preview',
          type,
          name,
          description,
          lineColor,
          lineStyle,
          fillColor,
          fillOpacity,
          center: points[0],
          radius
        };
        break;
      case 'rectangle':
        if (points.length < 2) break;
        const lats = [points[0].latitude, points[1].latitude].sort((a, b) => b - a);
        const lngs = [points[0].longitude, points[1].longitude].sort();
        preview = {
          id: 'preview',
          type,
          name,
          description,
          lineColor,
          lineStyle,
          fillColor,
          fillOpacity,
          bounds: {
            northEast: { latitude: lats[0], longitude: lngs[1] },
            southWest: { latitude: lats[1], longitude: lngs[0] }
          }
        };
        break;
      case 'arrow':
        if (points.length < 2) break;
        preview = {
          id: 'preview',
          type,
          name,
          description,
          lineColor,
          lineStyle,
          fillColor,
          fillOpacity,
          start: points[0],
          end: points[1],
          headSize: 10
        };
        break;
      case 'polyline':
        if (points.length < 2) break;
        preview = {
          id: 'preview',
          type,
          name,
          description,
          lineColor,
          lineStyle,
          fillColor,
          fillOpacity,
          path: points
        };
        break;
      case 'polygon':
        if (points.length < 3) break;
        preview = {
          id: 'preview',
          type,
          name,
          description,
          lineColor,
          lineStyle,
          fillColor,
          fillOpacity,
          path: points
        };
        break;
    }
    onPreviewShapeChange(preview);
  }, [type, name, description, lineColor, lineStyle, fillColor, fillOpacity, radius, points, onPreviewShapeChange]);

  // Update form fields if initialShape changes (for hot edit)
  useEffect(() => {
    if (!initialShape) return;
    setName(initialShape.name || getDefaultName());
    setDescription(initialShape.description || '');
    setLineColor(initialShape.lineColor || '#1E88E5');
    setLineStyle(initialShape.lineStyle || 'solid');
    setFillColor(initialShape.fillColor || '#1E88E5');
    setFillOpacity(initialShape.fillOpacity ?? 0.3);
    setPickingPoints(false);
    if (initialShape.type === 'point') setPoints([initialShape.position]);
    else if (initialShape.type === 'circle') setPoints([initialShape.center]);
    else if (initialShape.type === 'rectangle') setPoints([initialShape.bounds.northEast, initialShape.bounds.southWest]);
    else if (initialShape.type === 'arrow') setPoints([initialShape.start, initialShape.end]);
    else if (initialShape.type === 'polyline' || initialShape.type === 'polygon') setPoints(initialShape.path);
    if (initialShape.type === 'circle') setRadius(initialShape.radius);
  }, [initialShape]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (points.length === 0) {
      alert('Please select at least one point on the map.');
      return;
    }
    let shapeData: any;
    switch (type) {
      case 'point':
        shapeData = {
          type,
          name,
          description,
          lineColor,
          lineStyle,
          fillColor,
          fillOpacity,
          position: points[0]
        };
        break;
      case 'circle':
        shapeData = {
          type,
          name,
          description,
          lineColor,
          lineStyle,
          fillColor,
          fillOpacity,
          center: points[0],
          radius
        };
        break;
      case 'rectangle':
        if (points.length < 2) {
          alert('Please select two points to define the rectangle.');
          return;
        }
        const lats = [points[0].latitude, points[1].latitude].sort((a, b) => b - a);
        const lngs = [points[0].longitude, points[1].longitude].sort();
        shapeData = {
          type,
          name,
          description,
          lineColor,
          lineStyle,
          fillColor,
          fillOpacity,
          bounds: {
            northEast: { latitude: lats[0], longitude: lngs[1] },
            southWest: { latitude: lats[1], longitude: lngs[0] }
          }
        };
        break;
      case 'arrow':
        if (points.length < 2) {
          alert('Please select start and end points for the arrow.');
          return;
        }
        shapeData = {
          type,
          name,
          description,
          lineColor,
          lineStyle,
          fillColor,
          fillOpacity,
          start: points[0],
          end: points[1],
          headSize: 10
        };
        break;
      case 'polyline':
      case 'polygon':
        if (points.length < 2 && type === 'polyline') {
          alert('Please select at least two points for a polyline.');
          return;
        }
        if (points.length < 3 && type === 'polygon') {
          alert('Please select at least three points for a polygon.');
          return;
        }
        shapeData = {
          type,
          name,
          description,
          lineColor,
          lineStyle,
          fillColor,
          fillOpacity,
          path: points
        };
        break;
    }
    if (!shapeData) {
      alert('Invalid shape data. Please check your input.');
      return;
    }
    try {
      console.log('Submitting shape data:', shapeData);
      
      let success = false;
      
      // If we have an initialShape, we're editing an existing shape
      if (initialShape && updateShape) {
        success = await updateShape(initialShape.id, shapeData);
      } else {
        // Otherwise we're creating a new shape
        success = await createShape(shapeData);
      }
      
      if (success) {
        onPreviewShapeChange(null);
        onClose();
      } else {
        alert(`Failed to ${initialShape ? 'update' : 'save'} shape. Please try again.`);
      }
    } catch (error) {
      console.error(`Error ${initialShape ? 'updating' : 'saving'} shape:`, error);
      alert(`Failed to ${initialShape ? 'update' : 'save'} shape. Please try again.`);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    // If we're picking points, remove the listener
    if (mapRef.current && clickListenerRef.current) {
      mapRef.current.getMap().off('click', clickListenerRef.current);
    }
    
    onPreviewShapeChange(null);
    onClose();
  };
  
  // Handle done picking points
  const handleDonePicking = () => {
    if (
      (type === 'polyline' && points.length < 2) || 
      (type === 'polygon' && points.length < 3)
    ) {
      alert(`Please select at least ${type === 'polyline' ? '2' : '3'} points.`);
      return;
    }
    
    setPickingPoints(false);
  };
  
  // Reset point picking
  const handleResetPoints = () => {
    setPoints([]);
    setPickingPoints(true);
  };

  return (
    <div className="absolute top-0 right-0 bottom-0 w-96 z-40 bg-gray-900/90 backdrop-blur-sm border-l border-gray-800/50 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-800/50 flex justify-between items-center">
        <h2 className="text-lg font-medium text-white">{formatTitle()}</h2>
        <button 
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
          onClick={handleCancel}
        >
          <X size={18} />
        </button>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Map Interaction Instructions */}
        {pickingPoints && (
          <div className="p-3 bg-gray-800/70 rounded-lg text-gray-300 text-sm">
            <p className="mb-2">
              {type === 'point' ? 'Click on the map to place a point.' :
              type === 'circle' ? 'Click on the map to set the center of the circle.' :
              type === 'rectangle' ? `Click on the map to set ${points.length === 0 ? 'the first' : 'the second'} corner of the rectangle.` :
              `Click on the map to add points to your ${type}. Add at least ${type === 'polyline' ? '2' : '3'} points.`}
            </p>
            
            {/* Show points added */}
            {points.length > 0 && (
              <div className="mt-2">
                <p>Points added: {points.length}</p>
              </div>
            )}
            
            {/* Done button for polyline/polygon */}
            {(type === 'polyline' || type === 'polygon') && points.length > 0 && (
              <button 
                type="button"
                className="mt-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                onClick={handleDonePicking}
              >
                Done Adding Points
              </button>
            )}
          </div>
        )}
        
        {/* Basic Properties */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 bg-gray-800/70 border border-gray-700/50 rounded-md text-white"
            placeholder="Enter name"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 bg-gray-800/70 border border-gray-700/50 rounded-md text-white"
            placeholder="Enter description"
            rows={3}
          />
        </div>
        
        {/* Circle Radius */}
        {type === 'circle' && !pickingPoints && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Radius (meters)
            </label>
            <input
              type="number"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full p-2 bg-gray-800/70 border border-gray-700/50 rounded-md text-white"
              min={1}
              required
            />
          </div>
        )}
        
        {/* Style Options */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Line Color
            </label>
            <div className="flex items-center">
              <input
                type="color"
                value={lineColor}
                onChange={(e) => setLineColor(e.target.value)}
                className="p-0 bg-transparent border-0 w-8 h-8 rounded-md overflow-hidden"
              />
              <input
                type="text"
                value={lineColor}
                onChange={(e) => setLineColor(e.target.value)}
                className="ml-2 p-2 bg-gray-800/70 border border-gray-700/50 rounded-md text-white w-24"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Line Style
            </label>
            <select
              value={lineStyle}
              onChange={(e) => setLineStyle(e.target.value as 'solid' | 'dashed' | 'dotted')}
              className="w-full p-2 bg-gray-800/70 border border-gray-700/50 rounded-md text-white"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
        </div>
        
        {/* Fill Options (not for Polyline) */}
        {type !== 'polyline' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Fill Color
              </label>
              <div className="flex items-center">
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="p-0 bg-transparent border-0 w-8 h-8 rounded-md overflow-hidden"
                />
                <input
                  type="text"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="ml-2 p-2 bg-gray-800/70 border border-gray-700/50 rounded-md text-white w-24"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Fill Opacity
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={fillOpacity}
                onChange={(e) => setFillOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-right text-xs text-gray-400">
                {fillOpacity.toFixed(1)}
              </div>
            </div>
          </div>
        )}
        
        {/* Reset Points */}
        {!pickingPoints && (
          <button
            type="button"
            onClick={handleResetPoints}
            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md transition-colors"
          >
            Reset Map Points
          </button>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pickingPoints}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShapeForm; 