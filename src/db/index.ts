import { Pool } from 'pg';

const pool = new Pool({
  host: 'db-postgresql-nyc3-46583-do-user-22369569-0.i.db.ondigitalocean.com',
  port: 25060,
  database: 'military_db',
  user: 'doadmin',
  password: 'AVNS_ij_u9Qooato-zHSe-Ro',
  ssl: true // Disable SSL for local development
});

export const query = (text: string, params?: any[]) => pool.query(text, params);