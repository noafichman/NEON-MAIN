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
        const baseShape = {
          id: shape.id,
          name: shape.name,
          description: shape.description || '',
          lineColor: shape.line_color,
          lineStyle: shape.line_style as 'solid' | 'dashed' | 'dotted',
          fillColor: shape.fill_color,
          fillOpacity: shape.fill_opacity,
          isEnemy: shape.is_enemy || false,
          createdAt: shape.created_at,
          updatedAt: shape.updated_at
        };
        
        const shapeData = typeof shape.shape_data === 'string' 
          ? JSON.parse(shape.shape_data) 
          : shape.shape_data;
        
        try {
          switch (shape.type) {
            case 'point':
              return {
                ...baseShape,
                type: 'point' as const,
                position: {
                  latitude: shapeData.position_lat,
                  longitude: shapeData.position_lng
                }
              };
              
            case 'circle':
              return {
                ...baseShape,
                type: 'circle' as const,
                center: {
                  latitude: shapeData.center_lat,
                  longitude: shapeData.center_lng
                },
                radius: shapeData.radius
              };
              
            case 'rectangle':
              return {
                ...baseShape,
                type: 'rectangle' as const,
                bounds: {
                  northEast: {
                    latitude: shapeData.ne_lat,
                    longitude: shapeData.ne_lng
                  },
                  southWest: {
                    latitude: shapeData.sw_lat,
                    longitude: shapeData.sw_lng
                  }
                }
              };
              
            case 'polyline':
              return {
                ...baseShape,
                type: 'polyline' as const,
                path: typeof shapeData.path === 'string' 
                  ? JSON.parse(shapeData.path) 
                  : shapeData.path
              };
              
            case 'polygon':
              return {
                ...baseShape,
                type: 'polygon' as const,
                path: typeof shapeData.path === 'string' 
                  ? JSON.parse(shapeData.path) 
                  : shapeData.path
              };
              
            case 'arrow':
              return {
                ...baseShape,
                type: 'arrow' as const,
                start: {
                  latitude: shapeData.start_lat,
                  longitude: shapeData.start_lng
                },
                end: {
                  latitude: shapeData.end_lat,
                  longitude: shapeData.end_lng
                },
                headSize: shapeData.head_size
              };
              
            default:
              console.error(`Unknown shape type: ${shape.type}`);
              return null;
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
      }); // Add immediately
      return true;
    } catch (err: any) {
      console.error('Error creating shape:', err);
      setError('Failed to create shape. Please try again later.');
      return false;
    }
  };

  // Delete a shape and remove from state immediately
  const deleteShape = async (shapeId: string) => {
    try {
      const response = await fetch(`${API_URL}/shapes/${shapeId}`, {
        method: 'DELETE'
      });
      if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setShapes(prev => {
        const updated = prev.filter(s => s.id !== shapeId);
        console.log('Shapes in state after delete:', updated.map(s => s.id));
        return updated;
      });
      return true;
    } catch (err: any) {
      console.error('Error deleting shape:', err);
      setError('Failed to delete shape. Please try again later.');
      return false;
    }
  };

  // Update an existing shape
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

  // Helper to transform API result to MapShape (reuse logic from fetchShapes)
  const fetchShapeFromApiResult = (shape: any): MapShape => {
    const baseShape = {
      id: shape.id || shape._id,
      name: shape.name,
      description: shape.description || '',
      lineColor: shape.lineColor || shape.line_color,
      lineStyle: shape.lineStyle || shape.line_style,
      fillColor: shape.fillColor || shape.fill_color,
      fillOpacity: shape.fillOpacity || shape.fill_opacity,
      isEnemy: shape.isEnemy || shape.is_enemy || false,
      createdAt: shape.created_at,
      updatedAt: shape.updated_at
    };
    // Use shape.shape_data if exists, otherwise use direct fields
    const shapeData = shape.shape_data
      ? (typeof shape.shape_data === 'string' ? JSON.parse(shape.shape_data) : shape.shape_data)
      : shape;
    switch (shape.type) {
      case 'point':
        return {
          ...baseShape,
          type: 'point' as const,
          position: shapeData.position || {
            latitude: shapeData.position_lat,
            longitude: shapeData.position_lng
          }
        };
      case 'circle':
        return {
          ...baseShape,
          type: 'circle' as const,
          center: shapeData.center || {
            latitude: shapeData.center_lat,
            longitude: shapeData.center_lng
          },
          radius: shapeData.radius
        };
      case 'rectangle':
        return {
          ...baseShape,
          type: 'rectangle' as const,
          bounds: shapeData.bounds || {
            northEast: {
              latitude: shapeData.ne_lat,
              longitude: shapeData.ne_lng
            },
            southWest: {
              latitude: shapeData.sw_lat,
              longitude: shapeData.sw_lng
            }
          }
        };
      case 'polyline':
        return {
          ...baseShape,
          type: 'polyline' as const,
          path: shapeData.path
        };
      case 'polygon':
        return {
          ...baseShape,
          type: 'polygon' as const,
          path: shapeData.path
        };
      case 'arrow':
        return {
          ...baseShape,
          type: 'arrow' as const,
          start: shapeData.start || {
            latitude: shapeData.start_lat,
            longitude: shapeData.start_lng
          },
          end: shapeData.end || {
            latitude: shapeData.end_lat,
            longitude: shapeData.end_lng
          },
          headSize: shapeData.headSize || shapeData.head_size
        };
      default:
        throw new Error(`Unknown shape type: ${shape.type}`);
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