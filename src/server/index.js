import express from 'express';
import cors from 'cors';
import { query } from '../db/index.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/military-entities', async (req, res) => {
  try {
    console.log('Fetching military entities');
    const result = await query('SELECT * FROM c4i_table');
    
    const formattedEntities = result.rows.map(entity => ({
      id: entity.id,
      name: entity.name,
      sidc: entity.sidc || 'SFGPI-----',
      position: {
        latitude: entity.x,
        longitude: entity.y
      },
      status: entity.destroyed,
      threatLevel: entity.friendly,
      lastUpdate: entity.last_update ? new Date(entity.last_update).toISOString() : new Date().toISOString()
    }));
    
    res.json(formattedEntities);
  } catch (error) {
    console.error('Error fetching entities:', error);
    res.status(500).json({ 
      error: 'Failed to fetch entities',
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});