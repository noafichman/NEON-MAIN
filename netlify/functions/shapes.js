// Mock data to simulate database records from map_shapes table
const mockShapes = [
  {
    "id": "fbc38182-1387-4b82-a2b6-5c0b70583254",
    "name": "building",
    "description": "",
    "type": "polygon",
    "line_color": "#8B0000",
    "line_style": "dashed",
    "fill_color": "#610027",
    "fill_opacity": 0.4,
    "shape_data": {
      "path": [
        {
          "latitude": -22.791017556678582,
          "longitude": -43.308553363605625
        },
        {
          "latitude": -22.791363900558764,
          "longitude": -43.308052161734764
        },
        {
          "latitude": -22.792293596673503,
          "longitude": -43.30871743583435
        },
        {
          "latitude": -22.791686636390367,
          "longitude": -43.309147162354805
        }
      ]
    },
    "created_at": "2025-05-15T10:49:45.868Z",
    "updated_at": "2025-05-15T10:49:45.868Z",
    "is_enemy": true
  },
  {
    "id": "84a1eb1c-f6b6-4555-9912-1e129c2de55d",
    "name": "Our forces",
    "description": "",
    "type": "polygon",
    "line_color": "#1E88E5",
    "line_style": "solid",
    "fill_color": "#1E88E5",
    "fill_opacity": 0.3,
    "shape_data": {
      "path": [
        {
          "latitude": -22.790635463277653,
          "longitude": -43.31079132541379
        },
        {
          "latitude": -22.7908035828207,
          "longitude": -43.3113543875256
        },
        {
          "latitude": -22.792593198177897,
          "longitude": -43.31116457912455
        },
        {
          "latitude": -22.792286052978113,
          "longitude": -43.31029495238312
        }
      ]
    },
    "created_at": "2025-05-15T10:50:19.297Z",
    "updated_at": "2025-05-15T10:50:19.297Z",
    "is_enemy": false
  },
  {
    "id": "547dd9f0-d4e9-4a5c-9b33-37e9679fc3be",
    "name": "Polyline 2",
    "description": "",
    "type": "polyline",
    "line_color": "#ff0033",
    "line_style": "dashed",
    "fill_color": "#1E88E5",
    "fill_opacity": 0.3,
    "shape_data": {
      "path": [
        {
          "latitude": -22.790513158308613,
          "longitude": -43.30996892857402
        },
        {
          "latitude": -22.790969403232495,
          "longitude": -43.309775394705525
        },
        {
          "latitude": -22.791215623821728,
          "longitude": -43.31043492278806
        },
        {
          "latitude": -22.79325584957688,
          "longitude": -43.309358879710175
        },
        {
          "latitude": -22.792958006091155,
          "longitude": -43.30877813505313
        },
        {
          "latitude": -22.793358098366255,
          "longitude": -43.30813479917626
        }
      ]
    },
    "created_at": "2025-05-15T10:51:03.391Z",
    "updated_at": "2025-05-15T10:51:27.911Z",
    "is_enemy": false
  },
  {
    "id": "a5ee87c0-4462-4c9d-8e61-bdff37a574dc",
    "name": "Target For Destroy",
    "description": "",
    "type": "circle",
    "line_color": "#8B0000",
    "line_style": "dashed",
    "fill_color": "#1E88E5",
    "fill_opacity": 0.3,
    "shape_data": {
      "radius": 300,
      "center_lat": -22.79184232365803,
      "center_lng": -43.30888523477603
    },
    "created_at": "2025-05-15T10:55:31.080Z",
    "updated_at": "2025-05-15T10:55:31.080Z",
    "is_enemy": false
  },
  {
    "id": "c426a7eb-f93a-4891-95fc-3cb050f730cd",
    "name": "Air Support Route",
    "description": "",
    "type": "arrow",
    "line_color": "#1E88E5",
    "line_style": "solid",
    "fill_color": "#1E88E5",
    "fill_opacity": 0.3,
    "shape_data": {
      "end_lat": -22.791525257310298,
      "end_lng": -43.30924838503884,
      "head_size": 0.8,
      "start_lat": -22.790348503961027,
      "start_lng": -43.311976501573724
    },
    "created_at": "2025-05-15T10:56:03.349Z",
    "updated_at": "2025-05-15T10:56:03.349Z",
    "is_enemy": false
  },
  {
    "id": "d4cb3147-8454-470f-a3b0-06adce9b7112",
    "name": "Enemy ",
    "description": "",
    "type": "rectangle",
    "line_color": "#8B0000",
    "line_style": "dashed",
    "fill_color": "#a61fe5",
    "fill_opacity": 0.3,
    "shape_data": {
      "ne_lat": -22.791101258105158,
      "ne_lng": -43.30969804537847,
      "sw_lat": -22.793128358619597,
      "sw_lng": -43.3093509904827
    },
    "created_at": "2025-05-15T10:53:36.545Z",
    "updated_at": "2025-05-15T11:00:28.288Z",
    "is_enemy": true
  },
  {
    "id": "78e0368c-289a-497b-9487-ce37672da774",
    "name": "Arrow 2",
    "description": "",
    "type": "arrow",
    "line_color": "#00f030",
    "line_style": "dashed",
    "fill_color": "#597368",
    "fill_opacity": 0.3,
    "shape_data": {
      "end_lat": -22.791916905191954,
      "end_lng": -43.30926130676505,
      "head_size": 0.9,
      "start_lat": -22.792494535081346,
      "start_lng": -43.31061378158401
    },
    "created_at": "2025-05-15T10:48:11.033Z",
    "updated_at": "2025-05-15T10:48:35.967Z",
    "is_enemy": false
  }
];

// Helper function to find a shape by ID
function getShapeById(id) {
  return mockShapes.find(shape => shape.id === id);
}

// Add detailed logging function
function debugLog(title, data) {
  try {
    console.log(`${title}: ${typeof data === 'object' ? JSON.stringify(data, null, 2) : data}`);
  } catch (err) {
    console.log(`Error logging ${title}:`, err.message);
  }
}

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
    debugLog('Processing request', {
      method: event.httpMethod,
      path: event.path,
    });
    
    // Extract path parameters if any
    const path = event.path;
    const pathParts = path.split('/');
    const shapeId = pathParts[pathParts.length - 1];
    
    // Check if the request is for a specific shape (has an ID in the path)
    const isSpecificShapeRequest = 
      shapeId && 
      shapeId !== 'shapes' && 
      pathParts.includes('shapes');
    
    debugLog('Request path', path);
    debugLog('Shape ID', isSpecificShapeRequest ? shapeId : 'none');
    
    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        if (isSpecificShapeRequest) {
          // Get specific shape by ID
          const shape = getShapeById(shapeId);
          
          if (!shape) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: `Shape with ID ${shapeId} not found` })
            };
          }
          
          debugLog('Returning single shape', shape);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(shape)
          };
        } else {
          // Get all shapes
          debugLog('Returning all shapes', `${mockShapes.length} shapes`);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(mockShapes)
          };
        }
        
      case 'POST':
        // Create a new shape (mock implementation)
        try {
          const data = JSON.parse(event.body);
          
          // Generate a mock response with the data
          const newId = `new-${Date.now()}`;
          const newShape = {
            id: newId,
            name: data.name || 'New Shape',
            description: data.description || '',
            type: data.type,
            line_color: data.lineColor || '#1E88E5',
            line_style: data.lineStyle || 'solid',
            fill_color: data.fillColor || '#1E88E5',
            fill_opacity: data.fillOpacity || 0.3,
            is_enemy: data.isEnemy || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Add shape_data based on type
          let shapeData = {};
          switch (data.type) {
            case 'point':
              shapeData = {
                position_lat: data.position?.latitude || 0,
                position_lng: data.position?.longitude || 0
              };
              break;
            case 'circle':
              shapeData = {
                center_lat: data.center?.latitude || 0,
                center_lng: data.center?.longitude || 0,
                radius: data.radius || 1000
              };
              break;
            case 'rectangle':
              shapeData = {
                ne_lat: data.bounds?.northEast?.latitude || 0,
                ne_lng: data.bounds?.northEast?.longitude || 0,
                sw_lat: data.bounds?.southWest?.latitude || 0,
                sw_lng: data.bounds?.southWest?.longitude || 0
              };
              break;
            case 'polyline':
            case 'polygon':
              shapeData = {
                path: data.path || []
              };
              break;
            case 'arrow':
              shapeData = {
                start_lat: data.start?.latitude || 0,
                start_lng: data.start?.longitude || 0,
                end_lat: data.end?.latitude || 0,
                end_lng: data.end?.longitude || 0,
                head_size: data.headSize || 10
              };
              break;
          }
          
          newShape.shape_data = shapeData;
          
          // Add to mock shapes (for this session only)
          mockShapes.push(newShape);
          
          return {
            statusCode: 201,
            headers,
            body: JSON.stringify(newShape)
          };
        } catch (err) {
          console.error('Error creating shape:', err);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid shape data', details: err.message })
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
          const existingShapeIndex = mockShapes.findIndex(s => s.id === shapeId);
          
          if (existingShapeIndex === -1) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: `Shape with ID ${shapeId} not found` })
            };
          }
          
          // Update the shape
          const updatedShape = {
            ...mockShapes[existingShapeIndex],
            name: data.name || mockShapes[existingShapeIndex].name,
            description: data.description || mockShapes[existingShapeIndex].description,
            line_color: data.lineColor || mockShapes[existingShapeIndex].line_color,
            line_style: data.lineStyle || mockShapes[existingShapeIndex].line_style,
            fill_color: data.fillColor || mockShapes[existingShapeIndex].fill_color,
            fill_opacity: data.fillOpacity || mockShapes[existingShapeIndex].fill_opacity,
            is_enemy: data.isEnemy !== undefined ? data.isEnemy : mockShapes[existingShapeIndex].is_enemy,
            updated_at: new Date().toISOString()
          };
          
          // Update shape_data based on type
          let shapeData = {...mockShapes[existingShapeIndex].shape_data};
          switch (data.type) {
            case 'point':
              if (data.position) {
                shapeData.position_lat = data.position.latitude;
                shapeData.position_lng = data.position.longitude;
              }
              break;
            case 'circle':
              if (data.center) {
                shapeData.center_lat = data.center.latitude;
                shapeData.center_lng = data.center.longitude;
              }
              if (data.radius) {
                shapeData.radius = data.radius;
              }
              break;
            case 'rectangle':
              if (data.bounds) {
                if (data.bounds.northEast) {
                  shapeData.ne_lat = data.bounds.northEast.latitude;
                  shapeData.ne_lng = data.bounds.northEast.longitude;
                }
                if (data.bounds.southWest) {
                  shapeData.sw_lat = data.bounds.southWest.latitude;
                  shapeData.sw_lng = data.bounds.southWest.longitude;
                }
              }
              break;
            case 'polyline':
            case 'polygon':
              if (data.path) {
                shapeData.path = data.path;
              }
              break;
            case 'arrow':
              if (data.start) {
                shapeData.start_lat = data.start.latitude;
                shapeData.start_lng = data.start.longitude;
              }
              if (data.end) {
                shapeData.end_lat = data.end.latitude;
                shapeData.end_lng = data.end.longitude;
              }
              if (data.headSize) {
                shapeData.head_size = data.headSize;
              }
              break;
          }
          
          updatedShape.shape_data = shapeData;
          
          // Update in mock shapes array
          mockShapes[existingShapeIndex] = updatedShape;
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(updatedShape)
          };
        } catch (err) {
          console.error('Error updating shape:', err);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid shape data', details: err.message })
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
        
        const shapeIndex = mockShapes.findIndex(s => s.id === shapeId);
        
        if (shapeIndex === -1) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: `Shape with ID ${shapeId} not found` })
          };
        }
        
        // Remove from mock shapes array
        mockShapes.splice(shapeIndex, 1);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: `Shape ${shapeId} deleted successfully` })
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
      headers,
      body: JSON.stringify({ 
        error: 'Failed to process shape request',
        details: error.message 
      })
    };
  }
}; 