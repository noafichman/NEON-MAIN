const { Pool } = require('pg');

// Configure database connection
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Create connection pool
let pool;

// Initialize database connection
function getPool() {
  if (!pool) {
    console.log('Creating new database connection pool');
    
    try {
      // Log DB config (hide password)
      const safeDbConfig = {...dbConfig};
      if (safeDbConfig.connectionString) {
        safeDbConfig.connectionString = safeDbConfig.connectionString.replace(/:[^:]*@/, ':*****@');
      }
      console.log('DB Config:', JSON.stringify(safeDbConfig));
      
      pool = new Pool(dbConfig);
      
      // Handle pool errors
      pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
        pool = null;
      });
      
      // Log successful pool creation
      console.log('DB connection pool created successfully');
    } catch (err) {
      console.error('Error creating connection pool:', err);
      throw err;
    }
  }
  return pool;
}

// Execute query with proper connection handling
async function query(text, params = []) {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
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
    console.log(`Processing ${event.httpMethod} request for shapes-db`);
    
    // Extract path parameters if any
    const path = event.path;
    const pathParts = path.split('/');
    const shapeId = pathParts[pathParts.length - 1];
    
    // Check if the request is for a specific shape (has an ID in the path)
    const isSpecificShapeRequest = 
      shapeId && 
      shapeId !== 'shapes-db' && 
      !shapeId.includes('shapes-db');
    
    console.log(`Request path: ${path}, Shape ID: ${isSpecificShapeRequest ? shapeId : 'none'}`);
    
    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        if (isSpecificShapeRequest) {
          // Get specific shape by ID
          const result = await query('SELECT * FROM map_shapes WHERE id = $1', [shapeId]);
          
          if (result.rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: `Shape with ID ${shapeId} not found` })
            };
          }
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result.rows[0])
          };
        } else {
          // Get all shapes
          const result = await query('SELECT * FROM map_shapes');
          console.log(`Found ${result.rows.length} shapes in database`);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result.rows)
          };
        }
        
      case 'POST':
        // Create a new shape
        try {
          const data = JSON.parse(event.body);
          
          // Validate required fields
          if (!data.name || !data.type) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Missing required fields' })
            };
          }
          
          // Different fields based on shape type
          let positionData = {};
          
          switch (data.type) {
            case 'point':
              if (!data.position) {
                return {
                  statusCode: 400,
                  headers,
                  body: JSON.stringify({ error: 'Missing position data' })
                };
              }
              positionData = {
                position_lat: data.position.latitude,
                position_lng: data.position.longitude
              };
              break;
              
            case 'circle':
              if (!data.center || !data.radius) {
                return {
                  statusCode: 400,
                  headers,
                  body: JSON.stringify({ error: 'Missing center or radius data' })
                };
              }
              positionData = {
                center_lat: data.center.latitude,
                center_lng: data.center.longitude,
                radius: data.radius
              };
              break;
              
            case 'rectangle':
              if (!data.bounds) {
                return {
                  statusCode: 400,
                  headers,
                  body: JSON.stringify({ error: 'Missing bounds data' })
                };
              }
              positionData = {
                ne_lat: data.bounds.northEast.latitude,
                ne_lng: data.bounds.northEast.longitude,
                sw_lat: data.bounds.southWest.latitude,
                sw_lng: data.bounds.southWest.longitude
              };
              break;
              
            case 'polyline':
            case 'polygon':
              if (!data.path || data.path.length < 2) {
                return {
                  statusCode: 400,
                  headers,
                  body: JSON.stringify({ error: 'Invalid path data' })
                };
              }
              // Convert array of points to JSON string
              positionData = {
                path: data.path
              };
              break;
              
            case 'arrow':
              if (!data.start || !data.end) {
                return {
                  statusCode: 400,
                  headers,
                  body: JSON.stringify({ error: 'Missing arrow start or end points' })
                };
              }
              positionData = {
                start_lat: data.start.latitude,
                start_lng: data.start.longitude,
                end_lat: data.end.latitude,
                end_lng: data.end.longitude,
                head_size: data.headSize || 10 // Default head size if not provided
              };
              break;
              
            default:
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid shape type' })
              };
          }
          
          // Create database record
          const result = await query(
            `INSERT INTO map_shapes (
              name, 
              description, 
              type, 
              line_color, 
              line_style, 
              fill_color, 
              fill_opacity,
              shape_data,
              is_enemy
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
              data.name,
              data.description || '',
              data.type,
              data.lineColor || '#1E88E5',
              data.lineStyle || 'solid',
              data.fillColor || '#1E88E5',
              data.fillOpacity || 0.3,
              JSON.stringify(positionData),
              data.isEnemy || false
            ]
          );
          
          return {
            statusCode: 201,
            headers,
            body: JSON.stringify(result.rows[0])
          };
        } catch (err) {
          console.error('Error creating shape:', err);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to create shape', details: err.message })
          };
        }
        
      case 'PUT':
        // Update a shape
        if (!isSpecificShapeRequest) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Shape ID is required for update' })
          };
        }
        
        try {
          const data = JSON.parse(event.body);
          
          // Validate required fields
          if (!data.name || !data.type) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Missing required fields' })
            };
          }
          
          // Check if shape exists
          const checkResult = await query('SELECT id, type FROM map_shapes WHERE id = $1', [shapeId]);
          if (checkResult.rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Shape not found' })
            };
          }
          
          // Make sure shape type hasn't changed (not allowed)
          if (checkResult.rows[0].type !== data.type) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Cannot change shape type' })
            };
          }
          
          // Process shape position data based on type
          let positionData = {};
          switch (data.type) {
            case 'point':
              if (!data.position) {
                return {
                  statusCode: 400,
                  headers,
                  body: JSON.stringify({ error: 'Missing position data' })
                };
              }
              positionData = {
                position_lat: data.position.latitude,
                position_lng: data.position.longitude
              };
              break;
              
            case 'circle':
              if (!data.center || !data.radius) {
                return {
                  statusCode: 400,
                  headers,
                  body: JSON.stringify({ error: 'Missing center or radius data' })
                };
              }
              positionData = {
                center_lat: data.center.latitude,
                center_lng: data.center.longitude,
                radius: data.radius
              };
              break;
              
            case 'rectangle':
              if (!data.bounds) {
                return {
                  statusCode: 400,
                  headers,
                  body: JSON.stringify({ error: 'Missing bounds data' })
                };
              }
              positionData = {
                ne_lat: data.bounds.northEast.latitude,
                ne_lng: data.bounds.northEast.longitude,
                sw_lat: data.bounds.southWest.latitude,
                sw_lng: data.bounds.southWest.longitude
              };
              break;
              
            case 'polyline':
            case 'polygon':
              if (!data.path || data.path.length < 2) {
                return {
                  statusCode: 400,
                  headers,
                  body: JSON.stringify({ error: 'Invalid path data' })
                };
              }
              positionData = {
                path: data.path
              };
              break;
              
            case 'arrow':
              if (!data.start || !data.end) {
                return {
                  statusCode: 400,
                  headers,
                  body: JSON.stringify({ error: 'Missing arrow start or end points' })
                };
              }
              positionData = {
                start_lat: data.start.latitude,
                start_lng: data.start.longitude,
                end_lat: data.end.latitude,
                end_lng: data.end.longitude,
                head_size: data.headSize || 10
              };
              break;
              
            default:
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid shape type' })
              };
          }
          
          // Update the shape in the database
          const updateResult = await query(
            `UPDATE map_shapes SET
              name = $1,
              description = $2,
              line_color = $3,
              line_style = $4,
              fill_color = $5,
              fill_opacity = $6,
              shape_data = $7,
              is_enemy = $8,
              updated_at = NOW()
            WHERE id = $9 RETURNING *`,
            [
              data.name,
              data.description || '',
              data.lineColor || '#1E88E5',
              data.lineStyle || 'solid',
              data.fillColor || '#1E88E5',
              data.fillOpacity || 0.3,
              JSON.stringify(positionData),
              data.isEnemy || false,
              shapeId
            ]
          );
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(updateResult.rows[0])
          };
        } catch (err) {
          console.error('Error updating shape:', err);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to update shape', details: err.message })
          };
        }
        
      case 'DELETE':
        // Delete a shape
        if (!isSpecificShapeRequest) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Shape ID is required for deletion' })
          };
        }
        
        try {
          // Check if shape exists
          const checkResult = await query('SELECT id FROM map_shapes WHERE id = $1', [shapeId]);
          
          if (checkResult.rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Shape not found' })
            };
          }
          
          // Delete the shape
          await query('DELETE FROM map_shapes WHERE id = $1', [shapeId]);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Shape deleted successfully' })
          };
        } catch (err) {
          console.error('Error deleting shape:', err);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to delete shape', details: err.message })
          };
        }
        
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error in shapes-db function:', error);
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