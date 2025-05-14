export const config = {
  api: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0'
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'military_tracking',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  }
}; 