import pg from 'pg';
const { Client } = pg;

async function getMapShapes() {
  const client = new Client({
    host: 'db-postgresql-nyc3-46583-do-user-22369569-0.i.db.ondigitalocean.com',
    port: 25060,
    database: 'defaultdb', // or 'military_db' based on your actual configuration
    user: 'doadmin',
    password: 'AVNS_ij_u9Qooato-zHSe-Ro',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected, executing query: SELECT * FROM map_shapes');
    
    const result = await client.query('SELECT * FROM map_shapes');
    
    console.log(`Found ${result.rows.length} shapes`);
    console.log(JSON.stringify(result.rows, null, 2));
    
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    console.log('Closing database connection');
    await client.end();
  }
}

// Execute the function
getMapShapes().catch(console.error); 