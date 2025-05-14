import { Handler } from '@netlify/functions';
import { MilitaryEntity } from '../../src/types/entities';

// Mock data generator
const generateMockEntities = (): MilitaryEntity[] => {
  const entities: MilitaryEntity[] = [];
  const types = ['infantry', 'armor', 'air', 'naval'];
  const threatLevels = ['Hostile', 'Friendly', 'Unknown'];

  for (let i = 0; i < 10; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const threatLevel = threatLevels[Math.floor(Math.random() * threatLevels.length)];
    
    entities.push({
      id: `${type}-${i}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Unit ${i}`,
      sidc: `1003${threatLevel === 'Hostile' ? 'H' : threatLevel === 'Friendly' ? 'F' : 'U'}IPNR-----`,
      position: {
        latitude: 31.7 + (Math.random() - 0.5) * 0.1,
        longitude: 121.285 + (Math.random() - 0.5) * 0.1
      },
      threatLevel,
      lastUpdate: new Date().toISOString()
    });
  }

  return entities;
};

export const handler: Handler = async (event) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  try {
    const entities = generateMockEntities();

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entities)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to generate entities' })
    };
  }
}; 