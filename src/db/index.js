import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'db-postgresql-nyc3-46583-do-user-22369569-0.i.db.ondigitalocean.com',
  port: 25060,
  database: 'defaultdb',
  user: 'doadmin',
  password: 'AVNS_ij_u9Qooato-zHSe-Ro',
  ssl: {
    rejectUnauthorized: false
  } // Disable SSL for local development
});

export const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export default pool;