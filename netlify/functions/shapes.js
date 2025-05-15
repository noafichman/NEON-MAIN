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
      console.log('Starting shapes function');
      
      // Get shape type from query parameters if available
      const params = event.queryStringParameters || {};
      const type = params.type || 'all';
  
      console.log(`Request for shapes of type: ${type}`);
      
      // Return the requested shape type or all shapes
      let result;
      if (type === 'all') {
        result = allShapes;
      } else if (allShapes[type]) {
        result = { [type]: allShapes[type] };
      } else {
        // If type doesn't exist, return empty result
        result = {};
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    } catch (error) {
      console.error('Error in shapes function:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to fetch shapes',
          details: error.message 
        })
      };
    }
  };
