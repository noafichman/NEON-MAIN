import pg from 'pg';
const { Client } = pg;

// Helper function to execute queries with a single connection
async function runQuery(text, params) {
  // Create a new client for each request
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000 // how long to wait for connection
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected, executing query:', text);
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    // Always close the connection
    console.log('Closing database connection');
    await client.end();
  }
}

export const handler = async (event, context) => {
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
    console.log('Fetching military entities');
    const result = await runQuery('SELECT * FROM c4i_table');
    
    const formattedEntities = result.rows.map(entity => {
      // Build SIDC based on threatLevel and echelon
      let sidc = 'S'; // Standard Identity
      
      // Position 2: Affiliation (based on threatLevel/friendly)
      if (entity.friendly === "Friendly") {
        sidc += 'F'; // Friend
      } else if (entity.friendly === "Hostile") {
        sidc += 'H'; // Hostile
      } else {
        sidc += 'N'; // Neutral/Unknown
      }
      
            
      if (entity.id && entity.id.includes("UAV")) {
        sidc += 'A'; // Air
      } else {
        sidc += 'GP'; // Ground/Land Equipment
      }
      
      // Position 5: Entity Type
      sidc += 'I'; // Infantry
      
      // Position 8: Echelon
      const echelonMap = {
        'Team': 'A',
        'Squad': 'B', 
        'Platoon': 'C',
        'Company': 'D',
        'Battalion': 'E',
        'Regiment': 'F'
      };
      // Positions 6-7: Entity Subtype and Modifier
      sidc += echelonMap[entity.echlon] || '-';
      sidc += '---';
      
      // Position 9: Status (destroyed)
      sidc += '-';
      
      return {
        id: entity.id,
        name: entity.id,
        sidc: entity.sidc || sidc, // Use custom SIDC if entity.sidc is null
        position: {
          latitude: entity.x,
          longitude: entity.y
        },
        status: entity.destroyed,
        threatLevel: entity.friendly,
        lastUpdate: entity.last_update ? new Date(entity.last_update).toISOString() : new Date().toISOString()
      };
    });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(formattedEntities)
    };
  } catch (error) {
    console.error('Error fetching entities:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch entities',
        details: error.message 
      })
    };
  }
};