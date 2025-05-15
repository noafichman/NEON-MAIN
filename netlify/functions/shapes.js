// Mock shape data for the shapes endpoint
const allShapes = {
    point: [
      {
        id: 'p1',
        name: 'Base Location',
        type: 'point',
        position: { latitude: 37.7749, longitude: -122.4194 }
      }
    ],
    circle: [
      {
        id: 'c1',
        name: 'Operational Zone',
        type: 'circle',
        center: { latitude: 37.7749, longitude: -122.4194 },
        radius: 5000
      }
    ],
    rectangle: [
      {
        id: 'r1',
        name: 'Restricted Area',
        type: 'rectangle',
        bounds: {
          northEast: { latitude: 37.8, longitude: -122.4 },
          southWest: { latitude: 37.7, longitude: -122.5 }
        }
      }
    ],
    polyline: [
      {
        id: 'pl1',
        name: 'Supply Route',
        type: 'polyline',
        path: [
          { latitude: 37.7, longitude: -122.4 },
          { latitude: 37.8, longitude: -122.5 },
          { latitude: 37.9, longitude: -122.3 }
        ]
      }
    ],
    polygon: [
      {
        id: 'pg1',
        name: 'Defense Perimeter',
        type: 'polygon',
        path: [
          { latitude: 37.7, longitude: -122.4 },
          { latitude: 37.8, longitude: -122.5 },
          { latitude: 37.9, longitude: -122.3 },
          { latitude: 37.7, longitude: -122.4 }
        ]
      }
    ],
    arrow: [
      {
        id: 'a1',
        name: 'Movement Direction',
        type: 'arrow',
        start: { latitude: 37.7, longitude: -122.4 },
        end: { latitude: 37.8, longitude: -122.5 }
      }
    ]
  };
  
// Helper function to get all shapes as a flat array
const getAllShapesArray = () => {
  return Object.values(allShapes).flat();
};

// Helper function to find a shape by ID
const findShapeById = (id) => {
  const allShapesArray = getAllShapesArray();
  return allShapesArray.find(shape => shape.id === id);
};
  
// Handler function for Netlify
exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  // Handle OPTIONS request (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  try {
    console.log(`Processing ${event.httpMethod} request for shapes`);
    
    // Extract path parameters if any
    const path = event.path;
    const pathParts = path.split('/');
    const shapeId = pathParts[pathParts.length - 1];
    
    // Check if the request is for a specific shape (has an ID in the path)
    const isSpecificShapeRequest = 
      shapeId && 
      shapeId !== 'shapes' && 
      pathParts.includes('shapes');
    
    console.log(`Request path: ${path}, Shape ID: ${isSpecificShapeRequest ? shapeId : 'none'}`);
    
    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        if (isSpecificShapeRequest) {
          // Get specific shape by ID
          const shape = findShapeById(shapeId);
          
          if (!shape) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: `Shape with ID ${shapeId} not found` })
            };
          }
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(shape)
          };
        } else {
          // Get all shapes or shapes by type
          const params = event.queryStringParameters || {};
          const type = params.type || 'all';
          
          console.log(`Request for shapes of type: ${type}`);
          
          // Create a flat array of all shapes
          let result;
          if (type === 'all') {
            // Flatten all shapes into a single array
            result = getAllShapesArray();
          } else if (allShapes[type]) {
            // Return only shapes of the specified type
            result = allShapes[type];
          } else {
            // If type doesn't exist, return empty array
            result = [];
          }
          
          console.log(`Returning ${result.length} shapes`);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
          };
        }
        
      case 'POST':
        // Create a new shape (mock implementation)
        console.log('Create shape request received');
        try {
          const data = JSON.parse(event.body);
          
          // Generate a mock response with the data
          const newShape = {
            ...data,
            id: `new-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          return {
            statusCode: 201,
            headers,
            body: JSON.stringify(newShape)
          };
        } catch (err) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid shape data' })
          };
        }
        
      case 'PUT':
        // Update a shape (mock implementation)
        if (!isSpecificShapeRequest) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Shape ID is required for update' })
          };
        }
        
        try {
          const data = JSON.parse(event.body);
          const existingShape = findShapeById(shapeId);
          
          if (!existingShape) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: `Shape with ID ${shapeId} not found` })
            };
          }
          
          // Mock update - just return the data with the ID
          const updatedShape = {
            ...data,
            id: shapeId,
            updatedAt: new Date().toISOString()
          };
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(updatedShape)
          };
        } catch (err) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid shape data' })
          };
        }
        
      case 'DELETE':
        // Delete a shape (mock implementation)
        if (!isSpecificShapeRequest) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Shape ID is required for deletion' })
          };
        }
        
        const shapeToDelete = findShapeById(shapeId);
        
        if (!shapeToDelete) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: `Shape with ID ${shapeId} not found` })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: `Shape ${shapeId} deleted successfully` })
        };
        
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error in shapes function:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ 
        error: 'Failed to process shape request',
        details: error.message 
      })
    };
  }
};
