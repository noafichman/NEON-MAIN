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
  // Log all the request details for debugging
  console.log('Manual entities function called');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Path:', event.path);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  const path = event.path.replace(/\/\.netlify\/functions\/manual-entities/, '');
  const segments = path.split('/').filter(Boolean);
  const id = segments[0];

  try {
    // GET all manual entities
    if (event.httpMethod === 'GET' && !id) {
      console.log('Getting all manual entities');
      
      // Check if the table exists first
      try {
        const tableCheck = await runQuery(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = 'manual_entities'
          );
        `);
        console.log('Table check result:', tableCheck.rows[0]);
        
        if (!tableCheck.rows[0].exists) {
          console.log('Table manual_entities does not exist, creating it');
          await runQuery(`
            CREATE TABLE IF NOT EXISTS manual_entities (
              id TEXT PRIMARY KEY,
              friendly TEXT NOT NULL,
              echlon TEXT NOT NULL,
              destroyed TEXT NOT NULL,
              x DOUBLE PRECISION NOT NULL,
              y DOUBLE PRECISION NOT NULL, 
              z DOUBLE PRECISION DEFAULT 0
            );
          `);
          console.log('Table created successfully');
        }
      } catch (tableError) {
        console.error('Error checking/creating table:', tableError);
      }
      
      const result = await runQuery('SELECT * FROM manual_entities');
      console.log(`Found ${result.rows.length} manual entities`);
      
      // Log a sample of the first entity if available
      if (result.rows.length > 0) {
        console.log('Sample entity:', JSON.stringify(result.rows[0], null, 2));
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows)
      };
    }

    // POST - Create new manual entity
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const { id, friendly, echlon, destroyed, x, y, z } = body;
      
      console.log('Creating manual entity:', JSON.stringify(body, null, 2));
      
      // Create the table if it doesn't exist
      await runQuery(`
        CREATE TABLE IF NOT EXISTS manual_entities (
          id TEXT PRIMARY KEY,
          friendly TEXT NOT NULL,
          echlon TEXT NOT NULL,
          destroyed TEXT NOT NULL,
          x DOUBLE PRECISION NOT NULL,
          y DOUBLE PRECISION NOT NULL, 
          z DOUBLE PRECISION DEFAULT 0
        );
      `);
      
      const result = await runQuery(
        'INSERT INTO manual_entities (id, friendly, echlon, destroyed, x, y, z) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [id, friendly, echlon, destroyed, x, y, z]
      );
      
      console.log('Entity created successfully:', JSON.stringify(result.rows[0], null, 2));
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    // DELETE - Delete a manual entity
    if (event.httpMethod === 'DELETE' && id) {
      console.log(`Deleting manual entity with ID: ${id}`);
      
      // Check if entity exists
      const checkResult = await runQuery('SELECT id FROM manual_entities WHERE id = $1', [id]);
      
      if (checkResult.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Manual entity not found' })
        };
      }
      
      // Delete the entity
      await runQuery('DELETE FROM manual_entities WHERE id = $1', [id]);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Manual entity deleted successfully' })
      };
    }

    // PUT - Update a manual entity
    if (event.httpMethod === 'PUT' && id) {
      const body = JSON.parse(event.body);
      const { friendly, echlon, destroyed, x, y, z } = body;
      
      console.log(`Updating manual entity with ID: ${id}`);
      console.log('Update data:', JSON.stringify(body, null, 2));
      
      // Check if entity exists
      const checkResult = await runQuery('SELECT id FROM manual_entities WHERE id = $1', [id]);
      
      if (checkResult.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Manual entity not found' })
        };
      }
      
      // Update the entity
      const result = await runQuery(
        `UPDATE manual_entities SET 
          friendly = $1, 
          echlon = $2, 
          destroyed = $3, 
          x = $4, 
          y = $5, 
          z = $6
        WHERE id = $7 RETURNING *`,
        [friendly, echlon, destroyed, x, y, z, id]
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    // If no route matches
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'Not Found' })
    };
  } catch (error) {
    console.log('Error processing request:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
    };
  }
}; 