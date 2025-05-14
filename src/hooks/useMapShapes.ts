import { useState, useEffect, useCallback } from 'react';
import { MapShape } from '../types/shapes';

// Dynamically determine API URL based on environment
const API_URL = import.meta.env.PROD 
  ? '/api' 
  : 'http://localhost:3001/api';

export const useMapShapes = () => {
  const [shapes, setShapes] = useState<MapShape[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch all shapes
  const fetchShapes = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching shapes from API');
      const response = await fetch(`${API_URL}/shapes`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Received ${data.length} shapes from API`);
      
      // Transform the raw data into our shape types
      const formattedShapes = data.map((shape: any) => {
        try {
          // Ensure shape has a type, default to 'point' if missing
          const shapeType = shape.type || 'point';
          
          console.log(`Processing shape: ID ${shape.id}, Type: ${shapeType}`);
          
          const baseShape = {
            id: shape.id,
            name: shape.name || `Unnamed ${shapeType}`,
            description: shape.description || '',
            lineColor: shape.line_color || shape.lineColor || '#1E88E5',
            lineStyle: (shape.line_style || shape.lineStyle || 'solid') as 'solid' | 'dashed' | 'dotted',
            fillColor: shape.fill_color || shape.fillColor || '#1E88E5',
            fillOpacity: shape.fill_opacity ?? shape.fillOpacity ?? 0.3,
            createdAt: shape.created_at,
            updatedAt: shape.updated_at
          };
          
          // Parse shape data, handling both string and object formats
          const shapeData = typeof shape.shape_data === 'string' 
            ? JSON.parse(shape.shape_data) 
            : shape.shape_data || shape;
          
          // Detailed logging of shape data
          console.log('Raw shape data:', JSON.stringify(shapeData, null, 2));
          
          switch (shapeType) {
            case 'point':
              return {
                ...baseShape,
                type: 'point' as const,
                position: shapeData.position || {
                  latitude: shapeData.position_lat || shapeData.latitude,
                  longitude: shapeData.position_lng || shapeData.longitude
                }
              };
              
            case 'circle':
              return {
                ...baseShape,
                type: 'circle' as const,
                center: shapeData.center || {
                  latitude: shapeData.center_lat || shapeData.latitude,
                  longitude: shapeData.center_lng || shapeData.longitude
                },
                radius: shapeData.radius
              };
              
            case 'rectangle':
              return {
                ...baseShape,
                type: 'rectangle' as const,
                bounds: shapeData.bounds || {
                  northEast: {
                    latitude: shapeData.ne_lat || shapeData.northEast?.latitude,
                    longitude: shapeData.ne_lng || shapeData.northEast?.longitude
                  },
                  southWest: {
                    latitude: shapeData.sw_lat || shapeData.southWest?.latitude,
                    longitude: shapeData.sw_lng || shapeData.southWest?.longitude
                  }
                }
              };
              
            case 'polyline':
              return {
                ...baseShape,
                type: 'polyline' as const,
                path: shapeData.path || shapeData
              };
              
            case 'polygon':
              return {
                ...baseShape,
                type: 'polygon' as const,
                path: shapeData.path || shapeData
              };
              
            case 'arrow':
              return {
                ...baseShape,
                type: 'arrow' as const,
                start: shapeData.start || {
                  latitude: shapeData.start_lat || shapeData.start?.latitude,
                  longitude: shapeData.start_lng || shapeData.start?.longitude
                },
                end: shapeData.end || {
                  latitude: shapeData.end_lat || shapeData.end?.latitude,
                  longitude: shapeData.end_lng || shapeData.end?.longitude
                },
                headSize: shapeData.headSize || shapeData.head_size || 10
              };
              
            default:
              console.warn(`Unknown shape type: ${shapeType}. Defaulting to point.`);
              return {
                ...baseShape,
                type: 'point' as const,
                position: shapeData.position || {
                  latitude: shapeData.position_lat || 0,
                  longitude: shapeData.position_lng || 0
                }
              };
          }
        } catch (err) {
          console.error(`Error processing shape ${shape.id}:`, err);
          return null;
        }
      }).filter(Boolean); // Remove any null values from failed processing
      
      console.log(`Processed ${formattedShapes.length} valid shapes`);
      setShapes(formattedShapes);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching shapes:', err);
      setError('Failed to load shapes. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Create a new shape and add to state immediately
  const createShape = async (shapeData: Omit<MapShape, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Creating new shape:', shapeData);
      const response = await fetch(`${API_URL}/shapes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(shapeData)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log('Shape API result:', result);
      
      // Ensure the result has a type
      if (!result.type) {
        console.warn('Shape missing type, using input type', shapeData.type);
        result.type = shapeData.type;
      }
      
      let newShape;
      try {
        newShape = fetchShapeFromApiResult(result);
      } catch (err) {
        console.error('Error in fetchShapeFromApiResult:', err);
        newShape = result;
      }
      
      if (!newShape.id) {
        console.warn('Shape missing id, not adding to state:', newShape);
        return false;
      }
      
      console.log('Adding shape to state with id:', newShape.id);
      setShapes(prev => {
        const updated = [...prev, newShape];
        console.log('Shapes in state after add:', updated.map(s => s.id));
        return updated;
      });
      
      return true;
    } catch (err: any) {
      console.error('Error creating shape:', err);
      setError('Failed to create shape. Please try again later.');
      return false;
    }
  };

  // Similar robust error handling for update and delete methods...
  const updateShape = async (shapeId: string, shapeData: Omit<MapShape, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log(`Updating shape ${shapeId}:`, shapeData);
      const response = await fetch(`${API_URL}/shapes/${shapeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(shapeData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Shape update API result:', result);
      
      // Ensure the result has a type
      if (!result.type) {
        console.warn('Shape missing type, using input type', shapeData.type);
        result.type = shapeData.type;
      }
      
      let updatedShape;
      try {
        updatedShape = fetchShapeFromApiResult(result);
      } catch (err) {
        console.error('Error processing updated shape:', err);
        updatedShape = result;
      }
      
      if (!updatedShape.id) {
        console.warn('Updated shape missing id:', updatedShape);
        return false;
      }
      
      // Update the shape in the state
      setShapes(prev => {
        const updated = prev.map(s => s.id === shapeId ? updatedShape : s);
        console.log('Shapes in state after update:', updated.map(s => s.id));
        return updated;
      });
      
      return true;
    } catch (err: any) {
      console.error('Error updating shape:', err);
      setError('Failed to update shape. Please try again later.');
      return false;
    }
  };

  // Helper to transform API result to MapShape with robust error handling
  const fetchShapeFromApiResult = (shape: any): MapShape => {
    // Ensure shape has a type, default to 'point' if missing
    const shapeType = shape.type || 'point';
    
    console.log(`Transforming shape: ID ${shape.id}, Type: ${shapeType}`);
    
    const baseShape = {
      id: shape.id || shape._id,
      name: shape.name || `Unnamed ${shapeType}`,
      description: shape.description || '',
      lineColor: shape.lineColor || shape.line_color || '#1E88E5',
      lineStyle: (shape.lineStyle || shape.line_style || 'solid') as 'solid' | 'dashed' | 'dotted',
      fillColor: shape.fillColor || shape.fill_color || '#1E88E5',
      fillOpacity: shape.fillOpacity ?? shape.fill_opacity ?? 0.3,
      createdAt: shape.created_at,
      updatedAt: shape.updated_at
    };
    
    // Parse shape data, handling both string and object formats
    const shapeData = shape.shape_data
      ? (typeof shape.shape_data === 'string' ? JSON.parse(shape.shape_data) : shape.shape_data)
      : shape;
    
    switch (shapeType) {
      case 'point':
        return {
          ...baseShape,
          type: 'point' as const,
          position: shapeData.position || {
            latitude: shapeData.position_lat || shapeData.latitude,
            longitude: shapeData.position_lng || shapeData.longitude
          }
        };
      case 'circle':
        return {
          ...baseShape,
          type: 'circle' as const,
          center: shapeData.center || {
            latitude: shapeData.center_lat || shapeData.latitude,
            longitude: shapeData.center_lng || shapeData.longitude
          },
          radius: shapeData.radius
        };
      case 'rectangle':
        return {
          ...baseShape,
          type: 'rectangle' as const,
          bounds: shapeData.bounds || {
            northEast: {
              latitude: shapeData.ne_lat || shapeData.northEast?.latitude,
              longitude: shapeData.ne_lng || shapeData.northEast?.longitude
            },
            southWest: {
              latitude: shapeData.sw_lat || shapeData.southWest?.latitude,
              longitude: shapeData.sw_lng || shapeData.southWest?.longitude
            }
          }
        };
      case 'polyline':
        return {
          ...baseShape,
          type: 'polyline' as const,
          path: shapeData.path || shapeData
        };
      case 'polygon':
        return {
          ...baseShape,
          type: 'polygon' as const,
          path: shapeData.path || shapeData
        };
      case 'arrow':
        return {
          ...baseShape,
          type: 'arrow' as const,
          start: shapeData.start || {
            latitude: shapeData.start_lat || shapeData.start?.latitude,
            longitude: shapeData.start_lng || shapeData.start?.longitude
          },
          end: shapeData.end || {
            latitude: shapeData.end_lat || shapeData.end?.latitude,
            longitude: shapeData.end_lng || shapeData.end?.longitude
          },
          headSize: shapeData.headSize || shapeData.head_size || 10
        };
      default:
        console.warn(`Unknown shape type: ${shapeType}. Defaulting to point.`);
        return {
          ...baseShape,
          type: 'point' as const,
          position: shapeData.position || {
            latitude: shapeData.position_lat || 0,
            longitude: shapeData.position_lng || 0
          }
        };
    }
  };

  // Fetch shapes only on mount
  useEffect(() => {
    fetchShapes();
  }, [fetchShapes]);

  return {
    shapes,
    loading,
    error,
    fetchShapes,
    createShape,
    updateShape,
    deleteShape
  };
};

export default useMapShapes;