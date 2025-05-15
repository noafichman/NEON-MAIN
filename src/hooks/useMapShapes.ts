import { useState, useEffect, useCallback } from 'react';
import { MapShape } from '../types/shapes';

// Dynamically determine API URL and path based on environment
const BASE_URL = import.meta.env.PROD 
  ? '' 
  : 'http://localhost:3001';

const API_PATH = import.meta.env.PROD 
  ? '/.netlify/functions/shapes' 
  : '/api/shapes';

console.log('Using API path:', API_PATH, 'Environment:', import.meta.env.MODE);

export const useMapShapes = () => {
  const [shapes, setShapes] = useState<MapShape[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch all shapes
  const fetchShapes = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching shapes from API');
      const response = await fetch(`${BASE_URL}${API_PATH}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Received shapes from API:`, data);
      
      // Transform the raw data into our shape types
      const formattedShapes = data.map((shape: any) => {
        // Add default values for mandatory properties
        const baseShape = {
          id: shape.id,
          name: shape.name || 'Unnamed Shape',
          description: shape.description || '',
          lineColor: shape.lineColor || shape.line_color || '#FF0000',
          lineStyle: (shape.lineStyle || shape.line_style || 'solid') as 'solid' | 'dashed' | 'dotted',
          fillColor: shape.fillColor || shape.fill_color || '#FF000066',
          fillOpacity: shape.fillOpacity || shape.fill_opacity || 0.4,
          isEnemy: shape.isEnemy || shape.is_enemy || false,
          createdAt: shape.createdAt || shape.created_at || new Date().toISOString(),
          updatedAt: shape.updatedAt || shape.updated_at || new Date().toISOString()
        };
        
        // Handle shape_data being either a string or an object
        const shapeData = shape.shape_data 
          ? (typeof shape.shape_data === 'string' ? JSON.parse(shape.shape_data) : shape.shape_data)
          : shape;
        
        try {
          switch (shape.type) {
            case 'point':
              return {
                ...baseShape,
                type: 'point' as const,
                position: shape.position || {
                  latitude: shapeData.position_lat || shapeData.latitude || 0,
                  longitude: shapeData.position_lng || shapeData.longitude || 0
                }
              };
              
            case 'circle':
              return {
                ...baseShape,
                type: 'circle' as const,
                center: shape.center || {
                  latitude: shapeData.center_lat || shapeData.latitude || 0,
                  longitude: shapeData.center_lng || shapeData.longitude || 0
                },
                radius: shape.radius || shapeData.radius || 1000
              };
              
            case 'rectangle':
              return {
                ...baseShape,
                type: 'rectangle' as const,
                bounds: shape.bounds || {
                  northEast: {
                    latitude: shapeData.ne_lat || (shapeData.northEast && shapeData.northEast.latitude) || 0,
                    longitude: shapeData.ne_lng || (shapeData.northEast && shapeData.northEast.longitude) || 0
                  },
                  southWest: {
                    latitude: shapeData.sw_lat || (shapeData.southWest && shapeData.southWest.latitude) || 0,
                    longitude: shapeData.sw_lng || (shapeData.southWest && shapeData.southWest.longitude) || 0
                  }
                }
              };
              
            case 'polyline':
              return {
                ...baseShape,
                type: 'polyline' as const,
                path: shape.path || (typeof shapeData.path === 'string' 
                  ? JSON.parse(shapeData.path) 
                  : shapeData.path || [])
              };
              
            case 'polygon':
              return {
                ...baseShape,
                type: 'polygon' as const,
                path: shape.path || (typeof shapeData.path === 'string' 
                  ? JSON.parse(shapeData.path) 
                  : shapeData.path || [])
              };
              
            case 'arrow':
              return {
                ...baseShape,
                type: 'arrow' as const,
                start: shape.start || {
                  latitude: shapeData.start_lat || (shapeData.start && shapeData.start.latitude) || 0,
                  longitude: shapeData.start_lng || (shapeData.start && shapeData.start.longitude) || 0
                },
                end: shape.end || {
                  latitude: shapeData.end_lat || (shapeData.end && shapeData.end.latitude) || 0,
                  longitude: shapeData.end_lng || (shapeData.end && shapeData.end.longitude) || 0
                },
                headSize: shape.headSize || shapeData.head_size || 10
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
      console.log('Creating new shape:', JSON.stringify(shapeData, null, 2));
      
      // Ensure the shape has a type
      if (!shapeData.type) {
        console.error('Shape is missing type property:', shapeData);
        return false;
      }
      
      const response = await fetch(`${BASE_URL}${API_PATH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(shapeData)
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No response text');
        console.error(`HTTP error creating shape! status: ${response.status}`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Shape API result:', JSON.stringify(result, null, 2));
      
      // Ensure the result has the correct type
      if (!result.type && shapeData.type) {
        console.log('API result missing type, using type from original data:', shapeData.type);
        result.type = shapeData.type;
      }
      
      let newShape;
      try {
        newShape = fetchShapeFromApiResult(result);
      } catch (err) {
        console.error('Error in fetchShapeFromApiResult:', err);
        
        // Create a complete shape with all required properties based on the type
        const tempId = result.id || `temp-${Date.now()}`;
        const baseShape = {
          ...shapeData,
          id: tempId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Add required properties based on shape type
        switch (shapeData.type) {
          case 'point':
            newShape = {
              ...baseShape,
              position: (shapeData as any).position || { latitude: 0, longitude: 0 }
            };
            break;
          case 'circle':
            newShape = {
              ...baseShape,
              center: (shapeData as any).center || { latitude: 0, longitude: 0 },
              radius: (shapeData as any).radius || 100
            };
            break;
          case 'rectangle':
            newShape = {
              ...baseShape,
              bounds: (shapeData as any).bounds || {
                northEast: { latitude: 0, longitude: 0 },
                southWest: { latitude: 0, longitude: 0 }
              }
            };
            break;
          case 'polyline':
            newShape = {
              ...baseShape,
              path: (shapeData as any).path || []
            };
            break;
          case 'polygon':
            newShape = {
              ...baseShape,
              path: (shapeData as any).path || []
            };
            break;
          case 'arrow':
            newShape = {
              ...baseShape,
              start: (shapeData as any).start || { latitude: 0, longitude: 0 },
              end: (shapeData as any).end || { latitude: 0, longitude: 0 },
              headSize: (shapeData as any).headSize || 10
            };
            break;
          default:
            console.error('Unknown shape type:', shapeData.type);
            return false;
        }
        
        console.log('Using fallback shape:', newShape);
      }
      
      if (!newShape.id) {
        console.warn('Shape missing id, generating temporary ID');
        newShape.id = `temp-${Date.now()}`;
      }
      
      console.log('Adding shape to state with id:', newShape.id);
      setShapes(prev => {
        const updated = [...prev, newShape as MapShape];
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

  // Delete an existing shape
  const deleteShape = async (shapeId: string) => {
    try {
      const response = await fetch(`${BASE_URL}${API_PATH}/${shapeId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Remove the shape from state
      setShapes(prevShapes => prevShapes.filter(shape => shape.id !== shapeId));
      return true;
    } catch (err) {
      console.error('Error deleting shape:', err);
      return false;
    }
  };

  // Update an existing shape
  const updateShape = async (shapeId: string, shapeData: Omit<MapShape, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log(`Updating shape ${shapeId}:`, JSON.stringify(shapeData, null, 2));
      
      // Ensure the shape has a type
      if (!shapeData.type) {
        console.error('Shape is missing type property:', shapeData);
        return false;
      }
      
      const response = await fetch(`${BASE_URL}${API_PATH}/${shapeId}`, {
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
      
      // Update local state with updated shape
      let updatedShape;
      try {
        updatedShape = fetchShapeFromApiResult(result);
      } catch (err) {
        console.error('Error processing updated shape:', err);
        
        // Create a complete shape with all required properties based on the type
        const baseShape = {
          ...shapeData,
          id: shapeId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Add required properties based on shape type
        switch (shapeData.type) {
          case 'point':
            updatedShape = {
              ...baseShape,
              position: (shapeData as any).position || { latitude: 0, longitude: 0 }
            };
            break;
          case 'circle':
            updatedShape = {
              ...baseShape,
              center: (shapeData as any).center || { latitude: 0, longitude: 0 },
              radius: (shapeData as any).radius || 100
            };
            break;
          case 'rectangle':
            updatedShape = {
              ...baseShape,
              bounds: (shapeData as any).bounds || {
                northEast: { latitude: 0, longitude: 0 },
                southWest: { latitude: 0, longitude: 0 }
              }
            };
            break;
          case 'polyline':
            updatedShape = {
              ...baseShape,
              path: (shapeData as any).path || []
            };
            break;
          case 'polygon':
            updatedShape = {
              ...baseShape,
              path: (shapeData as any).path || []
            };
            break;
          case 'arrow':
            updatedShape = {
              ...baseShape,
              start: (shapeData as any).start || { latitude: 0, longitude: 0 },
              end: (shapeData as any).end || { latitude: 0, longitude: 0 },
              headSize: (shapeData as any).headSize || 10
            };
            break;
          default:
            console.error('Unknown shape type:', shapeData.type);
            return false;
        }
        
        console.log('Using fallback updated shape:', updatedShape);
      }
      
      if (!updatedShape.id) {
        console.warn('Updated shape missing id, using original id:', shapeId);
        updatedShape.id = shapeId;
      }
      
      // Update the shape in the state
      setShapes(prev => {
        const updated = prev.map(s => s.id === shapeId ? (updatedShape as MapShape) : s);
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
    console.log('fetchShapeFromApiResult received:', JSON.stringify(shape, null, 2));
    
    if (!shape) {
      throw new Error('Shape data is null or undefined');
    }

    if (!shape.type) {
      // Try to determine the type from the shape's properties
      if (shape.position || (shape.position_lat && shape.position_lng)) {
        console.log('Auto-detecting shape type as "point" based on properties');
        shape.type = 'point';
      } else if (shape.center || (shape.center_lat && shape.center_lng)) {
        console.log('Auto-detecting shape type as "circle" based on properties');
        shape.type = 'circle';
      } else if (shape.bounds || (shape.ne_lat && shape.ne_lng)) {
        console.log('Auto-detecting shape type as "rectangle" based on properties');
        shape.type = 'rectangle';
      } else if (shape.path && Array.isArray(shape.path)) {
        // Distinguish between polyline and polygon if possible
        if (shape.fillColor || shape.fill_color) {
          console.log('Auto-detecting shape type as "polygon" based on properties');
          shape.type = 'polygon';
        } else {
          console.log('Auto-detecting shape type as "polyline" based on properties');
          shape.type = 'polyline';
        }
      } else if (shape.start || (shape.start_lat && shape.start_lng)) {
        console.log('Auto-detecting shape type as "arrow" based on properties');
        shape.type = 'arrow';
      } else {
        // Check if there's a collection of shapes
        const possibleTypes = ['point', 'circle', 'rectangle', 'polyline', 'polygon', 'arrow'];
        for (const type of possibleTypes) {
          if (shape[type] && Array.isArray(shape[type]) && shape[type].length > 0) {
            console.log(`Found a collection of ${type} shapes, using the first one`);
            const firstShape = shape[type][0];
            // Merge the properties from the first shape
            shape = { ...shape, ...firstShape, type };
            break;
          }
        }
        
        if (!shape.type) {
          console.error('Could not determine shape type from properties:', shape);
          throw new Error('Unable to determine shape type');
        }
      }
    }

    // Generate UUID if id is missing
    if (!shape.id && !shape._id) {
      console.log('Shape missing ID, generating a random one');
      shape.id = 'temp-' + Math.random().toString(36).substring(2, 15);
    }

    const baseShape = {
      id: shape.id || shape._id,
      name: shape.name || 'Unnamed Shape',
      description: shape.description || '',
      lineColor: shape.lineColor || shape.line_color || '#1E88E5',
      lineStyle: (shape.lineStyle || shape.line_style || 'solid') as 'solid' | 'dashed' | 'dotted',
      fillColor: shape.fillColor || shape.fill_color || '#1E88E5',
      fillOpacity: shape.fillOpacity || shape.fill_opacity || 0.3,
      isEnemy: shape.isEnemy || shape.is_enemy || false,
      createdAt: shape.created_at || new Date().toISOString(),
      updatedAt: shape.updated_at || new Date().toISOString()
    };
    
    // Use shape.shape_data if exists, otherwise use direct fields
    const shapeData = shape.shape_data
      ? (typeof shape.shape_data === 'string' ? JSON.parse(shape.shape_data) : shape.shape_data)
      : shape;
    
    try {
      switch (shape.type) {
        case 'point':
          return {
            ...baseShape,
            type: 'point' as const,
            position: shapeData.position || {
              latitude: shapeData.position_lat || shapeData.latitude || 0,
              longitude: shapeData.position_lng || shapeData.longitude || 0
            }
          };
        case 'circle':
          return {
            ...baseShape,
            type: 'circle' as const,
            center: shapeData.center || {
              latitude: shapeData.center_lat || (shapeData.center && shapeData.center.latitude) || 0,
              longitude: shapeData.center_lng || (shapeData.center && shapeData.center.longitude) || 0
            },
            radius: shapeData.radius || 100 // Default radius if missing
          };
        case 'rectangle':
          return {
            ...baseShape,
            type: 'rectangle' as const,
            bounds: shapeData.bounds || {
              northEast: {
                latitude: shapeData.ne_lat || (shapeData.bounds && shapeData.bounds.northEast && shapeData.bounds.northEast.latitude) || 0,
                longitude: shapeData.ne_lng || (shapeData.bounds && shapeData.bounds.northEast && shapeData.bounds.northEast.longitude) || 0
              },
              southWest: {
                latitude: shapeData.sw_lat || (shapeData.bounds && shapeData.bounds.southWest && shapeData.bounds.southWest.latitude) || 0,
                longitude: shapeData.sw_lng || (shapeData.bounds && shapeData.bounds.southWest && shapeData.bounds.southWest.longitude) || 0
              }
            }
          };
        case 'polyline':
          // Ensure path is an array of positions
          let polylinePath = shapeData.path;
          if (!Array.isArray(polylinePath)) {
            console.warn('Polyline path is not an array, fixing:', polylinePath);
            polylinePath = [];
          }
          
          return {
            ...baseShape,
            type: 'polyline' as const,
            path: polylinePath
          };
        case 'polygon':
          // Ensure path is an array of positions
          let polygonPath = shapeData.path;
          if (!Array.isArray(polygonPath)) {
            console.warn('Polygon path is not an array, fixing:', polygonPath);
            polygonPath = [];
          }
          
          return {
            ...baseShape,
            type: 'polygon' as const,
            path: polygonPath
          };
        case 'arrow':
          return {
            ...baseShape,
            type: 'arrow' as const,
            start: shapeData.start || {
              latitude: shapeData.start_lat || 0,
              longitude: shapeData.start_lng || 0
            },
            end: shapeData.end || {
              latitude: shapeData.end_lat || 0,
              longitude: shapeData.end_lng || 0
            },
            headSize: shapeData.headSize || shapeData.head_size || 10
          };
        default:
          console.error(`Unknown shape type: ${shape.type}`, shape);
          throw new Error(`Unknown shape type: ${shape.type}`);
      }
    } catch (error) {
      console.error('Error processing shape:', error);
      console.error('Shape data that caused the error:', JSON.stringify(shape, null, 2));
      throw error;
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