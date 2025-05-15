import { Pool } from 'pg';

// Create a new pool using environment variables
// Netlify will inject these from your site's environment variables
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export const handler = async (event, context) => {
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
      const result = await query('SELECT * FROM manual_entities');
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
      
      const result = await query(
        'INSERT INTO manual_entities (id, friendly, echlon, destroyed, x, y, z) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [id, friendly, echlon, destroyed, x, y, z]
      );
      
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
      const checkResult = await query('SELECT id FROM manual_entities WHERE id = $1', [id]);
      
      if (checkResult.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Manual entity not found' })
        };
      }
      
      // Delete the entity
      await query('DELETE FROM manual_entities WHERE id = $1', [id]);
      
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
      const checkResult = await query('SELECT id FROM manual_entities WHERE id = $1', [id]);
      
      if (checkResult.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Manual entity not found' })
        };
      }
      
      // Update the entity
      const result = await query(
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