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
      
      // Positions 3-4: Symbol Set and Entity
      sidc += 'GP'; // Ground/Land Equipment
      
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
      
      console.log(sidc);
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